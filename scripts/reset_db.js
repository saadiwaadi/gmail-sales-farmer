const { DatabaseSync } = require('node:sqlite');

const dbPath = 'd:\\Vs arsenal\\Sales Crm for bitlogic\\bitlogic-server\\sales_crm.db';
console.log('Opening database at:', dbPath);
const db = new DatabaseSync(dbPath);

try {
  console.log('Clearing clients, messages, and tone_notes tables...');
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('DELETE FROM tone_notes;');
  db.exec('DELETE FROM messages;');
  db.exec('DELETE FROM clients;');
  db.exec('PRAGMA foreign_keys = ON;');
  console.log('Database reset successfully.');
} catch (err) {
  console.error('Error resetting database:', err);
}
