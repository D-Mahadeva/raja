// zepto-clone/src/pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, MapPin, Home, CreditCard, Truck, ArrowRight, Check, AlertTriangle } from 'lucide-react';
import { getPendingCheckout, updateOrderStatus } from '../utils/checkout-bridge';

const loadRazorpay = (options, onSuccess, onError) => {
  const rzp = new window.Razorpay(options);
  
  rzp.on('payment.success', (response) => {
    onSuccess(response);
  });
  
  rzp.on('payment.error', (response) => {
    onError(response);
  });
  
  rzp.open();
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checkoutData, setCheckoutData] = useState(null);
  const [address, setAddress] = useState("123 Main Street, Bengaluru, 560001");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  
  useEffect(() => {
    const fetchCheckoutData = () => {
      const urlParams = new URLSearchParams(location.search);
      const orderId = urlParams.get('orderId');
      
      // Get checkout data from localStorage (shared with the main app)
      const data = getPendingCheckout();
      
      if (!data || data.platform !== 'zepto') {
        setError("No valid checkout data found. Please return to the main app and try again.");
        setLoading(false);
        return;
      }
      
      setCheckoutData(data);
      setLoading(false);
    };
    
    fetchCheckoutData();
  }, [location]);
  
  const handlePayment = () => {
    if (!checkoutData) return;
    
    setPaymentInitiated(true);
    
    if (paymentMethod === 'cod') {
      // Handle cash on delivery
      updateOrderStatus({
        orderId: checkoutData.orderId,
        status: 'confirmed',
        platform: 'zepto',
        timestamp: new Date().toISOString(),
        totalAmount: checkoutData.totalAmount,
        deliveryTime: '8 minutes',
        message: 'Your order is confirmed and will be delivered in 8 minutes',
        paymentMethod: 'cod'
      });
      
      // Navigate to confirmation page
      navigate(`/order-confirmation?orderId=${checkoutData.orderId}`);
    } else {
      // Handle online payment with Razorpay
      const options = {
        key_id: 'rzp_test_Jt8mnJR1XSuoZB', 
        key_secret: 'dRJ1FSaqyiVVeQ1Vn9RtcGcm', // This would be your actual Razorpay key in production
        amount: checkoutData.totalAmount * 100, // Amount in paise
        currency: 'INR',
        name: 'Zepto',
        description: `Order ID: ${checkoutData.orderId}`,
        order_id: `order_${Date.now()}`, // This would be generated on your backend in production
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
            setPaymentInitiated(false);
            
            // Update status as payment cancelled
            updateOrderStatus({
              orderId: checkoutData.orderId,
              status: 'pending',
              platform: 'zepto',
              timestamp: new Date().toISOString(),
              totalAmount: checkoutData.totalAmount,
              message: 'Payment was cancelled. Please try again.',
              paymentMethod: 'online'
            });
          }
        }
      };
      
      loadRazorpay(
        options,
        (paymentResponse) => {
          // Payment success
          updateOrderStatus({
            orderId: checkoutData.orderId,
            status: 'confirmed',
            platform: 'zepto',
            timestamp: new Date().toISOString(),
            totalAmount: checkoutData.totalAmount,
            deliveryTime: '8 minutes',
            message: 'Your order is confirmed and will be delivered in 8 minutes',
            paymentMethod: 'online',
            paymentId: paymentResponse.razorpay_payment_id
          });
          
          // Navigate to confirmation page
          navigate(`/order-confirmation?orderId=${checkoutData.orderId}`);
        },
        (error) => {
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
            error: error.description || 'Unknown error'
          });
          
          setError('Payment failed. Please try again.');
        }
      );
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-[#8025fb] border-t-transparent rounded-full mb-4"></div>
        <p>Loading checkout information...</p>
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
          onClick={() => window.close()} 
          className="px-4 py-2 bg-[#8025fb] text-white rounded-lg"
        >
          Close Window
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
          onClick={() => window.close()} 
          className="px-4 py-2 bg-[#8025fb] text-white rounded-lg"
        >
          Close Window
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
              
              <div className="flex items-start p-3 border rounded-lg bg-gray-50">
                <Home className="mr-3 text-gray-500" size={18} />
                <div>
                  <div className="font-medium">Home</div>
                  <div className="text-sm text-gray-600">{address}</div>
                </div>
                <div className="ml-auto">
                  <div className="text-xs px-2 py-1 bg-[#8025fb] text-white rounded">
                    Default
                  </div>
                </div>
              </div>
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