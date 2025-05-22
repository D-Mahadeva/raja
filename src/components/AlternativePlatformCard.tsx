// src/components/AlternativePlatformCard.tsx

import React from 'react';
import { useShop, Platform, CartItem } from '@/context/ShopContext';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { formatCheckoutData, openCheckoutTab } from '@/lib/checkout-bridge';
import { useToast } from '@/hooks/use-toast';

// Clone app URLs - these should match your clone app configurations
const CHECKOUT_CONFIG = {
  blinkitUrl: 'http://localhost:3001',
  zeptoUrl: 'http://localhost:3002'
};

interface AlternativePlatformCardProps {
  platform: Platform;
  unavailableItems: CartItem[];
  availableItems: CartItem[];
  currentPlatform: Platform | null;
}

const AlternativePlatformCard: React.FC<AlternativePlatformCardProps> = ({
  platform,
  unavailableItems,
  availableItems,
  currentPlatform
}) => {
  const { platforms } = useShop();
  const { toast } = useToast();
  
  const platformInfo = platforms.find(p => p.id === platform);
  
  // Calculate key metrics
  const totalItems = unavailableItems.length;
  const isCurrentPlatform = platform === currentPlatform;
  
  const handleRedirect = () => {
    try {
      // Create checkout data for only the unavailable items that are available on this platform
      // First, convert to the format expected by formatCheckoutData
      const checkoutItems = unavailableItems.map(item => ({
        product: item.product,
        quantity: item.quantity,
        platform // Set platform to this alternative
      }));
      
      // Format the checkout data
      const checkoutData = formatCheckoutData(checkoutItems, platform);
      
      // Open the checkout tab with this data
      openCheckoutTab(checkoutData, CHECKOUT_CONFIG);
      
      toast({
        title: `Redirecting to ${platformInfo?.name}`,
        description: `Preparing ${totalItems} item${totalItems !== 1 ? 's' : ''} for checkout on ${platformInfo?.name}`,
      });
    } catch (error) {
      console.error('Error redirecting to platform:', error);
      toast({
        title: "Redirect failed",
        description: error.message || "There was an error redirecting to the platform",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div 
      className={`rounded-lg border p-4 ${
        isCurrentPlatform 
          ? `border-platform-${platform} bg-platform-${platform}/5` 
          : 'border-border/60 hover:border-border'
      }`}
      whileHover={{ y: -3, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className={`text-lg font-medium platform-${platform}`}>
            {platformInfo?.name}
          </span>
          
          <Badge 
            variant="outline" 
            className={`ml-2 bg-platform-${platform}/10 platform-${platform} text-xs px-2 py-0.5`}
          >
            {platformInfo?.deliveryTime}
          </Badge>
        </div>
        
        {isCurrentPlatform && (
          <Badge className="bg-platform-blinkit/10 platform-blinkit text-xs">
            Current
          </Badge>
        )}
      </div>
      
      <div className="text-sm mb-3">
        <div className="text-green-600 flex items-center font-medium">
          <Check size={16} className="mr-1" /> 
          {totalItems} unavailable item{totalItems !== 1 ? 's' : ''} available on this platform
        </div>
      </div>
      
      <div className="mt-4">
        <Button 
          variant="outline" 
          size="sm"
          className={`w-full border-platform-${platform} platform-${platform} hover:bg-platform-${platform}/10`}
          onClick={handleRedirect}
        >
          Checkout on {platformInfo?.name}
          <ArrowRight size={14} className="ml-1.5" />
        </Button>
      </div>
    </motion.div>
  );
};

export default AlternativePlatformCard;