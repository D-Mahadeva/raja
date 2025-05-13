// blinkit-clone/src/utils/checkout-bridge.js - COMPLETE VERSION

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
    if (window._checkoutData) {
      console.log("Found checkout data in global variable:", window._checkoutData);
      return window._checkoutData;
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