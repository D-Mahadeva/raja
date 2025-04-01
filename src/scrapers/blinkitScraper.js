import puppeteer from "puppeteer";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import connectDB from "../confiq/db.js";

const categories = [
    { name: "Vegetables", url: "https://blinkit.com/cn/fresh-vegetables/cid/1487/1489" },
    { name: "Fruits", url: "https://blinkit.com/cn/vegetables-fruits/fresh-fruits/cid/1487/1503" },
    { name: "Milk", url: "https://blinkit.com/cn/milk/cid/14/922" },
    { name: "Meat", url: "https://blinkit.com/cn/fresh-meat/cid/4/1201" },
    { name: "Beverages", url: "https://blinkit.com/cn/cold-drinks-juices/soft-drinks/cid/332/1102" },
    { name: "Beverages", url: "https://blinkit.com/cn/cold-drinks-juices/fruit-juices/cid/332/955" }
];

export default async function scrapeBlinkit() {
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

    await page.goto("https://www.blinkit.com/", { waitUntil: "networkidle2" });

    try {
        await page.waitForSelector(".DownloadAppModal__ContinueLink-sc-1wef47t-12.kdaLHw", { timeout: 5000 });
        await page.click(".DownloadAppModal__ContinueLink-sc-1wef47t-12.kdaLHw");
        await page.waitForTimeout(2000);
    } catch (error) {}

    try {
        await page.waitForSelector(".GetLocationModal__SelectManually-sc-jc7b49-7.hQarli", { timeout: 5000 });
        await page.click(".GetLocationModal__SelectManually-sc-jc7b49-7.hQarli");
        await page.waitForTimeout(2000);
    } catch (error) {}

    try {
        await page.waitForSelector('.LocationSearchBox__InputSelect-sc-1k8u6a6-0', { timeout: 5000 });
        await page.type('.LocationSearchBox__InputSelect-sc-1k8u6a6-0', "Bengaluru", { delay: 100 });
        await page.waitForTimeout(2000);
        await page.waitForSelector('.LocationSearchList__LocationLabel-sc-93rfr7-2', { timeout: 5000 });
        await page.click('.LocationSearchList__LocationLabel-sc-93rfr7-2');
        await page.waitForTimeout(2000);
    } catch (error) {}

    for (const category of categories) {
        await page.goto(category.url, { waitUntil: "networkidle2" });
        await new Promise(r => setTimeout(r, 3000));

        const products = await page.evaluate((category) => {
            return Array.from(document.querySelectorAll('[role="button"].tw-relative')).map((el, index) => {
                const nameElement = el.querySelector('.tw-text-300.tw-font-semibold.tw-line-clamp-2');
                const priceElement = el.querySelector('.tw-text-200.tw-font-semibold');
                const oldPriceElement = el.querySelector('.tw-text-200.tw-font-regular.tw-line-through');
                const imageElement = el.querySelector('img.tw-h-full');
                const quantityElement = el.querySelector('.tw-text-200.tw-font-medium.tw-line-clamp-1');

                return {
                    id: `blinkit-${category.name.toLowerCase().replace(/\s/g, '-')}-${index + 1}`,
                    name: nameElement ? nameElement.textContent.trim() : "No Name",
                    price: priceElement ? parseFloat(priceElement.textContent.replace(/₹|,/g, "")) : 0,
                    oldPrice: oldPriceElement ? parseFloat(oldPriceElement.textContent.replace(/₹|,/g, "")) : null,
                    image: imageElement ? imageElement.getAttribute("src") : "No Image",
                    quantity: quantityElement ? quantityElement.textContent.trim() : "No Quantity",
                    category: category.name,
                    source: "Blinkit",
                };
            });
        }, category);

        for (const product of products) {
            await Product.updateOne({ id: product.id }, product, { upsert: true });
        }
    }

    await browser.close();
    // mongoose.connection.close();
}

scrapeBlinkit().catch(console.error);
