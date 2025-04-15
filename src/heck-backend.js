// check-backend.js
// A simple script to check if the backend server is running and responding

import axios from 'axios';

const checkBackend = async () => {
  console.log('Checking backend server...');
  
  const endpoints = [
    'http://localhost:5000/api/health',
    'http://localhost:5000/api/products',
    'http://localhost:5000/'
  ];
  
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const response = await axios.get(endpoint, { timeout: 3000 });
      console.log(`✅ Success: ${endpoint} responded with status ${response.status}`);
      
      if (endpoint.includes('/products')) {
        console.log(`   Found ${response.data.length} products`);
      }
      
      successCount++;
    } catch (err) {
      console.log(`❌ Error: ${endpoint} - ${err.message}`);
    }
  }
  
  if (successCount > 0) {
    console.log('✅ Backend server is running and accessible!');
  } else {
    console.log('❌ Backend server is not responding. Make sure it is running with:');
    console.log('   npm run backend:only');
  }
};

checkBackend().catch(err => {
  console.error('Unexpected error:', err);
});