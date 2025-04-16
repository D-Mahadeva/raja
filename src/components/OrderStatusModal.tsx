// src/components/OrderStatusModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Platform } from '@/context/ShopContext';
import { motion } from "framer-motion";
import { CheckCircle, Clock, ShoppingBag } from 'lucide-react';
import OrderTracking from './OrderTracking';
import platformConfig from '@/config/platformConfig';

interface OrderStatusModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  platform: Platform;
  estimatedDelivery: string;
  onDismiss?: () => void;
}

const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  isOpen,
  onOpenChange,
  orderId,
  platform,
  estimatedDelivery,
  onDismiss
}) => {
  const [currentStatus, setCurrentStatus] = useState<any | null>(null);
  
  // Handle order status updates
  const handleStatusUpdate = (status: any) => {
    setCurrentStatus(status);
  };
  
  useEffect(() => {
    // Reset status when modal is opened/closed
    if (!isOpen) {
      setCurrentStatus(null);
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-8 h-8 rounded-full bg-platform-${platform}/20 flex items-center justify-center`}
            >
              <ShoppingBag className={`h-4 w-4 platform-${platform}`} />
            </motion.div>
            <span>Your Order Status</span>
          </DialogTitle>
          <DialogDescription>
            Track the status of your order from {platformConfig.names[platform]}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-6 text-center">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm font-medium"
            >
              <CheckCircle className="mr-1 h-3.5 w-3.5" />
              Order Confirmed
            </motion.div>
            
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Estimated delivery: {estimatedDelivery}</span>
            </motion.div>
          </div>
          
          <OrderTracking 
            orderId={orderId}
            platform={platform}
            estimatedDelivery={estimatedDelivery}
            currentStatus={currentStatus}
            onStatusUpdate={handleStatusUpdate}
          />
        </div>
        
        <DialogFooter className="sm:justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              if (onDismiss) onDismiss();
            }}
          >
            Close
          </Button>
          <Button 
            className={`bg-platform-${platform} hover:bg-platform-${platform}/90`}
            onClick={() => window.open(`${platformConfig.urls[platform]}/orders/${orderId}`, '_blank')}
          >
            View on {platformConfig.names[platform]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderStatusModal;