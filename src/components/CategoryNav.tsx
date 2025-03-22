
import React, { useRef, useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CategoryNav = () => {
  const { categories, selectedCategory, setSelectedCategory } = useShop();
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const container = containerRef.current;
      const scrollAmount = container.clientWidth / 2;
      
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const checkScrollButtons = () => {
    if (containerRef.current) {
      const container = containerRef.current;
      
      // Check if can scroll left
      setShowLeftArrow(container.scrollLeft > 0);
      
      // Check if can scroll right
      setShowRightArrow(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      // Initial check
      checkScrollButtons();
      
      // Recheck on window resize
      window.addEventListener('resize', checkScrollButtons);
      
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, []);

  return (
    <div className="relative w-full py-3 bg-background border-b border-border/30">
      <div className="container mx-auto px-4">
        {/* Left scroll button */}
        {showLeftArrow && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 rounded-full shadow-md p-1 backdrop-blur-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        
        {/* Categories */}
        <div 
          ref={containerRef}
          className="flex items-center gap-2 overflow-x-auto py-1 px-2 scrollbar-hidden"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`category-button whitespace-nowrap animate-fade-in ${
                selectedCategory === category ? 'active' : ''
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Right scroll button */}
        {showRightArrow && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 rounded-full shadow-md p-1 backdrop-blur-sm"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryNav;
