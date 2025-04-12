// src/components/ProductList.tsx

import React, { useState, useEffect } from 'react';
import { useShop, Product } from '@/context/ShopContext';
import ProductCard from '@/components/ProductCard';
import { PackageSearch, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS_PER_PAGE = 10; // Limit initial load to improve performance

const ProductList = () => {
  const { filteredProducts, loading, error } = useShop();
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  
  // Reset pagination when filtered products change
  useEffect(() => {
    setPage(1);
    setVisibleProducts(filteredProducts.slice(0, ITEMS_PER_PAGE));
  }, [filteredProducts]);
  
  // Handle scroll events for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      // Check if we're near the bottom of the page
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        // Load more products if available
        if (visibleProducts.length < filteredProducts.length) {
          const nextPage = page + 1;
          const nextProducts = filteredProducts.slice(0, nextPage * ITEMS_PER_PAGE);
          setVisibleProducts(nextProducts);
          setPage(nextPage);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredProducts, visibleProducts, page]);
  
  // Loading skeleton
  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center mb-6 text-primary">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading products...</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg overflow-hidden shadow-sm border border-border/40">
              <div className="aspect-square bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Empty state
  if (!loading && !error && filteredProducts.length === 0) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center py-16"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <PackageSearch size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No products found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Try changing your filters or search term, or check another category.
        </p>
      </motion.div>
    );
  }
  
  // Render products with progressive loading
  return (
    <AnimatePresence>
      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {visibleProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: Math.min(index * 0.05, 0.5), // Limit maximum delay
              duration: 0.3 
            }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>
      
      {/* Load more indicator */}
      {visibleProducts.length < filteredProducts.length && (
        <div className="flex justify-center my-8">
          <div className="flex items-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Loading more products...</span>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProductList;