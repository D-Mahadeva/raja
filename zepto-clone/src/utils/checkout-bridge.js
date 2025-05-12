// blinkit-clone/src/utils/checkout-bridge.js
/**
 * Shared library for communication between the price comparison app and clone apps
 */

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