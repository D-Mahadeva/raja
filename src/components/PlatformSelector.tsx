import React from 'react';
import { useShop, Platform } from '@/context/ShopContext';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

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
          <motion.div 
            className={`flex items-center justify-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPlatform === null 
                ? 'border-primary bg-primary/5' 
                : 'border-border/50 hover:border-border'
            }`}
            onClick={() => handlePlatformClick(null)}
            whileHover={{ y: -2, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="font-medium text-sm whitespace-nowrap">All Platforms</span>
            {selectedPlatform === null && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <Check size={16} className="ml-1.5 text-primary" />
              </motion.div>
            )}
          </motion.div>

          {platforms.map((platform, index) => (
            <motion.div
              key={platform.id}
              className={`flex items-center justify-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                selectedPlatform === platform.id
                  ? `border-platform-${platform.id} bg-platform-${platform.id}/5`
                  : 'border-border/50 hover:border-border'
              }`}
              onClick={() => handlePlatformClick(platform.id)}
              whileHover={{ y: -2, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <span 
                className={`font-medium text-sm whitespace-nowrap ${
                  selectedPlatform === platform.id ? `platform-${platform.id}` : ''
                }`}
              >
                {platform.name}
              </span>
              {selectedPlatform === platform.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <Check size={16} className={`ml-1.5 platform-${platform.id}`} />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlatformSelector;