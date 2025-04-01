import puppeteer from "puppeteer";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import connectDB from "../confiq/db.js";

const categories = [
    { name: "Vegetables", url: "https://www.bigbasket.com/pc/fruits-vegetables/fresh-vegetables/" },
    { name: "Fruits", url: "https://www.bigbasket.com/pc/fruits-vegetables/fresh-fruits" },
    { name: "Meat", url: "https://www.bigbasket.com/pc/eggs-meat-fish/poultry/fresh-chicken/" },
    { name: "Dairy & Milk", url: "https://www.bigbasket.com/pc/bakery-cakes-dairy/dairy/" },
    { name: "Beverages", url: "https://www.bigbasket.com/cl/beverages/" }
];

export default async function scrapeBigBasket() {
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
        console.log(`Scraping category: ${category.name}`);
        await page.goto(category.url, { waitUntil: "networkidle2" });

        await page.waitForSelector("img", { timeout: 10000 });

        const products = await page.evaluate((category) => {
            return Array.from(document.querySelectorAll(".SKUDeck___StyledDiv-sc-1e5d9gk-0")).map((el, index) => {
                const nameElement = el.querySelector("h3");
                const priceElement = el.querySelector('span[class*="Pricing___StyledLabel-sc-pldi2d-1"]');
                const quantityElement = el.querySelector('span[class*="Label-sc-15v1nk5"]');
                const imageElement = el.querySelector("img");

                let imageUrl = imageElement ? imageElement.getAttribute("src") : "No Image";
                if (imageUrl && !imageUrl.startsWith("http")) {
                    imageUrl = "https://www.bigbasket.com" + imageUrl;
                }

                return {
                    id: `bigbasket-${category.name.toLowerCase().replace(/\s/g, "-")}-${index + 1}`,
                    name: nameElement ? nameElement.textContent.trim() : "No Name",
                    price: priceElement ? parseFloat(priceElement.textContent.replace(/₹|,/g, "")) : 0,
                    image: imageUrl,
                    quantity: quantityElement ? quantityElement.textContent.trim() : "No Quantity",
                    category: category.name,
                    source: "BigBasket",
                };
            });
        }, category);

        console.log(`Scraped ${products.length} products from ${category.name}`);

        for (const product of products) {
            await Product.updateOne({ id: product.id }, product, { upsert: true });
        }
    }

    console.log("Data saved to MongoDB");
    await browser.close();
    // mongoose.connection.close();
}

scrapeBigBasket().catch(console.error);
