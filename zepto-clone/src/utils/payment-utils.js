// blinkit-clone/src/utils/payment-utils.js (and zepto-clone/src/utils/payment-utils.js)

import axios from 'axios';

// Function to create Razorpay order using our backend API
export const createRazorpayOrder = async (orderData) => {
  try {
    console.log('Creating Razorpay order for:', orderData);
    
    const response = await axios.post('/api/payments/create-order', {
      amount: orderData.totalAmount,
      currency: 'INR',
      receipt: orderData.orderId,
      notes: {
        platform: orderData.platform,
        items: orderData.items.length
      }
    });
    
    if (!response.data.success) {
      throw new Error('Failed to create order: ' + (response.data.error || 'Unknown error'));
    }
    
    console.log('Razorpay order created:', response.data.order);
    return response.data.order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to create payment order');
  }
};

// Function to verify payment using our backend API
export const verifyPayment = async (paymentData) => {
  try {
    console.log('Verifying payment:', paymentData);
    
    const response = await axios.post('/api/payments/verify-payment', paymentData);
    
    if (!response.data.success) {
      throw new Error('Payment verification failed');
    }
    
    console.log('Payment verification successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to verify payment');
  }
};

// Initialize Razorpay and handle payments
export const loadRazorpay = (options, onSuccess, onError) => {
  console.log('Initializing Razorpay with options:', options);
  
  try {
    if (!window.Razorpay) {
      throw new Error("Razorpay SDK is not loaded. Make sure the script is included in your HTML.");
    }
    
    const rzp = new window.Razorpay(options);
    
    rzp.on('payment.success', async (response) => {
      console.log('Razorpay payment success:', response);
      
      try {
        // Verify payment with backend
        const verification = await verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        });
        
        if (verification.success) {
          console.log('Payment verified successfully');
          onSuccess(response);
        } else {
          console.error('Payment verification failed');
          onError({ description: 'Payment verification failed' });
        }
      } catch (error) {
        console.error('Error during payment verification:', error);
        onError({ description: error.message });
      }
    });
    
    rzp.on('payment.error', (response) => {
      console.error('Razorpay payment error:', response);
      onError(response);
    });
    
    console.log('Opening Razorpay payment dialog');
    rzp.open();
    
    return rzp;
  } catch (error) {
    console.error('Error initializing Razorpay:', error);
    onError({ description: error.message || 'Failed to initialize payment' });
    return null;
  }
};