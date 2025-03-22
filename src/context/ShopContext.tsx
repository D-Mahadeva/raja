
import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

// Create the context
const ShopContext = createContext<ShopContextType | undefined>(undefined);

// Platform data
const platformsData: PlatformInfo[] = [
  { id: 'blinkit', name: 'Blinkit', color: '#0c831f', logo: '/blinkit-logo.png', deliveryTime: '10 mins' },
  { id: 'zepto', name: 'Zepto', color: '#8025fb', logo: '/zepto-logo.png', deliveryTime: '8 mins' },
  { id: 'swiggy', name: 'Swiggy Instamart', color: '#fc8019', logo: '/swiggy-logo.png', deliveryTime: '15 mins' },
  { id: 'bigbasket', name: 'Big Basket', color: '#84c225', logo: '/bigbasket-logo.png', deliveryTime: '30 mins' },
  { id: 'dunzo', name: 'Dunzo Daily', color: '#00d290', logo: '/dunzo-logo.png', deliveryTime: '20 mins' },
];

// Mock product data
const productsData: Product[] = [
  {
    id: '1',
    name: 'Fresh Milk',
    description: 'Farm-fresh whole milk, perfect for your daily needs.',
    category: 'Dairy & Milk',
    image: '/placeholder.svg',
    unit: '500ml',
    prices: [
      { platform: 'blinkit', price: 30, available: true, deliveryTime: '10 mins' },
      { platform: 'zepto', price: 28, available: true, deliveryTime: '8 mins' },
      { platform: 'swiggy', price: 32, available: true, deliveryTime: '15 mins' },
      { platform: 'bigbasket', price: 29, available: true, deliveryTime: '30 mins' },
      { platform: 'dunzo', price: 31, available: true, deliveryTime: '20 mins' },
    ],
  },
  {
    id: '2',
    name: 'Organic Bananas',
    description: 'Sweet and nutritious organic bananas.',
    category: 'Fruits',
    image: '/placeholder.svg',
    unit: '6 pcs',
    prices: [
      { platform: 'blinkit', price: 45, available: true, deliveryTime: '10 mins' },
      { platform: 'zepto', price: 42, available: true, deliveryTime: '8 mins' },
      { platform: 'swiggy', price: 48, available: true, deliveryTime: '15 mins' },
      { platform: 'bigbasket', price: 40, available: true, deliveryTime: '30 mins' },
      { platform: 'dunzo', price: 46, available: true, deliveryTime: '20 mins' },
    ],
  },
  {
    id: '3',
    name: 'Fresh Tomatoes',
    description: 'Ripe and juicy tomatoes for your salads and cooking.',
    category: 'Vegetables',
    image: '/placeholder.svg',
    unit: '500g',
    prices: [
      { platform: 'blinkit', price: 35, available: true, deliveryTime: '10 mins' },
      { platform: 'zepto', price: 32, available: true, deliveryTime: '8 mins' },
      { platform: 'swiggy', price: 38, available: true, deliveryTime: '15 mins' },
      { platform: 'bigbasket', price: 30, available: true, deliveryTime: '30 mins' },
      { platform: 'dunzo', price: 36, available: false, deliveryTime: '20 mins' },
    ],
  },
  {
    id: '4',
    name: 'Chicken Breast',
    description: 'Premium boneless chicken breast, fresh and ready to cook.',
    category: 'Meat',
    image: '/placeholder.svg',
    unit: '500g',
    prices: [
      { platform: 'blinkit', price: 180, available: true, deliveryTime: '10 mins' },
      { platform: 'zepto', price: 175, available: true, deliveryTime: '8 mins' },
      { platform: 'swiggy', price: 190, available: true, deliveryTime: '15 mins' },
      { platform: 'bigbasket', price: 170, available: true, deliveryTime: '30 mins' },
      { platform: 'dunzo', price: 185, available: true, deliveryTime: '20 mins' },
    ],
  },
  {
    id: '5',
    name: 'Whole Wheat Bread',
    description: 'Nutritious whole wheat bread for a healthy breakfast.',
    category: 'Grocery',
    image: '/placeholder.svg',
    unit: '400g',
    prices: [
      { platform: 'blinkit', price: 40, available: true, deliveryTime: '10 mins' },
      { platform: 'zepto', price: 38, available: true, deliveryTime: '8 mins' },
      { platform: 'swiggy', price: 42, available: true, deliveryTime: '15 mins' },
      { platform: 'bigbasket', price: 37, available: true, deliveryTime: '30 mins' },
      { platform: 'dunzo', price: 41, available: true, deliveryTime: '20 mins' },
    ],
  },
  {
    id: '6',
    name: 'Greek Yogurt',
    description: 'Creamy Greek yogurt, high in protein and perfect for breakfast.',
    category: 'Dairy & Milk',
    image: '/placeholder.svg',
    unit: '200g',
    prices: [
      { platform: 'blinkit', price: 60, available: true, deliveryTime: '10 mins' },
      { platform: 'zepto', price: 58, available: true, deliveryTime: '8 mins' },
      { platform: 'swiggy', price: 65, available: false, deliveryTime: '15 mins' },
      { platform: 'bigbasket', price: 55, available: true, deliveryTime: '30 mins' },
      { platform: 'dunzo', price: 62, available: true, deliveryTime: '20 mins' },
    ],
  },
  {
    id: '7',
    name: 'Potato Chips',
    description: 'Crunchy potato chips for your snack cravings.',
    category: 'Snacks',
    image: '/placeholder.svg',
    unit: '100g',
    prices: [
      { platform: 'blinkit', price: 30, available: true, deliveryTime: '10 mins' },
      { platform: 'zepto', price: 28, available: true, deliveryTime: '8 mins' },
      { platform: 'swiggy', price: 32, available: true, deliveryTime: '15 mins' },
      { platform: 'bigbasket', price: 27, available: true, deliveryTime: '30 mins' },
      { platform: 'dunzo', price: 31, available: true, deliveryTime: '20 mins' },
    ],
  },
  {
    id: '8',
    name: 'Cola Soft Drink',
    description: 'Refreshing cola drink for instant energy.',
    category: 'Beverages',
    image: '/placeholder.svg',
    unit: '1L',
    prices: [
      { platform: 'blinkit', price: 65, available: true, deliveryTime: '10 mins' },
      { platform: 'zepto', price: 62, available: true, deliveryTime: '8 mins' },
      { platform: 'swiggy', price: 68, available: true, deliveryTime: '15 mins' },
      { platform: 'bigbasket', price: 60, available: true, deliveryTime: '30 mins' },
      { platform: 'dunzo', price: 66, available: true, deliveryTime: '20 mins' },
    ],
  },
];

// Extract unique categories
const categoriesData = ['All', ...new Set(productsData.map(product => product.category))];

// Provider component
export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products] = useState<Product[]>(productsData);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(productsData);
  const [categories] = useState<string[]>(categoriesData);
  const [platforms] = useState<PlatformInfo[]>(platformsData);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
      // If platform is specified, only count items from that platform
      if (platform && item.platform !== platform) {
        return total;
      }
      
      // Find the price for this item's platform
      const priceInfo = item.product.prices.find(p => 
        p.platform === (item.platform || selectedPlatform)
      );
      
      // Add to total if price is available
      if (priceInfo && priceInfo.available) {
        return total + (priceInfo.price * item.quantity);
      }
      
      return total;
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const getBestPlatformForCart = () => {
    if (cart.length === 0) return null;
    
    // Calculate total for each platform
    const platformTotals = platforms.map(platform => {
      // Check if all cart items are available on this platform
      const allItemsAvailable = cart.every(item => {
        const priceInfo = item.product.prices.find(p => p.platform === platform.id);
        return priceInfo && priceInfo.available;
      });
      
      // If not all items are available, return a very high price
      if (!allItemsAvailable) {
        return { platform: platform.id, total: Number.MAX_SAFE_INTEGER };
      }
      
      // Calculate total for this platform
      const total = cart.reduce((sum, item) => {
        const priceInfo = item.product.prices.find(p => p.platform === platform.id);
        return sum + (priceInfo ? priceInfo.price * item.quantity : 0);
      }, 0);
      
      return { platform: platform.id, total };
    });
    
    // Find platform with lowest total
    return platformTotals.reduce((best, current) => 
      current.total < best.total ? current : best
    );
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
