const { execSync } = require('child_process');
const path = require('path');

console.log('Installing missing dependencies...');

// Path to backend directory
const backendDir = path.join(__dirname, 'backend');

try {
  console.log('\nInstalling backend dependencies...');
  // Force a clean install to make sure all packages are properly installed
  execSync('npm install bcryptjs jsonwebtoken', { cwd: backendDir, stdio: 'inherit' });
  console.log('\nDependencies installed successfully.');
  
  console.log('\nChecking if all dependencies are installed correctly...');
  execSync('npm list jsonwebtoken bcryptjs', { cwd: backendDir, stdio: 'inherit' });
  
  console.log('\nYou can now start the server with:');
  console.log('cd backend && npm run dev');
} catch (error) {
  console.error('Error during installation:', error.message);
}
