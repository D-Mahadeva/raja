// src/confiq/db.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    // Try to connect using the MONGO_URI from .env
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error("MongoDB URI is not defined in environment variables!");
      throw new Error("MongoDB URI is missing");
    }
    
    console.log("Connecting to MongoDB...");
    
    await mongoose.connect(mongoUri, {
      // These options help with connection stability
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
    });
    
    console.log("MongoDB connected successfully");
    return true;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    
    // If we're in development, try to connect to a fallback MongoDB
    if (process.env.NODE_ENV === 'development') {
      try {
        console.log("Trying fallback MongoDB connection...");
        await mongoose.connect('mongodb://localhost:27017/pricewise', {
          socketTimeoutMS: 30000,
          connectTimeoutMS: 30000,
          serverSelectionTimeoutMS: 30000,
        });
        console.log("Connected to fallback MongoDB");
        return true;
      } catch (fallbackError) {
        console.error("Fallback MongoDB connection failed:", fallbackError);
        throw error; // Re-throw the original error
      }
    }
    
    throw error;
  }
};

export default connectDB;