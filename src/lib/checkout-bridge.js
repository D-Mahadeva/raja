// Enhanced checkout-bridge.js with improved window communication and data persistence

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
 * Also uses sessionStorage and other methods for more reliable cross-tab communication
 * @param {Object} checkoutData - The formatted checkout data
 */
export const storeCheckoutData = (checkoutData) => {
  // Store in localStorage and sessionStorage for redundancy
  const dataString = JSON.stringify(checkoutData);
  
  try {
    // Primary storage methods
    localStorage.setItem('pending_checkout', dataString);
    sessionStorage.setItem('pending_checkout', dataString);
    localStorage.setItem('checkout_timestamp', Date.now().toString());
    
    // Store with the order ID for direct lookup
    localStorage.setItem(`checkout_${checkoutData.orderId}`, dataString);
    
    // Broadcast the data via a unique key (for detection by other tabs)
    const broadcastKey = `checkout_broadcast_${Date.now()}`;
    localStorage.setItem(broadcastKey, dataString);
    
    // Clean up after a delay to prevent localStorage from getting cluttered
    setTimeout(() => {
      try {
        localStorage.removeItem(broadcastKey);
      } catch (e) {
        console.error("Error cleaning up broadcast key:", e);
      }
    }, 10000); // 10 seconds
    
    console.log("Checkout data stored and broadcast:", checkoutData);
  } catch (e) {
    console.error("Error storing checkout data:", e);
  }
  
  // Create a global variable as a fallback method
  try {
    window._checkoutData = checkoutData;
    window._pendingCheckoutData = checkoutData;
    console.log("Set global checkout data variables");
  } catch (e) {
    console.error("Failed to set global checkout data variable:", e);
  }
};

/**
 * Retrieves pending checkout data from multiple sources with improved robustness
 * @return {Object|null} The checkout data or null if none exists
 */
export const getPendingCheckout = () => {
  console.log("Trying to retrieve checkout data");
  
  // Try multiple storage methods
  const storageOptions = [
    { type: 'orderParameter', key: 'orderId' },
    { type: 'sessionStorage', key: 'pending_checkout' },
    { type: 'localStorage', key: 'pending_checkout' },
    { type: 'broadcastKeys', pattern: 'checkout_broadcast_' },
    { type: 'windowVariable', name: '_checkoutData' },
    { type: 'windowVariable', name: '_pendingCheckoutData' }
  ];
  
  for (const option of storageOptions) {
    try {
      if (option.type === 'orderParameter') {
        // Check if we have an order ID in the URL and try to get the associated checkout data
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get(option.key);
        
        if (orderId) {
          const data = localStorage.getItem(`checkout_${orderId}`);
          if (data) {
            try {
              const parsedData = JSON.parse(data);
              console.log(`Found checkout data for order ${orderId}:`, parsedData);
              return parsedData;
            } catch (e) {
              console.error(`Error parsing checkout data for order ${orderId}:`, e);
            }
          }
        }
      }
      else if (option.type === 'sessionStorage') {
        const data = sessionStorage.getItem(option.key);
        if (data) {
          const parsedData = JSON.parse(data);
          console.log("Found checkout data in sessionStorage:", parsedData);
          return parsedData;
        }
      } 
      else if (option.type === 'localStorage') {
        const data = localStorage.getItem(option.key);
        if (data) {
          const parsedData = JSON.parse(data);
          console.log("Found checkout data in localStorage:", parsedData);
          return parsedData;
        }
      }
      else if (option.type === 'broadcastKeys') {
        const keys = Object.keys(localStorage).filter(key => 
          key.startsWith(option.pattern)
        );
        
        if (keys.length > 0) {
          // Sort by timestamp to get the most recent
          keys.sort().reverse();
          const latestKey = keys[0];
          const data = localStorage.getItem(latestKey);
          
          if (data) {
            const parsedData = JSON.parse(data);
            console.log("Found checkout data in broadcast key:", parsedData);
            return parsedData;
          }
        }
      }
      else if (option.type === 'windowVariable') {
        if (window[option.name]) {
          console.log(`Found checkout data in window.${option.name}:`, window[option.name]);
          return window[option.name];
        }
      }
    } catch (e) {
      console.error(`Error retrieving from ${option.type}:`, e);
    }
  }
  
  // Try to extract data from URL (base64 encoded)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');
    if (encodedData) {
      const jsonString = atob(decodeURIComponent(encodedData));
      const data = JSON.parse(jsonString);
      console.log("Found checkout data in URL parameter:", data);
      return data;
    }
  } catch (e) {
    console.error("Error extracting data from URL:", e);
  }
  
  console.warn("No checkout data found in any storage mechanism");
  return null;
};

/**
 * Clears pending checkout data from all storage mechanisms
 */
export const clearPendingCheckout = () => {
  try {
    localStorage.removeItem('pending_checkout');
    sessionStorage.removeItem('pending_checkout');
    localStorage.removeItem('checkout_timestamp');
    
    // Clean up any window variables
    if (window._checkoutData) {
      delete window._checkoutData;
    }
    
    if (window._pendingCheckoutData) {
      delete window._pendingCheckoutData;
    }
    
    // Also clear any broadcast keys
    try {
      const keys = Object.keys(localStorage);
      const broadcastKeys = keys.filter(key => key.startsWith('checkout_broadcast_'));
      broadcastKeys.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error("Error clearing broadcast keys:", e);
    }
  } catch (e) {
    console.error("Error in clearPendingCheckout:", e);
  }
};

/**
 * Stores order status updates with enhanced persistence and cross-window communication
 * @param {Object} orderStatus - The order status data
 */
export const updateOrderStatus = (orderStatus) => {
  try {
    console.log("Updating order status:", orderStatus);
    
    // Create a comprehensive record
    const statusRecord = {
      ...orderStatus,
      lastUpdated: new Date().toISOString(),
    };
    
    // Get existing orders with robust error handling
    let existingOrders = [];
    try {
      const ordersStr = localStorage.getItem('order_statuses');
      if (ordersStr) {
        existingOrders = JSON.parse(ordersStr);
        if (!Array.isArray(existingOrders)) {
          existingOrders = [];
        }
      }
    } catch (e) {
      console.error("Error parsing existing orders:", e);
      existingOrders = [];
    }
    
    // Check if this order already exists
    const existingIndex = existingOrders.findIndex(o => o.orderId === statusRecord.orderId);
    
    if (existingIndex >= 0) {
      // Update existing order
      existingOrders[existingIndex] = statusRecord;
    } else {
      // Add new order to the beginning
      existingOrders.unshift(statusRecord);
    }
    
    // Keep only the last 10 orders
    const updatedOrders = existingOrders.slice(0, 10);
    
    // Store in multiple places for redundancy
    localStorage.setItem('order_statuses', JSON.stringify(updatedOrders));
    sessionStorage.setItem('order_statuses', JSON.stringify(updatedOrders));
    
    // Store individual order by ID for easier retrieval
    localStorage.setItem(`order_${statusRecord.orderId}`, JSON.stringify(statusRecord));
    sessionStorage.setItem(`order_${statusRecord.orderId}`, JSON.stringify(statusRecord));
    
    // Also dispatch a custom event that the comparison app can listen for
    const event = new CustomEvent('order_status_update', { detail: statusRecord });
    window.dispatchEvent(event);
    
    // Broadcast to opener window if available
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          type: 'ORDER_STATUS_UPDATE',
          data: statusRecord
        }, '*');
      }
    } catch (e) {
      console.error("Error broadcasting to opener:", e);
    }
    
    console.log("Order status updated successfully:", statusRecord);
    return true;
  } catch (e) {
    console.error("Failed to update order status:", e);
    return false;
  }
};

/**
 * Gets a specific order by ID with improved reliability
 * @param {string} orderId - The order ID to retrieve
 * @return {Object|null} The order data or null if not found
 */
export const getOrderById = (orderId) => {
  if (!orderId) return null;
  
  console.log("Looking for order with ID:", orderId);
  
  // Try direct lookup first
  try {
    const orderData = localStorage.getItem(`order_${orderId}`);
    if (orderData) {
      console.log("Found order data in localStorage by direct lookup");
      return JSON.parse(orderData);
    }
  } catch (e) {
    console.error("Error retrieving order by direct lookup:", e);
  }
  
  // Check if this might be a pending checkout that hasn't been turned into an order yet
  try {
    const checkoutData = localStorage.getItem(`checkout_${orderId}`);
    if (checkoutData) {
      console.log("Found pending checkout data for this order ID");
      return JSON.parse(checkoutData);
    }
  } catch (e) {
    console.error("Error retrieving checkout by order ID:", e);
  }
  
  // Then check in the orders list
  try {
    const ordersStr = localStorage.getItem('order_statuses');
    if (ordersStr) {
      const orders = JSON.parse(ordersStr);
      if (Array.isArray(orders)) {
        const order = orders.find(o => o.orderId === orderId);
        if (order) {
          console.log("Found order in order_statuses list");
          return order;
        }
      }
    }
  } catch (e) {
    console.error("Error finding order in order list:", e);
  }
  
  // Try session storage as last resort
  try {
    const sessionOrderData = sessionStorage.getItem(`order_${orderId}`);
    if (sessionOrderData) {
      console.log("Found order in sessionStorage by direct lookup");
      return JSON.parse(sessionOrderData);
    }
    
    const sessionOrdersStr = sessionStorage.getItem('order_statuses');
    if (sessionOrdersStr) {
      const sessionOrders = JSON.parse(sessionOrdersStr);
      if (Array.isArray(sessionOrders)) {
        const sessionOrder = sessionOrders.find(o => o.orderId === orderId);
        if (sessionOrder) {
          console.log("Found order in sessionStorage order_statuses list");
          return sessionOrder;
        }
      }
    }
  } catch (e) {
    console.error("Error retrieving order from session storage:", e);
  }
  
  console.log("No order found with ID:", orderId);
  return null;
};

/**
 * Gets all recent order statuses with improved reliability
 * @return {Array} Recent order statuses
 */
export const getOrderStatuses = () => {
  let orders = [];
  
  // Try multiple storage locations
  const storageOptions = [
    { type: 'sessionStorage', key: 'order_statuses' },
    { type: 'localStorage', key: 'order_statuses' }
  ];
  
  for (const option of storageOptions) {
    try {
      const storage = option.type === 'sessionStorage' ? sessionStorage : localStorage;
      const data = storage.getItem(option.key);
      
      if (data) {
        const parsedData = JSON.parse(data);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          // If we found valid data, use it and stop looking
          orders = parsedData;
          break;
        }
      }
    } catch (e) {
      console.error(`Error retrieving orders from ${option.type}:`, e);
    }
  }
  
  return orders;
};

/**
 * Opens a clone app for checkout in a new tab with enhanced data sharing
 * @param {Object} checkoutData - The checkout data
 * @param {Object} config - Configuration including URLs
 */
export const openCheckoutTab = (checkoutData, config) => {
  // Store the checkout data using multiple mechanisms for redundancy
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
  // Custom event listener
  const handleLocalEvent = (event) => callback(event.detail);
  window.addEventListener('order_status_update', handleLocalEvent);
  
  // PostMessage handler for cross-window communication
  const handleWindowMessage = (event) => {
    // Verify this is our message type
    if (event.data && typeof event.data === 'object' && event.data.type === 'ORDER_STATUS_UPDATE') {
      callback(event.data.data);
    }
  };
  window.addEventListener('message', handleWindowMessage);
  
  // Return a cleanup function
  return () => {
    window.removeEventListener('order_status_update', handleLocalEvent);
    window.removeEventListener('message', handleWindowMessage);
  };
};