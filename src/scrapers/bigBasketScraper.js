// src/scrapers/blinkitScraper.js - Fixed with improved selectors and MongoDB integration

import puppeteer from "puppeteer";
import Product from "../models/Product.js";

const categories = [
    { name: "Vegetables", url: "https://blinkit.com/cn/fresh-vegetables/cid/1487/1489" },
    { name: "Fruits", url: "https://blinkit.com/cn/vegetables-fruits/fresh-fruits/cid/1487/1503" },
    { name: "Milk", url: "https://blinkit.com/cn/milk/cid/14/922" },
    { name: "Meat", url: "https://blinkit.com/cn/fresh-meat/cid/4/1201" },
    { name: "Beverages", url: "https://blinkit.com/cn/cold-drinks-juices/soft-drinks/cid/332/1102" },
    { name: "Beverages", url: "https://blinkit.com/cn/cold-drinks-juices/fruit-juices/cid/332/955" }
];

export default async function scrapeBlinkit() {
    console.log("Starting Blinkit scraper...");
    
    // Initialize browser with options that help avoid detection
    const browser = await puppeteer.launch({
        headless: "new", // "new" is more stable than true in newer Puppeteer versions
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            "--window-size=1920,1080",
        ],
        defaultViewport: { width: 1920, height: 1080 }, // Set specific viewport
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    });
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set user agent to appear as a regular browser
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    
    // Add extra headers to appear more like a real browser
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
    });

    // Go to Blinkit homepage first
    console.log("Navigating to Blinkit homepage...");
    await page.goto("https://www.blinkit.com/", { 
        waitUntil: "networkidle2",
        timeout: 60000 // Increase timeout for slow connections
    });
    console.log("Landed on Blinkit homepage");

    // Handle initial modals and prompts
    try {
        console.log("Checking for intro modal...");
        const continueButton = await page.waitForSelector("[data-test-id='continue-button'], .DownloadAppModal__ContinueLink-sc-1wef47t-12, .continue-button", { 
            timeout: 5000,
            visible: true
        });
        
        if (continueButton) {
            console.log("Found continue button, clicking...");
            await continueButton.click();
            await page.waitForTimeout(2000);
        }
    } catch (error) {
        console.log("No continue button found or it couldn't be clicked:", error.message);
    }

    // Handle location selection modal
    try {
        console.log("Checking for location selection modal...");
        const manualLocationButton = await page.waitForSelector("[data-test-id='manual-location'], .GetLocationModal__SelectManually-sc-jc7b49-7, .select-manually", { 
            timeout: 5000,
            visible: true
        });
        
        if (manualLocationButton) {
            console.log("Found manual location button, clicking...");
            await manualLocationButton.click();
            await page.waitForTimeout(2000);
            
            // Type location
            console.log("Entering location...");
            await page.type('.LocationSearchBox__InputSelect-sc-1k8u6a6-0, [data-test-id="location-input"]', "Bengaluru", { delay: 100 });
            await page.waitForTimeout(2000);
            
            // Select location from dropdown
            console.log("Selecting location from dropdown...");
            await page.click('.LocationSearchList__LocationLabel-sc-93rfr7-2, [data-test-id="location-item"]');
            await page.waitForTimeout(2000);
        }
    } catch (error) {
        console.log("No location selection needed or it failed:", error.message);
    }

    // Total products counter
    let totalProductsScraped = 0;
    let totalProductsSaved = 0;

    // Process each category
    for (const category of categories) {
        console.log(`\nProcessing category: ${category.name}`);
        
        try {
            // Navigate to category page
            console.log(`Navigating to ${category.url}`);
            await page.goto(category.url, { 
                waitUntil: "networkidle2",
                timeout: 60000 // Increase timeout for slow connections
            });
            
            // Wait for products to load - try different possible selectors
            console.log("Waiting for products to load...");
            await page.waitForFunction(() => {
                // Check if any of these selectors have elements on the page
                const selectors = [
                    'div[role="button"]', 
                    '.plp-product',
                    '.product-card',
                    '[data-test-id="product-card"]'
                ];
                
                return selectors.some(selector => 
                    document.querySelectorAll(selector).length > 0
                );
            }, { timeout: 10000 });
            
            // Small delay to ensure dynamic content is fully loaded
            await page.waitForTimeout(3000);
            
            // Extract product data using page.evaluate
            console.log("Extracting product data...");
            const products = await page.evaluate((categoryName) => {
                // Try multiple selectors to find product elements on the page
                const productElements = [
                    ...document.querySelectorAll('div[role="button"].tw-relative'),
                    ...document.querySelectorAll('.plp-product'),
                    ...document.querySelectorAll('.product-card'),
                    ...document.querySelectorAll('[data-test-id="product-card"]')
                ];
                
                // Filter out duplicates if needed
                const uniqueElements = Array.from(new Set(productElements));
                
                if (uniqueElements.length === 0) {
                    console.log("No product elements found on page");
                    return [];
                }
                
                console.log(`Found ${uniqueElements.length} product elements`);
                
                // Extract data from each product element
                return uniqueElements.map((el, index) => {
                    // Try different selectors for each data point
                    
                    // Name selectors
                    const nameSelectors = [
                        '.tw-text-300.tw-font-semibold',
                        '.product-name',
                        'h3',
                        '.name',
                        '[data-test-id="product-name"]'
                    ];
                    
                    // Price selectors
                    const priceSelectors = [
                        '.tw-text-200.tw-font-semibold',
                        '.product-price',
                        '.price',
                        '[data-test-id="product-price"]'
                    ];
                    
                    // Image selectors
                    const imageSelectors = [
                        'img.tw-h-full',
                        'img',
                        '.product-image img',
                        '[data-test-id="product-image"]'
                    ];
                    
                    // Quantity selectors
                    const quantitySelectors = [
                        '.tw-text-200.tw-font-medium',
                        '.product-quantity',
                        '.quantity',
                        '[data-test-id="product-quantity"]'
                    ];
                    
                    // Find element using multiple selectors
                    const findElement = (selectors) => {
                        for (const selector of selectors) {
                            const element = el.querySelector(selector);
                            if (element) return element;
                        }
                        return null;
                    };
                    
                    // Get elements
                    const nameElement = findElement(nameSelectors);
                    const priceElement = findElement(priceSelectors);
                    const imageElement = findElement(imageSelectors);
                    const quantityElement = findElement(quantitySelectors);
                    
                    // Extract name
                    let name = "Unknown Product";
                    if (nameElement) {
                        name = nameElement.textContent.trim();
                    }
                    
                    // Extract price
                    let price = 0;
                    if (priceElement) {
                        const priceText = priceElement.textContent.replace(/[^0-9.]/g, '');
                        price = parseFloat(priceText);
                    }
                    
                    // Extract image URL
                    let image = "No Image";
                    if (imageElement && imageElement.src) {
                        image = imageElement.src;
                    }
                    
                    // Extract quantity
                    let quantity = "1 unit";
                    if (quantityElement) {
                        quantity = quantityElement.textContent.trim();
                    }
                    
                    // Generate a unique ID for the product
                    const id = `blinkit-${categoryName.toLowerCase().replace(/\s/g, '-')}-${index + 1}`;
                    
                    return {
                        id,
                        name,
                        price,
                        image,
                        quantity,
                        category: categoryName,
                        source: "Blinkit"
                    };
                });
            }, category.name);
            
            console.log(`Extracted ${products.length} products from ${category.name}`);
            totalProductsScraped += products.length;
            
            // Save products to MongoDB
            for (const product of products) {
                try {
                    // Skip products with invalid data
                    if (product.name === "Unknown Product" || product.price === 0) {
                        continue;
                    }
                    
                    // Save to database with upsert (update or insert)
                    await Product.updateOne(
                        { id: product.id }, 
                        product, 
                        { upsert: true }
                    );
                    
                    totalProductsSaved++;
                } catch (error) {
                    console.error(`Error saving product ${product.id}:`, error.message);
                }
            }
            
            console.log(`Saved ${products.length} products from ${category.name} to database`);
            
        } catch (error) {
            console.error(`Error processing category ${category.name}:`, error.message);
        }
    }

    // Close the browser
    await browser.close();
    console.log("\nBlinkit scraper finished!");
    console.log(`Total products scraped: ${totalProductsScraped}`);
    console.log(`Total products saved to MongoDB: ${totalProductsSaved}`);
    
    return totalProductsSaved;
}

// Allow direct execution of this file
if (process.argv[1].endsWith('blinkitScraper.js')) {
    console.log("Running Blinkit scraper directly");
    import('../confiq/db.js').then(({ default: connectDB }) => {
        connectDB().then(() => {
            scrapeBlinkit().then(count => {
                console.log(`Scraping completed. Total products saved: ${count}`);
                process.exit(0);
            }).catch(error => {
                console.error("Error running Blinkit scraper:", error);
                process.exit(1);
            });
        });
    });
}