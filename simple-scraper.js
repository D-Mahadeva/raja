#!/usr/bin/env node
// simple-scraper.js - Simplified scraper runner without external dependencies

import dotenv from 'dotenv';
import connectDB from './src/confiq/db.js';
import mongoose from 'mongoose';
import Product from './src/models/Product.js';

// Import scrapers
import scrapeBlinkit from './src/scrapers/blinkitScraper.js';
import scrapeBigBasket from './src/scrapers/bigBasketScraper.js';
import scrapeZepto from './src/scrapers/zeptoScraper.js';
import scrapeSwiggy from './src/scrapers/swiggyScraper.js';

// Load environment variables
dotenv.config();

/**
 * Print help information
 */
function showHelp() {
  console.log('Simple Scraper Runner');
  console.log('---------------------');
  console.log('Usage:');
  console.log('  node simple-scraper.js [command] [options]');
  console.log('\nCommands:');
  console.log('  all                Run all scrapers');
  console.log('  blinkit            Run only Blinkit scraper');
  console.log('  zepto              Run only Zepto scraper');
  console.log('  swiggy             Run only Swiggy scraper');
  console.log('  bigbasket          Run only BigBasket scraper');
  console.log('  check-db           Test MongoDB connection');
  console.log('\nOptions:');
  console.log('  --clear            Clear existing data before scraping');
  console.log('  --help             Show this help message');
}

/**
 * Check database connection
 */
async function checkDatabase() {
  try {
    console.log('Testing MongoDB connection...');
    const connected = await connectDB();
    
    if (connected) {
      console.log('✅ MongoDB connection successful!');
      
      // Count existing products
      const count = await Product.countDocuments();
      console.log(`Database contains ${count} products`);
      
      // Get product count by source
      const sources = await Product.aggregate([
        { $group: { _id: "$source", count: { $sum: 1 } } }
      ]);
      
      if (sources.length > 0) {
        console.log('\nProducts by source:');
        sources.forEach(source => {
          console.log(`- ${source._id}: ${source.count} products`);
        });
      }
      
      // Get sample products
      if (count > 0) {
        const samples = await Product.find().limit(3);
        console.log('\nSample products:');
        samples.forEach((product, i) => {
          console.log(`${i+1}. ${product.name} - ₹${product.price} (${product.source})`);
        });
      }
    } else {
      console.log('❌ MongoDB connection failed');
    }
  } catch (error) {
    console.error('Error testing database connection:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
  }
}

/**
 * Clear existing products
 */
async function clearProducts() {
  console.log('Clearing existing products...');
  const result = await Product.deleteMany({});
  console.log(`Deleted ${result.deletedCount} products`);
}

/**
 * Run a specific scraper
 */
async function runScraper(scraperName) {
  console.log(`Running ${scraperName} scraper...`);
  
  let count = 0;
  try {
    switch (scraperName.toLowerCase()) {
      case 'blinkit':
        count = await scrapeBlinkit();
        break;
      case 'bigbasket':
        count = await scrapeBigBasket();
        break;
      case 'zepto':
        count = await scrapeZepto();
        break;
      case 'swiggy':
        count = await scrapeSwiggy();
        break;
      default:
        console.error(`Unknown scraper: ${scraperName}`);
        return 0;
    }
    
    console.log(`✅ ${scraperName} scraping completed successfully: ${count} products`);
    return count;
  } catch (error) {
    console.error(`❌ Error in ${scraperName} scraper:`, error);
    return 0;
  }
}

/**
 * Run all scrapers
 */
async function runAllScrapers() {
  let totalCount = 0;
  
  console.log('\n=== Running Blinkit Scraper ===');
  totalCount += await runScraper('blinkit');
  
  console.log('\n=== Running Swiggy Scraper ===');
  totalCount += await runScraper('swiggy');
  
  console.log('\n=== Running Zepto Scraper ===');
  totalCount += await runScraper('zepto');
  
  console.log('\n=== Running BigBasket Scraper ===');
  totalCount += await runScraper('bigbasket');
  
  console.log(`\n=== All scrapers completed ===`);
  console.log(`Total products saved: ${totalCount}`);
}

/**
 * Main function to process command line arguments and run the appropriate function
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const shouldClear = args.includes('--clear');
  
  if (args.includes('--help') || command === 'help') {
    showHelp();
    return;
  }
  
  // Connect to database
  console.log('Connecting to MongoDB...');
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to MongoDB. Exiting.');
    process.exit(1);
  }
  
  // Clear products if requested
  if (shouldClear) {
    await clearProducts();
  }
  
  // Execute the appropriate command
  switch (command) {
    case 'all':
      await runAllScrapers();
      break;
    case 'blinkit':
    case 'zepto':
    case 'swiggy':
    case 'bigbasket':
      await runScraper(command);
      break;
    case 'check-db':
      await checkDatabase();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      break;
  }
  
  // Close database connection
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});