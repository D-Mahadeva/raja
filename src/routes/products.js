// src/routes/products.js (CORS Fixed)

import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

// Get all products
router.get("/", async (req, res) => {
  try {
    console.log("Received request for products from", req.ip);
    
    // Ensure we have proper CORS headers set for this route
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    
    // Set cache control headers to prevent caching
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.header('Expires', '0');
    res.header('Pragma', 'no-cache');
    
    const products = await Product.find();
    console.log(`Found ${products.length} products to send`);
    
    // Log a sample product for debugging
    if (products.length > 0) {
      console.log("Sample product:", JSON.stringify(products[0]).substring(0, 200) + "...");
    }
    
    // Return the products immediately
    res.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    // Send a more detailed error response
    res.status(500).json({ 
      error: "Failed to fetch products", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// Get products by source (platform)
router.get("/source/:source", async (req, res) => {
  try {
    const { source } = req.params;
    
    // Set CORS headers
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control");
    
    const products = await Product.find({ source });
    console.log(`Found ${products.length} products for source ${source}`);
    
    res.json(products);
  } catch (error) {
    console.error("Failed to fetch products by source:", error);
    res.status(500).json({ 
      error: "Failed to fetch products by source",
      details: error.message
    });
  }
});

// Get products by category
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    
    // Set CORS headers
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control");
    
    const products = await Product.find({ category });
    console.log(`Found ${products.length} products for category ${category}`);
    
    res.json(products);
  } catch (error) {
    console.error("Failed to fetch products by category:", error);
    res.status(500).json({ 
      error: "Failed to fetch products by category",
      details: error.message
    });
  }
});

// Get single product by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Set CORS headers
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control");
    
    const product = await Product.findOne({ id });
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json(product);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    res.status(500).json({ 
      error: "Failed to fetch product",
      details: error.message
    });
  }
});

// Option route handler to properly handle preflight requests
router.options("*", (req, res) => {
  // Set CORS headers
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  
  // Send 200 response to OPTIONS requests
  res.sendStatus(200);
});

export default router;