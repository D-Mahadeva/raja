// server.js (updated)
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
const PORT = process.env.BACKEND_PORT || 5000;

// CORS configuration with more detailed setup
const corsOptions = {
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware with options
app.use(cors(corsOptions));

// Additional CORS headers for all routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  
  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});

// Parse JSON requests
app.use(express.json());

// Add cache control headers to prevent stale data
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.header('Expires', '0');
  res.header('Pragma', 'no-cache');
  
  // Log all requests for debugging
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`);
  
  next();
});

// Connect to MongoDB
connectDB().then(() => {
  console.log("MongoDB Connection Established");
}).catch((err) => {
  console.error("MongoDB Connection Failed:", err);
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "API is running", 
    time: new Date().toISOString(),
    ip: req.ip,
    headers: req.headers,
    cors: {
      allowOrigin: res.getHeader('Access-Control-Allow-Origin'),
      allowMethods: res.getHeader('Access-Control-Allow-Methods'),
      allowHeaders: res.getHeader('Access-Control-Allow-Headers')
    }
  });
});

// Debug endpoint
app.get("/api/debug", (req, res) => {
  res.json({ 
    message: "API is working",
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    clientIp: req.ip,
    headers: req.headers
  });
});

// Root endpoint for basic testing
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>PriceWise API</title></head>
      <body>
        <h1>PriceWise API is running!</h1>
        <p>Try these endpoints:</p>
        <ul>
          <li><a href="/api/health">Health Check</a></li>
          <li><a href="/api/debug">Debug Info</a></li>
          <li><a href="/api/products">Products API</a></li>
        </ul>
      </body>
    </html>
  `);
});

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Server error', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start the server
// By using '0.0.0.0' we allow connections from any network interface
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/products`);
});