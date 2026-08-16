const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { SETUP_KEY } = require('../auth');

// List of pleasant background colors for user avatars
const AVATAR_COLORS = [
  '#C9A24B', // Gold
  '#3FB27F', // Green
  '#E2585E', // Red
  '#5B8DEF', // Blue
  '#D9A441', // Warm Orange
  '#8F6FE0', // Purple
  '#4FBFA0', // Teal
  '#EF62A2'  // Pink
];

// Helper to generate initials avatar
function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, name, role, key } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required.' });
  }

  if (key !== SETUP_KEY) {
    return res.status(403).json({ error: 'Invalid setup key — not authorized to register.' });
  }

  try {
    // Check if user already exists
    const checkUser = db.prepare('SELECT id FROM users WHERE email = ?');
    const existing = checkUser.get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Determine role (Default to Admin if it is the first user, otherwise Agent)
    const checkCount = db.prepare('SELECT COUNT(*) as count FROM users');
    const userCount = checkCount.get().count;
    const finalRole = userCount === 0 ? 'Admin' : (role || 'Agent');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const avatar = getInitials(name);
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const now = new Date().toISOString();

    // Insert user
    const insert = db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, avatar, color, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(userId, email.toLowerCase().trim(), passwordHash, name.trim(), finalRole, avatar, color, now);

    // Set session
    req.session.userId = userId;

    return res.json({
      success: true,
      user: { id: userId, email, name, role: finalRole, avatar, color }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error during signup.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const getUser = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = getUser.get(email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    req.session.userId = user.id;

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        color: user.color
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to log out.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not logged in.' });
  }

  try {
    const getUser = db.prepare('SELECT id, email, name, role, avatar, color FROM users WHERE id = ?');
    const user = getUser.get(req.session.userId);

    if (!user) {
      return res.status(401).json({ error: 'User session not found.' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
