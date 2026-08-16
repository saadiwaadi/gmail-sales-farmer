const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../auth');

// GET /api/leads - Fetch all active leads
router.get('/', requireAuth, (req, res) => {
  try {
    const getLeads = db.prepare('SELECT * FROM leads WHERE deleted = 0');
    const leads = getLeads.all();

    // Map boolean locks
    const processedLeads = leads.map(l => ({
      ...l,
      locked: !!l.locked
    }));

    return res.json({ leads: processedLeads });
  } catch (error) {
    console.error('Fetch leads error:', error);
    return res.status(500).json({ error: 'Failed to fetch leads.' });
  }
});

// POST /api/leads - Create new lead
router.post('/', requireAuth, (req, res) => {
  const data = req.body;

  if (!data.company) {
    return res.status(400).json({ error: 'Company name is required.' });
  }

  try {
    const leadId = uuidv4();
    const now = new Date().toISOString();
    const createdBy = req.session.userId;

    const insert = db.prepare(`
      INSERT INTO leads (
        id, company, category, contactPerson, contactPosition, type, createdDate,
        potential, chance, weighted, source, email, phone, webLink, mailingAddress,
        city, state, zip, country, lastContact, nextContactDate, nextAction,
        status, notes, ownerId, createdBy, locked, deleted, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    insert.run(
      leadId,
      data.company.trim(),
      data.category || '',
      data.contactPerson || '',
      data.contactPosition || '',
      data.type || 'Tactical',
      data.createdDate || now.slice(0, 10),
      Number(data.potential) || 0,
      Number(data.chance) || 0,
      Number(data.weighted) || 0,
      data.source || '',
      data.email || '',
      data.phone || '',
      data.webLink || '',
      data.mailingAddress || '',
      data.city || '',
      data.state || '',
      data.zip || '',
      data.country || '',
      data.lastContact || '',
      data.nextContactDate || '',
      data.nextAction || '',
      data.status || 'New Lead',
      data.notes || '',
      data.ownerId || createdBy,
      createdBy,
      0, // locked
      0, // deleted
      now,
      now
    );

    const getNew = db.prepare('SELECT * FROM leads WHERE id = ?');
    const newLead = getNew.get(leadId);
    newLead.locked = false;

    return res.json({ success: true, lead: newLead });
  } catch (error) {
    console.error('Create lead error:', error);
    return res.status(500).json({ error: 'Failed to create lead.' });
  }
});

// PUT /api/leads/:id - Update lead
router.put('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const getLead = db.prepare('SELECT * FROM leads WHERE id = ? AND deleted = 0');
    const lead = getLead.get(id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    // Authorization check: if locked, only owner can edit
    if (lead.locked && lead.createdBy !== req.session.userId) {
      return res.status(403).json({ error: 'This lead is locked. Only the creator can modify it.' });
    }

    const now = new Date().toISOString();

    const update = db.prepare(`
      UPDATE leads
      SET company = ?, category = ?, contactPerson = ?, contactPosition = ?, type = ?,
          createdDate = ?, potential = ?, chance = ?, weighted = ?, source = ?, email = ?,
          phone = ?, webLink = ?, mailingAddress = ?, city = ?, state = ?,
          zip = ?, country = ?, lastContact = ?, nextContactDate = ?, nextAction = ?,
          status = ?, notes = ?, ownerId = ?, updatedAt = ?
      WHERE id = ?
    `);

    update.run(
      data.company !== undefined ? data.company.trim() : lead.company,
      data.category !== undefined ? data.category : lead.category,
      data.contactPerson !== undefined ? data.contactPerson : lead.contactPerson,
      data.contactPosition !== undefined ? data.contactPosition : lead.contactPosition,
      data.type !== undefined ? data.type : lead.type,
      data.createdDate !== undefined ? data.createdDate : lead.createdDate,
      data.potential !== undefined ? Number(data.potential) || 0 : lead.potential,
      data.chance !== undefined ? Number(data.chance) || 0 : lead.chance,
      data.weighted !== undefined ? Number(data.weighted) || 0 : lead.weighted,
      data.source !== undefined ? data.source : lead.source,
      data.email !== undefined ? data.email : lead.email,
      data.phone !== undefined ? data.phone : lead.phone,
      data.webLink !== undefined ? data.webLink : lead.webLink,
      data.mailingAddress !== undefined ? data.mailingAddress : lead.mailingAddress,
      data.city !== undefined ? data.city : lead.city,
      data.state !== undefined ? data.state : lead.state,
      data.zip !== undefined ? data.zip : lead.zip,
      data.country !== undefined ? data.country : lead.country,
      data.lastContact !== undefined ? data.lastContact : lead.lastContact,
      data.nextContactDate !== undefined ? data.nextContactDate : lead.nextContactDate,
      data.nextAction !== undefined ? data.nextAction : lead.nextAction,
      data.status !== undefined ? data.status : lead.status,
      data.notes !== undefined ? data.notes : lead.notes,
      data.ownerId !== undefined ? data.ownerId : lead.ownerId,
      now,
      id
    );

    const getUpdated = db.prepare('SELECT * FROM leads WHERE id = ?');
    const updatedLead = getUpdated.get(id);
    updatedLead.locked = !!updatedLead.locked;

    return res.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error('Update lead error:', error);
    return res.status(500).json({ error: 'Failed to update lead.' });
  }
});

// DELETE /api/leads/:id - Soft-delete lead
router.delete('/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  try {
    const getLead = db.prepare('SELECT * FROM leads WHERE id = ? AND deleted = 0');
    const lead = getLead.get(id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    // Authorization check: if locked, only owner can delete
    if (lead.locked && lead.createdBy !== req.session.userId) {
      return res.status(403).json({ error: 'This lead is locked. Only the creator can delete it.' });
    }

    const now = new Date().toISOString();
    const softDelete = db.prepare('UPDATE leads SET deleted = 1, updatedAt = ? WHERE id = ?');
    softDelete.run(now, id);

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete lead error:', error);
    return res.status(500).json({ error: 'Failed to delete lead.' });
  }
});

// PATCH /api/leads/:id/lock - Toggle lead lock
router.patch('/:id/lock', requireAuth, (req, res) => {
  const { id } = req.params;

  try {
    const getLead = db.prepare('SELECT * FROM leads WHERE id = ? AND deleted = 0');
    const lead = getLead.get(id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    // Only owner can toggle lock
    if (lead.createdBy !== req.session.userId) {
      return res.status(403).json({ error: 'Only the creator of this lead can lock/unlock it.' });
    }

    const newLockState = lead.locked ? 0 : 1;
    const now = new Date().toISOString();

    const toggle = db.prepare('UPDATE leads SET locked = ?, updatedAt = ? WHERE id = ?');
    toggle.run(newLockState, now, id);

    const getUpdated = db.prepare('SELECT * FROM leads WHERE id = ?');
    const updatedLead = getUpdated.get(id);
    updatedLead.locked = !!updatedLead.locked;

    return res.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error('Lock toggle error:', error);
    return res.status(500).json({ error: 'Failed to toggle lead lock.' });
  }
});

module.exports = router;
