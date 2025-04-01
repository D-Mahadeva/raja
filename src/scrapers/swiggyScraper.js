import puppeteer from "puppeteer";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import connectDB from "../confiq/db.js";

const categories = [
    { name: "Dairy & Milk", url: "https://www.swiggy.com/instamart/category-listing?categoryName=Dairy%2C+Bread+and+Eggs&custom_back=true&taxonomyType=Speciality+taxonomy+1" },
    { name: "Fruits", url: "https://www.swiggy.com/instamart/category-listing?categoryName=Fresh+Fruits&custom_back=true&taxonomyType=Speciality+taxonomy+1" },
    { name: "Vegetables", url: "https://www.swiggy.com/instamart/category-listing?categoryName=Fresh+Vegetables&custom_back=true&taxonomyType=Speciality+taxonomy+1" },
    { name: "Meat", url: "https://www.swiggy.com/instamart/category-listing?categoryName=Meat+and+Seafood&custom_back=true&taxonomyType=Speciality+taxonomy+1" },
    { name: "Beverages", url: "https://www.swiggy.com/instamart/category-listing?categoryName=Cold+Drinks+and+Juices&custom_back=true&taxonomyType=Speciality+taxonomy+3" }
];

export default async function scrapeSwiggy() {
    // await connectDB();
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            "--window-size=1920,1080",
            "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        ],
        defaultViewport: null
    });
    const page = await browser.newPage();

    for (const category of categories) {
        console.log(`Scraping: ${category.name}`);
        await page.goto(category.url, { waitUntil: "networkidle2" });
        await page.waitForSelector('[data-testid="ItemWidgetContainer"]');

        const products = await page.evaluate((categoryName) => {
            return Array.from(document.querySelectorAll('[data-testid="ItemWidgetContainer"]')).map((el, index) => {
                const nameElement = el.querySelector('.novMV');
                const priceElement = el.querySelector('._20EAu div');
                const imageElement = el.querySelector('[data-testid="item-image-default"]');
                const stockElement = el.querySelector('._3--Rr sjQej _1vyq6 div');

                return {
                    id: `swiggy-${categoryName}-${index + 1}`,
                    name: nameElement?.innerText.trim() || "No Name",
                    price: priceElement?.innerText.replace(/₹|,/g, "").trim() || "0",
                    image: imageElement?.src || "No Image",
                    stock: stockElement?.innerText.trim() || "No Stock Info",
                    category: categoryName,
                    source: "Swiggy",
                };
            });
        }, category.name);

        console.log(`Scraped ${products.length} products from ${category.name}`);

        for (const product of products) {
            await Product.updateOne({ id: product.id }, product, { upsert: true });
        }
    }

    console.log("All categories scraped successfully!");
    await browser.close();
    // mongoose.connection.close();
}

scrapeSwiggy().catch(console.error);
