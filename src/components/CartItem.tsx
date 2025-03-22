
import React from 'react';
import { Link } from 'react-router-dom';
import { useShop, CartItem as CartItemType, Platform } from '@/context/ShopContext';
import { Trash2, Plus, Minus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CartItemProps {
  item: CartItemType;
  platformFilter?: Platform;
}

const CartItem: React.FC<CartItemProps> = ({ item, platformFilter }) => {
  const { updateCartItemQuantity, removeFromCart } = useShop();
  const { product, quantity, platform } = item;
  
  // Find price for specific platform or the platform of this cart item
  const getPriceInfo = () => {
    const targetPlatform = platformFilter || platform;
    if (!targetPlatform) return null;
    
    return product.prices.find(p => p.platform === targetPlatform);
  };
  
  const priceInfo = getPriceInfo();
  
  // If we're filtering by platform and this item is not available, return null
  if (platformFilter && (!priceInfo || !priceInfo.available)) {
    return (
      <div className="py-4 flex items-center">
        <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
          <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover opacity-50" />
        </div>
        
        <div className="ml-4 flex-grow">
          <h3 className="font-medium text-gray-400">{product.name}</h3>
          <div className="flex items-center text-destructive mt-1">
            <AlertTriangle size={14} className="mr-1" />
            <span className="text-sm">Not available on {platformFilter}</span>
          </div>
        </div>
      </div>
    );
  }
  
  const handleQuantityChange = (newQuantity: number) => {
    updateCartItemQuantity(product.id, newQuantity, platform || undefined);
  };
  
  const handleRemove = () => {
    removeFromCart(product.id, platform || undefined);
  };

  return (
    <div className="flex items-center py-4">
      {/* Product Image */}
      <Link to={`/product/${product.id}`} className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
        <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
      </Link>
      
      {/* Product Details */}
      <div className="ml-4 flex-grow">
        <div className="flex justify-between">
          <Link to={`/product/${product.id}`}>
            <h3 className="font-medium hover:text-primary transition-colors">{product.name}</h3>
          </Link>
        </div>
        
        <div className="text-sm text-gray-500">{product.unit}</div>
        
        {/* Price and actions row */}
        <div className="flex justify-between items-center mt-2">
          {/* Price */}
          <div className="font-semibold">
            {priceInfo ? (
              <>₹{priceInfo.price * quantity}</>
            ) : (
              <span className="text-destructive">Not Available</span>
            )}
          </div>
          
          {/* Quantity controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-none"
                onClick={() => handleQuantityChange(quantity - 1)}
              >
                <Minus size={14} />
                <span className="sr-only">Decrease quantity</span>
              </Button>
              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-none"
                onClick={() => handleQuantityChange(quantity + 1)}
              >
                <Plus size={14} />
                <span className="sr-only">Increase quantity</span>
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
            >
              <Trash2 size={16} />
              <span className="sr-only">Remove item</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
