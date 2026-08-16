const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// GET /api/users - Get all team members
router.get('/', requireAuth, (req, res) => {
  try {
    const getUsers = db.prepare('SELECT id, name, role, avatar, color FROM users');
    const users = getUsers.all();
    return res.json({ users });
  } catch (error) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ error: 'Failed to fetch team members.' });
  }
});

module.exports = router;
