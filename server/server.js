const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Load environment variables from .env file if it exists
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    }
  }
} catch (err) {
  console.error('Error loading .env file:', err);
}

const db = require('./db');
const backup = require('./backup');
const discovery = require('./discovery');
const sync = require('./sync');

const authRoutes = require('./routes/auth.routes');
const leadsRoutes = require('./routes/leads.routes');
const sourcesRoutes = require('./routes/sources.routes');
const usersRoutes = require('./routes/users.routes');
const backupRoutes = require('./routes/backup.routes');
const syncRoutes = require('./routes/sync.routes');
const contactsRoutes = require('./routes/contacts.routes');

const app = express();

// Load or initialize config.json
const configPath = path.join(__dirname, 'config.json');
let config = {
  port: 4000,
  backupDir: './backups',
  backupIntervalHours: 2,
  backupMode: 'rolling',
  instanceId: uuidv4()
};

try {
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf8');
    config = { ...config, ...JSON.parse(raw) };
  } else {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  }
} catch (err) {
  console.error('Error reading/writing config.json:', err);
}

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'bitlogic-hub-crm-secret-key-92813',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Run on local HTTP
    maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
  }
}));

// Route interceptor for root page authentication
app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.redirect('/login.html');
  }
});

// Serve public static files (login.html, signup.html, fonts, assets)
app.use(express.static(path.join(__dirname, 'public')));

// Mount API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/sources', sourcesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/contacts', contactsRoutes);

const { requireAuth } = require('./auth');

// PATCH /api/messages/:id/outcome - Update message outcome
app.patch('/api/messages/:id/outcome', requireAuth, (req, res) => {
  const { id } = req.params;
  const { outcome } = req.body;
  try {
    const update = db.prepare('UPDATE messages SET outcome = ? WHERE id = ?').run(outcome, id);
    if (update.changes === 0) {
      return res.status(404).json({ error: 'Message not found.' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Update message outcome error:', error);
    return res.status(500).json({ error: 'Failed to update message outcome.' });
  }
});

// PATCH /api/messages/:id - Update message subject & body
app.patch('/api/messages/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { subject_line, body } = req.body;
  try {
    const update = db.prepare('UPDATE messages SET subject_line = ?, body = ? WHERE id = ?').run(subject_line, body, id);
    if (update.changes === 0) {
      return res.status(404).json({ error: 'Message not found.' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Update message error:', error);
    return res.status(500).json({ error: 'Failed to update message.' });
  }
});

// Fetch available email tones
app.get('/api/tones', (req, res) => {
  const tonesDir = path.join(__dirname, '..', '..', 'Autobot salefarmer', 'skills', 'writing', 'tones');
  try {
    if (!fs.existsSync(tonesDir)) {
      return res.json([]);
    }
    const files = fs.readdirSync(tonesDir);
    const tones = files
      .filter(f => f.endsWith('.md'))
      .map(f => f.slice(0, -3));
    res.json(tones);
  } catch (err) {
    console.error('Error reading tones:', err);
    res.status(500).json({ error: 'Failed to read tones' });
  }
});

// Error fallback handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
const port = Number(process.env.PORT || config.port || 4000);
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`Bitlogic Hub Server listening on http://localhost:${port}`);
  console.log(`Instance ID: ${config.instanceId}`);
  console.log(`==================================================`);

  // Start Bonjour discovery advertisement and search
  try {
    discovery.startDiscovery(port, config.instanceId);
  } catch (err) {
    console.error('Failed to initialize Bonjour discovery:', err);
  }

  // Setup automated Excel backup schedule
  try {
    backup.setupCron(config.backupIntervalHours);
  } catch (err) {
    console.error('Failed to initialize backup cron:', err);
  }

  // Start periodic peer sync checks
  try {
    sync.startPeriodicSync();
  } catch (err) {
    console.error('Failed to start periodic peer sync:', err);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('Shutting down server gracefully...');
  discovery.stopDiscovery();
  server.close(() => {
    console.log('Server process terminated.');
    process.exit(0);
  });
}
