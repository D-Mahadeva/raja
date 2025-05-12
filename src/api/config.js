// src/api/config.js

import axios from 'axios';

// Helper function to get API URL
export const getApiUrl = () => {
  // Try different possible API URL sources
  const envApiUrl = import.meta.env.VITE_API_URL;
  const currentOrigin = window.location.origin;
  const defaultPort = '5000';
  
  // If we have an environment variable, use it
  if (envApiUrl) {
    return envApiUrl.endsWith('/products') 
      ? envApiUrl.substring(0, envApiUrl.length - 9) // Remove '/products'
      : envApiUrl;
  }
  
  // Fallback options based on current origin
  const host = window.location.hostname;
  
  const possibleUrls = [
    `http://${host}:${defaultPort}/api`,
    `http://localhost:${defaultPort}/api`,
    `http://127.0.0.1:${defaultPort}/api`,
  ];
  
  // Return the first URL (default)
  return possibleUrls[0];
};

// Create a robust API client with retries and timeouts
export const createApiClient = () => {
  const client = axios.create({
    baseURL: getApiUrl(),
    timeout: 10000, // 10 second timeout
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
    },
    withCredentials: false // Set to true if you need to send cookies
  });
  
  // Add response interceptor for error handling
  client.interceptors.response.use(
    response => response,
    async error => {
      // Get original request
      const originalRequest = error.config;
      
      // If we've already tried 3 times, give up
      if (originalRequest._retry >= 3) {
        return Promise.reject(error);
      }
      
      // If the error is a network error or a timeout, retry
      if (error.code === 'ECONNABORTED' || 
          error.message?.includes('timeout') || 
          !error.response) {
        
        // Increment retry count
        originalRequest._retry = (originalRequest._retry || 0) + 1;
        
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * originalRequest._retry));
        
        // Try an alternative URL if we have one
        if (originalRequest._retry > 1) {
          const altUrls = [
            'http://localhost:5000/api',
            `http://127.0.0.1:5000/api`,
            `http://${window.location.hostname}:5000/api`
          ];
          
          const index = originalRequest._retry - 2;
          if (index < altUrls.length) {
            originalRequest.baseURL = altUrls[index];
            console.log(`Retrying with alternative URL: ${originalRequest.baseURL}`);
          }
        }
        
        console.log(`Retrying request (attempt ${originalRequest._retry})`);
        return client(originalRequest);
      }
      
      return Promise.reject(error);
    }
  );
  
  return client;
};

// Create a default API client instance
export const apiClient = createApiClient();

// Function to test API connection
export const testApiConnection = async () => {
  try {
    // Try multiple endpoints
    const endpoints = [
      '/health',
      '/products',
      '/debug'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing API connection to ${getApiUrl()}${endpoint}...`);
        
        const response = await apiClient.get(endpoint, { 
          timeout: 5000,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.log(`API connection successful to ${endpoint}:`, response.data);
        return {
          success: true,
          endpoint,
          data: response.data
        };
      } catch (err) {
        console.error(`Failed to connect to ${endpoint}:`, err.message);
        // Continue to next endpoint
      }
    }
    
    // If all endpoints failed
    return {
      success: false,
      error: 'All API connection attempts failed'
    };
  } catch (error) {
    console.error('API connection test error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default apiClient;