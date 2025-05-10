// blinkit-clone/index.js
// Entry point for the Blinkit clone app

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.BLINKIT_PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*', // In production, restrict this to your main app domain
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.static(path.join(__dirname, 'public')));

// Sample data storage (in-memory for demo)
const orders = new Map();
const sessions = new Map();

// Routes

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Checkout page
app.get('/checkout', (req, res) => {
  const { sessionId, cart, returnUrl } = req.query;
  
  if (!sessionId || !cart) {
    return res.status(400).send('Invalid checkout parameters');
  }
  
  // Store session data
  try {
    const cartData = JSON.parse(decodeURIComponent(cart));
    sessions.set(sessionId, {
      cartData,
      returnUrl: returnUrl || '/',
      timestamp: new Date()
    });
    
    // Render checkout page
    res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
  } catch (error) {
    console.error('Error parsing cart data:', error);
    res.status(400).send('Invalid cart data format');
  }
});

// API to fetch cart data for a session
app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json(session);
});

// API for creating an order
app.post('/api/orders', (req, res) => {
  const { sessionId, paymentDetails, deliveryAddress } = req.body;
  
  if (!sessionId || !paymentDetails || !deliveryAddress) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Create new order
  const orderId = `BL${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
  const order = {
    id: orderId,
    sessionId,
    cartData: session.cartData,
    paymentDetails,
    deliveryAddress,
    status: 'confirmed',
    estimatedDelivery: '10-15 minutes',
    createdAt: new Date(),
    platform: 'blinkit'
  };
  
  // Store order
  orders.set(orderId, order);
  
  // Return order data
  res.status(201).json(order);
});

// API to get order status
app.get('/api/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = orders.get(orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json(order);
});

// API to update order status (simulated delivery updates)
app.post('/api/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { status, message } = req.body;
  
  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  // Update order status
  order.status = status;
  order.statusMessage = message;
  order.updatedAt = new Date();
  
  // Return updated order
  res.json(order);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Blinkit clone running on http://localhost:${PORT}`);
});