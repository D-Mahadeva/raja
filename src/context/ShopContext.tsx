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

// Function to fetch data directly using the Fetch API (to bypass some CORS issues)
const fetchWithFetch = async (url: string): Promise<any> => {
  console.log(`Trying fetch with URL: ${url}`);
  const cacheBuster = `?t=${Date.now()}`;
  const response = await fetch(`${url}${cacheBuster}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
    },
    mode: 'cors', // Allow CORS requests
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
};

// Function to fetch data using XMLHttpRequest (as a fallback)
const fetchWithXHR = (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    console.log(`Trying XHR with URL: ${url}`);
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${url}?t=${Date.now()}`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.responseType = 'json';
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(`XHR error! Status: ${xhr.status}`));
      }
    };
    
    xhr.onerror = () => {
      reject(new Error('XHR network error'));
    };
    
    xhr.send();
  });
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
      
      // Try multiple possible API URLs
      const possibleUrls = [
        import.meta.env.VITE_API_URL,
        'http://localhost:5000/api/products',
        'http://127.0.0.1:5000/api/products',
        `http://${window.location.hostname}:5000/api/products`
      ];

      console.log("Trying the following API URLs:", possibleUrls);
      
      let data = null;
      let errorMessage = "";
      
      // First try with Fetch API
      for (const url of possibleUrls) {
        if (!url) continue;
        
        try {
          data = await fetchWithFetch(url);
          if (data) {
            console.log(`Successful fetch from: ${url}`);
            break;
          }
        } catch (err) {
          errorMessage += `Failed to fetch from ${url}: ${err.message}\n`;
          console.error(`Failed to fetch from ${url}:`, err);
        }
      }
      
      // If Fetch API fails, try with XMLHttpRequest
      if (!data) {
        console.log('Fetch API failed, trying XMLHttpRequest');
        for (const url of possibleUrls) {
          if (!url) continue;
          
          try {
            data = await fetchWithXHR(url);
            if (data) {
              console.log(`Successful XHR from: ${url}`);
              break;
            }
          } catch (err) {
            errorMessage += `Failed XHR from ${url}: ${err.message}\n`;
            console.error(`Failed XHR from ${url}:`, err);
          }
        }
      }
      
      // As a last resort, try with Axios
      if (!data) {
        console.log('Both Fetch and XHR failed, trying Axios');
        for (const url of possibleUrls) {
          if (!url) continue;
          
          try {
            const response = await axios.get(`${url}?t=${Date.now()}`, {
              timeout: 15000,
              headers: {
                'Cache-Control': 'no-cache',
                'Accept': 'application/json'
              }
            });
            
            if (response.data) {
              console.log(`Successful Axios from: ${url}`);
              data = response.data;
              break;
            }
          } catch (err) {
            errorMessage += `Failed Axios from ${url}: ${err.message}\n`;
            console.error(`Failed Axios from ${url}:`, err);
          }
        }
      }
      
      // Check if we got any data
      if (!data || !Array.isArray(data)) {
        throw new Error(`All API attempts failed. Details:\n${errorMessage}`);
      }
      
      console.log(`Successfully received ${data.length} products from API`);
      
      // Log a sample product to help debug
      if (data.length > 0) {
        console.log('Sample product:', data[0]);
      }
      
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
      
      // Try multiple possible API URLs
      const possibleUrls = [
        import.meta.env.VITE_API_URL?.replace('/products', '/cart'),
        'http://localhost:5000/api/cart',
        'http://127.0.0.1:5000/api/cart',
        `http://${window.location.hostname}:5000/api/cart`
      ];
      
      let saved = false;
      let errorMessage = "";
      
      for (const url of possibleUrls) {
        if (!url) continue;
        
        try {
          const response = await axios.post(url, { items: cartData }, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
          });
          console.log(`Successfully saved cart to ${url}`);
          saved = true;
          break;
        } catch (err) {
          errorMessage += `Failed to save cart to ${url}: ${err.message}\n`;
          console.error(`Failed to save cart to ${url}:`, err);
          // Continue to the next URL
        }
      }
      
      if (!saved) {
        console.error(`Failed to save cart to any endpoint. Details:\n${errorMessage}`);
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
      // Try multiple possible API URLs
      const possibleUrls = [
        import.meta.env.VITE_API_URL?.replace('/products', '/cart'),
        'http://localhost:5000/api/cart',
        'http://127.0.0.1:5000/api/cart',
        `http://${window.location.hostname}:5000/api/cart`
      ];
      
      let response = null;
      let errorMessage = "";
      
      for (const url of possibleUrls) {
        if (!url) continue;
        
        try {
          response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
          });
          console.log(`Successfully loaded cart from ${url}`);
          break;
        } catch (err) {
          errorMessage += `Failed to load cart from ${url}: ${err.message}\n`;
          console.error(`Failed to load cart from ${url}:`, err);
          // Continue to the next URL
        }
      }
      
      if (!response) {
        console.error(`Failed to load cart from any endpoint. Details:\n${errorMessage}`);
        return;
      }
      
      // Find the product objects and build cart items
      const userCart: CartItem[] = [];
      
      for (const item of response.data.items) {
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
      if (userCart.length > 0 || response.data.items.length === 0) {
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