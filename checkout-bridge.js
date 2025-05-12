// checkout-bridge.js
// This library facilitates communication between the price comparison app and clone apps

/**
 * Formats cart data to be shared between applications
 * @param {Array} cartItems - Cart items from the price comparison app
 * @param {string} platform - The platform to check out with (blinkit/zepto)
 * @return {Object} Formatted cart data
 */
export const formatCheckoutData = (cartItems, platform) => {
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
    
  return {
    platform,
    items: formattedItems,
    timestamp: new Date().toISOString(),
    totalAmount: formattedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    orderId: generateOrderId(platform)
  };
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
 * @param {Object} checkoutData - The formatted checkout data
 */
export const storeCheckoutData = (checkoutData) => {
  localStorage.setItem('pending_checkout', JSON.stringify(checkoutData));
  localStorage.setItem('checkout_timestamp', Date.now().toString());
};

/**
 * Retrieves pending checkout data
 * @return {Object|null} The checkout data or null if none exists
 */
export const getPendingCheckout = () => {
  const data = localStorage.getItem('pending_checkout');
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse checkout data', e);
    return null;
  }
};

/**
 * Clears pending checkout data
 */
export const clearPendingCheckout = () => {
  localStorage.removeItem('pending_checkout');
  localStorage.removeItem('checkout_timestamp');
};

/**
 * Stores order status updates
 * @param {Object} orderStatus - The order status data
 */
export const updateOrderStatus = (orderStatus) => {
  const existingOrders = JSON.parse(localStorage.getItem('order_statuses') || '[]');
  const updatedOrders = [orderStatus, ...existingOrders].slice(0, 10); // Keep last 10 orders
  localStorage.setItem('order_statuses', JSON.stringify(updatedOrders));
  
  // Also dispatch a custom event that the comparison app can listen for
  const event = new CustomEvent('order_status_update', { detail: orderStatus });
  window.dispatchEvent(event);
};

/**
 * Gets all recent order statuses
 * @return {Array} Recent order statuses
 */
export const getOrderStatuses = () => {
  return JSON.parse(localStorage.getItem('order_statuses') || '[]');
};

/**
 * Opens a clone app for checkout in a new tab
 * @param {Object} checkoutData - The checkout data
 * @param {Object} config - Configuration including URLs
 */
export const openCheckoutTab = (checkoutData, config) => {
  // Store the checkout data first
  storeCheckoutData(checkoutData);
  
  // Determine which URL to open based on the platform
  const platform = checkoutData.platform;
  let checkoutUrl;
  
  if (platform === 'blinkit') {
    checkoutUrl = config.blinkitUrl || 'http://localhost:3001/checkout';
  } else if (platform === 'zepto') {
    checkoutUrl = config.zeptoUrl || 'http://localhost:3002/checkout';
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  
  // Open the checkout URL in a new tab
  window.open(`${checkoutUrl}?orderId=${checkoutData.orderId}`, '_blank');
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