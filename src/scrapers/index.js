// src/scrapers/index.js - Fixed Scraper with MongoDB Integration

import scrapeBigBasket from "./bigBasketScraper.js";
import scrapeBlinkit from "./blinkitScraper.js";
import scrapeZepto from "./zeptoScraper.js";
import scrapeSwiggy from "./swiggyScraper.js";
import mongoose from "mongoose";
import connectDB from "../confiq/db.js";
import Product from "../models/Product.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function startScraping() {
  try {
    console.log("=== Starting Web Scraping Process ===");
    
    // Connect to MongoDB first
    const connected = await connectDB();
    if (!connected) {
      console.error("Failed to connect to MongoDB. Exiting the scraping process.");
      process.exit(1);
    }
    console.log("MongoDB connected successfully!");

    // Clear existing products if needed
    console.log("Clearing existing products from database...");
    const deleteResult = await Product.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing products from database`);

    // Run all scrapers in sequence (one after another to avoid overwhelming websites)
    console.log("\n=== Running Blinkit Scraper ===");
    try {
      await scrapeBlinkit();
      console.log("✅ Blinkit scraping completed successfully");
    } catch (error) {
      console.error("❌ Error in Blinkit scraper:", error);
    }

    console.log("\n=== Running Swiggy Scraper ===");
    try {
      await scrapeSwiggy();
      console.log("✅ Swiggy scraping completed successfully");
    } catch (error) {
      console.error("❌ Error in Swiggy scraper:", error);
    }

    console.log("\n=== Running Zepto Scraper ===");
    try {
      await scrapeZepto();
      console.log("✅ Zepto scraping completed successfully");
    } catch (error) {
      console.error("❌ Error in Zepto scraper:", error);
    }

    console.log("\n=== Running BigBasket Scraper ===");
    try {
      await scrapeBigBasket();
      console.log("✅ BigBasket scraping completed successfully");
    } catch (error) {
      console.error("❌ Error in BigBasket scraper:", error);
    }

    // Check how many products were scraped
    const productCount = await Product.countDocuments();
    console.log(`\n=== Scraping Summary ===`);
    console.log(`Total products scraped and stored: ${productCount}`);

    // Sample some products for verification
    if (productCount > 0) {
      const sampleProducts = await Product.find().limit(3);
      console.log("Sample products scraped:");
      sampleProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - ₹${product.price} (${product.source})`);
      });
    }

    console.log("\n=== Scraping Complete! ===");
  } catch (error) {
    console.error("Error during scraping process:", error);
  } finally {
    // Close MongoDB connection
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    } catch (err) {
      console.error("Error closing MongoDB connection:", err);
    }
  }
}

// Run the scraping function
startScraping().catch(error => {
  console.error("Fatal error in scraping process:", error);
  // Ensure we exit the process in case of fatal errors
  process.exit(1);
});