const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const db = require('../db');
const { requireAuth } = require('../auth');

// Helper to spawn Python commands safely without shell escaping issues
function runPythonCommand(args, callback) {
  const pythonPath = path.join(__dirname, '..', '..', '..', 'Autobot salefarmer', '.venv', 'Scripts', 'python.exe');
  const cliPath = path.join(__dirname, '..', '..', '..', 'Autobot salefarmer');
  const dbPath = path.join(__dirname, '..', 'sales_crm.db');

  const env = {
    ...process.env,
    DB_PATH: dbPath
  };

  const child = spawn(pythonPath, args, { cwd: cliPath, env });
  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  child.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  child.on('error', (err) => {
    console.error(`Python spawn error: ${err.message}`);
    callback(err, null, stderr);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      const err = new Error(`Python process exited with code ${code}`);
      console.error(`Python execution error: ${err.message}`);
      console.error(`Stderr: ${stderr}`);
      
      // Write error details to workspace file for debugging
      try {
        const fs = require('fs');
        const logContent = `COMMAND: ${args.join(' ')}\nCODE: ${code}\nERROR: ${err.message}\nSTDERR:\n${stderr}\nSTDOUT:\n${stdout}\n`;
        fs.writeFileSync(path.join(cliPath, 'python_error.log'), logContent, 'utf8');
      } catch (writeErr) {
        console.error('Failed to write python_error.log:', writeErr);
      }
      
      return callback(err, stdout, stderr);
    }
    callback(null, stdout, stderr);
  });
}

// Helper to parse JSON fields for a client row
function parseClientFields(client) {
  if (!client) return null;
  const parsed = { ...client };
  if (parsed.extracted_profile) {
    try {
      parsed.extracted_profile = JSON.parse(parsed.extracted_profile);
    } catch (e) {
      parsed.extracted_profile = null;
    }
  }
  if (parsed.structured_memory) {
    try {
      parsed.structured_memory = JSON.parse(parsed.structured_memory);
    } catch (e) {
      parsed.structured_memory = null;
    }
  }
  if (parsed.social_links) {
    try {
      parsed.social_links = JSON.parse(parsed.social_links);
    } catch (e) {
      parsed.social_links = [];
    }
  } else {
    parsed.social_links = [];
  }
  return parsed;
}

// GET /api/contacts - Fetch all contacts
router.get('/', requireAuth, (req, res) => {
  try {
    const getClients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC');
    const clients = getClients.all().map(parseClientFields);
    return res.json({ contacts: clients });
  } catch (error) {
    console.error('Fetch contacts error:', error);
    return res.status(500).json({ error: 'Failed to fetch contacts.' });
  }
});

// POST /api/contacts/scrape-profile - Extract details from raw copy-pasted text using Gemini
router.post('/scrape-profile', requireAuth, (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text is required for scraping.' });
  }

  const fs = require('fs');
  const uuid = require('uuid');
  const tempFilename = `temp_scrape_${uuid.v4()}.txt`;
  const cliPath = path.join(__dirname, '..', '..', '..', 'Autobot salefarmer');
  const tempFilePath = path.join(cliPath, tempFilename);

  try {
    fs.writeFileSync(tempFilePath, text, 'utf8');

    runPythonCommand(['main.py', 'scrape-profile', tempFilename], (err, stdout, stderr) => {
      // Always cleanup temp file
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupErr) {
        console.error('Error deleting temp file:', cleanupErr);
      }

      let parsedError = null;
      if (stdout) {
        try {
          const firstOpen = stdout.indexOf('{');
          const lastClose = stdout.lastIndexOf('}');
          if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
            const cleanStdout = stdout.substring(firstOpen, lastClose + 1);
            const result = JSON.parse(cleanStdout);
            if (result.error) {
              parsedError = result.error;
            }
          } else if (stdout.trim()) {
            parsedError = stdout.trim();
          }
        } catch (e) {
          // ignore parsing error
        }
      }

      if (!parsedError && stderr && stderr.trim()) {
        parsedError = stderr.trim();
      }

      if (err) {
        console.error('Scrape command error:', err);
        return res.status(500).json({ error: parsedError || 'Failed to analyze text with Gemini.' });
      }

      try {
        // Extract the JSON block from stdout to bypass any warning/info messages
        let cleanStdout = stdout;
        const firstOpen = stdout.indexOf('{');
        const lastClose = stdout.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
          cleanStdout = stdout.substring(firstOpen, lastClose + 1);
        }
        
        const result = JSON.parse(cleanStdout);
        if (result.error) {
          return res.status(500).json({ error: result.error });
        }
        return res.json({ success: true, data: result });
      } catch (parseErr) {
        console.error('Failed to parse Python stdout:', stdout);
        return res.status(500).json({ error: 'Failed to parse AI response.' });
      }
    });
  } catch (writeErr) {
    console.error('Failed to write temp file:', writeErr);
    return res.status(500).json({ error: 'Failed to process request.' });
  }
});

// POST /api/contacts - Create a single contact
router.post('/', requireAuth, (req, res) => {
  const { name, company, role, industry, raw_dump, type, stage, score, email, social_links } = req.body;

  if (!name || !company || !raw_dump) {
    return res.status(400).json({ error: 'Name, Company, and Raw Dump are required.' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO clients (name, company, role, industry, raw_dump, type, stage, score, email, ai_status, social_links)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NOT_STARTED', ?)
    `);
    const result = insert.run(
      name,
      company,
      role || '',
      industry || '',
      raw_dump,
      type || 'buyer',
      stage || 'New Lead',
      Number(score) || 50,
      email || '',
      social_links ? (typeof social_links === 'string' ? social_links : JSON.stringify(social_links)) : '[]'
    );

    const newClientId = result.lastInsertRowid;
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(newClientId);
    return res.json({ success: true, contact: parseClientFields(client) });
  } catch (error) {
    console.error('Create contact error:', error);
    return res.status(500).json({ error: 'Failed to create contact.' });
  }
});

// GET /api/contacts/:id - Get contact + messages
router.get('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!client) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    const messages = db.prepare('SELECT * FROM messages WHERE client_id = ? ORDER BY created_at DESC').all();
    const contact = parseClientFields(client);
    contact.messages = messages;

    return res.json({ contact });
  } catch (error) {
    console.error('Fetch contact detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch contact details.' });
  }
});

// PATCH /api/contacts/:id/tone_note - Update tone_note field and insert into tone_notes table
router.patch('/:id/tone_note', requireAuth, (req, res) => {
  const { id } = req.params;
  const { tone_note } = req.body;

  try {
    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(id);
    if (!client) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    // Update main field
    db.prepare('UPDATE clients SET tone_note = ? WHERE id = ?').run(tone_note || null, id);

    // Insert into history table if a note value is provided
    if (tone_note && tone_note.trim()) {
      db.prepare('INSERT INTO tone_notes (client_id, note) VALUES (?, ?)').run(id, tone_note.trim());
    }

    const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    return res.json({ success: true, contact: parseClientFields(updated) });
  } catch (error) {
    console.error('Update tone note error:', error);
    return res.status(500).json({ error: 'Failed to update tone note.' });
  }
});

// POST /api/contacts/:id/extract - Spawn profile extraction
router.post('/:id/extract', requireAuth, (req, res) => {
  const { id } = req.params;

  try {
    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(id);
    if (!client) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    db.prepare("UPDATE clients SET ai_status = 'PROCESSING' WHERE id = ?").run(id);

    // Run Python extract in background / async
    runPythonCommand(['main.py', 'extract', id], (err, stdout) => {
      if (err) {
        db.prepare("UPDATE clients SET ai_status = 'FAILED' WHERE id = ?").run(id);
        console.error(`AI Extraction failed for contact ${id}`);
        return;
      }
      db.prepare("UPDATE clients SET ai_status = 'READY' WHERE id = ?").run(id);
      console.log(`AI Extraction succeeded for contact ${id}`);
    });

    return res.json({ success: true, message: 'Profile extraction started.' });
  } catch (error) {
    console.error('Trigger extraction error:', error);
    return res.status(500).json({ error: 'Failed to trigger profile extraction.' });
  }
});

// POST /api/contacts/:id/draft - Spawn draft generator
router.post('/:id/draft', requireAuth, (req, res) => {
  const { id } = req.params;
  const { tone, custom_instruction } = req.body;

  if (!tone) {
    return res.status(400).json({ error: 'Tone is required for drafting.' });
  }

  try {
    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(id);
    if (!client) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    db.prepare("UPDATE clients SET ai_status = 'PROCESSING' WHERE id = ?").run(id);

    const fs = require('fs');
    let validatedTone = tone;
    try {
      const tonesDir = path.join(__dirname, '..', '..', '..', 'Autobot salefarmer', 'skills', 'writing', 'tones');
      if (fs.existsSync(tonesDir)) {
        const files = fs.readdirSync(tonesDir);
        const availableTones = files.filter(f => f.endsWith('.md')).map(f => f.slice(0, -3));
        if (!availableTones.includes(tone)) {
          validatedTone = availableTones.length > 0 ? availableTones[0] : 'direct';
        }
      } else {
        validatedTone = 'direct';
      }
    } catch (e) {
      validatedTone = 'direct';
    }

    const args = ['main.py', 'draft', id, '--tone', validatedTone];
    if (custom_instruction && custom_instruction.trim()) {
      args.push('--instruction', custom_instruction.trim());
    }

    runPythonCommand(args, (err, stdout) => {
      if (err) {
        db.prepare("UPDATE clients SET ai_status = 'READY' WHERE id = ?").run(id);
        return res.status(500).json({ error: 'Failed to generate email draft.' });
      }

      db.prepare("UPDATE clients SET ai_status = 'READY' WHERE id = ?").run(id);

      // Query the newly inserted message
      const latestMsg = db.prepare(`
        SELECT subject_line as subject, body 
        FROM messages 
        WHERE client_id = ? 
        ORDER BY id DESC LIMIT 1
      `).get(id);

      if (!latestMsg) {
        return res.status(500).json({ error: 'Draft generated but not found in message logs.' });
      }

      return res.json({
        success: true,
        subject: latestMsg.subject,
        body: latestMsg.body
      });
    });
  } catch (error) {
    console.error('Trigger drafting error:', error);
    return res.status(500).json({ error: 'Failed to trigger drafting.' });
  }
});

// GET /api/contacts/:id/messages - Return messages for contact
router.get('/:id/messages', requireAuth, (req, res) => {
  const { id } = req.params;
  try {
    const messages = db.prepare('SELECT * FROM messages WHERE client_id = ? ORDER BY created_at DESC').all(id);
    return res.json({ messages });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// POST /api/contacts/:id/messages - Log a message manually
router.post('/:id/messages', requireAuth, (req, res) => {
  const { id } = req.params;
  const { direction, tone_used, subject_line, body, outcome } = req.body;
  try {
    const insert = db.prepare(`
      INSERT INTO messages (client_id, direction, tone_used, subject_line, body, outcome, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    insert.run(
      id,
      direction || 'outbound',
      tone_used || '',
      subject_line || '',
      body || '',
      outcome || 'Sent'
    );
    // Also update client stage to 'Sent' if direction is outbound and clear reminders
    db.prepare(`
      UPDATE clients 
      SET stage = 'Sent', last = datetime('now'), reminder_at = NULL, reminder_note = NULL 
      WHERE id = ?
    `).run(id);
    return res.json({ success: true });
  } catch (error) {
    console.error('Log message error:', error);
    return res.status(500).json({ error: 'Failed to log message.' });
  }
});

// POST /api/contacts/import - CSV lead import wizard
router.post('/import', requireAuth, (req, res) => {
  const { rows } = req.body;

  if (!rows || !Array.isArray(rows)) {
    return res.status(400).json({ error: 'Invalid rows array provided.' });
  }

  const summary = {
    total: rows.length,
    imported: 0,
    duplicates: 0
  };

  try {
    const insert = db.prepare(`
      INSERT INTO clients (name, company, role, industry, raw_dump, type, stage, score, email, ai_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'QUEUED')
    `);

    const checkDuplicate = db.prepare('SELECT id FROM clients WHERE email = ? COLLATE NOCASE');

    const importedIds = [];

    db.exec('BEGIN TRANSACTION');
    try {
      for (const row of rows) {
        if (row.email) {
          const duplicate = checkDuplicate.get(row.email);
          if (duplicate) {
            summary.duplicates++;
            continue;
          }
        }

        const result = insert.run(
          row.name,
          row.company || 'Unknown',
          row.role || '',
          row.industry || '',
          row.raw_dump || `Imported contact: ${row.name} from ${row.company}`,
          row.type || 'buyer',
          row.stage || 'New Lead',
          Number(row.score) || 50,
          row.email || ''
        );

        importedIds.push(result.lastInsertRowid);
        summary.imported++;
      }
      db.exec('COMMIT');
    } catch (txError) {
      db.exec('ROLLBACK');
      throw txError;
    }

    // Trigger background extraction queue for imported leads
    for (const newId of importedIds) {
      setTimeout(() => {
        db.prepare("UPDATE clients SET ai_status = 'PROCESSING' WHERE id = ?").run(newId);
        runPythonCommand(['main.py', 'extract', newId], (err, stdout) => {
          if (err) {
            db.prepare("UPDATE clients SET ai_status = 'FAILED' WHERE id = ?").run(newId);
          } else {
            db.prepare("UPDATE clients SET ai_status = 'READY' WHERE id = ?").run(newId);
          }
        });
      }, 50);
    }

    return res.json({ success: true, summary });
  } catch (error) {
    console.error('Import contacts error:', error);
    return res.status(500).json({ error: 'Failed to import contacts.' });
  }
});

// PATCH /api/contacts/:id/stage - Update contact stage
router.patch('/:id/stage', requireAuth, (req, res) => {
  const { id } = req.params;
  const { stage } = req.body;
  try {
    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(id);
    if (!client) {
      return res.status(404).json({ error: 'Contact not found.' });
    }
    db.prepare('UPDATE clients SET stage = ?, is_manually_overridden = 1 WHERE id = ?').run(stage, id);
    const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    return res.json({ success: true, contact: parseClientFields(updated) });
  } catch (error) {
    console.error('Update stage error:', error);
    return res.status(500).json({ error: 'Failed to update stage.' });
  }
});

// PATCH /api/contacts/:id/raw_dump - Update contact raw dump research
router.patch('/:id/raw_dump', requireAuth, (req, res) => {
  const { id } = req.params;
  const { raw_dump } = req.body;
  try {
    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(id);
    if (!client) {
      return res.status(404).json({ error: 'Contact not found.' });
    }
    db.prepare('UPDATE clients SET raw_dump = ? WHERE id = ?').run(raw_dump || '', id);
    const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    return res.json({ success: true, contact: parseClientFields(updated) });
  } catch (error) {
    console.error('Update raw dump error:', error);
    return res.status(500).json({ error: 'Failed to update raw dump.' });
  }
});

// PATCH /api/contacts/:id - Update contact general details
router.patch('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  try {
    const currentClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!currentClient) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    const name = req.body.hasOwnProperty('name') ? req.body.name : currentClient.name;
    const company = req.body.hasOwnProperty('company') ? req.body.company : currentClient.company;
    const role = req.body.hasOwnProperty('role') ? req.body.role : currentClient.role;
    const industry = req.body.hasOwnProperty('industry') ? req.body.industry : currentClient.industry;
    const raw_dump = req.body.hasOwnProperty('raw_dump') ? req.body.raw_dump : currentClient.raw_dump;
    const type = req.body.hasOwnProperty('type') ? req.body.type : currentClient.type;
    const stage = req.body.hasOwnProperty('stage') ? req.body.stage : currentClient.stage;
    const score = req.body.hasOwnProperty('score') ? req.body.score : currentClient.score;
    const email = req.body.hasOwnProperty('email') ? req.body.email : currentClient.email;
    const reminder_at = req.body.hasOwnProperty('reminder_at') ? req.body.reminder_at : currentClient.reminder_at;
    const reminder_note = req.body.hasOwnProperty('reminder_note') ? req.body.reminder_note : currentClient.reminder_note;
    const social_links = req.body.hasOwnProperty('social_links')
      ? (typeof req.body.social_links === 'string' ? req.body.social_links : JSON.stringify(req.body.social_links))
      : currentClient.social_links;

    let is_manually_overridden = currentClient.is_manually_overridden;
    if (req.body.hasOwnProperty('is_manually_overridden')) {
      is_manually_overridden = req.body.is_manually_overridden ? 1 : 0;
    } else if (req.body.hasOwnProperty('stage') && req.body.stage !== currentClient.stage) {
      // Stage changed manual override lock trigger
      is_manually_overridden = 1;
    }

    db.prepare(`
      UPDATE clients
      SET name = ?, company = ?, role = ?, industry = ?, raw_dump = ?, type = ?, stage = ?, score = ?, email = ?,
          is_manually_overridden = ?, reminder_at = ?, reminder_note = ?, social_links = ?
      WHERE id = ?
    `).run(
      name,
      company,
      role || '',
      industry || '',
      raw_dump || '',
      type || 'buyer',
      stage || 'New Lead',
      score !== undefined && score !== null ? Number(score) : 50,
      email || '',
      is_manually_overridden,
      reminder_at,
      reminder_note,
      social_links,
      id
    );

    const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    return res.json({ success: true, contact: parseClientFields(updated) });
  } catch (error) {
    console.error('Update contact details error:', error);
    return res.status(500).json({ error: 'Failed to update contact details.' });
  }
});

// DELETE /api/contacts/:id - Delete single contact
router.delete('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  try {
    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(id);
    if (!client) {
      return res.status(404).json({ error: 'Contact not found.' });
    }
    db.exec('BEGIN TRANSACTION');
    try {
      db.prepare('DELETE FROM messages WHERE client_id = ?').run(id);
      db.prepare('DELETE FROM tone_notes WHERE client_id = ?').run(id);
      db.prepare('DELETE FROM clients WHERE id = ?').run(id);
      db.exec('COMMIT');
    } catch (txError) {
      db.exec('ROLLBACK');
      throw txError;
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete contact error:', error);
    return res.status(500).json({ error: 'Failed to delete contact.' });
  }
});

// POST /api/contacts/delete-multiple - Delete multiple contacts
router.post('/delete-multiple', requireAuth, (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Array of contact IDs is required.' });
  }
  try {
    db.exec('BEGIN TRANSACTION');
    try {
      const deleteMsgs = db.prepare('DELETE FROM messages WHERE client_id = ?');
      const deleteNotes = db.prepare('DELETE FROM tone_notes WHERE client_id = ?');
      const deleteClient = db.prepare('DELETE FROM clients WHERE id = ?');

      for (const id of ids) {
        deleteMsgs.run(id);
        deleteNotes.run(id);
        deleteClient.run(id);
      }
      db.exec('COMMIT');
    } catch (txError) {
      db.exec('ROLLBACK');
      throw txError;
    }
    return res.json({ success: true, message: `Successfully deleted ${ids.length} contacts.` });
  } catch (error) {
    console.error('Delete multiple contacts error:', error);
    return res.status(500).json({ error: 'Failed to delete multiple contacts.' });
  }
});

module.exports = router;
