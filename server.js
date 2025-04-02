import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import Product from "./src/models/Product.js";
import connectDB from "./src/confiq/db.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Connect to MongoDB
connectDB().then(() => {
    console.log("MongoDB Connection Established");
}).catch((err) => {
    console.error("MongoDB Connection Failed:", err);
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "API is running" });
});

// Debug endpoint
app.get("/api/debug", (req, res) => {
    res.json({ 
        message: "API is working",
        time: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Get all products
app.get("/api/products", async (req, res) => {
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
app.get("/api/products/source/:source", async (req, res) => {
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
app.get("/api/products/category/:category", async (req, res) => {
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
app.get("/api/products/:id", async (req, res) => {
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
app.delete("/api/products", async (req, res) => {
    try {
        await Product.deleteMany({});
        res.json({ message: "All products deleted successfully" });
    } catch (error) {
        console.error("Failed to delete products:", error);
        res.status(500).json({ error: "Failed to delete products" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`API endpoint: http://localhost:${PORT}/api/products`);
});