// zepto-clone/src/pages/OrderConfirmationPage.jsx - Fixed version
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Truck, Clock, MapPin, Copy, ArrowLeft, ExternalLink } from 'lucide-react';
import { getOrderById, updateOrderStatus, clearPendingCheckout } from '../utils/checkout-bridge';

const OrderConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryStage, setDeliveryStage] = useState(0); // 0: Confirmed, 1: Preparing, 2: On the way, 3: Delivered
  const [deliveryTimer, setDeliveryTimer] = useState(8 * 60); // 8 minutes in seconds
  const [copySuccess, setCopySuccess] = useState(false);
  
  useEffect(() => {
    const fetchOrderData = () => {
      const urlParams = new URLSearchParams(location.search);
      const orderId = urlParams.get('orderId');
      
      if (!orderId) {
        console.error("No order ID found in URL");
        setLoading(false);
        return;
      }
      
      console.log("Looking for order with ID:", orderId);
      
      // Get order data directly using the order ID
      const data = getOrderById(orderId);
      
      if (!data) {
        console.error("No order data found for ID:", orderId);
        setLoading(false);
        return;
      }
      
      console.log("Found order data:", data);
      setOrderData(data);
      
      // Clear the pending checkout data as the order is now confirmed
      clearPendingCheckout();
      
      setLoading(false);
    };
    
    fetchOrderData();
  }, [location]);
  
  // Simulate delivery progress
  useEffect(() => {
    if (!orderData) return;
    
    // Advance to "preparing" stage after 15 seconds
    const prepTimer = setTimeout(() => {
      setDeliveryStage(1);
      
      // Update status in the main app
      updateOrderStatus({
        orderId: orderData.orderId,
        status: 'preparing',
        platform: 'zepto',
        timestamp: new Date().toISOString(),
        totalAmount: orderData.totalAmount,
        deliveryTime: '5 minutes',
        message: 'Your order is being prepared and will be out for delivery soon'
      });
      
    }, 15000);
    
    // Advance to "on the way" stage after 30 seconds
    const onWayTimer = setTimeout(() => {
      setDeliveryStage(2);
      
      // Update status in the main app
      updateOrderStatus({
        orderId: orderData.orderId,
        status: 'on_the_way',
        platform: 'zepto',
        timestamp: new Date().toISOString(),
        totalAmount: orderData.totalAmount,
        deliveryTime: '2 minutes',
        message: 'Your order is on the way to your location'
      });
      
    }, 30000);
    
    // Advance to "delivered" stage after 45 seconds
    const deliveredTimer = setTimeout(() => {
      setDeliveryStage(3);
      
      // Update status in the main app
      updateOrderStatus({
        orderId: orderData.orderId,
        status: 'delivered',
        platform: 'zepto',
        timestamp: new Date().toISOString(),
        totalAmount: orderData.totalAmount,
        deliveryTime: 'Delivered',
        message: 'Your order has been delivered. Thank you for shopping with Zepto!'
      });
      
    }, 45000);
    
    return () => {
      clearTimeout(prepTimer);
      clearTimeout(onWayTimer);
      clearTimeout(deliveredTimer);
    };
  }, [orderData]);
  
  // Countdown timer
  useEffect(() => {
    if (!orderData || deliveryStage === 3) return;
    
    const interval = setInterval(() => {
      setDeliveryTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [orderData, deliveryStage]);
  
  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const copyOrderId = () => {
    if (!orderData) return;
    
    navigator.clipboard.writeText(orderData.orderId)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      });
  };
  
  const handleReturnToApp = () => {
    // Try to focus the opener window and close this one
    if (window.opener) {
      try {
        window.opener.focus();
        window.close();
      } catch (e) {
        console.error("Error returning to main app:", e);
        // Fallback to navigate to home
        window.location.href = "/";
      }
    } else {
      // If no opener, just navigate home
      window.location.href = "/";
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-[#8025fb] border-t-transparent rounded-full mb-4"></div>
        <p>Loading order information...</p>
      </div>
    );
  }
  
  if (!orderData) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start mb-4 max-w-lg">
          <div className="text-yellow-500 mr-3 mt-0.5">⚠️</div>
          <div>
            <h3 className="text-yellow-800 font-medium mb-1">Order Not Found</h3>
            <p className="text-yellow-700 text-sm">No valid order data found. Please check your order in the main app.</p>
          </div>
        </div>
        <button 
          onClick={handleReturnToApp} 
          className="px-4 py-2 bg-[#8025fb] text-white rounded-lg"
        >
          Return to Main App
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={handleReturnToApp}
          className="mb-6 flex items-center text-[#8025fb] hover:underline"
        >
          <ArrowLeft size={16} className="mr-1" />
          Return to Main App
        </button>
        
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#F0E6FD] flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-[#8025fb]" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">
              Your order has been placed successfully and will be delivered soon.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-gray-50 rounded-lg mb-6">
            <div className="flex flex-col items-center sm:items-start mb-4 sm:mb-0">
              <div className="text-sm text-gray-500 mb-1">Order ID</div>
              <div className="flex items-center">
                <span className="font-medium">{orderData.orderId}</span>
                <button 
                  onClick={copyOrderId} 
                  className="ml-2 text-[#8025fb] hover:text-[#6a1ed6]"
                >
                  {copySuccess ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex flex-col items-center sm:items-end">
              <div className="text-sm text-gray-500 mb-1">Order Total</div>
              <div className="font-bold text-lg">₹{orderData.totalAmount.toFixed(2)}</div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="font-semibold mb-4">Delivery Status</h2>
            
            <div className="relative">
              {/* Progress Bar */}
              <div className="absolute left-3 top-0 w-0.5 h-full bg-gray-200 z-0"></div>
              
              {/* Confirmed */}
              <div className="relative z-10 flex mb-6">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  deliveryStage >= 0 ? 'bg-[#8025fb] text-white' : 'bg-gray-200'
                }`}>
                  {deliveryStage >= 0 ? <CheckCircle size={14} /> : "1"}
                </div>
                <div className="ml-4">
                  <div className="font-medium">Order Confirmed</div>
                  <div className="text-sm text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              {/* Preparing */}
              <div className="relative z-10 flex mb-6">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  deliveryStage >= 1 ? 'bg-[#8025fb] text-white' : 'bg-gray-200'
                }`}>
                  {deliveryStage >= 1 ? <CheckCircle size={14} /> : "2"}
                </div>
                <div className="ml-4">
                  <div className="font-medium">Preparing Your Order</div>
                  <div className="text-sm text-gray-500">
                    {deliveryStage >= 1 ? new Date().toLocaleTimeString() : '-'}
                  </div>
                </div>
              </div>
              
              {/* On the way */}
              <div className="relative z-10 flex mb-6">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  deliveryStage >= 2 ? 'bg-[#8025fb] text-white' : 'bg-gray-200'
                }`}>
                  {deliveryStage >= 2 ? <CheckCircle size={14} /> : "3"}
                </div>
                <div className="ml-4">
                  <div className="font-medium">On the Way</div>
                  <div className="text-sm text-gray-500">
                    {deliveryStage >= 2 ? new Date().toLocaleTimeString() : '-'}
                  </div>
                </div>
              </div>
              
              {/* Delivered */}
              <div className="relative z-10 flex">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  deliveryStage >= 3 ? 'bg-[#8025fb] text-white' : 'bg-gray-200'
                }`}>
                  {deliveryStage >= 3 ? <CheckCircle size={14} /> : "4"}
                </div>
                <div className="ml-4">
                  <div className="font-medium">Delivered</div>
                  <div className="text-sm text-gray-500">
                    {deliveryStage >= 3 ? new Date().toLocaleTimeString() : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#F0E6FD] p-4 rounded-lg flex items-center mb-6">
            <div className="w-12 h-12 bg-[#8025fb] rounded-full flex items-center justify-center mr-4">
              <Clock className="text-white" size={24} />
            </div>
            <div>
              <div className="text-sm font-semibold mb-1">Estimated Delivery Time</div>
              <div className="font-bold text-lg flex items-center">
                {deliveryStage === 3 ? (
                  <span className="text-[#8025fb]">Delivered!</span>
                ) : (
                  <>
                    <Truck className="mr-2 text-[#8025fb]" size={18} />
                    <span>{formatTime(deliveryTimer)} minutes</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="font-semibold mb-3">Delivery Address</h2>
            <div className="flex items-start p-3 border rounded-lg bg-gray-50">
              <MapPin className="text-[#8025fb] mr-2" size={18} />
              <div className="text-sm">{orderData.address || "123 Main Street, Bengaluru, 560001"}</div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="divide-y border rounded-lg overflow-hidden">
              {orderData.items && orderData.items.map((item) => (
                <div key={item.id} className="p-3 flex items-center bg-white">
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100">
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
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.unit}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-sm">₹{item.price}</div>
                    <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Items Total</span>
              <span>₹{orderData.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Delivery Fee</span>
              <span className="text-purple-600">FREE</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span>₹{orderData.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button 
            onClick={handleReturnToApp}
            className="px-6 py-2 bg-[#8025fb] text-white rounded-lg flex items-center"
          >
            Return to Main App
            <ExternalLink size={16} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;