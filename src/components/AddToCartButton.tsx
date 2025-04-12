import React, { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Platform, useShop } from '@/context/ShopContext';
import { useToast } from '@/hooks/use-toast';

interface AddToCartButtonProps {
  product: Product;
  platform?: Platform;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ product, platform }) => {
  const { addToCart } = useShop();
  const { toast } = useToast();
  const [added, setAdded] = useState(false);
  
  // Get price to display based on platform or best price
  const getPriceToDisplay = () => {
    if (platform) {
      const platformPrice = product.prices.find(p => p.platform === platform);
      return platformPrice && platformPrice.available ? platformPrice : null;
    }
    
    // If no platform specified, get the best price
    const availablePrices = product.prices.filter(p => p.available);
    if (availablePrices.length === 0) return null;
    
    return availablePrices.reduce((best, current) => 
      current.price < best.price ? current : best
    );
  };
  
  const priceInfo = getPriceToDisplay();
  
  const handleAddToCart = () => {
    if (!priceInfo) return;
    
    // Create a stable copy of the product to avoid reference issues
    const stableProduct = JSON.parse(JSON.stringify(product));
    
    // Add to cart with the stable product copy and specific platform
    addToCart(stableProduct, priceInfo.platform);
    
    // Show toast notification
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
    
    // Show success animation
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };
  
  if (!priceInfo) return null;
  
  return (
    <motion.div
      className="fixed bottom-8 right-8 z-40"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 500, damping: 30 }}
    >
      <AnimatePresence mode="wait">
        {added ? (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-green-500 text-white rounded-full shadow-lg py-3 px-6 flex items-center"
          >
            <Check size={20} className="mr-2" />
            <span>Added to cart!</span>
          </motion.div>
        ) : (
          <motion.div
            key="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              className="rounded-full shadow-lg py-6 bg-black hover:bg-black/80 text-white"
              onClick={handleAddToCart}
            >
              <ShoppingCart size={18} className="mr-2" />
              Add to Cart | ₹{priceInfo.price}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AddToCartButton;