import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try multiple possible API URLs
        const possibleUrls = [
          import.meta.env.VITE_API_URL,
          'http://localhost:5000/api/products',
          'http://192.168.1.35:5000/api/products',
          `http://${window.location.hostname}:5000/api/products`
        ];

        console.log("Trying the following API URLs:", possibleUrls);
        
        let response = null;
        let errorMessage = "";
        
        // Try each URL in order until one works
        for (const url of possibleUrls) {
          if (!url) continue;
          
          try {
            console.log(`Attempting to fetch from: ${url}`);
            response = await axios.get(url, { timeout: 5000 });
            console.log(`Successful connection to: ${url}`);
            break;
          } catch (err) {
            errorMessage += `Failed to connect to ${url}: ${err.message}\n`;
            console.error(`Failed to connect to ${url}:`, err);
            // Continue to the next URL
          }
        }
        
        if (!response) {
          throw new Error(`All API attempts failed. Details:\n${errorMessage}`);
        }
        
        console.log(`Received ${response.data.length} products from API`);
        
        // Transform API data to our product format
        const transformedProducts = transformProductData(response.data);
        setProducts(transformedProducts);
        
        // Extract unique categories
        const uniqueCategories = ['All', ...new Set(transformedProducts.map(product => product.category))];
        setCategories(uniqueCategories);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e);
      }
    }
  }, []);

  // Save cart to localStorage and server when it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Also save to server if user is logged in
    if (localStorage.getItem('auth_token')) {
      saveUserCart();
    }
  }, [cart]);

  // Filter products based on selected category, platform, and search query
  useEffect(() => {
    let filtered = [...products];
    
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Filter by platform availability
    if (selectedPlatform) {
      filtered = filtered.filter(product => 
        product.prices.some(price => price.platform === selectedPlatform && price.available)
      );
    }
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
  }, [products, selectedCategory, selectedPlatform, searchQuery]);

  const addToCart = (product: Product, platform?: Platform) => {
    setCart(prevCart => {
      // If platform is specified, use it; otherwise, use the selected platform or null
      const targetPlatform = platform || selectedPlatform;
      
      // Check if this product + platform combination already exists in cart
      const existingItemIndex = prevCart.findIndex(item => 
        item.product.id === product.id && 
        (targetPlatform ? item.platform === targetPlatform : item.platform === null)
      );
      
      if (existingItemIndex !== -1) {
        // Update quantity of existing item
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += 1;
        return updatedCart;
      } else {
        // Add new item to cart
        return [...prevCart, {
          product,
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
        'http://192.168.1.35:5000/api/cart',
        `http://${window.location.hostname}:5000/api/cart`
      ];
      
      let saved = false;
      for (const url of possibleUrls) {
        if (!url) continue;
        
        try {
          await axios.post(url, { items: cartData }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          saved = true;
          break;
        } catch (err) {
          console.error(`Failed to save cart to ${url}:`, err);
        }
      }
      
      if (!saved) {
        console.error('Failed to save cart to any endpoint');
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
        'http://192.168.1.35:5000/api/cart',
        `http://${window.location.hostname}:5000/api/cart`
      ];
      
      let response = null;
      for (const url of possibleUrls) {
        if (!url) continue;
        
        try {
          response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log(`Successfully loaded cart from ${url}`);
          break;
        } catch (err) {
          console.error(`Failed to load cart from ${url}:`, err);
        }
      }
      
      if (!response) {
        console.error('Failed to load cart from any endpoint');
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
      
      setCart(userCart);
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
    getConsolidatedTotal
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