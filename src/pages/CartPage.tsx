// src/pages/CartPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop, Platform, CartItem as CartItemType } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import CartItem from '@/components/CartItem';
import PriceComparison from '@/components/PriceComparison';
import OrderStatusModal from '@/components/OrderStatusModal';
import { 
  ArrowLeft, 
  ShoppingCart, 
  ArrowRight, 
  Filter, 
  X, 
  TagIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  Store 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import CheckoutConnector from '@/services/CheckoutConnector';
import platformConfig from '@/config/platformConfig';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const CartPage = () => {
  const { cart, getCartTotal, platforms, clearCart, getConsolidatedTotal } = useShop();
  const { isAuthenticated, user } = useAuth();
  const [checkoutPlatform, setCheckoutPlatform] = useState<Platform | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State for tracking checkout process
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // Order state
  const [currentOrder, setCurrentOrder] = useState<{
    orderId: string;
    platform: Platform;
    status: string;
    estimatedDelivery: string;
  } | null>(null);
  
  // Show order status modal
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  
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
    
    Object.entries(groupedCartItems).forEach(([platform, items]) => {
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
  
  // Subscribe to checkout connector events
  useEffect(() => {
    // Setup event listeners for checkout process
    const paymentCompleteUnsub = CheckoutConnector.subscribe('paymentComplete', handlePaymentComplete);
    const statusUpdateUnsub = CheckoutConnector.subscribe('statusUpdate', handleStatusUpdate);
    const checkoutCanceledUnsub = CheckoutConnector.subscribe('checkoutCanceled', handleCheckoutCanceled);
    
    // Try to recover any ongoing checkout
    const savedCheckout = CheckoutConnector.recoverCheckoutSession();
    if (savedCheckout) {
      setCheckoutPlatform(savedCheckout.platform);
      setIsCheckingOut(true);
      
      toast({
        title: "Ongoing Checkout",
        description: "You have an ongoing checkout session. Please complete it or start a new one.",
      });
    }
    
    // Cleanup subscriptions
    return () => {
      paymentCompleteUnsub();
      statusUpdateUnsub();
      checkoutCanceledUnsub();
    };
  }, []);
  
  // Handler for payment completion
  const handlePaymentComplete = (data) => {
    setIsCheckingOut(false);
    
    // Store order information
    setCurrentOrder({
      orderId: data.orderId,
      platform: data.platform,
      status: 'confirmed',
      estimatedDelivery: data.estimatedDelivery
    });
    
    // Show order status modal
    setShowOrderStatus(true);
    
    toast({
      title: "Payment Successful",
      description: `Your order has been placed with ${platformConfig.names[data.platform]}`,
    });
    
    // Clear cart after successful payment
    clearCart();
  };
  
  // Handler for status updates
  const handleStatusUpdate = (data) => {
    if (currentOrder && currentOrder.orderId === data.orderId) {
      // Update current order status
      setCurrentOrder({
        ...currentOrder,
        status: data.status
      });
      
      toast({
        title: "Order Update",
        description: data.message,
      });
    }
  };
  
  // Handler for checkout cancellation
  const handleCheckoutCanceled = (data) => {
    setIsCheckingOut(false);
    
    toast({
      title: "Checkout Canceled",
      description: data.reason || "You canceled the checkout process",
      variant: "destructive",
    });
  };
  
  // Initiate checkout process
  const handleCheckout = () => {
    if (!checkoutPlatform) {
      toast({
        title: "Please select a platform",
        description: "Select a platform to proceed with checkout",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user is logged in
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    // Check minimum order values
    const platformMinValue = platformConfig.minimumOrderValues[checkoutPlatform] || 0;
    const cartTotal = getConsolidatedTotal(checkoutPlatform);
    
    if (cartTotal < platformMinValue) {
      toast({
        title: "Minimum order value not met",
        description: `${platformConfig.names[checkoutPlatform]} requires a minimum order of ₹${platformMinValue}`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if all items are available on the selected platform
    const unavailableItems = cart.filter(item => {
      const priceInfo = item.product.prices.find(p => p.platform === checkoutPlatform);
      return !priceInfo || !priceInfo.available;
    });
    
    if (unavailableItems.length > 0) {
      // If some items are unavailable, show a warning dialog
      setShowCheckoutDialog(true);
      return;
    }
    
    // Proceed with checkout
    proceedToCheckout();
  };
  
  // Continue with checkout after confirmation
  const proceedToCheckout = () => {
    setShowCheckoutDialog(false);
    setIsCheckingOut(true);
    
    // Prepare cart data for the platform
    const checkoutCart = cart.map(item => {
      const platformPrice = item.product.prices.find(p => p.platform === checkoutPlatform);
      
      return {
        id: item.product.id,
        name: item.product.name,
        image: item.product.image,
        unit: item.product.unit,
        quantity: item.quantity,
        price: platformPrice?.price || 0,
        available: platformPrice?.available || false
      };
    }).filter(item => item.available); // Only include available items
    
    // Get platform details
    const platformInfo = platforms.find(p => p.id === checkoutPlatform);
    
    toast({
      title: "Redirecting to checkout",
      description: `You're being redirected to ${platformInfo?.name} for checkout`,
    });
    
    // Use the checkout connector to redirect to the platform clone
    try {
      CheckoutConnector.redirectToCheckout(checkoutCart, checkoutPlatform as Platform);
    } catch (error) {
      console.error('Checkout redirection error:', error);
      setIsCheckingOut(false);
      
      toast({
        title: "Checkout Failed",
        description: "There was a problem redirecting to the checkout page. Please try again.",
        variant: "destructive",
      });
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
        
        {/* Order Success Alert */}
        <AnimatePresence>
          {currentOrder && (
            <motion.div 
              className={`mb-6 p-4 rounded-lg border bg-green-50 border-green-100`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                
                <div className="flex-grow">
                  <h3 className="font-medium">
                    Order Placed Successfully!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your order has been placed with {platformConfig.names[currentOrder.platform]}
                  </p>
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  className="ml-auto"
                  onClick={() => setShowOrderStatus(true)}
                >
                  View Status
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
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
                      {items.length > 0 && (
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
                    ₹{checkoutPlatform ? getConsolidatedTotal(checkoutPlatform) : getCartTotal()}
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
                      
                      {/* Platform-specific policies */}
                      <div className="mt-3 text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} />
                          <span>Estimated delivery: {platforms.find(p => p.id === checkoutPlatform)?.deliveryTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Store size={12} />
                          <span>Min. order: ₹{platformConfig.minimumOrderValues[checkoutPlatform]}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Select a platform to proceed with checkout
                    </div>
                  )}
                </div>
                
                <Button 
                  className={`w-full ${checkoutPlatform ? 
                    `bg-platform-${checkoutPlatform} hover:bg-platform-${checkoutPlatform}/90` : 
                    'bg-black hover:bg-black/80'} text-white`}
                  disabled={!checkoutPlatform || isCheckingOut}
                  onClick={handleCheckout}
                >
                  {isCheckingOut ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Checkout
                      <ArrowRight size={16} className="ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      
      {/* Confirmation Dialog for partial availability */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Some items are not available</DialogTitle>
            <DialogDescription>
              Some items in your cart are not available at {platforms.find(p => p.id === checkoutPlatform)?.name}.
              Do you want to continue with only the available items?
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">Unavailable Items</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cart.filter(item => {
                const priceInfo = item.product.prices.find(p => p.platform === checkoutPlatform);
                return !priceInfo || !priceInfo.available;
              }).map(item => (
                <div key={item.product.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                  <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} x {item.product.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={() => setShowCheckoutDialog(false)}>
              Cancel
            </Button>
            <Button onClick={proceedToCheckout}>
              Continue with Available Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Login Prompt Dialog */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to checkout. Please login or create an account to continue.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Why login is required</AlertTitle>
              <AlertDescription>
                Logging in allows us to track your order and provide order status updates.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={() => setShowLoginPrompt(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowLoginPrompt(false);
              // Open login modal or redirect to login page
              // This would integrate with your existing auth system
            }}>
              Login / Sign Up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Order Status Modal */}
      {currentOrder && (
        <OrderStatusModal
          isOpen={showOrderStatus}
          onOpenChange={setShowOrderStatus}
          orderId={currentOrder.orderId}
          platform={currentOrder.platform}
          estimatedDelivery={currentOrder.estimatedDelivery}
          onDismiss={() => setCurrentOrder(null)}
        />
      )}
    </div>
  );
};

export default CartPage;