import scrapeBigBasket from "./bigBasketScraper.js";
import scrapeBlinkit from "./blinkitScraper.js";
import scrapeZepto from "./zeptoScraper.js";
import scrapeSwiggy from "./swiggyScraper.js";
import mongoose from "mongoose";
import connectDB from "../confiq/db.js";
import Product from "../models/Product.js";

async function startScraping() {
    try {

        await connectDB();
        console.log("MongoDB connected successfully");


        await Product.deleteMany({});
        console.log("Database cleared before scraping");


        await Promise.all([
            scrapeBlinkit(),
            scrapeSwiggy(),
            scrapeZepto(),
            scrapeBigBasket()
        ]);

        console.log("Scraping complete!");
    } catch (error) {
        console.error("Error during scraping:", error);
    } finally {
        // Close MongoDB connection only after all scrapers finish
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
    }
}

startScraping();
