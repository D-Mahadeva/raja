import express from "express";
import { authenticate } from "./users.js";
import User from "../models/User.js";

const router = express.Router();

// Get user's cart
router.get("/", authenticate, async (req, res) => {
  try {
    // User is already attached to req by authenticate middleware
    const user = req.user;
    
    res.json({ items: user.cart });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
});

// Update user's cart
router.post("/", authenticate, async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Items must be an array" });
    }
    
    // Validate each item
    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ 
          message: "Each item must have a productId and a positive quantity" 
        });
      }
    }
    
    // Update user's cart
    req.user.cart = items;
    await req.user.save();
    
    res.json({ message: "Cart updated successfully", items: req.user.cart });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Failed to update cart" });
  }
});

// Add item to cart
router.post("/add", authenticate, async (req, res) => {
  try {
    const { productId, quantity = 1, platform = null } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    
    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive number" });
    }
    
    // Check if item already exists in cart
    const existingItemIndex = req.user.cart.findIndex(item => 
      item.productId === productId && item.platform === platform
    );
    
    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      req.user.cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      req.user.cart.push({ productId, quantity, platform });
    }
    
    await req.user.save();
    
    res.json({ message: "Item added to cart", items: req.user.cart });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({ message: "Failed to add item to cart" });
  }
});

// Remove item from cart
router.delete("/:productId", authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    const { platform } = req.query;
    
    // Filter out the item to be removed
    req.user.cart = req.user.cart.filter(item => 
      !(item.productId === productId && 
        (platform ? item.platform === platform : true))
    );
    
    await req.user.save();
    
    res.json({ message: "Item removed from cart", items: req.user.cart });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ message: "Failed to remove item from cart" });
  }
});

// Clear cart
router.delete("/", authenticate, async (req, res) => {
  try {
    req.user.cart = [];
    await req.user.save();
    
    res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

export default router;