const { spawn } = require('child_process');
const path = require('path');
const child = spawn('node', ['--experimental-sqlite', 'server.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  env: process.env
});
child.on('error', (err) => console.error('Spawn error:', err));
child.on('exit', (code) => console.log('Process exited with code:', code));
