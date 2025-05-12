// generateMockData.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./src/confiq/db.js";
import Product from "./src/models/Product.js";

dotenv.config();

// Sample data for mock products
const categories = [
  "Fruits",
  "Vegetables",
  "Dairy & Milk",
  "Beverages",
  "Meat"
];

const platforms = [
  { id: 'blinkit', name: 'Blinkit', deliveryTime: '10 mins' },
  { id: 'zepto', name: 'Zepto', deliveryTime: '8 mins' },
  { id: 'swiggy', name: 'Swiggy Instamart', deliveryTime: '15 mins' },
  { id: 'bigbasket', name: 'Big Basket', deliveryTime: '30 mins' },
  { id: 'dunzo', name: 'Dunzo Daily', deliveryTime: '20 mins' }
];

// Mock product data by category
const mockProducts = {
  "Fruits": [
    { name: "Apple", unit: "1 kg", price: 180 },
    { name: "Banana", unit: "12 pcs", price: 60 },
    { name: "Orange", unit: "1 kg", price: 120 },
    { name: "Grapes", unit: "500 g", price: 80 },
    { name: "Watermelon", unit: "1 pc", price: 90 },
    { name: "Mango", unit: "1 kg", price: 250 },
    { name: "Pineapple", unit: "1 pc", price: 120 },
    { name: "Papaya", unit: "1 pc", price: 70 }
  ],
  "Vegetables": [
    { name: "Tomato", unit: "1 kg", price: 60 },
    { name: "Potato", unit: "1 kg", price: 40 },
    { name: "Onion", unit: "1 kg", price: 35 },
    { name: "Cucumber", unit: "500 g", price: 30 },
    { name: "Carrot", unit: "500 g", price: 40 },
    { name: "Capsicum", unit: "250 g", price: 35 },
    { name: "Cabbage", unit: "1 pc", price: 45 },
    { name: "Lady Finger", unit: "250 g", price: 30 }
  ],
  "Dairy & Milk": [
    { name: "Milk", unit: "1 L", price: 68 },
    { name: "Curd", unit: "500 g", price: 40 },
    { name: "Paneer", unit: "200 g", price: 90 },
    { name: "Cheese", unit: "200 g", price: 120 },
    { name: "Butter", unit: "500 g", price: 240 },
    { name: "Ghee", unit: "500 ml", price: 350 },
    { name: "Yogurt", unit: "400 g", price: 80 },
    { name: "Fresh Cream", unit: "200 ml", price: 65 }
  ],
  "Beverages": [
    { name: "Coca Cola", unit: "1 L", price: 65 },
    { name: "Pepsi", unit: "750 ml", price: 40 },
    { name: "Orange Juice", unit: "1 L", price: 120 },
    { name: "Apple Juice", unit: "1 L", price: 130 },
    { name: "Mango Juice", unit: "1 L", price: 110 },
    { name: "Sprite", unit: "750 ml", price: 40 },
    { name: "Red Bull", unit: "250 ml", price: 125 },
    { name: "Mineral Water", unit: "1 L", price: 20 }
  ],
  "Meat": [
    { name: "Chicken Breast", unit: "500 g", price: 180 },
    { name: "Mutton", unit: "500 g", price: 350 },
    { name: "Eggs", unit: "12 pcs", price: 90 },
    { name: "Fish", unit: "500 g", price: 250 },
    { name: "Prawns", unit: "250 g", price: 280 },
    { name: "Chicken Drumstick", unit: "500 g", price: 160 },
    { name: "Boneless Chicken", unit: "500 g", price: 220 },
    { name: "Lamb Chops", unit: "500 g", price: 450 }
  ]
};

// Image placeholders by category
const categoryImages = {
  "Fruits": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=300",
  "Vegetables": "https://images.unsplash.com/photo-1466637574441-749b8f19452f?q=80&w=300",
  "Dairy & Milk": "https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=300",
  "Beverages": "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?q=80&w=300",
  "Meat": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=300"
};

// Function to generate random price variation (±15%)
function getRandomPrice(basePrice) {
  const variation = 0.85 + (Math.random() * 0.3); // 0.85 to 1.15
  return Math.round(basePrice * variation);
}

// Function to generate random availability (80% chance of being available)
function getRandomAvailability() {
  return Math.random() > 0.2;
}

// Generate mock data for the database
async function generateMockData() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");
    
    // Clear existing data
    await Product.deleteMany({});
    console.log("Cleared existing products");
    
    let generatedProducts = [];
    
    // Generate products for each category
    for (const category of categories) {
      const products = mockProducts[category];
      
      for (const [index, product] of products.entries()) {
        // Choose a random platform as the source
        const sourcePlatform = platforms[Math.floor(Math.random() * platforms.length)];
        
        // Generate prices for all platforms
        const prices = platforms.map(platform => {
          return {
            platform: platform.id,
            price: getRandomPrice(product.price),
            available: getRandomAvailability(),
            deliveryTime: platform.deliveryTime
          };
        });
        
        // Make sure source platform has this product available
        const sourcePlatformIndex = prices.findIndex(p => p.platform === sourcePlatform.id);
        prices[sourcePlatformIndex].available = true;
        
        // Create product object
        const mockProduct = {
          id: `mock-${category.toLowerCase().replace(/\s|&/g, "-")}-${index + 1}`,
          name: product.name,
          description: `Fresh ${product.name} available for quick delivery`,
          category: category,
          image: categoryImages[category] || "/placeholder.svg",
          unit: product.unit,
          price: product.price,
          source: sourcePlatform.id,
          prices: prices
        };
        
        generatedProducts.push(mockProduct);
      }
    }
    
    // Insert all products into the database
    await Product.insertMany(generatedProducts);
    
    console.log(`Successfully generated ${generatedProducts.length} mock products`);
  } catch (error) {
    console.error("Error generating mock data:", error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the function
generateMockData();