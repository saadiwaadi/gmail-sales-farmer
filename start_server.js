const { spawn } = require('child_process');
const child = spawn('node', ['--experimental-sqlite', 'server.js'], {
  cwd: 'd:\\Vs arsenal\\Sales Crm for bitlogic\\bitlogic-server',
  stdio: 'inherit',
  env: process.env
});
child.on('error', (err) => console.error('Spawn error:', err));
child.on('exit', (code) => console.log('Process exited with code:', code));
