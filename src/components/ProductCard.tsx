
import React from 'react';
import { useShop, Product, Platform } from '@/context/ShopContext';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, selectedPlatform } = useShop();
  
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
  const handleAddToCart = () => {
    if (priceToDisplay) {
      addToCart(product, priceToDisplay.platform);
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm">
      {/* Product Image */}
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        <img 
          src={product.image || "/placeholder.svg"} 
          alt={product.name} 
          className="object-cover w-full h-full"
        />
      </div>
      
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
          <Button 
            className="w-full bg-black hover:bg-black/80 text-white"
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
