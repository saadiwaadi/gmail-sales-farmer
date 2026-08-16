const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'sales_crm.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency
db.exec('PRAGMA journal_mode = WAL;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT NOT NULL,
    color TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    abbr TEXT NOT NULL,
    color TEXT NOT NULL,
    deleted INTEGER DEFAULT 0,
    updatedAt TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    category TEXT,
    contactPerson TEXT,
    contactPosition TEXT,
    type TEXT,
    createdDate TEXT,
    potential INTEGER DEFAULT 0,
    chance INTEGER DEFAULT 0,
    weighted INTEGER DEFAULT 0,
    source TEXT,
    email TEXT,
    phone TEXT,
    webLink TEXT,
    mailingAddress TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT,
    lastContact TEXT,
    nextContactDate TEXT,
    nextAction TEXT,
    status TEXT NOT NULL,
    notes TEXT,
    ownerId TEXT,
    createdBy TEXT,
    locked INTEGER DEFAULT 0,
    deleted INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`);

// Add indexes for optimization
db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_deleted ON leads (deleted);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_owner ON leads (ownerId);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_creator ON leads (createdBy);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_sources_deleted ON sources (deleted);`);

// Create clients, messages, and tone_notes tables for the outreach-bot pipeline
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    company TEXT,
    role TEXT,
    industry TEXT,
    raw_dump TEXT,
    extracted_profile TEXT,   -- JSON stored as text
    normalized_research TEXT, -- Normalized Markdown summary of raw research
    structured_memory TEXT,   -- JSON stored as text
    context_cache TEXT,       -- Dense prose summary
    memory_updated_at TEXT,
    memory_version INTEGER DEFAULT 0,
    provider_used TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    -- UI-specific fields
    type TEXT,
    stage TEXT,
    last TEXT,
    score INTEGER,
    email TEXT,
    ai_status TEXT DEFAULT 'NOT_STARTED',
    tone_note TEXT,
    is_manually_overridden INTEGER DEFAULT 0,
    reminder_at TEXT,
    reminder_note TEXT,
    social_links TEXT
  );
`);

// Programmatic migration for existing databases: Add missing fields if they don't exist
try {
  const tableInfo = db.prepare('PRAGMA table_info(clients)').all();
  const columns = tableInfo.map(col => col.name);
  const required = [
    { name: 'raw_dump', type: 'TEXT' },
    { name: 'extracted_profile', type: 'TEXT' },
    { name: 'context_cache', type: 'TEXT' },
    { name: 'ai_status', type: "TEXT DEFAULT 'NOT_STARTED'" },
    { name: 'tone_note', type: 'TEXT' },
    { name: 'type', type: 'TEXT' },
    { name: 'stage', type: 'TEXT' },
    { name: 'last', type: 'TEXT' },
    { name: 'score', type: 'INTEGER' },
    { name: 'email', type: 'TEXT' },
    { name: 'is_manually_overridden', type: 'INTEGER DEFAULT 0' },
    { name: 'reminder_at', type: 'TEXT' },
    { name: 'reminder_note', type: 'TEXT' },
    { name: 'social_links', type: 'TEXT' }
  ];
  for (const col of required) {
    if (!columns.includes(col.name)) {
      db.exec(`ALTER TABLE clients ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Added column ${col.name} to clients table via migration.`);
    }
  }
} catch (err) {
  console.error('Migration error:', err);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER REFERENCES clients(id),
    direction TEXT,        -- 'outbound' | 'inbound_reply'
    tone_used TEXT,
    subject_line TEXT,
    body TEXT,
    outcome TEXT,           -- 'no_response'|'opened'|'replied'|'booked'|'rejected'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tone_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER REFERENCES clients(id),
    note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default lead sources if the sources table is empty
const checkSources = db.prepare('SELECT COUNT(*) as count FROM sources');
const row = checkSources.get();
if (row.count === 0) {
  const insertSource = db.prepare('INSERT INTO sources (id, name, abbr, color, updatedAt) VALUES (?, ?, ?, ?, ?)');
  const defaultSources = [
    { id: 'src_web', name: 'Website', abbr: 'WB', color: '#5B8DEF' },
    { id: 'src_ref', name: 'Referral', abbr: 'RF', color: '#3FB27F' },
    { id: 'src_cold', name: 'Cold Outreach', abbr: 'CL', color: '#E2585E' },
    { id: 'src_partner', name: 'Partner', abbr: 'PT', color: '#C9A24B' }
  ];
  const now = new Date().toISOString();
  for (const src of defaultSources) {
    insertSource.run(src.id, src.name, src.abbr, src.color, now);
  }
}

module.exports = db;
