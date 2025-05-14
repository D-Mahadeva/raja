// zepto-clone/src/utils/checkout-bridge.js

/**
 * Retrieves pending checkout data from multiple sources with improved robustness
 * @return {Object|null} The checkout data or null if none exists
 */
export const getPendingCheckout = () => {
  console.log("Trying to retrieve checkout data");
  
  // Try multiple storage methods
  const storageOptions = [
    { type: 'sessionStorage', key: 'pending_checkout' },
    { type: 'localStorage', key: 'pending_checkout' },
    { type: 'broadcastKeys', pattern: 'checkout_broadcast_' },
    { type: 'windowVariable', name: '_checkoutData' }
  ];
  
  for (const option of storageOptions) {
    try {
      if (option.type === 'sessionStorage') {
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
    delete window._checkoutData;
  } catch (e) {}
  
  // Also clear any broadcast keys
  try {
    const keys = Object.keys(localStorage);
    const broadcastKeys = keys.filter(key => key.startsWith('checkout_broadcast_'));
    broadcastKeys.forEach(key => localStorage.removeItem(key));
  } catch (e) {}
};

/**
 * Stores order status updates with enhanced persistence
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
 * Gets a specific order by ID
 * @param {string} orderId - The order ID to retrieve
 * @return {Object|null} The order data or null if not found
 */
export const getOrderById = (orderId) => {
  if (!orderId) return null;
  
  // Try direct lookup first
  try {
    const orderData = localStorage.getItem(`order_${orderId}`);
    if (orderData) {
      return JSON.parse(orderData);
    }
  } catch (e) {
    console.error("Error retrieving order by direct lookup:", e);
  }
  
  // Then check in the orders list
  try {
    const ordersStr = localStorage.getItem('order_statuses');
    if (ordersStr) {
      const orders = JSON.parse(ordersStr);
      if (Array.isArray(orders)) {
        const order = orders.find(o => o.orderId === orderId);
        if (order) return order;
      }
    }
  } catch (e) {
    console.error("Error finding order in order list:", e);
  }
  
  // Try session storage as last resort
  try {
    const sessionOrderData = sessionStorage.getItem(`order_${orderId}`);
    if (sessionOrderData) {
      return JSON.parse(sessionOrderData);
    }
    
    const sessionOrdersStr = sessionStorage.getItem('order_statuses');
    if (sessionOrdersStr) {
      const sessionOrders = JSON.parse(sessionOrdersStr);
      if (Array.isArray(sessionOrders)) {
        const sessionOrder = sessionOrders.find(o => o.orderId === orderId);
        if (sessionOrder) return sessionOrder;
      }
    }
  } catch (e) {
    console.error("Error retrieving order from session storage:", e);
  }
  
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