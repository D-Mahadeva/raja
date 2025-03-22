
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop, Product, Platform } from '@/context/ShopContext';
import { Plus, Minus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, selectedPlatform, cart, updateCartItemQuantity } = useShop();
  const [isHovering, setIsHovering] = useState(false);
  
  // Find if product is in cart already
  const cartItem = cart.find(item => 
    item.product.id === product.id && 
    (selectedPlatform ? item.platform === selectedPlatform : true)
  );
  
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
  
  // Function to handle platform selection for product
  const handleAddToCart = (platform?: Platform) => {
    addToCart(product, platform);
  };
  
  // Function to increment/decrement quantity
  const updateQuantity = (increment: boolean) => {
    if (!cartItem) {
      addToCart(product);
      return;
    }
    
    const newQuantity = increment ? cartItem.quantity + 1 : cartItem.quantity - 1;
    updateCartItemQuantity(product.id, newQuantity, cartItem.platform || undefined);
  };

  return (
    <div 
      className="product-card animate-scale-in"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Product Image + Link */}
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
        />
        
        {/* Best price tag */}
        {!selectedPlatform && priceToDisplay && (
          <div className={`absolute top-2 left-2 platform-badge bg-platform-${priceToDisplay.platform}`}>
            Best Price
          </div>
        )}
        
        {/* Platform badge */}
        {selectedPlatform && priceToDisplay && (
          <div className={`absolute top-2 left-2 platform-badge bg-platform-${selectedPlatform}`}>
            {priceToDisplay.deliveryTime}
          </div>
        )}
      </Link>
      
      {/* Product Info */}
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <Link to={`/product/${product.id}`} className="block">
            <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>
        
        <div className="text-xs text-muted-foreground mb-2">{product.unit}</div>
        
        {/* Price and Add to Cart */}
        <div className="flex justify-between items-center">
          {priceToDisplay ? (
            <div className="flex items-center gap-1">
              <span className="font-semibold">₹{priceToDisplay.price}</span>
              
              {/* Delivery time */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-muted-foreground ml-1.5">
                      <Clock size={12} className="mr-0.5" />
                      <span className="text-xs">{priceToDisplay.deliveryTime}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Estimated delivery time</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : (
            <span className="text-destructive text-sm">Not Available</span>
          )}
          
          {/* Add to Cart / Quantity Controls */}
          {priceToDisplay && (
            cartItem ? (
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-none"
                  onClick={() => updateQuantity(false)}
                >
                  <Minus size={14} />
                  <span className="sr-only">Decrease quantity</span>
                </Button>
                <span className="w-8 text-center text-sm font-medium">{cartItem.quantity}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-none"
                  onClick={() => updateQuantity(true)}
                >
                  <Plus size={14} />
                  <span className="sr-only">Increase quantity</span>
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 transition-all duration-200"
                onClick={() => handleAddToCart(selectedPlatform || undefined)}
              >
                <Plus size={14} className="mr-1" />
                Add
              </Button>
            )
          )}
        </div>
      </div>
      
      {/* Price comparison on hover */}
      {isHovering && !selectedPlatform && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border/50 p-2 animate-fade-in">
          <div className="text-xs font-medium mb-1">Available on:</div>
          <div className="grid grid-cols-2 gap-1.5">
            {product.prices
              .filter(price => price.available)
              .slice(0, 4) // Limit to top 4
              .sort((a, b) => a.price - b.price) // Sort by price
              .map(price => (
                <div 
                  key={price.platform}
                  className={`platform-badge bg-platform-${price.platform}/10 platform-${price.platform} cursor-pointer hover:bg-platform-${price.platform}/20`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart(price.platform);
                  }}
                >
                  <span className="mr-1">₹{price.price}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
