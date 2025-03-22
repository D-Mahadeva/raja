
import React from 'react';
import { useShop, Platform } from '@/context/ShopContext';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PriceComparisonProps {
  selectedPlatform: Platform | null;
  onSelectPlatform: (platform: Platform) => void;
}

const PriceComparison: React.FC<PriceComparisonProps> = ({ 
  selectedPlatform, 
  onSelectPlatform 
}) => {
  const { platforms, cart, getCartTotal } = useShop();
  
  // Check if all items are available on a platform
  const areAllItemsAvailable = (platform: Platform) => {
    return cart.every(item => {
      const priceInfo = item.product.prices.find(p => p.platform === platform);
      return priceInfo && priceInfo.available;
    });
  };
  
  // Get platforms sorted by total price
  const sortedPlatforms = React.useMemo(() => {
    return platforms
      .map(platform => ({
        ...platform,
        available: areAllItemsAvailable(platform.id),
        total: areAllItemsAvailable(platform.id) ? getCartTotal(platform.id) : -1
      }))
      .sort((a, b) => {
        // Sort by availability first, then by price
        if (a.available && !b.available) return -1;
        if (!a.available && b.available) return 1;
        return a.total - b.total;
      });
  }, [platforms, cart]);
  
  // Find best platform (lowest total)
  const bestPlatform = sortedPlatforms.find(p => p.available);

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden animate-scale-in">
      <div className="bg-secondary/50 px-4 py-3 border-b border-border/60">
        <h3 className="font-medium">Platform Price Comparison</h3>
      </div>
      
      <div className="divide-y divide-border/60">
        {sortedPlatforms.map((platform) => (
          <div 
            key={platform.id}
            className={`flex items-center justify-between p-4 ${
              platform.id === selectedPlatform ? 'bg-primary/5' : ''
            } ${platform.id === bestPlatform?.id ? 'bg-platform-' + platform.id + '/5' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span className={`font-medium platform-${platform.id}`}>{platform.name}</span>
              
              {/* Best price badge */}
              {platform.id === bestPlatform?.id && (
                <span className="text-xs bg-platform-blinkit/10 platform-blinkit px-2 py-0.5 rounded-full">
                  Best Deal
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {platform.available ? (
                <>
                  <span className="font-semibold">₹{platform.total}</span>
                  <Button 
                    variant={platform.id === selectedPlatform ? "default" : "outline"}
                    size="sm"
                    className={platform.id === selectedPlatform ? 
                      `bg-platform-${platform.id} hover:bg-platform-${platform.id}/90` : 
                      `border-platform-${platform.id} platform-${platform.id} hover:bg-platform-${platform.id}/10`}
                    onClick={() => onSelectPlatform(platform.id)}
                  >
                    {platform.id === selectedPlatform ? (
                      <Check size={14} className="mr-1" />
                    ) : null}
                    {platform.id === selectedPlatform ? 'Selected' : 'Select'}
                  </Button>
                </>
              ) : (
                <div className="flex items-center text-muted-foreground">
                  <X size={14} className="mr-1" />
                  <span>Some items unavailable</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceComparison;
