const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Run vite build in crm-client
console.log('Building React Frontend...');
try {
  execSync('npm run build', { cwd: path.join(__dirname, 'crm-client'), stdio: 'inherit' });
} catch (err) {
  console.error('Error during React build:', err.message);
  process.exit(1);
}

// 2. Define source and destination paths
const srcDir = path.join(__dirname, 'crm-client', 'dist');
const destDir = path.join(__dirname, '..', 'Sales Crm for bitlogic', 'bitlogic-server', 'public');

// Recursive helper to copy directory contents
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Copying build assets to backend server public folder...');
try {
  // Clear existing React build artifacts in destDir first, to avoid stale files
  // (but preserve login.html, signup.html, fonts, and fonts.css!)
  const preserve = ['login.html', 'signup.html', 'fonts', 'fonts.css'];
  if (fs.existsSync(destDir)) {
    const files = fs.readdirSync(destDir);
    for (const file of files) {
      if (!preserve.includes(file)) {
        const filePath = path.join(destDir, file);
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    }
  }
  
  copyDirRecursive(srcDir, destDir);
  console.log('Build and deployment completed successfully!');
} catch (err) {
  console.error('Error during file deployment:', err.message);
  process.exit(1);
}
