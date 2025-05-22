// src/confiq/db.js - Updated MongoDB Connection without deprecated options

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Get MongoDB URI from environment variables
const MONGO_URI = process.env.MONGO_URI;

// Check if MONGO_URI is defined
if (!MONGO_URI) {
  console.error("ERROR: MONGO_URI is not defined in environment variables!");
  console.error("Please create a .env file with your MongoDB connection string");
  console.error("Example: MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database");
  process.exit(1); // Exit with error code
}

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");
    console.log(`Using connection string: ${MONGO_URI.substring(0, 25)}...`);
    
    // Connect to MongoDB without deprecated options
    await mongoose.connect(MONGO_URI);
    
    console.log("MongoDB connected successfully!");
    return true;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    
    // For more detailed troubleshooting
    if (error.name === 'MongoParseError') {
      console.error("This appears to be an invalid connection string format.");
    } else if (error.name === 'MongoServerSelectionError') {
      console.error("Could not connect to any MongoDB server. Check your network or MongoDB Atlas status.");
    } else if (error.name === 'MongoNetworkError') {
      console.error("Network issue while connecting to MongoDB. Check your internet connection.");
    }
    
    // Return false to indicate connection failed
    return false;
  }
};

export default connectDB;