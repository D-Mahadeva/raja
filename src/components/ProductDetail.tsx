// src/components/ProductDetail.tsx

import React from 'react';
import { useShop, Product, Platform } from '@/context/ShopContext';
import { Clock, ShoppingBag, Truck, Check, Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface ProductDetailProps {
  product: Product;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const { addToCart, cart, updateCartItemQuantity, platforms } = useShop();
  const { toast } = useToast();
  
  // Sort prices from lowest to highest
  const sortedPrices = [...product.prices]
    .filter(price => price.available)
    .sort((a, b) => a.price - b.price);
  
  const bestPrice = sortedPrices.length > 0 ? sortedPrices[0] : null;
  
  const handleAddToCart = (platform: Platform) => {
    // Check if product is already in cart for this platform
    const existingItem = cart.find(item => 
      item.product.id === product.id && item.platform === platform
    );
    
    if (existingItem) {
      updateCartItemQuantity(product.id, existingItem.quantity + 1, platform);
      toast({
        title: "Updated cart",
        description: `Increased ${product.name} quantity to ${existingItem.quantity + 1}`,
      });
    } else {
      addToCart(product, platform);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    }
  };

  // Share functionality
  const handleShare = () => {
    // Get product and platform info
    const productName = product.name;
    const bestPlatform = product.prices
      .filter(p => p.available)
      .sort((a, b) => a.price - b.price)[0]?.platform || '';
    
    const platformName = platforms.find(p => p.id === bestPlatform)?.name || '';
    
    // Create share text
    const shareText = `Check out ${productName} on ${platformName}!`;
    const shareUrl = window.location.href;
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: `${productName} | PriceWise`,
        text: shareText,
        url: shareUrl,
      })
      .then(() => {
        console.log('Shared successfully');
        toast({
          title: "Shared successfully",
          description: "Product information has been shared",
        });
      })
      .catch((error) => {
        console.error('Error sharing:', error);
        // Fallback for when sharing fails
        fallbackShare();
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      fallbackShare();
    }
  };

  // Fallback share function
  const fallbackShare = () => {
    // Copy the URL to clipboard
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast({
          title: "Link copied to clipboard",
          description: "Share this link with others",
        });
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        toast({
          title: "Couldn't copy link",
          description: "Please try again or copy manually",
          variant: "destructive",
        });
      });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="grid md:grid-cols-2 gap-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Product Image */}
      <motion.div 
        className="rounded-lg overflow-hidden border border-border/40 bg-white p-4 aspect-square flex items-center justify-center animate-fade-in"
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <motion.img 
          src={product.image} 
          alt={product.name} 
          className="max-w-full max-h-full object-contain"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
      
      {/* Product Info */}
      <motion.div variants={containerVariants}>
        <motion.div className="mb-4" variants={itemVariants}>
          <span className="text-sm text-muted-foreground">{product.category}</span>
          <h1 className="text-2xl font-bold mt-1">{product.name}</h1>
          <div className="text-sm mt-1">{product.unit}</div>
          
          <div className="flex gap-2 mt-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Share product"
              onClick={handleShare}
            >
              <Share2 size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Add to favorites"
            >
              <Heart size={18} />
            </motion.button>
          </div>
        </motion.div>
        
        <motion.div 
          className="text-sm text-muted-foreground mb-6"
          variants={itemVariants}
        >
          {product.description}
        </motion.div>
        
        {/* Platform Prices */}
        <motion.div 
          className="space-y-4 mb-8" 
          variants={itemVariants}
        >
          <h3 className="font-medium">Available on:</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {product.prices.map((price) => (
              <motion.div 
                key={price.platform}
                className={`rounded-lg border ${
                  price.available 
                    ? bestPrice && price.platform === bestPrice.platform
                      ? `border-platform-${price.platform}`
                      : 'border-border/60'
                    : 'border-border/30 bg-muted/30'
                } p-3`}
                whileHover={price.available ? { y: -3, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } : {}}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex justify-between">
                  <span className={`font-medium ${price.available ? `platform-${price.platform}` : 'text-muted-foreground'}`}>
                    {price.platform.charAt(0).toUpperCase() + price.platform.slice(1)}
                  </span>
                  
                  {bestPrice && price.platform === bestPrice.platform && (
                    <Badge className="bg-platform-blinkit/10 platform-blinkit text-xs">
                      Best Price
                    </Badge>
                  )}
                </div>
                
                <div className="flex justify-between items-end mt-2">
                  <div>
                    {price.available ? (
                      <>
                        <div className="text-lg font-semibold">₹{price.price}</div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Clock size={12} className="mr-1" />
                          <span>Delivery in {price.deliveryTime}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-destructive">Not Available</div>
                    )}
                  </div>
                  
                  {price.available && (
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={`border-platform-${price.platform} platform-${price.platform} hover:bg-platform-${price.platform}/10 group`}
                        onClick={() => handleAddToCart(price.platform)}
                      >
                        <ShoppingBag size={14} className="mr-1 group-hover:rotate-12 transition-transform" />
                        Add to Cart
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Additional Information */}
        <motion.div 
          className="rounded-lg border border-border/60 divide-y divide-border/60"
          variants={itemVariants}
        >
          <motion.div 
            className="p-3 flex items-center gap-2.5"
            whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
          >
            <Truck size={16} className="text-muted-foreground" />
            <span>Fast delivery, directly from stores to your doorstep</span>
          </motion.div>
          <motion.div 
            className="p-3 flex items-center gap-2.5"
            whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
          >
            <Check size={16} className="text-muted-foreground" />
            <span>Compare prices across multiple platforms in real-time</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ProductDetail;