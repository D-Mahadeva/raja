// runBackend.js (Updated)

import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import checkAndUpdatePort from './check-port.js';

dotenv.config();

const execAsync = promisify(exec);

async function runBackend() {
  try {
    console.log('🚀 Starting backend preparation...');
    
    // Check for available port first
    console.log('Checking for available port...');
    const availablePort = await checkAndUpdatePort();
    
    if (!availablePort) {
      console.error('❌ Could not find an available port. Please manually close any applications using port 5000.');
      process.exit(1);
    }
    
    console.log(`✅ Will use port: ${availablePort}`);
    
    // Setup mock data instead of using scrapers if using local MongoDB
    const useLocalMongoDB = process.env.MONGO_URI?.includes('localhost') || false;
    
    // Check if there's data in the database
    console.log('Checking database connection...');
    try {
      // Import directly instead of using execAsync for more graceful error handling
      const dbModule = await import('./src/confiq/db.js');
      await dbModule.default();
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.log('\nPlease make sure MongoDB is running locally or update your connection string.');
      console.log('Exiting...');
      process.exit(1);
    }
    
    // Check if we need to generate data
    console.log('Checking if we need to generate data...');
    try {
      // Import mongoose directly
      const mongoose = await import('mongoose');
      
      // Check if Product model exists or create it
      let Product;
      try {
        Product = mongoose.default.model('Product');
      } catch (e) {
        // Import the Product model if it doesn't exist
        const productModule = await import('./src/models/Product.js');
        Product = productModule.default;
      }
      
      // Check if there are products in the database
      const productCount = await Product.countDocuments();
      
      if (productCount === 0) {
        console.log('🔄 No products found in database. Generating mock data...');
        // Generate mock data instead of running scrapers
        await execAsync('node generateMockData.js');
        console.log('✅ Mock data generation completed');
      } else {
        console.log(`Found ${productCount} products in database. Skipping data generation.`);
      }
      
      // Close mongoose connection
      await mongoose.default.connection.close();
    } catch (error) {
      console.error('❌ Error checking database or generating data:', error);
      console.log('Trying to continue with server startup...');
    }
    
    // Transform data to add price comparisons with intelligent matching
    console.log('🔄 Transforming product data to add intelligent price comparisons...');
    try {
      await execAsync('node transformData.js');
      console.log('✅ Data transformation with product matching complete');
    } catch (error) {
      console.error('❌ Error transforming data:', error);
      console.log('Trying to continue with server startup...');
    }
    
    // Start the server with environment variables
    console.log(`🚀 Starting server on port ${availablePort}...`);
    exec(`set PORT=${availablePort} && node server.js`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error starting server: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Server Error: ${stderr}`);
        return;
      }
      console.log(stdout);
    });
  } catch (error) {
    console.error('❌ Backend preparation failed:', error.message);
  }
}

runBackend();