const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== MongoDB Setup Helper ===');
console.log('This script will help you set up MongoDB for your application.');
console.log('\nOptions:');
console.log('1. Use MongoDB Atlas (free cloud database)');
console.log('2. Use local MongoDB (requires MongoDB to be installed)');
console.log('3. Use in-memory database (data will be lost when server stops)');

rl.question('\nChoose an option (1-3): ', async (choice) => {
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  try {
    envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  } catch (err) {
    console.error('Error reading .env file:', err);
  }
  
  switch(choice) {
    case '1':
      console.log('\nSetting up MongoDB Atlas...');
      console.log('\n1. Go to https://www.mongodb.com/cloud/atlas/register');
      console.log('2. Create a free account');
      console.log('3. Create a new cluster (the free tier is sufficient)');
      console.log('4. In the "Security" tab, create a database user');
      console.log('5. In "Network Access", add your IP address or allow access from anywhere (0.0.0.0/0)');
      console.log('6. In the "Database" tab, click "Connect" and choose "Connect your application"');
      console.log('7. Copy the connection string');
      
      rl.question('\nPaste your MongoDB Atlas connection string (or press enter to use a test database): ', (uri) => {
        let connectionString = uri.trim();
        if (!connectionString) {
          connectionString = 'mongodb+srv://test:test123@cluster0.ydt6l.mongodb.net/collabboard?retryWrites=true&w=majority';
          console.log('Using test database. Note: This is shared and not secure for production!');
        }
        
        const newEnvContent = envContent.replace(
          /MONGODB_URI=.*/,
          `MONGODB_URI=${connectionString}`
        ) || `MONGODB_URI=${connectionString}`;
        
        fs.writeFileSync(envPath, newEnvContent);
        console.log('MongoDB Atlas connection string saved to .env file');
        rl.close();
      });
      break;
      
    case '2':
      console.log('\nSetting up local MongoDB...');
      console.log('\nMake sure MongoDB is installed and running on your machine.');
      
      const localUri = 'mongodb://localhost:27017/collabboard';
      const newEnvContent = envContent.replace(
        /MONGODB_URI=.*/,
        `MONGODB_URI=${localUri}`
      ) || `MONGODB_URI=${localUri}`;
      
      fs.writeFileSync(envPath, newEnvContent);
      console.log('Local MongoDB connection string saved to .env file');
      rl.close();
      break;
      
    case '3':
      console.log('\nSetting up in-memory database...');
      
      const inMemoryFlag = 'IN_MEMORY_DB=true';
      const newContent = envContent.includes('IN_MEMORY_DB') 
        ? envContent.replace(/IN_MEMORY_DB=.*/, inMemoryFlag)
        : `${envContent}\n${inMemoryFlag}`;
      
      fs.writeFileSync(envPath, newContent);
      console.log('In-memory database flag added to .env file');
      console.log('Warning: Data will not persist when the server restarts!');
      rl.close();
      break;
      
    default:
      console.log('Invalid option. Exiting.');
      rl.close();
  }
});

rl.on('close', () => {
  console.log('\nSetup complete! Start your server with: npm run dev');
  process.exit(0);
});
