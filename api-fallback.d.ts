// api-fallback.js
// A Vite plugin to provide mock data when the backend is not available

/**
 * Create a Vite plugin that intercepts API requests and returns mock data
 * if the backend server is not available
 */
export function apiFallbackPlugin() {
    // Mock data for products
    const mockCategories = ['Fruits', 'Vegetables', 'Dairy & Milk', 'Meat', 'Beverages'];
    
    const fruitItems = ['Apple', 'Banana', 'Orange', 'Mango', 'Grapes', 'Watermelon', 'Kiwi', 'Pineapple', 'Strawberry', 'Papaya'];
    const vegetableItems = ['Potato', 'Onion', 'Tomato', 'Carrot', 'Cucumber', 'Cabbage', 'Cauliflower', 'Spinach', 'Capsicum', 'Beans'];
    const dairyItems = ['Milk', 'Butter', 'Cheese', 'Yogurt', 'Curd', 'Paneer', 'Cream', 'Ghee', 'Buttermilk', 'Ice Cream'];
    const meatItems = ['Chicken', 'Mutton', 'Fish', 'Eggs', 'Prawns', 'Beef', 'Pork', 'Crab', 'Lamb', 'Turkey'];
    const beverageItems = ['Cola', 'Sprite', 'Fanta', 'Pepsi', 'Apple Juice', 'Orange Juice', 'Mango Juice', 'Water', 'Soda', 'Energy Drink'];
    
    const itemsByCategory = {
      'Fruits': fruitItems,
      'Vegetables': vegetableItems,
      'Dairy & Milk': dairyItems,
      'Meat': meatItems,
      'Beverages': beverageItems
    };
    
    const units = {
      'Fruits': ['1 kg', '500 g', '250 g', '2 kg', '6 pcs'],
      'Vegetables': ['1 kg', '500 g', '250 g', '2 kg', '3 pcs'],
      'Dairy & Milk': ['500 ml', '1 L', '250 g', '400 g', '200 g'],
      'Meat': ['500 g', '1 kg', '6 pcs', '12 pcs', '300 g'],
      'Beverages': ['1 L', '500 ml', '2 L', '330 ml', '750 ml']
    };
    
    // Platforms data
    const platforms = [
      { id: 'blinkit', name: 'Blinkit', deliveryTime: '10 mins' },
      { id: 'zepto', name: 'Zepto', deliveryTime: '8 mins' },
      { id: 'swiggy', name: 'Swiggy Instamart', deliveryTime: '15 mins' },
      { id: 'bigbasket', name: 'Big Basket', deliveryTime: '30 mins' },
      { id: 'dunzo', name: 'Dunzo Daily', deliveryTime: '20 mins' }
    ];
    
    // Generate mock product data
    const generateMockProducts = () => {
      const mockProducts = [];
      let idCounter = 1;
      
      mockCategories.forEach(category => {
        const items = itemsByCategory[category];
        const categoryUnits = units[category];
        
        items.forEach((item) => {
          const id = `mock-${category.toLowerCase().replace(/\s/g, '-')}-${idCounter++}`;
          const unit = categoryUnits[Math.floor(Math.random() * categoryUnits.length)];
          const basePrice = Math.floor(Math.random() * 100) + 50; // Random price between 50 and 150
          
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
            description: `Fresh ${item} available for quick delivery`,
            category,
            image: '/placeholder.svg',
            unit,
            price: basePrice,
            source: 'Mock',
            prices
          });
        });
      });
      
      return mockProducts;
    };
    
    // API response handlers
    const apiHandlers = {
      '/api/health': () => ({
        status: "API is running (mock)",
        time: new Date().toISOString(),
        mode: "fallback"
      }),
      
      '/api/products': () => generateMockProducts(),
      
      '/api/debug': () => ({
        message: "API is working (mock mode)",
        time: new Date().toISOString(),
        environment: 'development',
        mode: "fallback"
      })
    };
    
    // Check if the backend is reachable
    let backendAvailable = false;
    let backendChecked = false;
    
    const checkBackendStatus = async () => {
      if (backendChecked) return backendAvailable;
      
      try {
        console.log('[API Fallback] Checking if backend server is available...');
        // Use fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('http://localhost:5000/api/health', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'cors',
          cache: 'no-cache',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        backendAvailable = response.ok;
        console.log(`[API Fallback] Backend status: ${backendAvailable ? 'Available ✅' : 'Unavailable ❌'}`);
      } catch (e) {
        backendAvailable = false;
        console.log('[API Fallback] Backend unavailable, using mock data');
        console.error(e);
      }
      
      backendChecked = true;
      return backendAvailable;
    };
    
    // Plugin definition
    return {
      name: 'api-fallback',
      configureServer(server) {
        // Check backend status when dev server starts
        server.httpServer.once('listening', () => {
          checkBackendStatus();
        });
        
        // Intercept API requests
        server.middlewares.use(async (req, res, next) => {
          const apiMatch = req.url.match(/^\/api\/([^/?]+)/);
          
          if (apiMatch) {
            const endpoint = `/api/${apiMatch[1]}`;
            console.log(`[API Fallback] Intercepted request to ${endpoint}`);
            
            // Check if backend is available
            const isBackendAvailable = await checkBackendStatus();
            
            if (!isBackendAvailable && apiHandlers[endpoint]) {
              // Return mock data
              console.log(`[API Fallback] Returning mock data for ${endpoint}`);
              const mockData = apiHandlers[endpoint]();
              
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
              
              res.statusCode = 200;
              res.end(JSON.stringify(mockData));
              return;
            }
            
            // Log the request
            console.log(`[API Fallback] Passing through request to ${req.url}`);
          }
          
          next();
        });
      }
    };
  }