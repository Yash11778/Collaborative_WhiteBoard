const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the server.js file
const serverPath = path.join(__dirname, 'backend', 'server.js');

// Check if server.js exists
if (!fs.existsSync(serverPath)) {
  console.error('Error: server.js file not found!');
  process.exit(1);
}

// Start the server
console.log('Starting server...');
const server = spawn('node', [serverPath]);

// Log server output
server.stdout.on('data', (data) => {
  console.log(`Server: ${data}`);
});

server.stderr.on('data', (data) => {
  console.error(`Server error: ${data}`);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});
