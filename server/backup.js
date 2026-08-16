const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const cron = require('node-cron');
const db = require('./db');

let lastBackupAt = null;
let backupCronJob = null;

async function runBackup() {
  const configPath = path.join(__dirname, 'config.json');
  let config = {
    backupDir: './backups',
    backupMode: 'rolling'
  };

  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading config.json for backup:', err);
  }

  const backupDir = process.env.BACKUP_DIR || config.backupDir || './backups';
  const resolvedDir = path.isAbsolute(backupDir)
    ? backupDir
    : path.resolve(__dirname, backupDir);

  // Ensure backup directory exists
  if (!fs.existsSync(resolvedDir)) {
    fs.mkdirSync(resolvedDir, { recursive: true });
  }

  // Fetch leads and sources
  const activeLeads = db.prepare('SELECT * FROM leads WHERE deleted = 0').all();
  const activeSources = db.prepare('SELECT * FROM sources WHERE deleted = 0').all();

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Bitlogic Hub';
  workbook.lastModifiedBy = 'Bitlogic Server';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Leads Sheet
  const leadsSheet = workbook.addWorksheet('Leads');
  leadsSheet.columns = [
    { header: 'ID', key: 'id', width: 36 },
    { header: 'Company', key: 'company', width: 25 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Contact Person', key: 'contactPerson', width: 20 },
    { header: 'Contact Position', key: 'contactPosition', width: 20 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Created Date', key: 'createdDate', width: 15 },
    { header: 'Potential Value ($)', key: 'potential', width: 18 },
    { header: 'Chance (%)', key: 'chance', width: 12 },
    { header: 'Weighted Value ($)', key: 'weighted', width: 18 },
    { header: 'Source ID', key: 'source', width: 15 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Web Link', key: 'webLink', width: 30 },
    { header: 'Mailing Address', key: 'mailingAddress', width: 30 },
    { header: 'City', key: 'city', width: 15 },
    { header: 'State', key: 'state', width: 15 },
    { header: 'ZIP', key: 'zip', width: 10 },
    { header: 'Country', key: 'country', width: 15 },
    { header: 'Last Contact', key: 'lastContact', width: 15 },
    { header: 'Next Contact Date', key: 'nextContactDate', width: 15 },
    { header: 'Next Action', key: 'nextAction', width: 25 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Notes', key: 'notes', width: 40 },
    { header: 'Owner ID', key: 'ownerId', width: 36 },
    { header: 'Created By ID', key: 'createdBy', width: 36 },
    { header: 'Locked', key: 'locked', width: 10 },
    { header: 'Created At', key: 'createdAt', width: 25 },
    { header: 'Updated At', key: 'updatedAt', width: 25 }
  ];

  // Add Leads Rows
  for (const lead of activeLeads) {
    leadsSheet.addRow({
      ...lead,
      locked: lead.locked ? 'Yes' : 'No'
    });
  }

  // 2. Sources Sheet
  const sourcesSheet = workbook.addWorksheet('Sources');
  sourcesSheet.columns = [
    { header: 'ID', key: 'id', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Abbr', key: 'abbr', width: 10 },
    { header: 'Color', key: 'color', width: 15 },
    { header: 'Updated At', key: 'updatedAt', width: 25 }
  ];

  // Add Sources Rows
  for (const source of activeSources) {
    sourcesSheet.addRow(source);
  }

  // Style headers
  [leadsSheet, sourcesSheet].forEach(sheet => {
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF16171B' } // Premium dark grey header
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'left' };
  });

  // Generate File Name
  let fileName = 'sales_crm_backup.xlsx';
  if (config.backupMode === 'timestamped') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fileName = `sales_crm_backup_${timestamp}.xlsx`;
  }

  const finalPath = path.join(resolvedDir, fileName);
  await workbook.xlsx.writeFile(finalPath);
  lastBackupAt = new Date().toISOString();
  console.log(`Backup successfully written to: ${finalPath}`);
  return { path: finalPath, filename: fileName };
}

function setupCron(intervalHours) {
  if (backupCronJob) {
    backupCronJob.stop();
  }

  const hours = Number(intervalHours) || 2;
  const cronExpression = `0 */${hours} * * *`;

  backupCronJob = cron.schedule(cronExpression, async () => {
    console.log('Running automatic scheduled backup...');
    try {
      await runBackup();
    } catch (err) {
      console.error('Scheduled backup error:', err);
    }
  });

  console.log(`Cron backup schedule established: every ${hours} hours.`);
}

function getLastBackupTime() {
  return lastBackupAt;
}

module.exports = {
  runBackup,
  setupCron,
  getLastBackupTime
};
