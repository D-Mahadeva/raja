import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { Search, ShoppingCart, MapPin, LogIn, UserCircle, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from '@/components/ui/auth-modal';

const Header = () => {
  const { getCartItemCount, searchQuery, setSearchQuery } = useShop();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [location, setLocation] = useState('New Delhi');
  const [showFullSearch, setShowFullSearch] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
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
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
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
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="hover-scale">
                        <UserCircle size={18} className="mr-1.5" />
                        <span className="text-sm font-medium max-w-28 truncate">
                          {user?.email.split('@')[0]}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="cursor-default">
                        <div className="flex flex-col">
                          <span className="font-medium">{user?.email.split('@')[0]}</span>
                          <span className="text-xs text-muted-foreground">{user?.email}</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                        <LogOut size={16} className="mr-2" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hover-scale"
                    onClick={() => setShowAuthModal(true)}
                  >
                    <LogIn size={18} className="mr-1.5" />
                    <span className="text-sm font-medium">Login</span>
                  </Button>
                )}
                
                <Link to="/cart">
                  <motion.div 
                    initial={false}
                    animate={{ scale: cartItemCount > 0 ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Button variant="outline" size="sm" className="relative hover-scale">
                      <ShoppingCart size={18} className="mr-1.5" />
                      <span className="text-sm font-medium">Cart</span>
                      {cartItemCount > 0 && (
                        <motion.span 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground"
                        >
                          {cartItemCount}
                        </motion.span>
                      )}
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Authentication Modal */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal} 
      />
    </>
  );
};

export default Header;