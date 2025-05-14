// src/pages/CartPage.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useShop, Platform, CartItem as CartItemType } from '@/context/ShopContext';
import Header from '@/components/Header';
import CartItem from '@/components/CartItem';
import PriceComparison from '@/components/PriceComparison';
import { ArrowLeft, ShoppingCart, ArrowRight, Filter, X, TagIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  formatCheckoutData, 
  openCheckoutTab, 
  listenForOrderUpdates, 
  getOrderStatuses,
  getOrderById
} from '@/lib/checkout-bridge';

// Configuration for clone apps
const CHECKOUT_CONFIG = {
  blinkitUrl: 'http://localhost:3001',
  zeptoUrl: 'http://localhost:3002'
};

const CartPage = () => {
  const { cart, getCartTotal, platforms } = useShop();
  const [checkoutPlatform, setCheckoutPlatform] = useState<Platform | null>(null);
  const [checkoutInProgress, setCheckoutInProgress] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const { toast } = useToast();
  
  // Group cart items by platform
  const groupedCartItems = React.useMemo(() => {
    const grouped: Record<Platform | 'generic', CartItemType[]> = {
      'blinkit': [],
      'zepto': [],
      'swiggy': [],
      'bigbasket': [],
      'dunzo': [],
      'generic': []
    };
    
    cart.forEach(item => {
      if (item.platform) {
        grouped[item.platform].push(item);
      } else {
        grouped.generic.push(item);
      }
    });
    
    return grouped;
  }, [cart]);
  
  // Calculate total for each platform group in cart
  const platformTotals = React.useMemo(() => {
    const totals: Record<string, number> = {};
    
    Object.entries(groupedCartItems).map(([platform, items]) => {
      if (items.length === 0) return;
      
      // Calculate platform-specific total
      const total = items.reduce((sum, item) => {
        const priceInfo = item.product.prices.find(p => 
          platform === 'generic' 
            ? (item.platform || p.platform === checkoutPlatform) 
            : p.platform === platform
        );
        
        if (priceInfo && priceInfo.available) {
          return sum + (priceInfo.price * item.quantity);
        }
        return sum;
      }, 0);
      
      totals[platform] = total;
    });
    
    return totals;
  }, [groupedCartItems, checkoutPlatform]);
  
  // Listen for order status updates
  useEffect(() => {
    // Load initial order statuses with improved handling
    const initialOrders = getOrderStatuses().map(order => {
      // If the order doesn't have a formatted timestamp, add one
      if (!order.formattedTime) {
        try {
          const timestamp = new Date(order.timestamp);
          order.formattedTime = timestamp.toLocaleString();
        } catch (e) {
          order.formattedTime = "Unknown time";
        }
      }
      return order;
    });
    
    console.log("Initial orders:", initialOrders);
    setRecentOrders(initialOrders);
    
    // Set up listener for future updates with better error handling
    const handleOrderUpdate = (orderStatus) => {
      console.log("Received order update:", orderStatus);
      
      try {
        // Format timestamp for display
        let formattedTime = "Unknown time";
        try {
          const timestamp = new Date(orderStatus.timestamp);
          formattedTime = timestamp.toLocaleString();
        } catch (e) {}
        
        // Create enhanced status record
        const enhancedStatus = {
          ...orderStatus,
          formattedTime
        };
        
        // Update the orders list, handling duplicates
        setRecentOrders(prev => {
          // Check if this order already exists
          const existingIndex = prev.findIndex(o => o.orderId === orderStatus.orderId);
          
          if (existingIndex >= 0) {
            // Update existing order
            const newOrders = [...prev];
            newOrders[existingIndex] = enhancedStatus;
            return newOrders;
          } else {
            // Add new order to the beginning
            return [enhancedStatus, ...prev].slice(0, 10);
          }
        });
        
        // Show a toast notification for the update
        const statusMessage = getStatusMessage(orderStatus.status);
        
        toast({
          title: `Order Update: ${orderStatus.orderId}`,
          description: orderStatus.message || statusMessage,
          variant: orderStatus.status === 'failed' ? 'destructive' : 'default',
        });
        
        // If the order was successfully placed, reset checkout progress
        if (orderStatus.status === 'confirmed' || orderStatus.status === 'delivered') {
          setCheckoutInProgress(false);
        }
      } catch (e) {
        console.error("Error handling order update:", e);
      }
    };
    
    // Helper function to get a readable status message
    const getStatusMessage = (status) => {
      switch(status) {
        case 'confirmed': return 'Your order has been confirmed!';
        case 'preparing': return 'Your order is being prepared.';
        case 'on_the_way': return 'Your order is on the way!';
        case 'delivered': return 'Your order has been delivered!';
        case 'failed': return 'There was an issue with your order.';
        default: return 'Order status updated.';
      }
    };
    
    // Set up event listeners with both methods
    window.addEventListener('order_status_update', (event) => handleOrderUpdate(event.detail));
    
    // Also listen for window messages from child windows
    const handleWindowMessage = (event) => {
      // Verify this is our message type
      if (event.data && event.data.type === 'ORDER_STATUS_UPDATE') {
        handleOrderUpdate(event.data.data);
      }
    };
    
    window.addEventListener('message', handleWindowMessage);
    
    // Clean up listeners
    return () => {
      window.removeEventListener('order_status_update', (event) => handleOrderUpdate(event.detail));
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [toast]);

  const handleCheckout = () => {
    if (!checkoutPlatform) {
      toast({
        title: "Please select a platform",
        description: "Select a platform to proceed with checkout",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Check if there are available items for this platform
      const availableItems = cart.filter(item => {
        const priceInfo = item.product.prices.find(p => p.platform === checkoutPlatform);
        return priceInfo && priceInfo.available;
      });
      
      if (availableItems.length === 0) {
        toast({
          title: "No available items",
          description: `No items are available for ${platforms.find(p => p.id === checkoutPlatform)?.name}`,
          variant: "destructive",
        });
        return;
      }
      
      // Prepare checkout data
      const checkoutData = formatCheckoutData(cart, checkoutPlatform);
      
      // Track checkout in progress
      setCheckoutInProgress(true);
      
      // Open the checkout tab
      openCheckoutTab(checkoutData, CHECKOUT_CONFIG);
      
      toast({
        title: "Checkout initiated",
        description: `Please complete your order in the new tab. If no tab opened, check your pop-up blocker.`,
      });
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout failed",
        description: error.message || "There was an error initiating checkout.",
        variant: "destructive",
      });
      setCheckoutInProgress(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingCart size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Link to="/">
              <Button className="mt-2" variant="outline">
                <ArrowLeft size={16} className="mr-1.5" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Cart</h1>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft size={16} className="mr-1.5" />
              Continue Shopping
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">
                    Cart Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                  </h3>
                  
                  {checkoutPlatform && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Badge 
                        variant="outline" 
                        className={`bg-platform-${checkoutPlatform}/10 platform-${checkoutPlatform} hover:bg-platform-${checkoutPlatform}/20`}
                      >
                        <Filter size={12} className="mr-1" />
                        Viewing as {platforms.find(p => p.id === checkoutPlatform)?.name}
                      </Badge>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => setCheckoutPlatform(null)}
                      >
                        <X size={14} />
                        <span className="sr-only">Clear filter</span>
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
              
              {/* Platform sections */}
              <AnimatePresence>
                {Object.entries(groupedCartItems).map(([platform, items]) => {
                  // Skip platforms with no items
                  if (items.length === 0) return null;
                  
                  // Get platform display name
                  const platformInfo = platforms.find(p => p.id === platform);
                  const platformName = platform === 'generic' 
                    ? 'Unspecified Platform' 
                    : platformInfo?.name || platform;
                  
                  // Calculate availability if viewing as a specific platform
                  let availableItems = items.length;
                  if (checkoutPlatform) {
                    availableItems = items.filter(item => {
                      const priceInfo = item.product.prices.find(p => p.platform === checkoutPlatform);
                      return priceInfo && priceInfo.available;
                    }).length;
                  }
                  
                  return (
                    <motion.div 
                      key={platform} 
                      className="border-b border-gray-200 last:border-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Platform header */}
                      {platform !== 'generic' && (
                        <div className={`px-4 py-2 bg-platform-${platform}/10 flex justify-between items-center`}>
                          <h4 className={`font-medium platform-${platform}`}>{platformName}</h4>
                          
                          {checkoutPlatform && availableItems < items.length && (
                            <div className="text-xs text-muted-foreground">
                              {availableItems} of {items.length} items available on {platforms.find(p => p.id === checkoutPlatform)?.name}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Platform items */}
                      <div className="divide-y divide-gray-200">
                        {items.map((item) => (
                          <motion.div 
                            key={`${item.product.id}-${item.platform || 'generic'}`} 
                            className="px-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CartItem item={item} platformFilter={checkoutPlatform} />
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* Platform subtotal */}
                      {items.length > 0 && platformTotals[platform] > 0 && (
                        <div className="px-4 py-3 bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <TagIcon size={14} />
                              <span>Subtotal</span>
                            </div>
                            <span className="font-medium">
                              ₹{platformTotals[platform].toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {/* Cart Summary */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg">
                    ₹{checkoutPlatform ? getCartTotal(checkoutPlatform) : getCartTotal()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Price Comparison and Checkout */}
          <div className="space-y-6">
            <PriceComparison 
              selectedPlatform={checkoutPlatform} 
              onSelectPlatform={setCheckoutPlatform} 
            />
            
            <motion.div 
              className="rounded-lg border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-medium">Checkout</h3>
              </div>
              
              <div className="p-4 bg-white">
                <div className="mb-4">
                  {checkoutPlatform ? (
                    <div className="text-sm">
                      <p>You're checking out with:</p>
                      <p className={`font-medium text-base platform-${checkoutPlatform} mt-1`}>
                        {platforms.find(p => p.id === checkoutPlatform)?.name}
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Select a platform to proceed with checkout
                    </div>
                  )}
                </div>
                
                <Button 
                  className={`w-full ${
                    checkoutPlatform && !checkoutInProgress 
                      ? `bg-platform-${checkoutPlatform} hover:bg-platform-${checkoutPlatform}/90`
                      : "bg-black/80 hover:bg-black/70"
                  } text-white`}
                  disabled={!checkoutPlatform || checkoutInProgress}
                  onClick={handleCheckout}
                >
                  {checkoutInProgress ? (
                    <>Checkout in Progress...</>
                  ) : (
                    <>
                      Proceed to Checkout
                      <ExternalLink size={16} className="ml-1.5" />
                    </>
                  )}
                </Button>
                
                {checkoutInProgress && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Please complete your order in the new tab
                  </p>
                )}
              </div>
            </motion.div>
            
            {/* Recent Orders */}
            <AnimatePresence>
              {recentOrders.length > 0 && (
                <motion.div 
                  className="rounded-lg border border-gray-200 overflow-hidden"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-medium">Recent Orders</h3>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {recentOrders.map((order, index) => (
                      <div key={`${order.orderId}-${index}`} className="p-3 bg-white">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm">Order {order.orderId}</span>
                          <Badge
                            variant={
                              order.status === 'delivered' ? 'success' :
                              order.status === 'confirmed' ? 'outline' :
                              order.status === 'failed' ? 'destructive' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {order.formattedTime || new Date(order.timestamp).toLocaleString()}
                          </span>
                          <span className={`platform-${order.platform}`}>
                            {platforms.find(p => p.id === order.platform)?.name || order.platform}
                          </span>
                        </div>
                        {order.deliveryTime && (
                          <div className="text-xs text-green-600 mt-1 flex items-center">
                            {order.deliveryTime}
                          </div>
                        )}
                        {order.message && (
                          <div className="text-xs mt-1">{order.message}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CartPage;