import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/confiq/db.js";

// Import routes
import productRoutes from "./src/routes/products.js";
import userRoutes from "./src/routes/users.js";
import cartRoutes from "./src/routes/cart.js";

// Configure environment variables
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

// Parse JSON requests
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

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/products`);
});