// src/components/OrderTracking.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Check, Truck, Package, PackageOpen, Home, ShoppingBag } from 'lucide-react';
import { Platform } from '@/context/ShopContext';
import platformConfig from '@/config/platformConfig';

interface OrderStatus {
  status: 'confirmed' | 'preparing' | 'packed' | 'dispatched' | 'out_for_delivery' | 'delivered';
  message: string;
  timestamp: string;
}

interface OrderTrackingProps {
  orderId: string;
  platform: Platform;
  estimatedDelivery: string;
  currentStatus?: OrderStatus;
  onStatusUpdate?: (status: OrderStatus) => void;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({
  orderId,
  platform,
  estimatedDelivery,
  currentStatus,
  onStatusUpdate
}) => {
  const [status, setStatus] = useState<OrderStatus | null>(currentStatus || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Status steps in order
  const statusSteps = [
    { key: 'confirmed', label: 'Confirmed', icon: Check },
    { key: 'preparing', label: 'Preparing', icon: ShoppingBag },
    { key: 'packed', label: 'Packed', icon: Package },
    { key: 'dispatched', label: 'Dispatched', icon: PackageOpen },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: Home }
  ];
  
  // Get current step index
  const getCurrentStepIndex = () => {
    if (!status) return 0;
    const index = statusSteps.findIndex(step => step.key === status.status);
    return index > -1 ? index : 0;
  };
  
  // Effect to periodically fetch order status updates
  useEffect(() => {
    const fetchOrderStatus = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${platformConfig.urls[platform]}/api/orders/${orderId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch order status: ${response.statusText}`);
        }
        
        const orderData = await response.json();
        
        // Create status object
        const newStatus = {
          status: orderData.status,
          message: orderData.statusMessage || platformConfig.defaultStatus[platform][orderData.status] || 'Order status updated',
          timestamp: orderData.updatedAt || new Date().toISOString()
        };
        
        setStatus(newStatus);
        
        // Call onStatusUpdate callback if provided
        if (onStatusUpdate) {
          onStatusUpdate(newStatus);
        }
      } catch (err) {
        console.error('Error fetching order status:', err);
        setError('Could not fetch order status');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial fetch
    fetchOrderStatus();
    
    // Set up polling interval (every 30 seconds)
    const intervalId = setInterval(fetchOrderStatus, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [orderId, platform, onStatusUpdate]);
  
  const currentStepIndex = getCurrentStepIndex();
  
  return (
    <div className={`bg-platform-${platform}/5 border border-platform-${platform}/20 rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-medium platform-${platform}`}>
          Order #{orderId}
        </h3>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock size={14} className="mr-1.5" />
          <span>Est. delivery: {estimatedDelivery}</span>
        </div>
      </div>
      
      {isLoading && !status && (
        <div className="p-4 text-center">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-primary rounded-full" role="status" aria-label="loading">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Fetching order status...</p>
        </div>
      )}
      
      {error && (
        <div className="p-4 text-center text-destructive">
          <p>{error}</p>
          <button 
            className="mt-2 text-sm underline"
            onClick={() => window.open(`${platformConfig.urls[platform]}/orders/${orderId}`, '_blank')}
          >
            View on {platformConfig.names[platform]}
          </button>
        </div>
      )}
      
      {status && (
        <div className="relative">
          {/* Progress bar */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 z-0"></div>
          <div 
            className={`absolute left-4 top-0 w-0.5 bg-platform-${platform} z-10`} 
            style={{ 
              height: `${Math.min(100, (currentStepIndex / (statusSteps.length - 1)) * 100)}%`
            }}
          ></div>
          
          {/* Status steps */}
          <div className="relative z-20">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div 
                  key={step.key} 
                  className={`flex items-start mb-4 last:mb-0 ${isCompleted ? '' : 'opacity-40'}`}
                >
                  <div 
                    className={`relative flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                      isCompleted ? `bg-platform-${platform}` : 'bg-gray-200'
                    }`}
                  >
                    {React.createElement(step.icon, { 
                      size: 16, 
                      className: isCompleted ? 'text-white' : 'text-gray-500' 
                    })}
                    
                    {isCurrent && (
                      <motion.div 
                        className={`absolute inset-0 rounded-full border-2 border-platform-${platform} animate-pulse`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1.2 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className={`font-medium ${isCurrent ? `platform-${platform}` : ''}`}>
                      {step.label}
                    </p>
                    
                    {isCurrent && status.message && (
                      <p className="text-sm text-muted-foreground mt-0.5">{status.message}</p>
                    )}
                    
                    {isCompleted && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isCurrent ? 'Current status' : 'Completed'}
                      </p>
                    )}
                  </div>
                  
                  {isCompleted && !isCurrent && (
                    <Check size={16} className={`platform-${platform}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
        <a 
          href={`${platformConfig.urls[platform]}/orders/${orderId}`}
          target="_blank" 
          rel="noopener noreferrer"
          className={`text-sm platform-${platform} font-medium hover:underline`}
        >
          View details on {platformConfig.names[platform]}
        </a>
      </div>
    </div>
  );
};

export default OrderTracking;