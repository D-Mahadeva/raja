// generateMockData.js
// Generate mock product data for development and testing

import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./src/confiq/db.js";
import Product from "./src/models/Product.js";

dotenv.config();

// Platform data
const platforms = [
  { id: 'blinkit', name: 'Blinkit', deliveryTime: '10 mins' },
  { id: 'zepto', name: 'Zepto', deliveryTime: '8 mins' },
  { id: 'swiggy', name: 'Swiggy Instamart', deliveryTime: '15 mins' },
  { id: 'bigbasket', name: 'Big Basket', deliveryTime: '30 mins' },
  { id: 'dunzo', name: 'Dunzo Daily', deliveryTime: '20 mins' }
];

// Categories and items
const categories = ['Fruits', 'Vegetables', 'Dairy & Milk', 'Meat', 'Beverages'];

const itemsByCategory = {
  'Fruits': [
    'Apple', 'Banana', 'Orange', 'Mango', 'Grapes', 'Watermelon', 'Kiwi',
    'Pineapple', 'Strawberry', 'Papaya', 'Pomegranate', 'Guava',
    'Dragon Fruit', 'Pear', 'Avocado', 'Blueberry', 'Cherry', 'Litchi'
  ],
  'Vegetables': [
    'Potato', 'Onion', 'Tomato', 'Carrot', 'Cucumber', 'Cabbage', 'Cauliflower',
    'Spinach', 'Capsicum', 'Beans', 'Broccoli', 'Beetroot', 'Ginger',
    'Garlic', 'Mushroom', 'Corn', 'Peas', 'Eggplant', 'Pumpkin', 'Radish'
  ],
  'Dairy & Milk': [
    'Milk', 'Butter', 'Cheese', 'Yogurt', 'Curd', 'Paneer', 'Cream',
    'Ghee', 'Buttermilk', 'Ice Cream', 'Chocolate Milk', 'Condensed Milk',
    'Flavored Yogurt', 'Cottage Cheese', 'Whipped Cream'
  ],
  'Meat': [
    'Chicken', 'Mutton', 'Fish', 'Eggs', 'Prawns', 'Beef', 'Pork',
    'Crab', 'Lamb', 'Turkey', 'Duck', 'Salmon', 'Tuna', 'Crab Sticks',
    'Chicken Sausage', 'Salami', 'Bacon', 'Ham'
  ],
  'Beverages': [
    'Cola', 'Sprite', 'Fanta', 'Pepsi', 'Apple Juice', 'Orange Juice',
    'Mango Juice', 'Water', 'Soda', 'Energy Drink', 'Green Tea',
    'Black Tea', 'Coffee', 'Iced Tea', 'Coconut Water', 'Lemonade',
    'Milkshake', 'Smoothie', 'Chocolate Drink'
  ]
};

const units = {
  'Fruits': ['1 kg', '500 g', '250 g', '2 kg', '6 pcs', '12 pcs', '1 piece'],
  'Vegetables': ['1 kg', '500 g', '250 g', '2 kg', '3 pcs', '1 bunch', '100 g'],
  'Dairy & Milk': ['500 ml', '1 L', '250 g', '400 g', '200 g', '100 g', '50 g'],
  'Meat': ['500 g', '1 kg', '6 pcs', '12 pcs', '300 g', '200 g', '100 g'],
  'Beverages': ['1 L', '500 ml', '2 L', '330 ml', '750 ml', '250 ml', '6 pack']
};

// Generate product descriptions
function generateDescription(name, category) {
  const descriptions = {
    'Fruits': [
      `Fresh ${name} packed with nutrients and flavor.`,
      `Sweet and juicy ${name}, hand-picked for quality.`,
      `Organic ${name}, perfect for healthy snacking.`,
      `Premium quality ${name}, farm to your doorstep.`
    ],
    'Vegetables': [
      `Fresh ${name}, locally sourced for best quality.`,
      `Crisp and fresh ${name}, perfect for your healthy recipes.`,
      `Organic ${name} grown without harmful pesticides.`,
      `Hand-picked ${name} delivered fresh to your door.`
    ],
    'Dairy & Milk': [
      `Premium quality ${name} for your daily nutrition.`,
      `Pure and fresh ${name} from select farms.`,
      `Rich and creamy ${name} for your cooking needs.`,
      `Natural ${name} with no artificial additives.`
    ],
    'Meat': [
      `Premium quality ${name}, fresh and hygienically packed.`,
      `Farm-fresh ${name}, perfect for your favorite recipes.`,
      `Tender and juicy ${name}, ready to cook.`,
      `Premium cut ${name}, expertly processed for quality.`
    ],
    'Beverages': [
      `Refreshing ${name} to quench your thirst.`,
      `Chilled ${name}, perfect for any time of day.`,
      `Premium ${name}, best served cold.`,
      `Delicious ${name} for instant refreshment.`
    ]
  };
  
  const options = descriptions[category] || [`Fresh ${name} available for quick delivery`];
  return options[Math.floor(Math.random() * options.length)];
}

async function generateMockData() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("Connected to MongoDB successfully");
    
    // Check if there are already products in the database
    const existingCount = await Product.countDocuments();
    
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing products. Skipping mock data generation.`);
      await mongoose.connection.close();
      return;
    }
    
    console.log("No existing products found. Generating mock data...");
    
    // Generate products
    const mockProducts = [];
    
    categories.forEach(category => {
      const items = itemsByCategory[category];
      const categoryUnits = units[category];
      
      items.forEach((item, index) => {
        const id = `mock-${category.toLowerCase().replace(/\s/g, '-')}-${index + 1}`;
        const unit = categoryUnits[Math.floor(Math.random() * categoryUnits.length)];
        const basePrice = Math.floor(Math.random() * 100) + 50; // Random price between 50 and 150
        const description = generateDescription(item, category);
        
        // Generate prices for each platform
        const prices = platforms.map(platform => {
          const priceFactor = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
          return {
            platform: platform.id,
            price: Math.round(basePrice * priceFactor),
            available: Math.random() > 0.2, // 80% chance of being available
            deliveryTime: platform.deliveryTime
          };
        });
        
        mockProducts.push({
          id,
          name: item,
          description,
          category,
          image: '/placeholder.svg',
          unit,
          price: basePrice,
          source: 'Mock',
          prices
        });
      });
    });
    
    // Insert products into the database
    console.log(`Inserting ${mockProducts.length} mock products into the database...`);
    await Product.insertMany(mockProducts);
    
    console.log("Mock data generation complete!");
    await mongoose.connection.close();
    
  } catch (error) {
    console.error("Error generating mock data:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function
generateMockData();