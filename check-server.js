// check-server.js
// A utility script to check if the backend server is running correctly

import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { createServer } from 'http';

dotenv.config();

const execAsync = promisify(exec);

// Ports to check
const BACKEND_PORT = process.env.PORT || 5000;
const FRONTEND_PORT = 8080;

// Check if a port is in use
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false); // Port is free
    });
    
    server.listen(port);
  });
}

async function checkServerStatus() {
  console.log('Checking backend server status...');
  
  // Check if backend port is in use
  const backendPortInUse = await isPortInUse(BACKEND_PORT);
  if (!backendPortInUse) {
    console.log(`❌ No server running on port ${BACKEND_PORT}`);
    return false;
  }
  
  console.log(`✅ Port ${BACKEND_PORT} is in use`);
  
  // Try to connect to the API endpoints
  const endpoints = [
    `http://localhost:${BACKEND_PORT}/api/health`,
    `http://localhost:${BACKEND_PORT}/api/products`,
    `http://localhost:${BACKEND_PORT}/`
  ];
  
  let connectedSuccessfully = false;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing connection to: ${endpoint}`);
      const response = await fetch(endpoint, { timeout: 3000 });
      
      if (response.ok) {
        console.log(`✅ Successfully connected to ${endpoint}`);
        connectedSuccessfully = true;
        break;
      } else {
        console.log(`❌ Received status ${response.status} from ${endpoint}`);
      }
    } catch (error) {
      console.log(`❌ Failed to connect to ${endpoint}: ${error.message}`);
    }
  }
  
  if (!connectedSuccessfully) {
    console.log('❌ Backend server is running but not responding to requests');
    return false;
  }
  
  return true;
}

async function startBackendServer() {
  try {
    console.log('🚀 Starting backend server...');
    const { stdout, stderr } = await execAsync('node server.js');
    
    if (stderr) {
      console.error('❌ Error starting server:', stderr);
      return false;
    }
    
    console.log('✅ Backend server started successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to start backend server:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Checking server connection...');
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log('📡 Trying to start the backend server...');
    const started = await startBackendServer();
    
    if (!started) {
      console.log('⚠️ Could not start the backend server. You may need to run it manually:');
      console.log('   npm run backend');
      process.exit(1);
    }
  }
  
  console.log('✅ Server check completed');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});