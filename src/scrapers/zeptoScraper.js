import puppeteer from "puppeteer";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import connectDB from "../confiq/db.js";

const categories = [
  { name: "Fruits", url: "https://www.zepto.com/cn/fruits-vegetables/fresh-fruits/cid/64374cfe-d06f-4a01-898e-c07c46462c36/scid/09e63c15-e5f7-4712-9ff8-513250b79942" },
  { name: "Vegetables", url: "https://www.zepto.com/cn/fruits-vegetables/fresh-vegetables/cid/64374cfe-d06f-4a01-898e-c07c46462c36/scid/b4827798-fcb6-4520-ba5b-0f2bd9bd7208" },
  { 
    name: "Dairy & Milk", 
    urls: [
      "https://www.zepto.com/cn/dairy-bread-eggs/milk/cid/4b938e02-7bde-4479-bc0a-2b54cb6bd5f5/scid/22964a2b-0439-4236-9950-0d71b532b243",
      "https://www.zepto.com/cn/dairy-bread-eggs/paneer-cream/cid/4b938e02-7bde-4479-bc0a-2b54cb6bd5f5/scid/1806412f-190a-46b1-be42-4237a4146eb1"
    ] 
  },
  { name: "Meat", url: "https://www.zepto.com/cn/meats-fish-eggs/meats-fish-eggs/cid/4654bd8a-fb30-4ee1-ab30-4bf581b6c6e3/scid/b6fbf886-79f1-4a34-84bf-4aed50175418" },
  { name: "Beverages", url: "https://www.zepto.com/cn/cold-drinks-juices/cold-drinks-juices/cid/947a72ae-b371-45cb-ad3a-778c05b64399/scid/7dceec53-78f9-4f06-83d7-c8edd9c2f71a" }
];

async function scrapeCategory(category) {
  console.log(`Scraping ${category.name}...`);

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

  let products = [];


  const urls = Array.isArray(category.urls) ? category.urls : [category.url];

  for (const url of urls) {
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForSelector('[data-testid="product-card"]');

    const categoryProducts = await page.evaluate((categoryName) => {
      return Array.from(document.querySelectorAll('[data-testid="product-card"]')).map((productCard, index) => {
        const nameElement = productCard.querySelector('[data-testid="product-card-name"]');
        const priceElement = productCard.querySelector('[data-testid="product-card-price"]');
        const imageElement = productCard.querySelector('[data-testid="product-card-image"]');
        const stockElement = productCard.querySelector('[data-testid="product-card-quantity"] h5');
        const productURL = productCard.getAttribute("href");

        return {
          id: `zepto-${categoryName.replace(/\s/g, "")}-${index + 1}`,
          name: nameElement?.innerText.trim() || "No Name",
          price: parseFloat(priceElement?.innerText.replace(/₹|,/g, "")) || 0,
          image: imageElement?.src || "No Image",
          stock: stockElement?.innerText.trim() || "No Stock Info",
          category: categoryName,
          productURL: productURL ? `https://www.zepto.com${productURL}` : "No URL",
          source: "Zepto",
        };
      });
    }, category.name);

    products = [...products, ...categoryProducts];
  }

  console.log(`Scraped ${products.length} products from ${category.name}`);

  for (const product of products) {
    await Product.updateOne({ id: product.id }, product, { upsert: true });
  }

  console.log(`${category.name} data saved to MongoDB`);

  await browser.close();
}

export default async function scrapeZepto() {
//   await connectDB();
  for (const category of categories) {
    await scrapeCategory(category);
  }
//   mongoose.connection.close();
  console.log("All categories scraped successfully!");
}

scrapeZepto().catch(console.error);
