const { spawn, execSync } = require('child_process');
const path = require('path');

console.log('==================================================');
console.log('Starting Sales CRM Workspace...');
console.log('==================================================');

// 1. Start Backend Server
console.log('Starting Backend Server...');
const backend = spawn('node', ['start_server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env
});

// 2. Start Frontend React client (Vite)
console.log('Starting Frontend React Client...');
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'crm-client'),
  stdio: 'inherit',
  shell: true,
  env: process.env
});

backend.on('exit', (code) => {
  console.log(`Backend process exited with code ${code}`);
  process.exit(code || 0);
});

frontend.on('exit', (code) => {
  console.log(`Frontend process exited with code ${code}`);
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit(0);
});
