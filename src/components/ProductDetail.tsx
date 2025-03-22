
import React from 'react';
import { useShop, Product, Platform } from '@/context/ShopContext';
import { Clock, ShoppingBag, Truck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductDetailProps {
  product: Product;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const { addToCart, cart, updateCartItemQuantity } = useShop();
  
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
    } else {
      addToCart(product, platform);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Product Image */}
      <div className="rounded-lg overflow-hidden border border-border/40 bg-white p-4 aspect-square flex items-center justify-center animate-fade-in">
        <img 
          src={product.image} 
          alt={product.name} 
          className="max-w-full max-h-full object-contain"
        />
      </div>
      
      {/* Product Info */}
      <div className="animate-fade-in">
        <div className="mb-4">
          <span className="text-sm text-muted-foreground">{product.category}</span>
          <h1 className="text-2xl font-bold mt-1">{product.name}</h1>
          <div className="text-sm mt-1">{product.unit}</div>
        </div>
        
        <div className="text-sm text-muted-foreground mb-6">
          {product.description}
        </div>
        
        {/* Platform Prices */}
        <div className="space-y-4 mb-8">
          <h3 className="font-medium">Available on:</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {product.prices.map((price) => (
              <div 
                key={price.platform}
                className={`rounded-lg border ${
                  price.available 
                    ? bestPrice && price.platform === bestPrice.platform
                      ? `border-platform-${price.platform}`
                      : 'border-border/60'
                    : 'border-border/30 bg-muted/30'
                } p-3`}
              >
                <div className="flex justify-between">
                  <span className={`font-medium ${price.available ? `platform-${price.platform}` : 'text-muted-foreground'}`}>
                    {price.platform.charAt(0).toUpperCase() + price.platform.slice(1)}
                  </span>
                  
                  {bestPrice && price.platform === bestPrice.platform && (
                    <span className="text-xs bg-platform-blinkit/10 platform-blinkit px-2 py-0.5 rounded-full">
                      Best Price
                    </span>
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={`border-platform-${price.platform} platform-${price.platform} hover:bg-platform-${price.platform}/10`}
                      onClick={() => handleAddToCart(price.platform)}
                    >
                      <ShoppingBag size={14} className="mr-1" />
                      Add to Cart
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Additional Information */}
        <div className="rounded-lg border border-border/60 divide-y divide-border/60">
          <div className="p-3 flex items-center gap-2.5">
            <Truck size={16} className="text-muted-foreground" />
            <span>Fast delivery, directly from stores to your doorstep</span>
          </div>
          <div className="p-3 flex items-center gap-2.5">
            <Check size={16} className="text-muted-foreground" />
            <span>Compare prices across multiple platforms in real-time</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
