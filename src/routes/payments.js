// /src/routes/payments.js

import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto"; // Using Node.js built-in crypto module
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Get Razorpay keys from environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Validate Razorpay keys
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn("WARNING: Razorpay keys not found in environment variables. Using placeholder values for development.");
}

// Initialize Razorpay with your keys
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: RAZORPAY_KEY_SECRET || "placeholder_secret"
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ 
    status: "Payments API is running",
    keyId: RAZORPAY_KEY_ID ? "Key ID is set" : "Key ID is missing",
    razorpayActive: !!RAZORPAY_KEY_ID && !!RAZORPAY_KEY_SECRET
  });
});

// Create a new Razorpay order
router.post("/create-order", async (req, res) => {
  try {
    console.log("Creating Razorpay order with payload:", req.body);
    
    const { amount, currency = "INR", receipt, notes = {} } = req.body;
    
    // Validate input
    if (!amount || !receipt) {
      return res.status(400).json({ 
        success: false, 
        error: "Amount and receipt ID are required" 
      });
    }
    
    // Convert amount to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(parseFloat(amount) * 100);
    
    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency,
      receipt,
      notes
    };
    
    console.log("Razorpay order options:", options);
    
    const order = await razorpay.orders.create(options);
    console.log("Razorpay order created:", order);
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to create payment order",
      details: error.message
    });
  }
});

// Verify payment signature
router.post("/verify-payment", async (req, res) => {
  try {
    console.log("Verifying payment with payload:", req.body);
    
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;
    
    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        error: "All payment verification details are required" 
      });
    }
    
    // Create the string that needs to be signed
    const signatureString = razorpay_order_id + "|" + razorpay_payment_id;
    
    // Create expected signature using the secret key
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(signatureString)
      .digest("hex");
    
    console.log("Expected signature:", expectedSignature);
    console.log("Received signature:", razorpay_signature);
    
    // Compare signatures
    const isSignatureValid = expectedSignature === razorpay_signature;
    
    if (isSignatureValid) {
      console.log("Payment verification successful");
      res.json({ 
        success: true, 
        message: "Payment verification successful" 
      });
    } else {
      console.log("Payment verification failed - invalid signature");
      res.status(400).json({ 
        success: false, 
        message: "Payment verification failed - invalid signature" 
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to verify payment",
      details: error.message
    });
  }
});

export default router;