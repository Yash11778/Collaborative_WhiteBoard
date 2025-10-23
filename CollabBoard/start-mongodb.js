const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data', 'db');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Starting MongoDB...');
console.log(`Data directory: ${dataDir}`);

// Try to start MongoDB
try {
  const mongod = spawn('mongod', [`--dbpath=${dataDir}`]);

  mongod.stdout.on('data', (data) => {
    console.log(`MongoDB: ${data}`);
  });

  mongod.stderr.on('data', (data) => {
    console.error(`MongoDB error: ${data}`);
  });

  mongod.on('close', (code) => {
    console.log(`MongoDB process exited with code ${code}`);
  });

  process.on('SIGINT', () => {
    console.log('Shutting down MongoDB...');
    mongod.kill('SIGINT');
    process.exit(0);
  });
} catch (error) {
  console.error('Failed to start MongoDB:', error.message);
  console.log('Make sure MongoDB is installed on your system.');
  console.log('You can install MongoDB from: https://www.mongodb.com/try/download/community');
  process.exit(1);
}
