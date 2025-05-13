// src/lib/checkout-bridge.js - UPDATED for better data sharing and Razorpay integration

/**
 * Formats cart data to be shared between applications
 * @param {Array} cartItems - Cart items from the price comparison app
 * @param {string} platform - The platform to check out with (blinkit/zepto)
 * @return {Object} Formatted cart data
 */
export const formatCheckoutData = (cartItems, platform) => {
  console.log("Formatting checkout data for platform:", platform);
  console.log("Cart items:", cartItems);
  
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('Invalid cart data');
  }
  
  // Filter items for the selected platform and format them
  const formattedItems = cartItems
    .filter(item => {
      // Find the price info for this platform
      const priceInfo = item.product.prices.find(p => p.platform === platform);
      return priceInfo && priceInfo.available;
    })
    .map(item => {
      const priceInfo = item.product.prices.find(p => p.platform === platform);
      return {
        id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: priceInfo.price,
        unit: item.product.unit,
        image: item.product.image,
        category: item.product.category
      };
    });
  
  const data = {
    platform,
    items: formattedItems,
    timestamp: new Date().toISOString(),
    totalAmount: formattedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    orderId: generateOrderId(platform)
  };
  
  console.log("Formatted checkout data:", data);
  return data;
};

/**
 * Generates a unique order ID
 * @param {string} platform - The platform identifier
 * @return {string} A unique order ID
 */
export const generateOrderId = (platform) => {
  const prefix = platform.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Stores checkout data in localStorage for retrieval by clone apps
 * Also uses sessionStorage for more reliable cross-tab communication
 * @param {Object} checkoutData - The formatted checkout data
 */
export const storeCheckoutData = (checkoutData) => {
  // Store in both localStorage and sessionStorage for redundancy
  const dataString = JSON.stringify(checkoutData);
  localStorage.setItem('pending_checkout', dataString);
  sessionStorage.setItem('pending_checkout', dataString);
  localStorage.setItem('checkout_timestamp', Date.now().toString());
  
  // Broadcast the data to other tabs/windows via storage event
  try {
    // Create a shared key with timestamp to ensure uniqueness
    const broadcastKey = `checkout_broadcast_${Date.now()}`;
    localStorage.setItem(broadcastKey, dataString);
    
    // Clean up after a delay to prevent localStorage from getting cluttered
    setTimeout(() => {
      localStorage.removeItem(broadcastKey);
    }, 10000); // 10 seconds
    
    console.log("Checkout data stored and broadcast:", checkoutData);
  } catch (e) {
    console.error("Error broadcasting checkout data:", e);
  }
  
  // Create a global variable as a fallback method
  try {
    window._pendingCheckoutData = checkoutData;
    console.log("Set global checkout data variable");
  } catch (e) {
    console.error("Failed to set global checkout data variable:", e);
  }
};

/**
 * Retrieves pending checkout data from multiple sources
 * @return {Object|null} The checkout data or null if none exists
 */
export const getPendingCheckout = () => {
  console.log("Trying to retrieve checkout data");
  
  // Try multiple storage methods
  let data = null;
  
  // 1. Try sessionStorage first (most reliable for same tab)
  try {
    const sessionData = sessionStorage.getItem('pending_checkout');
    if (sessionData) {
      data = JSON.parse(sessionData);
      console.log("Found checkout data in sessionStorage:", data);
      return data;
    }
  } catch (e) {
    console.error("Error retrieving from sessionStorage:", e);
  }
  
  // 2. Try localStorage second
  try {
    const localData = localStorage.getItem('pending_checkout');
    if (localData) {
      data = JSON.parse(localData);
      console.log("Found checkout data in localStorage:", data);
      return data;
    }
  } catch (e) {
    console.error("Error retrieving from localStorage:", e);
  }
  
  // 3. Try to find a broadcast message in localStorage
  try {
    const keys = Object.keys(localStorage);
    const broadcastKeys = keys.filter(key => key.startsWith('checkout_broadcast_'));
    
    if (broadcastKeys.length > 0) {
      // Sort by timestamp to get the most recent
      broadcastKeys.sort().reverse();
      const latestKey = broadcastKeys[0];
      const broadcastData = localStorage.getItem(latestKey);
      
      if (broadcastData) {
        data = JSON.parse(broadcastData);
        console.log("Found checkout data in broadcast key:", data);
        return data;
      }
    }
  } catch (e) {
    console.error("Error retrieving from broadcast keys:", e);
  }
  
  // 4. Try the global variable as a last resort
  try {
    if (window._pendingCheckoutData) {
      console.log("Found checkout data in global variable:", window._pendingCheckoutData);
      return window._pendingCheckoutData;
    }
  } catch (e) {
    console.error("Error retrieving from global variable:", e);
  }
  
  console.warn("No checkout data found in any storage mechanism");
  return null;
};

/**
 * Clears pending checkout data from all storage mechanisms
 */
export const clearPendingCheckout = () => {
  localStorage.removeItem('pending_checkout');
  sessionStorage.removeItem('pending_checkout');
  localStorage.removeItem('checkout_timestamp');
  try {
    delete window._pendingCheckoutData;
  } catch (e) {}
  
  // Also clear any broadcast keys
  try {
    const keys = Object.keys(localStorage);
    const broadcastKeys = keys.filter(key => key.startsWith('checkout_broadcast_'));
    broadcastKeys.forEach(key => localStorage.removeItem(key));
  } catch (e) {}
};

/**
 * Stores order status updates
 * @param {Object} orderStatus - The order status data
 */
export const updateOrderStatus = (orderStatus) => {
  const existingOrders = JSON.parse(localStorage.getItem('order_statuses') || '[]');
  const updatedOrders = [orderStatus, ...existingOrders].slice(0, 10); // Keep last 10 orders
  localStorage.setItem('order_statuses', JSON.stringify(updatedOrders));
  
  // Also store in sessionStorage for redundancy
  sessionStorage.setItem('order_statuses', JSON.stringify(updatedOrders));
  
  // Also dispatch a custom event that the comparison app can listen for
  const event = new CustomEvent('order_status_update', { detail: orderStatus });
  window.dispatchEvent(event);
  
  // Broadcast to opener window if available
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'ORDER_STATUS_UPDATE',
        data: orderStatus
      }, '*');
    }
  } catch (e) {
    console.error("Error broadcasting to opener:", e);
  }
  
  console.log("Order status updated:", orderStatus);
};

/**
 * Gets all recent order statuses
 * @return {Array} Recent order statuses
 */
export const getOrderStatuses = () => {
  // Try sessionStorage first
  try {
    const sessionData = sessionStorage.getItem('order_statuses');
    if (sessionData) {
      return JSON.parse(sessionData);
    }
  } catch (e) {}
  // Fall back to localStorage
  return JSON.parse(localStorage.getItem('order_statuses') || '[]');
};

/**
 * Opens a clone app for checkout in a new tab with data sharing
 * @param {Object} checkoutData - The checkout data
 * @param {Object} config - Configuration including URLs
 */
export const openCheckoutTab = (checkoutData, config) => {
  // Store the checkout data first using multiple mechanisms
  storeCheckoutData(checkoutData);
  
  // Determine which URL to open based on the platform
  const platform = checkoutData.platform;
  let baseUrl;
  
  if (platform === 'blinkit') {
    baseUrl = config.blinkitUrl || 'http://localhost:3001';
  } else if (platform === 'zepto') {
    baseUrl = config.zeptoUrl || 'http://localhost:3002';
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  
  // Ensure the URL has the /checkout path
  const checkoutUrl = `${baseUrl}/checkout`;
  
  // Add the checkout data to the URL as a base64 encoded query parameter
  // This is a fallback mechanism in case localStorage communication fails
  try {
    const compressedData = btoa(JSON.stringify(checkoutData));
    const url = `${checkoutUrl}?orderId=${checkoutData.orderId}&data=${encodeURIComponent(compressedData)}`;
    
    // Open the checkout URL in a new tab
    console.log("Opening checkout URL:", url);
    const newWindow = window.open(url, '_blank');
    
    // Try to directly pass the data to the new window as a second fallback
    if (newWindow) {
      try {
        // Wait a moment for the new window to initialize
        setTimeout(() => {
          newWindow._checkoutData = checkoutData;
          console.log("Directly passed checkout data to new window");
        }, 500);
      } catch (e) {
        console.error("Failed to pass data directly to new window:", e);
      }
    }
  } catch (e) {
    // If encoding fails, fall back to the simple URL
    console.error("Error encoding checkout data for URL:", e);
    window.open(`${checkoutUrl}?orderId=${checkoutData.orderId}`, '_blank');
  }
};

/**
 * Listens for order status updates
 * @param {Function} callback - Callback to handle status updates
 * @return {Function} Function to remove event listener
 */
export const listenForOrderUpdates = (callback) => {
  const handleEvent = (event) => callback(event.detail);
  window.addEventListener('order_status_update', handleEvent);
  return () => window.removeEventListener('order_status_update', handleEvent);
};