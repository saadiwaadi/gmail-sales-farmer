const { spawn, execSync } = require('child_process');
const path = require('path');

console.log('==================================================');
console.log('Starting Sales CRM Workspace...');
console.log('==================================================');

// 1. Compile the HTML mockup to public/app.html
try {
  console.log('Compiling latest HTML/JS changes...');
  execSync('python replace_script.py', { cwd: __dirname, stdio: 'inherit' });
  console.log('HTML mockup compiled successfully.');
} catch (err) {
  console.error('Warning: Failed to compile HTML mockup:', err.message);
}

// 2. Start Backend Server
console.log('Starting Backend Server...');
const backend = spawn('node', ['start_server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env
});

// 3. Start Frontend React client (Vite)
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
