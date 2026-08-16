const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const db = require('./db');

const peersFilePath = path.join(__dirname, 'peers.json');

// Get all peers from peers.json
function getPeers() {
  try {
    if (fs.existsSync(peersFilePath)) {
      return JSON.parse(fs.readFileSync(peersFilePath, 'utf8')).peers || [];
    }
  } catch (err) {
    console.error('Error reading peers.json:', err);
  }
  return [];
}

// Save peers to peers.json
function savePeers(peers) {
  try {
    fs.writeFileSync(peersFilePath, JSON.stringify({ peers }, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing peers.json:', err);
  }
}

// Record/update discovered peer details
function updatePeer(peerId, peerUrl) {
  const peers = getPeers();
  const existingIndex = peers.findIndex(p => p.id === peerId);
  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    peers[existingIndex].url = peerUrl;
    peers[existingIndex].lastSeen = now;
  } else {
    peers.push({ id: peerId, url: peerUrl, lastSeen: now });
  }

  savePeers(peers);
}

// Core merge logic
function mergeData(data) {
  const { users = [], sources = [], leads = [] } = data;
  let changesMade = false;

  const now = new Date().toISOString();

  // 1. Merge Users (Append-only by ID)
  if (users.length > 0) {
    const checkUser = db.prepare('SELECT id FROM users WHERE id = ?');
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, avatar, color, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const u of users) {
      const exists = checkUser.get(u.id);
      if (!exists) {
        insertUser.run(u.id, u.email, u.password_hash, u.name, u.role, u.avatar, u.color, u.createdAt || now);
        changesMade = true;
      }
    }
  }

  // 2. Merge Sources (Last-Write-Wins by updatedAt)
  if (sources.length > 0) {
    const checkSource = db.prepare('SELECT id, updatedAt, deleted FROM sources WHERE id = ?');
    const insertSource = db.prepare(`
      INSERT INTO sources (id, name, abbr, color, deleted, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const updateSource = db.prepare(`
      UPDATE sources
      SET name = ?, abbr = ?, color = ?, deleted = ?, updatedAt = ?
      WHERE id = ?
    `);

    for (const s of sources) {
      const local = checkSource.get(s.id);
      if (!local) {
        insertSource.run(s.id, s.name, s.abbr, s.color, s.deleted || 0, s.updatedAt || now);
        changesMade = true;
      } else if (new Date(s.updatedAt || 0) > new Date(local.updatedAt || 0)) {
        updateSource.run(s.name, s.abbr, s.color, s.deleted || 0, s.updatedAt || now, s.id);
        changesMade = true;
      }
    }
  }

  // 3. Merge Leads (Last-Write-Wins by updatedAt, lock-authoritative)
  if (leads.length > 0) {
    const checkLead = db.prepare('SELECT id, updatedAt, deleted, locked, createdBy FROM leads WHERE id = ?');
    const insertLead = db.prepare(`
      INSERT INTO leads (
        id, company, category, contactPerson, contactPosition, type, createdDate,
        potential, chance, weighted, source, email, phone, webLink, mailingAddress,
        city, state, zip, country, lastContact, nextContactDate, nextAction,
        status, notes, ownerId, createdBy, locked, deleted, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);
    const updateLead = db.prepare(`
      UPDATE leads
      SET company = ?, category = ?, contactPerson = ?, contactPosition = ?, type = ?,
          createdDate = ?, potential = ?, chance = ?, weighted = ?, source = ?, email = ?,
          phone = ?, webLink = ?, mailingAddress = ?, city = ?, state = ?,
          zip = ?, country = ?, lastContact = ?, nextContactDate = ?, nextAction = ?,
          status = ?, notes = ?, ownerId = ?, createdBy = ?, locked = ?,
          deleted = ?, updatedAt = ?
      WHERE id = ?
    `);

    for (const l of leads) {
      const local = checkLead.get(l.id);
      if (!local) {
        insertLead.run(
          l.id, l.company, l.category, l.contactPerson, l.contactPosition, l.type, l.createdDate,
          l.potential, l.chance, l.weighted, l.source || '', l.email, l.phone, l.webLink, l.mailingAddress,
          l.city, l.state, l.zip, l.country, l.lastContact, l.nextContactDate, l.nextAction,
          l.status, l.notes, l.ownerId, l.createdBy, l.locked || 0, l.deleted || 0, l.createdAt || now, l.updatedAt || now
        );
        changesMade = true;
      } else if (new Date(l.updatedAt || 0) > new Date(local.updatedAt || 0)) {
        // Lock is authoritative: if local record is locked, only its owner/creator's update is accepted
        if (local.locked && local.createdBy !== l.createdBy) {
          continue;
        }
        updateLead.run(
          l.company, l.category, l.contactPerson, l.contactPosition, l.type, l.createdDate,
          l.potential, l.chance, l.weighted, l.source || '', l.email, l.phone, l.webLink, l.mailingAddress,
          l.city, l.state, l.zip, l.country, l.lastContact, l.nextContactDate, l.nextAction,
          l.status, l.notes, l.ownerId, l.createdBy, l.locked || 0, l.deleted || 0, l.updatedAt || now,
          l.id
        );
        changesMade = true;
      }
    }
  }

  if (changesMade) {
    console.log('Database synced & updated from peer.');
  }
  return changesMade;
}

// Retrieve local dataset to prepare payload
function getLocalSyncPayload() {
  const users = db.prepare('SELECT id, email, password_hash, name, role, avatar, color, createdAt FROM users').all();
  const sources = db.prepare('SELECT * FROM sources').all();
  const leads = db.prepare('SELECT * FROM leads').all();

  return { users, sources, leads };
}

const SYNC_SECRET = process.env.SYNC_SECRET || 'change-me-sync';

// Perform bi-directional sync with peer
async function syncWithPeer(peerUrl) {
  console.log(`Starting dynamic sync with peer: ${peerUrl}`);
  try {
    // 1. Fetch peer data with x-sync-secret validation header
    const res = await fetch(`${peerUrl}/api/sync/data`, {
      headers: { 'x-sync-secret': SYNC_SECRET },
      timeout: 5000
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const peerData = await res.json();

    // 2. Merge peer data locally
    const updatedLocally = mergeData(peerData);

    // 3. Push local data to peer so they have our changes
    const localPayload = getLocalSyncPayload();
    const pushRes = await fetch(`${peerUrl}/api/sync/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-secret': SYNC_SECRET
      },
      body: JSON.stringify(localPayload),
      timeout: 5000
    });

    if (pushRes.ok) {
      console.log(`Pushed updates successfully to peer: ${peerUrl}`);
    }
  } catch (error) {
    console.error(`Sync failed with peer ${peerUrl}:`, error.message);
  }
}

let periodicSyncInterval = null;

function startPeriodicSync() {
  if (periodicSyncInterval) clearInterval(periodicSyncInterval);
  
  periodicSyncInterval = setInterval(async () => {
    const peers = getPeers();
    if (peers.length === 0) return;
    
    for (const peer of peers) {
      try {
        await syncWithPeer(peer.url);
      } catch (err) {
        // Peer offline/unreachable - ignore silently
      }
    }
  }, 30000); // sync every 30 seconds
}

module.exports = {
  updatePeer,
  mergeData,
  getLocalSyncPayload,
  syncWithPeer,
  getPeers,
  startPeriodicSync,
  SYNC_SECRET
};
