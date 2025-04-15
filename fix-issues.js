// fix-issues.js
// A utility script to diagnose and fix common issues with the application

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

async function main() {
  console.log('🔍 Starting diagnostic checks and fixes...');
  
  // Check if .env file exists and has the correct API URL
  await checkAndFixEnvFile();
  
  // Check if MongoDB is accessible
  await checkMongoDBConnection();
  
  // Check if the backend server is running
  await checkAndStartBackend();
  
  // Check API reachability
  await checkApiReachability();
  
  console.log('✅ All checks completed. Your application should now be ready to use.');
  console.log('   If you still experience issues, try running:');
  console.log('   npm run start');
}

async function checkAndFixEnvFile() {
  console.log('Checking .env file...');
  
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';
    
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch (err) {
      console.log('⚠️ .env file not found. Creating a new one...');
      envContent = '';
    }
    
    // Check for API URL
    const apiUrlRegex = /VITE_API_URL=(.+)/;
    const apiUrlMatch = envContent.match(apiUrlRegex);
    
    if (!apiUrlMatch) {
      console.log('⚠️ VITE_API_URL not found in .env. Adding it...');
      envContent += '\nVITE_API_URL=http://localhost:5000/api/products\n';
    } else {
      const currentUrl = apiUrlMatch[1];
      if (!currentUrl.startsWith('http://')) {
        console.log('⚠️ VITE_API_URL is missing http:// prefix. Fixing...');
        envContent = envContent.replace(apiUrlRegex, `VITE_API_URL=http://localhost:5000/api/products`);
      }
    }
    
    // Check for MongoDB URI
    const mongoUriRegex = /MONGO_URI=(.+)/;
    const mongoUriMatch = envContent.match(mongoUriRegex);
    
    if (!mongoUriMatch) {
      console.log('⚠️ MONGO_URI not found in .env. Adding it...');
      // Using the same URI from the existing setup
      envContent += '\nMONGO_URI=mongodb+srv://mahadevadmahadev78:mahadeva@cluster0.7j3av.mongodb.net/?retryWrites=true&w=majority&appname=Cluster0\n';
    }
    
    // Check for PORT
    const portRegex = /PORT=(.+)/;
    const portMatch = envContent.match(portRegex);
    
    if (!portMatch) {
      console.log('⚠️ PORT not found in .env. Adding it...');
      envContent += '\nPORT=5000\n';
    }
    
    // Write updated content back to .env
    await fs.writeFile(envPath, envContent);
    console.log('✅ .env file checked and fixed');
    
  } catch (err) {
    console.error('❌ Error checking/fixing .env file:', err.message);
  }
}

async function checkMongoDBConnection() {
  console.log('Checking MongoDB connection...');
  
  try {
    const { stdout, stderr } = await execAsync('node -e "require(\'./src/confiq/db.js\').default().then(() => console.log(\'✅ MongoDB connection successful\')).catch(err => { console.error(\'❌ MongoDB connection failed:\', err.message); process.exit(1); })"');
    
    if (stdout.includes('MongoDB connection successful')) {
      console.log('✅ MongoDB connection check passed');
    } else {
      console.error('❌ MongoDB connection check failed:', stderr || stdout);
    }
  } catch (err) {
    console.error('❌ MongoDB connection check failed:', err.message);
    console.log('⚠️ You may need to update your MONGO_URI in the .env file');
  }
}

async function checkAndStartBackend() {
  console.log('Checking if backend server is running...');
  
  try {
    // Try to make a request to the backend health endpoint
    const response = await fetch('http://localhost:5000/api/health', { timeout: 3000 })
      .catch(() => null);
    
    if (response && response.ok) {
      console.log('✅ Backend server is already running');
      return;
    }
    
    console.log('⚠️ Backend server not responding. Attempting to start it...');
    
    // Start the backend server in a separate process
    const { stdout, stderr } = await execAsync('node server.js & echo $!');
    const pid = parseInt(stdout.trim(), 10);
    
    console.log(`🚀 Started backend server with PID ${pid}`);
    
    // Wait a moment for the server to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if it's now responsive
    const newResponse = await fetch('http://localhost:5000/api/health', { timeout: 3000 })
      .catch(() => null);
    
    if (newResponse && newResponse.ok) {
      console.log('✅ Backend server started successfully');
    } else {
      console.error('❌ Backend server could not be started correctly');
      console.log('⚠️ Try running "npm run backend" in a separate terminal');
    }
  } catch (err) {
    console.error('❌ Error checking/starting backend server:', err.message);
    console.log('⚠️ Try running "npm run backend" in a separate terminal');
  }
}

async function checkApiReachability() {
  console.log('Checking API reachability...');
  
  const endpoints = [
    'http://localhost:5000/api/health',
    'http://localhost:5000/api/products',
    'http://localhost:5000/api/debug'
  ];
  
  let anySuccess = false;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { timeout: 3000 });
      
      if (response.ok) {
        console.log(`✅ Successfully connected to ${endpoint}`);
        anySuccess = true;
      } else {
        console.log(`❌ Received status ${response.status} from ${endpoint}`);
      }
    } catch (err) {
      console.log(`❌ Failed to connect to ${endpoint}: ${err.message}`);
    }
  }
  
  if (!anySuccess) {
    console.log('⚠️ API is not reachable. The application will fall back to using mock data.');
    console.log('   If you want to use real data, ensure the backend server is running and accessible.');
  } else {
    console.log('✅ API is reachable');
  }
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});