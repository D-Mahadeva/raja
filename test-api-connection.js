// test-api-connection.js

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Default port from environment or fallback
const DEFAULT_PORT = parseInt(process.env.PORT) || 5000;

// Test API connection
async function testAPIConnection() {
  console.log('Starting API connection test...');
  
  const urls = [
    `http://localhost:${DEFAULT_PORT}/api/health`,
    `http://localhost:${DEFAULT_PORT}/api/products`,
    `http://localhost:${DEFAULT_PORT}/api/debug`,
    `http://127.0.0.1:${DEFAULT_PORT}/api/health`
  ];
  
  console.log('Testing the following URLs:', urls);
  
  let allFailed = true;
  
  for (const url of urls) {
    try {
      console.log(`\nTesting connection to: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/json',
          'Origin': 'http://localhost:8080' // Simulate request from your frontend
        },
        timeout: 5000
      });
      
      console.log(`✅ Successfully connected to ${url}`);
      console.log('Response status:', response.status);
      
      // Check CORS headers
      const corsHeaders = {
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'access-control-allow-methods': response.headers['access-control-allow-methods'],
        'access-control-allow-headers': response.headers['access-control-allow-headers']
      };
      
      console.log('CORS Headers:', corsHeaders);
      
      if (url.includes('/products')) {
        console.log(`Found ${response.data.length} products.`);
        
        // Log the first product as a sample
        if (response.data.length > 0) {
          console.log('Sample product:', JSON.stringify(response.data[0], null, 2));
        }
      } else {
        console.log('Response data:', response.data);
      }
      
      allFailed = false;
    } catch (error) {
      console.error(`❌ Error connecting to ${url}:`, error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  }
  
  if (allFailed) {
    console.error('\n❌ All connection attempts failed!');
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure your server is running on port', DEFAULT_PORT);
    console.log('2. Check your firewall settings');
    console.log('3. Verify CORS is properly configured');
    console.log('4. Try running "node kill-port.js" to free port', DEFAULT_PORT);
  } else {
    console.log('\n✅ At least one connection succeeded!');
  }
  
  console.log('\nAPI connection test completed.');
}

// Run the test
testAPIConnection()
  .then(() => {
    console.log('API testing complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });