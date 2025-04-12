// src/components/ProductCard.tsx

import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { useShop, Product, Platform } from '@/context/ShopContext';
import { Clock, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import OptimizedImage from './OptimizedImage'; // Import the new OptimizedImage component

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = memo(({ product }) => {
  const { addToCart, selectedPlatform } = useShop();
  const { toast } = useToast();
  
  // Function to find best price across all platforms
  const getBestPrice = () => {
    const availablePrices = product.prices.filter(p => p.available);
    if (availablePrices.length === 0) return null;
    
    return availablePrices.reduce((best, current) => 
      current.price < best.price ? current : best
    );
  };
  
  // Get price to display based on selected platform or best price
  const getPriceToDisplay = () => {
    if (selectedPlatform) {
      const platformPrice = product.prices.find(p => p.platform === selectedPlatform);
      return platformPrice && platformPrice.available ? platformPrice : null;
    }
    
    return getBestPrice();
  };
  
  const priceToDisplay = getPriceToDisplay();
  
  // Function to handle adding to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product page
    e.stopPropagation();
    
    if (priceToDisplay) {
      addToCart(product, priceToDisplay.platform);
      
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    }
  };

  return (
    <Link to={`/product/${product.id}`}>
      <motion.div 
        className="bg-white rounded-lg overflow-hidden shadow-sm border border-border/40 h-full transition-all hover:shadow-md hover:border-border/60"
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Product Image - Using OptimizedImage */}
        <motion.div 
          className="aspect-square relative overflow-hidden bg-gray-100"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <OptimizedImage
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="object-cover w-full h-full"
          />
        </motion.div>
        
        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-medium text-lg line-clamp-1">{product.name}</h3>
          <p className="text-sm text-gray-500 mb-2">{product.unit}</p>
          
          {/* Price and Platform */}
          {priceToDisplay ? (
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="font-bold text-lg">₹{priceToDisplay.price}</div>
                <div className={`text-sm platform-${priceToDisplay.platform}`}>
                  {priceToDisplay.platform.charAt(0).toUpperCase() + priceToDisplay.platform.slice(1)}
                </div>
              </div>
              
              <div className="flex items-center text-gray-500">
                <Clock size={14} className="mr-1" />
                <span className="text-sm">{priceToDisplay.deliveryTime}</span>
              </div>
            </div>
          ) : (
            <div className="text-destructive text-sm mb-3">Not Available</div>
          )}
          
          {/* Add to Cart Button */}
          {priceToDisplay && (
            <motion.div
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                className="w-full bg-black hover:bg-black/80 text-white group"
                onClick={handleAddToCart}
              >
                <ShoppingBag size={16} className="mr-2 group-hover:rotate-12 transition-transform" />
                Add to Cart
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </Link>
  );
});

export default ProductCard;