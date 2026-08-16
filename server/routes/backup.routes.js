const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const backup = require('../backup');
const { requireAuth } = require('../auth');

// GET /api/backup/status - Get backup details
router.get('/status', requireAuth, (req, res) => {
  const configPath = path.join(__dirname, '..', 'config.json');
  let config = {
    backupDir: './backups',
    backupIntervalHours: 2,
    backupMode: 'rolling'
  };

  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading config.json in backup status route:', err);
  }

  return res.json({
    lastBackupAt: backup.getLastBackupTime(),
    intervalHours: config.backupIntervalHours,
    mode: config.backupMode,
    dir: config.backupDir
  });
});

// POST /api/backup/run - Trigger manual backup execution
router.post('/run', requireAuth, async (req, res) => {
  try {
    const result = await backup.runBackup();
    return res.json({ success: true, message: 'Backup completed successfully.', file: result.filename });
  } catch (error) {
    console.error('Manual backup trigger error:', error);
    return res.status(500).json({ error: 'Failed to run backup.' });
  }
});

// GET /api/backup/download - Download latest generated Excel file
router.get('/download', requireAuth, (req, res) => {
  const configPath = path.join(__dirname, '..', 'config.json');
  let config = {
    backupDir: './backups'
  };

  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading config.json in backup download route:', err);
  }

  const backupDir = process.env.BACKUP_DIR || config.backupDir || './backups';
  const resolvedDir = path.isAbsolute(backupDir)
    ? backupDir
    : path.resolve(__dirname, '..', backupDir);

  const filePath = path.join(resolvedDir, 'sales_backup.xlsx');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'No backup file found yet — run a backup first' });
  }

  res.download(filePath, 'bitlogic_sales_export.xlsx', (err) => {
    if (err) {
      console.error('Download error:', err);
    }
  });
});

module.exports = router;
