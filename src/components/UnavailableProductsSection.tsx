// src/components/UnavailableProductsSection.tsx

import React, { useMemo } from 'react';
import { useShop, Platform, CartItem } from '@/context/ShopContext';
import { AlertTriangle, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import AlternativePlatformCard from './AlternativePlatformCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

interface UnavailableProductsSectionProps {
  selectedPlatform: Platform | null;
}

const UnavailableProductsSection: React.FC<UnavailableProductsSectionProps> = ({ 
  selectedPlatform 
}) => {
  const { cart, platforms } = useShop();
  const [expanded, setExpanded] = React.useState(false);
  
  // Only process if a platform is selected
  if (!selectedPlatform) return null;
  
  // Find unavailable items on the current platform
  const unavailableItems = cart.filter(item => {
    const priceInfo = item.product.prices.find(p => p.platform === selectedPlatform);
    return !priceInfo || !priceInfo.available;
  });
  
  // If there are no unavailable items, don't show this section
  if (unavailableItems.length === 0) return null;

  // Calculate alternative platforms that have these unavailable items
  const alternativePlatforms = useMemo(() => {
    // Skip the currently selected platform
    const otherPlatforms = platforms
      .map(p => p.id)
      .filter(p => p !== selectedPlatform);
    
    // For each platform, check how many unavailable items are available there
    return otherPlatforms.map(platform => {
      // Check which items are available on this platform
      const availableOnPlatform = unavailableItems.filter(item => {
        const priceInfo = item.product.prices.find(p => p.platform === platform);
        return priceInfo && priceInfo.available;
      });
      
      return {
        platform,
        availableItems: availableOnPlatform, 
        unavailableItems: availableOnPlatform // These are items unavailable on selected but available here
      };
    })
    // Sort by how many unavailable items they have available
    .filter(p => p.availableItems.length > 0)
    .sort((a, b) => b.availableItems.length - a.availableItems.length);
  }, [unavailableItems, platforms, selectedPlatform]);

  // If no alternative platforms have any of the unavailable items, don't show
  if (alternativePlatforms.length === 0) return null;
  
  return (
    <motion.div 
      className="rounded-lg border border-amber-200 overflow-hidden my-4"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div 
        className="bg-amber-50 px-4 py-3 flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <AlertTriangle size={18} className="text-amber-500 mr-2" />
          <div>
            <h3 className="font-medium text-amber-800">
              {unavailableItems.length} item{unavailableItems.length !== 1 ? 's' : ''} unavailable on {platforms.find(p => p.id === selectedPlatform)?.name}
            </h3>
            <p className="text-xs text-amber-600">
              These items are available on other platforms
            </p>
          </div>
        </div>
        
        <button className="text-amber-700 hover:bg-amber-100 p-1 rounded">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
      
      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white">
              {/* Unavailable items preview */}
              <div className="mb-4">
                <div className="text-sm font-medium mb-2 text-gray-700">Unavailable Items:</div>
                <div className="flex flex-wrap gap-2">
                  {unavailableItems.map(item => (
                    <div key={item.product.id} className="flex items-center bg-gray-100 rounded-full px-2 py-1 text-xs">
                      <div className="w-4 h-4 rounded-full overflow-hidden mr-1">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <span className="truncate max-w-32">{item.product.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator className="my-4" />
              
              {/* Alternative platforms */}
              <div className="space-y-3">
                <div className="text-sm font-medium mb-2 text-gray-700">Available on:</div>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {alternativePlatforms.map(({ platform, availableItems, unavailableItems }) => (
                    <AlternativePlatformCard 
                      key={platform}
                      platform={platform}
                      unavailableItems={unavailableItems}
                      availableItems={availableItems}
                      currentPlatform={selectedPlatform}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UnavailableProductsSection;