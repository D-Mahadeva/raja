import express from "express";
import { authenticate } from "./users.js";
import User from "../models/User.js";

const router = express.Router();

// Get user's cart
router.get("/", authenticate, async (req, res) => {
  try {
    // Get fresh user data to ensure we have the latest cart
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ items: user.cart });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
});

// Update user's cart (full replace)
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
    
    // Use findOneAndUpdate instead of save to avoid version conflicts
    // Add retry logic for robustness
    let updatedUser = null;
    let retries = 3;
    let error = null;
    
    while (retries > 0 && !updatedUser) {
      try {
        updatedUser = await User.findByIdAndUpdate(
          req.user._id,
          { $set: { cart: items } },
          { new: true, runValidators: true }
        );
      } catch (err) {
        console.error(`Update attempt failed (${retries} retries left):`, err);
        error = err;
        retries--;
        
        // Add small delay between retries
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
    
    if (!updatedUser) {
      console.error("All update attempts failed:", error);
      return res.status(500).json({ message: "Failed to update cart after multiple attempts" });
    }
    
    res.json({ message: "Cart updated successfully", items: updatedUser.cart });
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
    
    // Get fresh user data
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Find existing item in cart
    const existingItemIndex = user.cart.findIndex(item => 
      item.productId === productId && item.platform === platform
    );
    
    let update;
    
    if (existingItemIndex !== -1) {
      // Update quantity of existing item using atomic operation
      const newQuantity = user.cart[existingItemIndex].quantity + quantity;
      update = {
        $set: { [`cart.${existingItemIndex}.quantity`]: newQuantity }
      };
    } else {
      // Add new item to cart using atomic operation
      update = {
        $push: { cart: { productId, quantity, platform } }
      };
    }
    
    // Use findOneAndUpdate with retry logic
    let updatedUser = null;
    let retries = 3;
    
    while (retries > 0 && !updatedUser) {
      try {
        updatedUser = await User.findByIdAndUpdate(
          req.user._id,
          update,
          { new: true, runValidators: true }
        );
        break;
      } catch (err) {
        console.error(`Add item attempt failed (${retries} retries left):`, err);
        retries--;
        
        // Add small delay between retries
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
    
    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to add item to cart after multiple attempts" });
    }
    
    res.json({ message: "Item added to cart", items: updatedUser.cart });
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
    
    // Use $pull to remove matching items
    const update = platform 
      ? { $pull: { cart: { productId, platform } } }
      : { $pull: { cart: { productId } } };
    
    // Use findOneAndUpdate with retry logic
    let updatedUser = null;
    let retries = 3;
    
    while (retries > 0 && !updatedUser) {
      try {
        updatedUser = await User.findByIdAndUpdate(
          req.user._id,
          update,
          { new: true }
        );
        break;
      } catch (err) {
        console.error(`Remove item attempt failed (${retries} retries left):`, err);
        retries--;
        
        // Add small delay between retries
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
    
    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to remove item from cart after multiple attempts" });
    }
    
    res.json({ message: "Item removed from cart", items: updatedUser.cart });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ message: "Failed to remove item from cart" });
  }
});

// Clear cart
router.delete("/", authenticate, async (req, res) => {
  try {
    // Use findOneAndUpdate with retry logic
    let updatedUser = null;
    let retries = 3;
    
    while (retries > 0 && !updatedUser) {
      try {
        updatedUser = await User.findByIdAndUpdate(
          req.user._id,
          { $set: { cart: [] } },
          { new: true }
        );
        break;
      } catch (err) {
        console.error(`Clear cart attempt failed (${retries} retries left):`, err);
        retries--;
        
        // Add small delay between retries
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
    
    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to clear cart after multiple attempts" });
    }
    
    res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

export default router;