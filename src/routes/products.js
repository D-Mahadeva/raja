import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

// Get all products
router.get("/", async (req, res) => {
  try {
    console.log("Received request for products");
    const products = await Product.find();
    console.log(`Found ${products.length} products to send`);
    
    // Add CORS headers explicitly for troubleshooting
    res.header('Access-Control-Allow-Origin', '*');
    
    res.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get products by source (platform)
router.get("/source/:source", async (req, res) => {
  try {
    const { source } = req.params;
    const products = await Product.find({ source });
    res.json(products);
  } catch (error) {
    console.error("Failed to fetch products by source:", error);
    res.status(500).json({ error: "Failed to fetch products by source" });
  }
});

// Get products by category
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category });
    res.json(products);
  } catch (error) {
    console.error("Failed to fetch products by category:", error);
    res.status(500).json({ error: "Failed to fetch products by category" });
  }
});

// Get single product by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ id });
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json(product);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Reset products (development only)
router.delete("/", async (req, res) => {
  try {
    await Product.deleteMany({});
    res.json({ message: "All products deleted successfully" });
  } catch (error) {
    console.error("Failed to delete products:", error);
    res.status(500).json({ error: "Failed to delete products" });
  }
});

export default router;