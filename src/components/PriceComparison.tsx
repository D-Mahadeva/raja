import React, { useState } from 'react';
import { useShop, Platform } from '@/context/ShopContext';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface PriceComparisonProps {
  selectedPlatform: Platform | null;
  onSelectPlatform: (platform: Platform) => void;
}

const PriceComparison: React.FC<PriceComparisonProps> = ({ 
  selectedPlatform, 
  onSelectPlatform 
}) => {
  const { platforms, cart } = useShop();
  const [expandedPlatform, setExpandedPlatform] = useState<Platform | null>(null);
  
  // Calculate all products consolidated into each platform
  const platformAnalysis = React.useMemo(() => {
    if (cart.length === 0) return [];
    
    return platforms.map(platform => {
      // Analyze each cart item on this platform
      const items = cart.map(item => {
        const priceInfo = item.product.prices.find(p => p.platform === platform.id);
        
        return {
          product: item.product,
          quantity: item.quantity,
          available: priceInfo && priceInfo.available ? true : false,
          price: priceInfo ? priceInfo.price : 0,
          totalPrice: priceInfo && priceInfo.available ? priceInfo.price * item.quantity : 0
        };
      });
      
      // Calculate totals
      const availableItems = items.filter(item => item.available);
      const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
      
      return {
        platform: platform,
        items: items,
        totalPrice: totalPrice,
        availableCount: availableItems.length,
        totalCount: items.length,
        allAvailable: availableItems.length === items.length
      };
    }).sort((a, b) => {
      // First prioritize platforms that have all items
      if (a.allAvailable && !b.allAvailable) return -1;
      if (!a.allAvailable && b.allAvailable) return 1;
      
      // Then sort by price among platforms that have equivalent availability
      if (a.availableCount === b.availableCount) {
        return a.totalPrice - b.totalPrice;
      }
      
      // Otherwise sort by how many items are available
      return b.availableCount - a.availableCount;
    });
  }, [cart, platforms]);
  
  // Find best platform (lowest total)
  const bestPlatform = platformAnalysis.length > 0 ? platformAnalysis[0] : null;
  
  // Toggle expanded view for a platform
  const toggleExpand = (platformId: Platform) => {
    if (expandedPlatform === platformId) {
      setExpandedPlatform(null);
    } else {
      setExpandedPlatform(platformId);
    }
  };

  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden animate-scale-in">
      <div className="bg-secondary/50 px-4 py-3 border-b border-border/60">
        <h3 className="font-medium">Platform Price Comparison</h3>
        <p className="text-xs text-muted-foreground mt-1">
          See prices if all your items were bought from a single platform
        </p>
      </div>
      
      <div className="divide-y divide-border/60">
        {platformAnalysis.map((analysis) => (
          <div key={analysis.platform.id} className="flex flex-col">
            <div 
              className={`
                flex items-center justify-between p-4 cursor-pointer
                ${selectedPlatform === analysis.platform.id ? 'bg-primary/5' : ''}
                ${analysis.platform.id === bestPlatform?.platform.id ? 'bg-platform-' + analysis.platform.id + '/5' : ''}
              `}
              onClick={() => toggleExpand(analysis.platform.id)}
            >
              <div className="flex items-center gap-2">
                <span className={`font-medium platform-${analysis.platform.id}`}>
                  {analysis.platform.name}
                </span>
                
                {/* Best price badge */}
                {analysis.platform.id === bestPlatform?.platform.id && (
                  <span className="text-xs bg-platform-blinkit/10 platform-blinkit px-2 py-0.5 rounded-full">
                    Best Deal
                  </span>
                )}
                
                {/* Show availability badge */}
                {!analysis.allAvailable && (
                  <span className="text-xs text-muted-foreground">
                    ({analysis.availableCount}/{analysis.totalCount} items available)
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-semibold">₹{analysis.totalPrice.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant={selectedPlatform === analysis.platform.id ? "default" : "outline"}
                    size="sm"
                    className={selectedPlatform === analysis.platform.id ? 
                      `bg-platform-${analysis.platform.id} hover:bg-platform-${analysis.platform.id}/90` : 
                      `border-platform-${analysis.platform.id} platform-${analysis.platform.id} hover:bg-platform-${analysis.platform.id}/10`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPlatform(analysis.platform.id);
                    }}
                  >
                    {selectedPlatform === analysis.platform.id ? (
                      <Check size={14} className="mr-1" />
                    ) : null}
                    {selectedPlatform === analysis.platform.id ? 'Selected' : 'Select'}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(analysis.platform.id);
                    }}
                  >
                    {expandedPlatform === analysis.platform.id ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Expandable item list */}
            <AnimatePresence>
              {expandedPlatform === analysis.platform.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="bg-gray-50 p-3 divide-y divide-gray-200">
                    {analysis.items.map((item, index) => (
                      <div 
                        key={`${analysis.platform.id}-${item.product.id}`}
                        className="py-2 flex justify-between items-center"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md overflow-hidden bg-white border border-gray-200">
                            <img 
                              src={item.product.image || '/placeholder.svg'} 
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className={`${!item.available ? 'text-gray-400' : ''}`}>
                            <div className="text-sm font-medium">{item.product.name}</div>
                            <div className="text-xs">
                              {item.quantity} × {item.product.unit}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {item.available ? (
                            <span className="font-medium">₹{item.totalPrice.toFixed(2)}</span>
                          ) : (
                            <span className="text-destructive text-sm flex items-center">
                              <X size={14} className="mr-1" />
                              Not available
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Platform summary */}
                    <div className="pt-3 flex justify-between items-center font-medium">
                      <span>Total ({analysis.availableCount} items)</span>
                      <span>₹{analysis.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceComparison;