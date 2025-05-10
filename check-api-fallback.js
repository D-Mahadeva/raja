// check-api-fallback.js
// Script to verify that the API fallback plugin is working correctly

import { apiFallbackPlugin } from './api-fallback.js';
import http from 'http';

console.log('🔍 Testing API Fallback Plugin...');

// Simulate a simple Vite server for testing
const mockServer = {
  httpServer: new http.Server(),
  middlewares: {
    use: (middleware) => {
      mockServer.middleware = middleware;
    }
  },
  middleware: null
};

// Initialize the plugin
console.log('Initializing API Fallback Plugin...');
const plugin = apiFallbackPlugin();
plugin.configureServer(mockServer);

// Trigger the listening event to check backend status
mockServer.httpServer.emit('listening');

// Create a mock request and response
const mockRequest = {
  url: '/api/products',
  method: 'GET',
  headers: {
    'accept': 'application/json'
  }
};

const mockResponse = {
  setHeader: (name, value) => {
    console.log(`Setting header: ${name} = ${value}`);
  },
  statusCode: 200,
  end: (data) => {
    console.log('Response sent:');
    try {
      // Parse and prettify the response data
      const parsed = JSON.parse(data);
      console.log(`Generated ${parsed.length} mock products`);
      
      if (parsed.length > 0) {
        console.log('Sample product:');
        console.log(JSON.stringify(parsed[0], null, 2));
      }
    } catch (e) {
      console.log(data);
    }
  }
};

// Test the middleware
console.log('\nTesting middleware with API request...');
if (mockServer.middleware) {
  // Call the middleware with our mock request and response
  // Use a mock next function to check if it passes through
  const mockNext = () => {
    console.log('Middleware passed to next handler (this is expected if backend is available)');
  };
  
  // Execute the middleware
  mockServer.middleware(mockRequest, mockResponse, mockNext);
  
  console.log('\n✅ API Fallback Plugin test complete');
  console.log('If you see mock products above or "Backend status: Available", the plugin is working');
  console.log('If you see "Middleware passed to next handler", your backend is available');
} else {
  console.log('❌ Middleware not registered properly');
}