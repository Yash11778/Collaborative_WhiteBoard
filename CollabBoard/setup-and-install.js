const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up CollabBoard project...');

// Paths to project directories
const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'hackathon');

// Check if directories exist
if (!fs.existsSync(backendDir)) {
  console.error(`Backend directory not found at ${backendDir}`);
  process.exit(1);
}

if (!fs.existsSync(frontendDir)) {
  console.error(`Frontend directory not found at ${frontendDir}`);
  process.exit(1);
}

// Install backend dependencies
console.log('\nInstalling backend dependencies...');
try {
  execSync('npm install', { cwd: backendDir, stdio: 'inherit' });
  console.log('Backend dependencies installed successfully.');
} catch (error) {
  console.error('Failed to install backend dependencies:', error.message);
  process.exit(1);
}

// Install frontend dependencies
console.log('\nInstalling frontend dependencies...');
try {
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
  console.log('Frontend dependencies installed successfully.');
} catch (error) {
  console.error('Failed to install frontend dependencies:', error.message);
  process.exit(1);
}

console.log('\nSetup complete! You can now start the application:');
console.log('- Backend: cd backend && npm start');
console.log('- Frontend: cd hackathon && npm run dev');
