const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../auth');

const SOURCE_COLORS = [
  '#C9A24B', // Gold
  '#3FB27F', // Green
  '#E2585E', // Red
  '#5B8DEF', // Blue
  '#D9A441', // Warm Orange
  '#8F6FE0', // Purple
  '#4FBFA0', // Teal
  '#EF62A2', // Pink
  '#EF6C00', // Deep Orange
  '#00ACC1', // Cyan
  '#7CB342'  // Light Green
];

function getAbbr(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

// GET /api/sources - Fetch all active lead sources
router.get('/', requireAuth, (req, res) => {
  try {
    const getSources = db.prepare('SELECT * FROM sources WHERE deleted = 0');
    const sources = getSources.all();
    return res.json({ sources });
  } catch (error) {
    console.error('Fetch sources error:', error);
    return res.status(500).json({ error: 'Failed to fetch sources.' });
  }
});

// POST /api/sources - Create a custom lead source
router.post('/', requireAuth, (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Source name is required.' });
  }

  try {
    // Check if duplicate source name exists
    const checkDuplicate = db.prepare('SELECT id, deleted FROM sources WHERE name = ? COLLATE NOCASE');
    const existing = checkDuplicate.get(name.trim());

    if (existing) {
      if (existing.deleted) {
        // Reactivate soft-deleted source
        const now = new Date().toISOString();
        const reactivate = db.prepare('UPDATE sources SET deleted = 0, updatedAt = ? WHERE id = ?');
        reactivate.run(now, existing.id);

        const getSource = db.prepare('SELECT * FROM sources WHERE id = ?');
        return res.json({ success: true, source: getSource.get(existing.id) });
      } else {
        return res.status(400).json({ error: 'This source already exists.' });
      }
    }

    const sourceId = 'src_' + uuidv4().slice(0, 8);
    const abbr = getAbbr(name);
    const color = SOURCE_COLORS[Math.floor(Math.random() * SOURCE_COLORS.length)];
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO sources (id, name, abbr, color, deleted, updatedAt)
      VALUES (?, ?, ?, ?, 0, ?)
    `);
    insert.run(sourceId, name.trim(), abbr, color, now);

    const getNew = db.prepare('SELECT * FROM sources WHERE id = ?');
    return res.json({ success: true, source: getNew.get(sourceId) });
  } catch (error) {
    console.error('Create source error:', error);
    return res.status(500).json({ error: 'Failed to create source.' });
  }
});

module.exports = router;
