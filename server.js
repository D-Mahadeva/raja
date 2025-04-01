import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import Product from "./src/models/Product.js";
import connectDB from "./src/confiq/db.js"; // Import MongoDB connection

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


connectDB().then(() => {
    console.log("MongoDB Connection Established");
}).catch((err) => {
    console.error("MongoDB Connection Failed:", err);
});


app.get("/api/health", (req, res) => {
    res.json({ status: "API is running" });
});


app.get("/api/products", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch products" });
    }
});


app.get("/api/products/source/:source", async (req, res) => {
    try {
        const { source } = req.params;
        const products = await Product.find({ source });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch products by source" });
    }
});


app.get("/api/products/category/:category", async (req, res) => {
    try {
        const { category } = req.params;
        const products = await Product.find({ category });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch products by category" });
    }
});

app.delete("/api/products", async (req, res) => {
    try {
        await Product.deleteMany({});
        res.json({ message: "All products deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete products" });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
