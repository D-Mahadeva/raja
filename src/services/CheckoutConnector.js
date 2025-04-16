// src/services/CheckoutConnector.js
// Service to handle checkout communication with platform clones

/**
 * CheckoutConnector service manages the communication and handoff between
 * the price comparison app and the platform-specific checkout pages
 */
class CheckoutConnector {
    constructor() {
      // Clone platform URLs
      this.platformUrls = {
        blinkit: process.env.BLINKIT_CLONE_URL || 'http://localhost:3001',
        zepto: process.env.ZEPTO_CLONE_URL || 'http://localhost:3002',
        swiggy: process.env.SWIGGY_CLONE_URL || 'http://localhost:3003',
        bigbasket: process.env.BIGBASKET_CLONE_URL || 'http://localhost:3004',
        dunzo: process.env.DUNZO_CLONE_URL || 'http://localhost:3005',
      };
      
      // Setup event listeners for receiving messages from clones
      this.setupMessageListeners();
      
      // Keep track of current checkout session
      this.currentCheckout = null;
    }
    
    /**
     * Set up window message listeners to receive updates from platform clones
     */
    setupMessageListeners() {
      window.addEventListener('message', (event) => {
        // Verify the origin is from one of our platform clones
        const trustedOrigins = Object.values(this.platformUrls);
        if (!trustedOrigins.includes(event.origin)) {
          console.warn('Received message from untrusted origin:', event.origin);
          return;
        }
        
        // Process the message based on its type
        const { type, data } = event.data;
        
        switch (type) {
          case 'PAYMENT_COMPLETE':
            this.handlePaymentComplete(data);
            break;
          case 'ORDER_STATUS_UPDATE':
            this.handleOrderStatusUpdate(data);
            break;
          case 'CHECKOUT_CANCELED':
            this.handleCheckoutCanceled(data);
            break;
          default:
            console.log('Received unknown message type:', type, data);
        }
      });
    }
    
    /**
     * Initiate checkout process with the selected platform
     * @param {Object} cartData - User's cart data
     * @param {string} platform - Selected platform (e.g., 'blinkit', 'zepto')
     * @param {Function} onComplete - Callback for when checkout completes
     * @param {Function} onCancel - Callback for when checkout is canceled
     * @param {Function} onStatusUpdate - Callback for order status updates
     * @returns {string} Checkout URL to redirect to
     */
    initiateCheckout(cartData, platform, onComplete, onCancel, onStatusUpdate) {
      // Validate platform
      if (!this.platformUrls[platform]) {
        throw new Error(`Unknown platform: ${platform}`);
      }
      
      // Generate a unique session ID for this checkout
      const sessionId = `checkout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Store the current checkout session
      this.currentCheckout = {
        sessionId,
        platform,
        cartData,
        onComplete,
        onCancel,
        onStatusUpdate,
        timestamp: new Date()
      };
      
      // Store in localStorage for recovery in case user refreshes page
      localStorage.setItem('currentCheckout', JSON.stringify({
        sessionId,
        platform,
        cartData,
        timestamp: new Date()
      }));
      
      // Prepare checkout URL with encoded cart data and session ID
      const encodedCart = encodeURIComponent(JSON.stringify(cartData));
      const checkoutUrl = `${this.platformUrls[platform]}/checkout?sessionId=${sessionId}&cart=${encodedCart}&returnUrl=${encodeURIComponent(window.location.href)}`;
      
      return checkoutUrl;
    }
    
    /**
     * Open the checkout process in a new window/tab
     * @param {Object} cartData - User's cart data
     * @param {string} platform - Selected platform
     */
    openCheckoutWindow(cartData, platform) {
      const checkoutUrl = this.initiateCheckout(
        cartData,
        platform,
        this.handlePaymentComplete.bind(this),
        this.handleCheckoutCanceled.bind(this),
        this.handleOrderStatusUpdate.bind(this)
      );
      
      // Open in a new window
      window.open(checkoutUrl, '_blank');
    }
    
    /**
     * Redirect to the checkout process in the current window
     * @param {Object} cartData - User's cart data
     * @param {string} platform - Selected platform
     */
    redirectToCheckout(cartData, platform) {
      const checkoutUrl = this.initiateCheckout(
        cartData,
        platform,
        this.handlePaymentComplete.bind(this),
        this.handleCheckoutCanceled.bind(this),
        this.handleOrderStatusUpdate.bind(this)
      );
      
      // Redirect in the current window
      window.location.href = checkoutUrl;
    }
    
    /**
     * Handle payment completion callback
     * @param {Object} data - Payment completion data
     */
    handlePaymentComplete(data) {
      if (!this.currentCheckout) {
        console.warn('Received payment complete but no active checkout');
        return;
      }
      
      if (data.sessionId !== this.currentCheckout.sessionId) {
        console.warn('Session ID mismatch in payment complete');
        return;
      }
      
      // Execute the onComplete callback if defined
      if (typeof this.currentCheckout.onComplete === 'function') {
        this.currentCheckout.onComplete(data);
      }
      
      // Publish to any subscribers
      this.publishEvent('paymentComplete', data);
      
      // Clear from localStorage
      localStorage.removeItem('currentCheckout');
    }
    
    /**
     * Handle order status update
     * @param {Object} data - Status update data
     */
    handleOrderStatusUpdate(data) {
      if (!this.currentCheckout) {
        console.warn('Received status update but no active checkout');
        return;
      }
      
      if (data.sessionId !== this.currentCheckout.sessionId) {
        console.warn('Session ID mismatch in status update');
        return;
      }
      
      // Execute the onStatusUpdate callback if defined
      if (typeof this.currentCheckout.onStatusUpdate === 'function') {
        this.currentCheckout.onStatusUpdate(data);
      }
      
      // Publish to any subscribers
      this.publishEvent('statusUpdate', data);
    }
    
    /**
     * Handle checkout cancellation
     * @param {Object} data - Cancellation data
     */
    handleCheckoutCanceled(data) {
      if (!this.currentCheckout) {
        console.warn('Received checkout canceled but no active checkout');
        return;
      }
      
      if (data.sessionId !== this.currentCheckout.sessionId) {
        console.warn('Session ID mismatch in checkout canceled');
        return;
      }
      
      // Execute the onCancel callback if defined
      if (typeof this.currentCheckout.onCancel === 'function') {
        this.currentCheckout.onCancel(data);
      }
      
      // Publish to any subscribers
      this.publishEvent('checkoutCanceled', data);
      
      // Clear from localStorage
      localStorage.removeItem('currentCheckout');
      this.currentCheckout = null;
    }
    
    // Event subscription system
    subscribers = {
      paymentComplete: [],
      statusUpdate: [],
      checkoutCanceled: []
    };
    
    /**
     * Subscribe to checkout events
     * @param {string} eventType - Event type to subscribe to
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(eventType, callback) {
      if (!this.subscribers[eventType]) {
        this.subscribers[eventType] = [];
      }
      
      this.subscribers[eventType].push(callback);
      
      // Return unsubscribe function
      return () => {
        this.subscribers[eventType] = this.subscribers[eventType].filter(cb => cb !== callback);
      };
    }
    
    /**
     * Publish an event to subscribers
     * @param {string} eventType - Event type to publish
     * @param {Object} data - Event data
     */
    publishEvent(eventType, data) {
      if (!this.subscribers[eventType]) return;
      
      this.subscribers[eventType].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventType} subscriber:`, error);
        }
      });
    }
    
    /**
     * Recover checkout session from localStorage (e.g., after page refresh)
     */
    recoverCheckoutSession() {
      const savedCheckout = localStorage.getItem('currentCheckout');
      if (!savedCheckout) return null;
      
      try {
        return JSON.parse(savedCheckout);
      } catch (error) {
        console.error('Error recovering checkout session:', error);
        localStorage.removeItem('currentCheckout');
        return null;
      }
    }
  }
  
  // Export singleton instance
  export default new CheckoutConnector();