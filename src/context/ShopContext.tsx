// src/context/ShopContext.tsx

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Define types
export type Platform = 'blinkit' | 'zepto' | 'swiggy' | 'bigbasket' | 'dunzo';

export interface PlatformInfo {
  id: Platform;
  name: string;
  color: string;
  logo: string;
  deliveryTime: string;
}

export interface ProductPrice {
  platform: Platform;
  price: number;
  available: boolean;
  deliveryTime: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  unit: string;
  prices: ProductPrice[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  platform: Platform | null;
}

interface ShopContextType {
  products: Product[];
  filteredProducts: Product[];
  categories: string[];
  platforms: PlatformInfo[];
  cart: CartItem[];
  selectedPlatform: Platform | null;
  selectedCategory: string;
  searchQuery: string;
  loading: boolean;
  error: string | null;
  setSearchQuery: (query: string) => void;
  setSelectedPlatform: (platform: Platform | null) => void;
  setSelectedCategory: (category: string) => void;
  addToCart: (product: Product, platform?: Platform) => void;
  removeFromCart: (productId: string, platform?: Platform) => void;
  updateCartItemQuantity: (productId: string, quantity: number, platform?: Platform) => void;
  getCartTotal: (platform?: Platform) => number;
  getCartItemCount: () => number;
  getBestPlatformForCart: () => { platform: Platform; total: number } | null;
  clearCart: () => void;
  saveUserCart: () => Promise<void>;
  loadUserCart: () => Promise<void>;
  getConsolidatedTotal: (platform: Platform) => number;
  reloadProducts: () => Promise<void>;
}

// Platform data
const platformsData: PlatformInfo[] = [
  { id: 'blinkit', name: 'Blinkit', color: '#0c831f', logo: '/blinkit-logo.png', deliveryTime: '10 mins' },
  { id: 'zepto', name: 'Zepto', color: '#8025fb', logo: '/zepto-logo.png', deliveryTime: '8 mins' },
  { id: 'swiggy', name: 'Swiggy Instamart', color: '#fc8019', logo: '/swiggy-logo.png', deliveryTime: '15 mins' },
  { id: 'bigbasket', name: 'Big Basket', color: '#84c225', logo: '/bigbasket-logo.png', deliveryTime: '30 mins' },
  { id: 'dunzo', name: 'Dunzo Daily', color: '#00d290', logo: '/dunzo-logo.png', deliveryTime: '20 mins' },
];

// Create the context
const ShopContext = createContext<ShopContextType | undefined>(undefined);

// Helper function to transform API data to our product format
const transformProductData = (apiProducts: any[]): Product[] => {
  if (!Array.isArray(apiProducts)) {
    console.error('Expected array of products, received:', apiProducts);
    return [];
  }
  
  console.log(`Transforming ${apiProducts.length} products from API`);
  
  return apiProducts.map(item => {
    // If the product already has prices array, use it directly
    if (item.prices && Array.isArray(item.prices) && item.prices.length > 0) {
      // Make a deep copy to avoid reference issues
      const prices = [...item.prices].map(price => ({
        ...price,
        available: price.available === undefined ? true : price.available
      }));

      return {
        id: item.id || `product-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name || 'Unknown Product',
        description: item.description || `Details about ${item.name}`,
        category: item.category || 'General',
        image: item.image && item.image !== 'No Image' ? item.image : '/placeholder.svg',
        unit: item.unit || item.stock || '1 unit',
        prices
      };
    }
    
    // Generate synthetic prices for all platforms if not already present
    const prices: ProductPrice[] = platformsData.map(platform => {
      const basePrice = parseFloat(item.price?.toString() || '50') || 50;
      // Generate a random price variation (±10%)
      const randomFactor = 0.9 + (Math.random() * 0.2);
      const price = Math.round(basePrice * randomFactor);
      
      // Randomly make some items unavailable
      const available = Math.random() > 0.2;
      
      return {
        platform: platform.id,
        price,
        available,
        deliveryTime: platform.deliveryTime
      };
    });

    return {
      id: item.id || `product-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || 'Unknown Product',
      description: item.description || `Details about ${item.name}`,
      category: item.category || 'General',
      image: item.image && item.image !== 'No Image' ? item.image : '/placeholder.svg',
      unit: item.unit || item.stock || '1 unit',
      prices
    };
  });
};

// Function to fetch data directly using the Fetch API with absolute relative URL
const fetchFromRelative = async (endpoint: string): Promise<any> => {
  const url = `/api${endpoint}`;
  console.log(`Trying fetch with relative URL: ${url}`);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`Relative fetch failed for ${url}:`, err);
    throw err;
  }
};

// Function to fetch data directly using the Fetch API with CORS mode
const fetchWithFetch = async (url: string): Promise<any> => {
  console.log(`Trying fetch with URL: ${url}`);
  const cacheBuster = `${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
  try {
    const response = await fetch(`${url}${cacheBuster}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      mode: 'cors',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`Fetch failed for ${url}:`, err);
    throw err;
  }
};

// Function to fetch data using Axios
const fetchWithAxios = async (url: string): Promise<any> => {
  console.log(`Trying axios with URL: ${url}`);
  try {
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      timeout: 5000
    });
    return response.data;
  } catch (err) {
    console.error(`Axios failed for ${url}:`, err);
    throw err;
  }
};

// Generate mock data function for fallback
const generateMockData = () => {
  console.log("Generating mock product data...");
  
  const mockCategories = ['Fruits', 'Vegetables', 'Dairy & Milk', 'Meat', 'Beverages'];
  const mockProducts = [];
  
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
  
  // Generate 50 mock products (10 per category)
  mockCategories.forEach(category => {
    const items = itemsByCategory[category];
    const categoryUnits = units[category];
    
    items.forEach((item, index) => {
      const id = `mock-${category.toLowerCase().replace(/\s/g, '-')}-${index + 1}`;
      const unit = categoryUnits[Math.floor(Math.random() * categoryUnits.length)];
      const basePrice = Math.floor(Math.random() * 100) + 50; // Random price between 50 and 150
      
      // Generate prices for each platform
      const prices = platformsData.map(platform => {
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

// Provider component
export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [platforms] = useState<PlatformInfo[]>(platformsData);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref for fetch attempts
  const fetchAttemptsRef = useRef<number>(0);
  const maxFetchAttempts = 3;
  
  // Function to fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching products...");
      
      let data = null;
      let usedMockData = false;
      
      // Try API fetch using multiple methods in sequence
      try {
        // First attempt: Try using the relative URL with vite proxy
        console.log("Attempt 1: Using relative URL with proxy");
        data = await fetchFromRelative('/products');
        console.log("Relative URL fetch successful with", data.length, "products");
      } catch (error1) {
        console.log("Relative URL fetch failed:", error1);
        try {
          // Second attempt: Try direct URL with fetch
          console.log("Attempt 2: Using direct URL with fetch");
          data = await fetchWithFetch('http://localhost:5000/api/products');
          console.log("Direct URL fetch successful with", data.length, "products");
        } catch (error2) {
          console.log("Direct URL fetch failed:", error2);
          try {
            // Third attempt: Try direct URL with axios
            console.log("Attempt 3: Using direct URL with axios");
            data = await fetchWithAxios('http://localhost:5000/api/products');
            console.log("Axios fetch successful with", data.length, "products");
          } catch (error3) {
            console.log("All fetch attempts failed");
            
            // Final attempt: Use mock data
            console.log("Using mock data instead");
            data = generateMockData();
            usedMockData = true;
            console.log("Generated", data.length, "mock products");
          }
        }
      }
      
      if (!data || !Array.isArray(data)) {
        console.error("Invalid data format received:", data);
        data = generateMockData();
        usedMockData = true;
      }
      
      console.log(`Successfully received ${data.length} products (${usedMockData ? 'mock' : 'real'} data)`);
      
      // Transform API data to our product format
      const transformedProducts = transformProductData(data);
      console.log(`Transformed into ${transformedProducts.length} products`);
      
      setProducts(transformedProducts);
      
      // Extract unique categories
      const uniqueCategories = ['All', ...new Set(transformedProducts.map(product => product.category))];
      setCategories(uniqueCategories);
      console.log('Categories:', uniqueCategories);
      
      setLoading(false);
      fetchAttemptsRef.current = 0; // Reset attempts on success
      
      if (usedMockData) {
        setError("Could not connect to the backend server. Using mock data instead.");
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(`Failed to load products: ${err.message}. Please try again later.`);
      setLoading(false);
      
      // Auto-retry with increasing delay if we haven't reached max attempts
      fetchAttemptsRef.current += 1;
      if (fetchAttemptsRef.current < maxFetchAttempts) {
        const delay = 2000 * (fetchAttemptsRef.current); // Increasing delay for each retry
        console.log(`Will retry in ${delay}ms (attempt ${fetchAttemptsRef.current} of ${maxFetchAttempts})`);
        setTimeout(() => {
          fetchProducts();
        }, delay);
      } else {
        // As a last resort, generate mock data
        console.log("Maximum API fetch attempts reached. Using mock data instead.");
        const mockData = generateMockData();
        const transformedProducts = transformProductData(mockData);
        setProducts(transformedProducts);
        
        const uniqueCategories = ['All', ...new Set(transformedProducts.map(product => product.category))];
        setCategories(uniqueCategories);
        
        setLoading(false);
        setError("Could not connect to the server. Using mock data instead.");
      }
    }
  };

  // Method for manual reload
  const reloadProducts = async () => {
    fetchAttemptsRef.current = 0; // Reset attempts
    await fetchProducts();
  };

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('Loaded cart from localStorage:', parsedCart);
        setCart(parsedCart);
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e);
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Only save to server if user is logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      saveUserCart();
    }
  }, [cart]);

  // Filter products based on selected category, platform, and search query
  useEffect(() => {
    if (products.length === 0) return;
    
    let filtered = [...products];
    console.log(`Filtering from ${filtered.length} products`);
    
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
      console.log(`After category filter (${selectedCategory}): ${filtered.length} products`);
    }
    
    // Filter by platform availability
    if (selectedPlatform) {
      filtered = filtered.filter(product => 
        product.prices.some(price => price.platform === selectedPlatform && price.available)
      );
      console.log(`After platform filter (${selectedPlatform}): ${filtered.length} products`);
    }
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
      console.log(`After search filter (${searchQuery}): ${filtered.length} products`);
    }
    
    setFilteredProducts(filtered);
  }, [products, selectedCategory, selectedPlatform, searchQuery]);

  const addToCart = (product: Product, platform?: Platform) => {
    // Create a deep copy of the product to avoid reference issues
    const stableProduct = JSON.parse(JSON.stringify(product));
    
    setCart(prevCart => {
      // If platform is specified, use it; otherwise, use the selected platform or null
      const targetPlatform = platform || selectedPlatform;
      
      // Check if this product + platform combination already exists in cart
      const existingItemIndex = prevCart.findIndex(item => 
        item.product.id === stableProduct.id && 
        (targetPlatform ? item.platform === targetPlatform : item.platform === null)
      );
      
      if (existingItemIndex !== -1) {
        // Update quantity of existing item
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + 1
        };
        return updatedCart;
      } else {
        // Add new item to cart
        return [...prevCart, {
          product: stableProduct,
          quantity: 1,
          platform: targetPlatform
        }];
      }
    });
  };

  const removeFromCart = (productId: string, platform?: Platform) => {
    setCart(prevCart => {
      // If platform is specified, use it; otherwise, use the selected platform or remove all instances
      const targetPlatform = platform || selectedPlatform;
      
      if (targetPlatform) {
        // Remove specific product + platform combination
        return prevCart.filter(item => 
          !(item.product.id === productId && item.platform === targetPlatform)
        );
      } else {
        // Remove all instances of this product regardless of platform
        return prevCart.filter(item => item.product.id !== productId);
      }
    });
  };

  const updateCartItemQuantity = (productId: string, quantity: number, platform?: Platform) => {
    setCart(prevCart => {
      const targetPlatform = platform || selectedPlatform;
      
      return prevCart.map(item => {
        if (item.product.id === productId && 
            (targetPlatform ? item.platform === targetPlatform : true)) {
          return { ...item, quantity: Math.max(0, quantity) };
        }
        return item;
      }).filter(item => item.quantity > 0); // Remove items with quantity 0
    });
  };

  const getCartTotal = (platform?: Platform) => {
    return cart.reduce((total, item) => {
      // Find the appropriate price based on context
      let priceInfo;
      
      if (platform) {
        // If a specific platform is requested, use that platform's price regardless of the item's platform
        priceInfo = item.product.prices.find(p => p.platform === platform);
      } else if (item.platform) {
        // If no platform specified but item has a platform, use item's platform price
        priceInfo = item.product.prices.find(p => p.platform === item.platform);
      } else if (selectedPlatform) {
        // If no item platform but there's a selected platform, use that
        priceInfo = item.product.prices.find(p => p.platform === selectedPlatform);
      } else {
        // Default: find best price
        priceInfo = item.product.prices
          .filter(p => p.available)
          .sort((a, b) => a.price - b.price)[0];
      }
      
      // Add to total if price is available
      if (priceInfo && priceInfo.available) {
        return total + (priceInfo.price * item.quantity);
      }
      
      return total;
    }, 0);
  };
  
  // Get total by consolidating all items as if they were purchased from a single platform
  const getConsolidatedTotal = (platform: Platform) => {
    return cart.reduce((total, item) => {
      const priceInfo = item.product.prices.find(p => p.platform === platform);
      if (priceInfo && priceInfo.available) {
        return total + (priceInfo.price * item.quantity);
      }
      return total;
    }, 0);
  };
  
  // Save cart to server (for logged in users)
  const saveUserCart = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return; // Not logged in
    
    try {
      const cartData = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        platform: item.platform
      }));
      
      // Try multiple possible ways to save cart
      try {
        // First try with relative URL (vite proxy)
        await fetchFromRelative('/cart');
        console.log('Successfully saved cart with relative URL');
        return;
      } catch (error1) {
        console.log('Failed to save cart with relative URL:', error1);
        
        // Try direct URL 
        try {
          const response = await axios.post('http://localhost:5000/api/cart', 
            { items: cartData }, 
            { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
          );
          console.log('Successfully saved cart with direct URL');
          return;
        } catch (error2) {
          console.error('Failed to save cart with direct URL:', error2);
          // Cart couldn't be saved, but we'll continue silently
        }
      }
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };
  
  // Load cart from server (for logged in users)
  const loadUserCart = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return; // Not logged in
    
    try {
      let cartData = null;
      
      // Try multiple approaches to load the cart
      try {
        // First try with relative URL (vite proxy)
        cartData = await fetchFromRelative('/cart');
        console.log('Successfully loaded cart with relative URL');
      } catch (error1) {
        console.log('Failed to load cart with relative URL:', error1);
        
        // Try direct URL
        try {
          const response = await axios.get('http://localhost:5000/api/cart', {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
          });
          cartData = response.data;
          console.log('Successfully loaded cart with direct URL');
        } catch (error2) {
          console.error('Failed to load cart with direct URL:', error2);
          return; // Can't load the cart
        }
      }
      
      if (!cartData) {
        console.error('No cart data received');
        return;
      }
      
      // Find the product objects and build cart items
      const userCart: CartItem[] = [];
      
      for (const item of cartData.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          userCart.push({
            product,
            quantity: item.quantity,
            platform: item.platform
          });
        }
      }
      
      // Only update if we have valid data or explicitly empty cart
      if (userCart.length > 0 || cartData.items.length === 0) {
        setCart(userCart);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const getBestPlatformForCart = () => {
    if (cart.length === 0) return null;
    
    // Calculate total for each platform
    const platformStats = platforms.map(platform => {
      let total = 0;
      let availableCount = 0;
      let totalItems = 0;
      
      // Calculate totals and check availability
      cart.forEach(item => {
        totalItems += 1;
        const priceInfo = item.product.prices.find(p => p.platform === platform.id);
        
        if (priceInfo && priceInfo.available) {
          availableCount += 1;
          total += priceInfo.price * item.quantity;
        }
      });
      
      return { 
        platform: platform.id, 
        total, 
        availableCount, 
        totalItems,
        availabilityScore: availableCount / totalItems 
      };
    });
    
    // Filter out platforms with no available items
    const availablePlatforms = platformStats.filter(p => p.availableCount > 0);
    
    if (availablePlatforms.length === 0) {
      return null;
    }
    
    // Sort by availability percentage (at least 80%), then by price
    availablePlatforms.sort((a, b) => {
      // First prioritize platforms with at least 80% item availability
      const aHighAvail = a.availabilityScore >= 0.8;
      const bHighAvail = b.availabilityScore >= 0.8;
      
      if (aHighAvail && !bHighAvail) return -1;
      if (!aHighAvail && bHighAvail) return 1;
      
      // For platforms with similar availability, sort by price
      return a.total - b.total;
    });
    
    return availablePlatforms[0];
  };

  const clearCart = () => {
    setCart([]);
  };

  const contextValue: ShopContextType = {
    products,
    filteredProducts,
    categories,
    platforms,
    cart,
    selectedPlatform,
    selectedCategory,
    searchQuery,
    loading,
    error,
    setSearchQuery,
    setSelectedPlatform,
    setSelectedCategory,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    getCartTotal,
    getCartItemCount,
    getBestPlatformForCart,
    clearCart,
    saveUserCart,
    loadUserCart,
    getConsolidatedTotal,
    reloadProducts
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {children}
    </ShopContext.Provider>
  );
};

// Custom hook to use the shop context
export const useShop = () => {
  const context = useContext(ShopContext);
  
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  
  return context;
};