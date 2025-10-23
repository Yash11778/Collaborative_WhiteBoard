const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== MongoDB Connection Troubleshooter ===');

// Check if MongoDB is installed locally
function checkMongoDBInstalled() {
  try {
    execSync('mongod --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

// Test a MongoDB connection
async function testConnection(uri) {
  try {
    console.log('Testing connection...');
    const client = new MongoClient(uri, { 
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    await client.connect();
    await client.db().admin().listDatabases();
    await client.close();
    return true;
  } catch (e) {
    console.error('Connection failed:', e.message);
    return false;
  }
}

async function main() {
  // Check if local MongoDB is installed
  const isMongoInstalled = checkMongoDBInstalled();
  console.log(isMongoInstalled 
    ? '✓ MongoDB is installed locally'
    : '✗ MongoDB does not appear to be installed locally');
  
  console.log('\nPlease select a MongoDB connection option:');
  console.log('1. Use local MongoDB (mongodb://localhost:27017/collabboard)');
  console.log('2. Use MongoDB Atlas (cloud database)');
  console.log('3. Use in-memory database (data will not persist)');
  
  const choice = await new Promise(resolve => {
    rl.question('Enter your choice (1-3): ', answer => {
      resolve(answer.trim());
    });
  });
  
  const envPath = path.join(__dirname, 'backend', '.env');
  let envContent = '';
  
  try {
    envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  } catch (err) {
    console.error('Error reading .env file:', err);
    envContent = '';
  }
  
  let updatedEnv = envContent;
  
  switch(choice) {
    case '1': // Local MongoDB
      if (!isMongoInstalled) {
        console.log('\n⚠️ Warning: MongoDB does not appear to be installed.');
        console.log('You can install MongoDB from: https://www.mongodb.com/try/download/community');
        console.log('Or use MongoDB Atlas (option 2) instead.');
        
        const proceed = await new Promise(resolve => {
          rl.question('Proceed anyway? (y/n): ', answer => {
            resolve(answer.toLowerCase() === 'y');
          });
        });
        
        if (!proceed) {
          console.log('Operation cancelled.');
          rl.close();
          return;
        }
      }
      
      const localUri = 'mongodb://localhost:27017/collabboard';
      
      console.log('\nTrying to connect to local MongoDB...');
      const localConnectionSuccess = await testConnection(localUri);
      
      if (localConnectionSuccess) {
        console.log('✓ Successfully connected to local MongoDB');
        updatedEnv = updatedEnv
          .replace(/IN_MEMORY_DB=.*\n/g, 'IN_MEMORY_DB=false\n')
          .replace(/MONGODB_URI=.*\n/g, `MONGODB_URI=${localUri}\n`);
          
        if (!updatedEnv.includes('MONGODB_URI=')) {
          updatedEnv += `\nMONGODB_URI=${localUri}`;
        }
        
        if (!updatedEnv.includes('IN_MEMORY_DB=')) {
          updatedEnv += `\nIN_MEMORY_DB=false`;
        }
      } else {
        console.log('❌ Failed to connect to local MongoDB.');
        console.log('Please make sure MongoDB is running with: mongod --dbpath=/path/to/data/db');
        
        const useInMemory = await new Promise(resolve => {
          rl.question('Would you like to use in-memory database instead? (y/n): ', answer => {
            resolve(answer.toLowerCase() === 'y');
          });
        });
        
        if (useInMemory) {
          updatedEnv = updatedEnv.replace(/IN_MEMORY_DB=.*\n/g, 'IN_MEMORY_DB=true\n');
          if (!updatedEnv.includes('IN_MEMORY_DB=')) {
            updatedEnv += `\nIN_MEMORY_DB=true`;
          }
        }
      }
      break;
      
    case '2': // MongoDB Atlas
      console.log('\nTo use MongoDB Atlas:');
      console.log('1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account');
      console.log('2. Create a new cluster (the free tier is sufficient)');
      console.log('3. In "Security" > "Database Access", create a database user');
      console.log('4. In "Security" > "Network Access", click "Add IP Address" and choose "Allow Access from Anywhere"');
      console.log('5. In "Databases", click "Connect" on your cluster, select "Connect your application", and copy the connection string');
      console.log('   Example: mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority');
      console.log('6. Replace <username> and <password> with your actual database username and password');
      
      const atlasUri = await new Promise(resolve => {
        rl.question('\nPaste your MongoDB Atlas connection string: ', answer => {
          resolve(answer.trim());
        });
      });
      
      if (!atlasUri || !atlasUri.startsWith('mongodb+srv://')) {
        console.log('Invalid connection string provided.');
        break;
      }
      
      console.log('\nTrying to connect to MongoDB Atlas...');
      const atlasConnectionSuccess = await testConnection(atlasUri);
      
      if (atlasConnectionSuccess) {
        console.log('✓ Successfully connected to MongoDB Atlas');
        updatedEnv = updatedEnv
          .replace(/IN_MEMORY_DB=.*\n/g, 'IN_MEMORY_DB=false\n')
          .replace(/MONGODB_URI=.*\n/g, `MONGODB_URI=${atlasUri}\n`);
          
        if (!updatedEnv.includes('MONGODB_URI=')) {
          updatedEnv += `\nMONGODB_URI=${atlasUri}`;
        }
        
        if (!updatedEnv.includes('IN_MEMORY_DB=')) {
          updatedEnv += `\nIN_MEMORY_DB=false`;
        }
      } else {
        console.log('❌ Failed to connect to MongoDB Atlas.');
        console.log('Please check your connection string and network settings.');
        
        const useInMemory = await new Promise(resolve => {
          rl.question('Would you like to use in-memory database instead? (y/n): ', answer => {
            resolve(answer.toLowerCase() === 'y');
          });
        });
        
        if (useInMemory) {
          updatedEnv = updatedEnv.replace(/IN_MEMORY_DB=.*\n/g, 'IN_MEMORY_DB=true\n');
          if (!updatedEnv.includes('IN_MEMORY_DB=')) {
            updatedEnv += `\nIN_MEMORY_DB=true`;
          }
        }
      }
      break;
      
    case '3': // In-memory database
      console.log('\nConfiguring in-memory database.');
      console.log('⚠️ Warning: Data will not persist when the server restarts!');
      
      updatedEnv = updatedEnv.replace(/IN_MEMORY_DB=.*\n/g, 'IN_MEMORY_DB=true\n');
      if (!updatedEnv.includes('IN_MEMORY_DB=')) {
        updatedEnv += `\nIN_MEMORY_DB=true`;
      }
      break;
      
    default:
      console.log('Invalid option selected.');
      break;
  }
  
  // Save updated .env file
  if (updatedEnv !== envContent) {
    try {
      fs.writeFileSync(envPath, updatedEnv);
      console.log('\n✓ Configuration updated successfully!');
    } catch (err) {
      console.error('Error saving .env file:', err);
    }
  }
  
  console.log('\nSetup complete! You can now start your application:');
  console.log('1. cd backend && npm run dev');
  console.log('2. cd hackathon && npm run dev');
  
  rl.close();
}

main().catch(console.error);
