// Fixed version of zepto-clone CheckoutPage.jsx with improved payment handling

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, MapPin, Home, CreditCard, Truck, ArrowRight, Check, AlertTriangle } from 'lucide-react';
import { getPendingCheckout, updateOrderStatus, getOrderById } from '../utils/checkout-bridge';
import { createRazorpayOrder, loadRazorpay } from '../utils/payment-utils';

// Function to extract data from URL if present
const extractDataFromUrl = (search) => {
  try {
    const params = new URLSearchParams(search);
    const encodedData = params.get('data');
    if (encodedData) {
      const jsonString = atob(decodeURIComponent(encodedData));
      return JSON.parse(jsonString);
    }
  } catch (e) {
    console.error("Failed to extract data from URL:", e);
  }
  return null;
};

// Function to retrieve window-passed data if available
const getWindowData = () => {
  try {
    if (window._checkoutData) {
      return window._checkoutData;
    }
  } catch (e) {
    console.error("Failed to get window data:", e);
  }
  return null;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checkoutData, setCheckoutData] = useState(null);
  const [address, setAddress] = useState("123 Main Street, Bengaluru, 560001");
  const [editingAddress, setEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [razorpayInstance, setRazorpayInstance] = useState(null);

  // Flag to track if component is mounted (for safe state updates)
  const isMounted = React.useRef(true);
  
  useEffect(() => {
    // Set up mounted flag
    isMounted.current = true;
    
    // Cleanup function to set mounted flag to false
    return () => {
      isMounted.current = false;
      
      // If Razorpay instance exists when component unmounts, close it
      if (razorpayInstance) {
        try {
          razorpayInstance.close();
        } catch (err) {
          console.error("Error closing Razorpay instance:", err);
        }
      }
    };
  }, [razorpayInstance]);
  
  useEffect(() => {
    // Check if we're already supposed to be on the confirmation page
    // This can happen if the payment was successful but the navigation failed
    const urlParams = new URLSearchParams(location.search);
    const orderId = urlParams.get('orderId');
    
    if (location.pathname === '/checkout' && orderId) {
      // Check if we have an order with this ID
      const orderData = getOrderById(orderId);
      if (orderData && orderData.status === 'confirmed') {
        // We should be on the confirmation page - redirect
        navigate(`/order-confirmation?orderId=${orderId}`, { replace: true });
        return;
      }
    }
    
    const fetchCheckoutData = () => {
      console.log("Attempting to fetch checkout data (attempt", retryCount + 1, ")");
      
      // Try all available methods to get the checkout data
      
      // 1. Try to get it from URL parameters (most reliable)
      const urlData = extractDataFromUrl(location.search);
      if (urlData && urlData.platform === 'zepto') {
        console.log("Found checkout data in URL:", urlData);
        setCheckoutData(urlData);
        setLoading(false);
        return;
      }
      
      // 2. Try to get it from the window object (direct pass)
      const windowData = getWindowData();
      if (windowData && windowData.platform === 'zepto') {
        console.log("Found checkout data in window object:", windowData);
        setCheckoutData(windowData);
        setLoading(false);
        return;
      }
      
      // 3. Try to get it from localStorage/sessionStorage
      const storageData = getPendingCheckout();
      if (storageData && storageData.platform === 'zepto') {
        console.log("Found checkout data in storage:", storageData);
        setCheckoutData(storageData);
        setLoading(false);
        return;
      }
      
      // If we got here, we couldn't find the data
      console.log("No checkout data found in any source");
      
      // If we've tried less than 5 times, retry after a delay
      if (retryCount < 5) {
        console.log(`Retrying in ${(retryCount + 1) * 500}ms...`);
        setTimeout(() => {
          if (isMounted.current) {
            setRetryCount(prevCount => prevCount + 1);
          }
        }, (retryCount + 1) * 500);
        return;
      }
      
      // After 5 retries, show an error
      setError("Could not retrieve checkout data. Please return to the main app and try again.");
      setLoading(false);
    };
    
    fetchCheckoutData();
  }, [location, retryCount, navigate]);
  
  const handlePayment = async () => {
    if (!checkoutData) return;
    
    setPaymentInitiated(true);
    
    if (paymentMethod === 'cod') {
      try {
        // Handle cash on delivery
        const orderStatusData = {
          orderId: checkoutData.orderId,
          status: 'confirmed',
          platform: 'zepto',
          timestamp: new Date().toISOString(),
          totalAmount: checkoutData.totalAmount,
          deliveryTime: '8 minutes',
          message: 'Your order is confirmed and will be delivered in 8 minutes',
          paymentMethod: 'cod',
          address: address,
          items: checkoutData.items
        };
        
        // Update order status
        updateOrderStatus(orderStatusData);
        
        // Navigate to confirmation page with a small delay to ensure data is saved
        setTimeout(() => {
          if (isMounted.current) {
            navigate(`/order-confirmation?orderId=${checkoutData.orderId}`);
          }
        }, 500);
      } catch (error) {
        console.error("Error handling COD payment:", error);
        if (isMounted.current) {
          setPaymentInitiated(false);
          setError("Failed to place order. Please try again.");
        }
      }
    } else {
      try {
        // Create Razorpay order first
        const razorpayOrder = await createRazorpayOrder(checkoutData);
        
        // Get Razorpay key from environment variables
        const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_default';
        
        // Handle online payment with Razorpay
        const options = {
          key: razorpayKeyId,
          amount: razorpayOrder.amount, // Amount from the order (already in paise)
          currency: razorpayOrder.currency,
          name: 'Zepto',
          description: `Order ID: ${checkoutData.orderId}`,
          order_id: razorpayOrder.id,
          prefill: {
            name: 'Customer Name',
            email: 'customer@example.com',
            contact: '9876543210'
          },
          theme: {
            color: '#8025fb'
          },
          modal: {
            ondismiss: () => {
              console.log("Razorpay modal dismissed by user");
              if (isMounted.current) {
                setPaymentInitiated(false);
                
                // Update status as payment cancelled
                updateOrderStatus({
                  orderId: checkoutData.orderId,
                  status: 'pending',
                  platform: 'zepto',
                  timestamp: new Date().toISOString(),
                  totalAmount: checkoutData.totalAmount,
                  message: 'Payment was cancelled. Please try again.',
                  paymentMethod: 'online',
                  address: address
                });
              }
            }
          }
        };
        
        const handlePaymentSuccess = (paymentResponse) => {
          console.log("Payment success handler called with response:", paymentResponse);
          
          // This function may be called multiple times from different event handlers
          // We need to ensure state transitions happen only once
          try {
            // Create order status record with all necessary information
            const orderStatusData = {
              orderId: checkoutData.orderId,
              status: 'confirmed',
              platform: 'zepto',
              timestamp: new Date().toISOString(),
              totalAmount: checkoutData.totalAmount,
              deliveryTime: '8 minutes',
              message: 'Your order is confirmed and will be delivered in 8 minutes',
              paymentMethod: 'online',
              paymentId: paymentResponse.razorpay_payment_id,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              address: address,
              items: checkoutData.items
            };
            
            // Save order data for the confirmation page to access
            updateOrderStatus(orderStatusData);
            
            // Add a small delay to ensure data is saved before navigation
            setTimeout(() => {
              if (isMounted.current) {
                // Set payment initiated to false to prevent duplicate processing
                setPaymentInitiated(false);
                
                // Navigate to confirmation page
                console.log("Navigating to order confirmation page");
                navigate(`/order-confirmation?orderId=${checkoutData.orderId}`);
              }
            }, 800); // Increased delay to ensure data saving completes
          } catch (err) {
            console.error("Error in payment success handler:", err);
            if (isMounted.current) {
              setPaymentInitiated(false);
              setError("Error processing successful payment. Please contact support.");
            }
          }
        };
        
        const handlePaymentError = (error) => {
          console.error("Payment error:", error);
          
          if (isMounted.current) {
            // Payment failure
            setPaymentInitiated(false);
            
            updateOrderStatus({
              orderId: checkoutData.orderId,
              status: 'failed',
              platform: 'zepto',
              timestamp: new Date().toISOString(),
              totalAmount: checkoutData.totalAmount,
              message: 'Payment failed. Please try again.',
              paymentMethod: 'online',
              error: error.description || 'Unknown error',
              address: address
            });
            
            setError('Payment failed: ' + (error.description || 'Unknown error'));
          }
        };
        
        // Initialize Razorpay with proper success/error handling
        const rzpInstance = loadRazorpay(
          options,
          handlePaymentSuccess,
          handlePaymentError
        );
        
        // Store the instance for cleanup
        setRazorpayInstance(rzpInstance);
        
      } catch (error) {
        console.error('Payment initialization error:', error);
        if (isMounted.current) {
          setPaymentInitiated(false);
          setError('Payment initialization failed: ' + error.message);
        }
      }
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-[#8025fb] border-t-transparent rounded-full mb-4"></div>
        <p>Loading checkout information... {retryCount > 0 ? `(Attempt ${retryCount})` : ''}</p>
        {retryCount >= 3 && (
          <p className="text-sm text-gray-600 mt-2">
            This is taking longer than expected. Please try returning to the main app and starting again.
          </p>
        )}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start mb-4 max-w-lg">
          <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={20} />
          <div>
            <h3 className="text-red-800 font-medium mb-1">Checkout Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
        <button 
          onClick={() => {
            if (window.opener) {
              window.opener.focus();
              window.close();
            } else {
              window.location.href = "/";
            }
          }} 
          className="px-4 py-2 bg-[#8025fb] text-white rounded-lg"
        >
          Return to Main App
        </button>
      </div>
    );
  }
  
  if (!checkoutData) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start mb-4 max-w-lg">
          <AlertTriangle className="text-yellow-500 mr-3 mt-0.5" size={20} />
          <div>
            <h3 className="text-yellow-800 font-medium mb-1">No Checkout Data</h3>
            <p className="text-yellow-700 text-sm">No valid checkout data found. Please return to the main app and try again.</p>
          </div>
        </div>
        <button 
          onClick={() => {
            if (window.opener) {
              window.opener.focus();
              window.close();
            } else {
              window.location.href = "/";
            }
          }} 
          className="px-4 py-2 bg-[#8025fb] text-white rounded-lg"
        >
          Return to Main App
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <ShoppingBag className="mr-2 text-[#8025fb]" />
          Checkout
        </h1>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="font-semibold mb-4 flex items-center">
                <MapPin className="mr-2 text-[#8025fb]" size={18} />
                Delivery Address
              </h2>
              
              {editingAddress ? (
                <div className="space-y-3">
                  <textarea
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8025fb] min-h-[100px]"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Enter your full delivery address"
                  />
                  <div className="flex gap-2">
                    <button 
                      className="px-4 py-2 bg-[#8025fb] text-white rounded-lg hover:bg-[#6a1ed6] transition-colors"
                      onClick={() => {
                        if (newAddress.trim()) {
                          setAddress(newAddress.trim());
                        }
                        setEditingAddress(false);
                      }}
                    >
                      Save Address
                    </button>
                    <button 
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setNewAddress("");
                        setEditingAddress(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start p-3 border rounded-lg bg-gray-50">
                  <Home className="mr-3 text-gray-500" size={18} />
                  <div className="flex-1">
                    <div className="font-medium">Home</div>
                    <div className="text-sm text-gray-600">{address}</div>
                  </div>
                  <button 
                    className="text-[#8025fb] hover:underline text-sm"
                    onClick={() => {
                      setNewAddress(address);
                      setEditingAddress(true);
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
            
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="font-semibold mb-4 flex items-center">
                <ShoppingBag className="mr-2 text-[#8025fb]" size={18} />
                Order Items ({checkoutData.items.length})
              </h2>
              
              <div className="divide-y">
                {checkoutData.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center">
                    <div className="w-12 h-12 rounded-md overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100?text=Product';
                        }} 
                      />
                    </div>
                    
                    <div className="ml-3 flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.unit}</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold">₹{item.price}</div>
                      <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Payment Methods */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="font-semibold mb-4 flex items-center">
                <CreditCard className="mr-2 text-[#8025fb]" size={18} />
                Payment Method
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="online" 
                    checked={paymentMethod === 'online'} 
                    onChange={() => setPaymentMethod('online')}
                    className="mt-1 text-[#8025fb]" 
                  />
                  <div className="ml-3">
                    <div className="font-medium">Online Payment</div>
                    <div className="text-xs text-gray-500">Pay securely using your debit/credit card or UPI</div>
                  </div>
                </label>
                
                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="cod" 
                    checked={paymentMethod === 'cod'} 
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-[#8025fb]" 
                  />
                  <div className="ml-3">
                    <div className="font-medium">Cash on Delivery</div>
                    <div className="text-xs text-gray-500">Pay when your order arrives</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-24">
              <h2 className="font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items Total</span>
                  <span>₹{checkoutData.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-purple-600">FREE</span>
                </div>
              </div>
              
              <div className="border-t pt-3 mb-4">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{checkoutData.totalAmount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mb-4">
                <Truck size={16} className="mr-2 text-[#8025fb]" />
                <span>Delivery in 8 minutes</span>
              </div>
              
              <button 
                onClick={handlePayment}
                disabled={paymentInitiated}
                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${
                  paymentInitiated 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-[#8025fb] hover:bg-[#6a1ed6] text-white'
                }`}
              >
                {paymentInitiated ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {paymentMethod === 'online' ? 'Pay Now' : 'Place Order'} 
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </button>
              
              <div className="mt-4 text-xs text-gray-500 text-center">
                By placing this order, you agree to our 
                <a href="#" className="text-[#8025fb] ml-1">Terms & Conditions</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;