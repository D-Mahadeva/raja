
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '@/context/ShopContext';
import { Search, ShoppingCart, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { getCartItemCount, searchQuery, setSearchQuery } = useShop();
  const [location, setLocation] = useState('New Delhi');
  const [showFullSearch, setShowFullSearch] = useState(false);
  
  const cartItemCount = getCartItemCount();
  
  const locations = [
    'New Delhi',
    'Mumbai',
    'Bangalore',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Pune',
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchFocus = () => {
    setShowFullSearch(true);
  };

  const handleSearchBlur = () => {
    if (!searchQuery) {
      setShowFullSearch(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-effect border-b border-border/30 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold tracking-tight animate-fade-in">PriceWise</span>
            </Link>

            {/* Location Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1.5 text-sm font-medium hover-scale">
                  <MapPin size={16} className="text-primary/70" />
                  <span>{location}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 animate-scale-in">
                {locations.map(loc => (
                  <DropdownMenuItem 
                    key={loc} 
                    onClick={() => setLocation(loc)}
                    className="cursor-pointer"
                  >
                    {loc}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search Bar */}
            <div className={`relative flex-grow transition-all duration-300 ${showFullSearch ? 'max-w-2xl' : 'max-w-sm'}`}>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="w-full rounded-full border border-input bg-white px-10 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <span className="sr-only">Clear search</span>
                    <span className="text-xs">×</span>
                  </button>
                )}
              </div>
            </div>

            {/* User and Cart */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hover-scale">
                <User size={18} className="mr-1.5" />
                <span className="text-sm font-medium">Login</span>
              </Button>
              
              <Link to="/cart">
                <Button variant="outline" size="sm" className="relative hover-scale">
                  <ShoppingCart size={18} className="mr-1.5" />
                  <span className="text-sm font-medium">Cart</span>
                  {cartItemCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
