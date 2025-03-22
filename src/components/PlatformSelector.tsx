
import React from 'react';
import { useShop, Platform } from '@/context/ShopContext';
import { Check } from 'lucide-react';

const PlatformSelector = () => {
  const { platforms, selectedPlatform, setSelectedPlatform } = useShop();

  const handlePlatformClick = (platformId: Platform | null) => {
    // Toggle platform selection (clicking the same platform will clear the selection)
    if (selectedPlatform === platformId) {
      setSelectedPlatform(null);
    } else {
      setSelectedPlatform(platformId);
    }
  };

  return (
    <div className="w-full py-4 overflow-x-auto scrollbar-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 md:gap-5">
          <div 
            className={`flex items-center justify-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all hover-scale ${
              selectedPlatform === null 
                ? 'border-primary bg-primary/5' 
                : 'border-border/50 hover:border-border'
            }`}
            onClick={() => handlePlatformClick(null)}
          >
            <span className="font-medium text-sm whitespace-nowrap">All Platforms</span>
            {selectedPlatform === null && (
              <Check size={16} className="ml-1.5 text-primary" />
            )}
          </div>

          {platforms.map((platform) => (
            <div
              key={platform.id}
              className={`flex items-center justify-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all hover-scale ${
                selectedPlatform === platform.id
                  ? `border-platform-${platform.id} bg-platform-${platform.id}/5`
                  : 'border-border/50 hover:border-border'
              }`}
              onClick={() => handlePlatformClick(platform.id)}
            >
              <span 
                className={`font-medium text-sm whitespace-nowrap ${
                  selectedPlatform === platform.id ? `platform-${platform.id}` : ''
                }`}
              >
                {platform.name}
              </span>
              {selectedPlatform === platform.id && (
                <Check size={16} className={`ml-1.5 platform-${platform.id}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlatformSelector;
