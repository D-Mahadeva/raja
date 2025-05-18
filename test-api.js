import axios from 'axios';

// Try to access the API
const testAPI = async () => {
  console.log('Starting API connection test...');
  
  const urls = [
    'http://localhost:5000/api/health',
    'https://api.themahadeva.live',
    'http://localhost:5000/api/debug',
    `http://${process.env.HOSTNAME || 'localhost'}:5000/api/health`
  ];
  
  console.log('Testing the following URLs:', urls);
  
  for (const url of urls) {
    try {
      console.log(`\nTesting connection to: ${url}`);
      const response = await axios.get(url);
      console.log(`✅ Successfully connected to ${url}`);
      console.log('Response status:', response.status);
      
      if (url.includes('/products')) {
        console.log(`Found ${response.data.length} products.`);
        
        // Log the first product as a sample
        if (response.data.length > 0) {
          console.log('Sample product:', JSON.stringify(response.data[0], null, 2));
        }
      } else {
        console.log('Response data:', response.data);
      }
    } catch (error) {
      console.error(`❌ Error connecting to ${url}:`, error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  }
  
  console.log('\nAPI connection test completed.');
};

// Run the test
testAPI()
  .then(() => {
    console.log('API testing complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });