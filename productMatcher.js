import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./src/confiq/db.js";

dotenv.config();

// Import the Product model dynamically to avoid issues with model registration
const importProductModel = async () => {
  try {
    return (await import("./src/models/Product.js")).default;
  } catch (error) {
    console.error("Error importing Product model:", error);
    // If the model doesn't exist yet, define it here
    const ProductSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      description: { type: String },
      category: { type: String, required: true },
      image: { type: String },
      unit: { type: String },
      stock: { type: String },
      price: { type: Number },
      source: { type: String, required: true },
      prices: { type: Array }
    });
    
    return mongoose.model("Product", ProductSchema);
  }
};

// Platform data
const platforms = [
  { id: 'blinkit', name: 'Blinkit', deliveryTime: '10 mins' },
  { id: 'zepto', name: 'Zepto', deliveryTime: '8 mins' },
  { id: 'swiggy', name: 'Swiggy Instamart', deliveryTime: '15 mins' },
  { id: 'bigbasket', name: 'Big Basket', deliveryTime: '30 mins' },
  { id: 'dunzo', name: 'Dunzo Daily', deliveryTime: '20 mins' }
];

// Product type keywords for better matching
const productTypes = {
  "fruits": [
    "apple", "banana", "orange", "grapes", "watermelon", "kiwi", "strawberry", 
    "pineapple", "mango", "papaya", "coconut", "pomegranate", "guava", "cherries"
  ],
  "vegetables": [
    "potato", "onion", "tomato", "carrot", "cucumber", "capsicum", "cabbage", 
    "cauliflower", "broccoli", "spinach", "lettuce", "beans", "peas", "corn", 
    "garlic", "ginger", "coriander", "mint", "chilli", "beetroot", "brinjal"
  ],
  "dairy": [
    "milk", "curd", "yogurt", "cheese", "butter", "ghee", "paneer", "cream"
  ],
  "meat": [
    "chicken", "mutton", "lamb", "pork", "beef", "fish", "prawns", "eggs", "crab"
  ]
};

// Extract key information from a product name
function extractProductInfo(name, category) {
  name = name.toLowerCase();
  
  // Remove brand names and prefixes like "fresho!"
  name = name.replace(/fresho!|brotos|fresh|organic|natural|special|premium/, "").trim();
  
  // Extract weight/quantity
  const quantityMatch = name.match(/(\d+)\s*(g|kg|ml|l|pcs|pc|pack)/i);
  const quantity = quantityMatch ? quantityMatch[0] : null;
  
  // Remove quantity from name for better matching
  if (quantity) {
    name = name.replace(quantity, "").trim();
  }
  
  // Remove common words and punctuation
  name = name.replace(/with|and|&|,|-|\/|\(|\)|\+/g, " ").trim();
  name = name.replace(/\s+/g, " "); // Replace multiple spaces with a single space
  
  // Extract product type
  let productType = null;
  for (const type in productTypes) {
    for (const keyword of productTypes[type]) {
      if (name.includes(keyword)) {
        productType = keyword;
        break;
      }
    }
    if (productType) break;
  }
  
  return {
    cleanName: name,
    quantity,
    productType
  };
}

// Calculate similarity between two product names (0-100%)
function calculateSimilarity(product1, product2) {
  const info1 = extractProductInfo(product1.name, product1.category);
  const info2 = extractProductInfo(product2.name, product2.category);
  
  // Start with base similarity
  let similarity = 0;
  
  // If product types match, that's a strong signal
  if (info1.productType && info2.productType && info1.productType === info2.productType) {
    similarity += 50;
  }
  
  // Check for word matches in clean names
  const words1 = info1.cleanName.split(" ");
  const words2 = info2.cleanName.split(" ");
  
  // Count matching words
  const matchingWords = words1.filter(word => words2.includes(word)).length;
  
  // Calculate word similarity percentage
  const wordSimilarity = Math.min(
    (matchingWords / words1.length) * 100,
    (matchingWords / words2.length) * 100
  );
  
  // Weight word similarity
  similarity += wordSimilarity * 0.5;
  
  // If categories match exactly, boost similarity
  if (product1.category === product2.category) {
    similarity += 20;
  }
  
  // If quantities are similar, boost similarity
  if (info1.quantity && info2.quantity && info1.quantity === info2.quantity) {
    similarity += 10;
  }
  
  // Cap at 100%
  return Math.min(similarity, 100);
}

// Find matches for a product across all platforms
function findMatches(product, allProducts, similarityThreshold = 70) {
  const matches = [];
  
  // Group products by category for faster matching
  const sameCategory = allProducts.filter(p => 
    p.category === product.category && 
    p.source !== product.source && 
    p.id !== product.id
  );
  
  // Calculate similarity for each potential match
  for (const candidateProduct of sameCategory) {
    const similarity = calculateSimilarity(product, candidateProduct);
    
    if (similarity >= similarityThreshold) {
      matches.push({
        product: candidateProduct,
        similarity
      });
    }
  }
  
  // Sort by similarity descending
  return matches.sort((a, b) => b.similarity - a.similarity);
}

// Generate cross-platform price data for all products
async function matchProductsAcrossPlatforms() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("Connected to MongoDB successfully");
    
    // Load Product model
    const Product = await importProductModel();
    
    // Get all products
    const products = await Product.find();
    console.log(`Found ${products.length} products in the database`);
    
    if (products.length === 0) {
      console.log("No products found in the database. Please run scrapers first.");
      await mongoose.connection.close();
      return;
    }
    
    // Group products by platform
    const productsByPlatform = {};
    platforms.forEach(platform => {
      productsByPlatform[platform.id] = products.filter(p => 
        p.source.toLowerCase() === platform.id || 
        p.source.toLowerCase() === platform.name.toLowerCase()
      );
    });
    
    // For each product, find matches across platforms
    let updatedCount = 0;
    for (const product of products) {
      const productInfo = extractProductInfo(product.name, product.category);
      console.log(`\nProcessing: ${product.name} (${product.source})`);
      console.log(`Extracted: ${JSON.stringify(productInfo)}`);
      
      // Skip products that already have prices
      if (product.prices && product.prices.length > 0) {
        console.log("Product already has price data, skipping...");
        continue;
      }
      
      // Find matches across platforms
      const matches = findMatches(product, products);
      
      // Generate price data for all platforms
      const priceData = platforms.map(platform => {
        // Default values
        let basePrice = product.price || 50;
        let available = true;
        
        // Check if we have a match for this platform
        const platformMatches = matches.filter(match => 
          match.product.source.toLowerCase() === platform.id || 
          match.product.source.toLowerCase() === platform.name.toLowerCase()
        );
        
        if (platformMatches.length > 0) {
          // Use the best match
          const bestMatch = platformMatches[0];
          console.log(`Found match for ${platform.name}: ${bestMatch.product.name} (${bestMatch.similarity.toFixed(2)}%)`);
          
          basePrice = bestMatch.product.price;
          available = true;
        } else {
          // No match found, generate synthetic data
          // Make price 90-110% of the original
          const randomFactor = 0.9 + (Math.random() * 0.2);
          basePrice = Math.round(basePrice * randomFactor);
          
          // 80% chance of being available
          available = Math.random() > 0.2;
          
          console.log(`No match for ${platform.name}, generated synthetic price: ₹${basePrice}`);
        }
        
        return {
          platform: platform.id,
          price: basePrice,
          available,
          deliveryTime: platform.deliveryTime
        };
      });
      
      // Update product with prices
      await Product.updateOne(
        { _id: product._id },
        { 
          $set: { 
            prices: priceData,
            // Add unit if missing
            unit: product.unit || product.stock || productInfo.quantity || '1 item',
            // Add description if missing
            description: product.description || `${product.name} available for quick delivery`
          }
        }
      );
      
      updatedCount++;
      console.log(`Updated product with cross-platform price data`);
    }
    
    console.log(`\nProduct matching complete! Updated ${updatedCount} products with cross-platform data.`);
  } catch (error) {
    console.error("Error matching products:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the matcher
matchProductsAcrossPlatforms();