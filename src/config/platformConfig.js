// src/config/platformConfig.js
// Configuration for platform clone integrations

const platformConfig = {
    // Platform URLs
    urls: {
      blinkit: process.env.BLINKIT_CLONE_URL || 'http://localhost:3001',
      zepto: process.env.ZEPTO_CLONE_URL || 'http://localhost:3002',
      swiggy: process.env.SWIGGY_CLONE_URL || 'http://localhost:3003',
      bigbasket: process.env.BIGBASKET_CLONE_URL || 'http://localhost:3004',
      dunzo: process.env.DUNZO_CLONE_URL || 'http://localhost:3005',
    },
    
    // Platform display names
    names: {
      blinkit: 'Blinkit',
      zepto: 'Zepto',
      swiggy: 'Swiggy Instamart',
      bigbasket: 'Big Basket',
      dunzo: 'Dunzo Daily',
    },
    
    // Platform colors
    colors: {
      blinkit: '#0c831f',
      zepto: '#8025fb',
      swiggy: '#fc8019',
      bigbasket: '#84c225',
      dunzo: '#00d290',
    },
    
    // Platform delivery times
    deliveryTimes: {
      blinkit: '10 mins',
      zepto: '8 mins',
      swiggy: '15 mins',
      bigbasket: '30 mins',
      dunzo: '20 mins',
    },
    
    // Platform logos
    logos: {
      blinkit: '/platforms/blinkit-logo.png',
      zepto: '/platforms/zepto-logo.png',
      swiggy: '/platforms/swiggy-logo.png',
      bigbasket: '/platforms/bigbasket-logo.png',
      dunzo: '/platforms/dunzo-logo.png',
    },
    
    // Payment methods supported by each platform
    paymentMethods: {
      blinkit: ['upi', 'card', 'cod'],
      zepto: ['upi', 'card', 'cod', 'wallet'],
      swiggy: ['upi', 'card', 'cod', 'wallet'],
      bigbasket: ['upi', 'card', 'cod'],
      dunzo: ['upi', 'card', 'wallet'],
    },
    
    // Minimum order values
    minimumOrderValues: {
      blinkit: 99,
      zepto: 149,
      swiggy: 199,
      bigbasket: 299,
      dunzo: 149,
    },
    
    // Default states
    defaultStatus: {
      blinkit: {
        preparing: 'Your order is being prepared',
        packed: 'Your order has been packed',
        dispatched: 'Your order has been dispatched',
        out_for_delivery: 'Your order is out for delivery',
        delivered: 'Your order has been delivered'
      },
      zepto: {
        preparing: 'Order confirmed & being prepared',
        packed: 'Your order is packed & ready',
        dispatched: 'Order dispatched with delivery partner',
        out_for_delivery: 'Your order is arriving soon',
        delivered: 'Your order has been delivered'
      }
    }
  };
  
  export default platformConfig;