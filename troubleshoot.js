// troubleshoot.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import os from 'os';

// Load environment variables
dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Running PriceWise Troubleshooter...');

// Check system info
console.log('\n📊 System Information:');
console.log(`OS: ${os.type()} ${os.release()}`);
console.log(`Node.js: ${process.version}`);
console.log(`Memory: ${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`);

// Get network interfaces
const networkInterfaces = os.networkInterfaces();
console.log('\n🌐 Network Interfaces:');
Object.keys(networkInterfaces).forEach(ifName => {
  networkInterfaces[ifName].forEach(iface => {
    if (iface.family === 'IPv4' && !iface.internal) {
      console.log(`${ifName}: ${iface.address}`);
    }
  });
});

// Check if required files exist
console.log('\n📁 Checking required files:');
const requiredFiles = [
  '.env',
  'package.json',
  'server.js',
  'src/confiq/db.js',
  'src/routes/products.js',
  'vite.config.ts'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// Check platform clones
console.log('\n🛒 Checking platform clones:');
const platformClones = [
  { name: 'Blinkit', path: 'blinkit-clone', port: process.env.BLINKIT_PORT || 3001 },
  { name: 'Zepto', path: 'zepto-clone', port: process.env.ZEPTO_PORT || 3002 }
];

platformClones.forEach(clone => {
  const folderExists = fs.existsSync(path.join(__dirname, clone.path));
  const indexJsExists = folderExists ? fs.existsSync(path.join(__dirname, clone.path, 'index.js')) : false;
  const packageJsonExists = folderExists ? fs.existsSync(path.join(__dirname, clone.path, 'package.json')) : false;
  
  console.log(`${clone.name}: ${folderExists ? '✅' : '❌'} folder, ${indexJsExists ? '✅' : '❌'} index.js, ${packageJsonExists ? '✅' : '❌'} package.json`);
});

// Check MongoDB connection string
console.log('\n🗄️ Checking MongoDB configuration:');
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.log('❌ MONGO_URI is not defined in .env file');
} else {
  const isAtlasUri = mongoUri.includes('mongodb+srv');
  const hasCredentials = mongoUri.includes('@');
  
  console.log(`MongoDB Type: ${isAtlasUri ? 'Atlas' : 'Standard'}`);
  console.log(`Has Credentials: ${hasCredentials ? '✅' : '❌'}`);
  
  // Don't print the full URI for security reasons
  console.log(`URI Format: ${isAtlasUri ? 'mongodb+srv://[username]:[password]@[cluster]' : 'mongodb://[host]:[port]/[database]'}`);
}

// Check API URL configuration
console.log('\n🌍 Checking API URL configuration:');
const apiUrl = process.env.VITE_API_URL;
if (!apiUrl) {
  console.log('❌ VITE_API_URL is not defined in .env file');
} else {
  console.log(`API URL: ${apiUrl}`);
  
  // Check if URL has correct format
  const hasProtocol = apiUrl.startsWith('http://') || apiUrl.startsWith('https://');
  const hasHost = apiUrl.includes('localhost') || /\d+\.\d+\.\d+\.\d+/.test(apiUrl);
  const hasPort = /:\d+/.test(apiUrl);
  
  console.log(`Has Protocol: ${hasProtocol ? '✅' : '❌'}`);
  console.log(`Has Host: ${hasHost ? '✅' : '❌'}`);
  console.log(`Has Port: ${hasPort ? '✅' : '❌'}`);
}

// Test network connections
console.log('\n🔌 Testing network connections:');

async function testEndpoint(url, name) {
  try {
    console.log(`Testing ${name} (${url})...`);
    const response = await fetch(url, { timeout: 5000 });
    console.log(`✅ ${name} is responding with status ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} is not responding: ${error.message}`);
    return false;
  }
}

// Run tests sequentially
(async () => {
  // Test backend API
  await testEndpoint('http://localhost:5000/api/health', 'Backend API');
  
  // Test platform clones
  for (const clone of platformClones) {
    await testEndpoint(`http://localhost:${clone.port}`, `${clone.name} Clone`);
  }
  
  // Test MongoDB directly via products endpoint
  await testEndpoint('http://localhost:5000/api/products', 'MongoDB Products');
  
  console.log('\n🏁 Troubleshooting complete!');
  
  console.log('\n💡 Recommendations:');
  console.log('1. Make sure MongoDB Atlas is accessible from your network');
  console.log('2. Try binding all services to 0.0.0.0 instead of localhost');
  console.log('3. Check if there are any firewalls blocking the connections');
  console.log('4. Update your .env file with the correct network IP addresses');
  console.log('5. Run "npm run start:full" to start all services');
})();