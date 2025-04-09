// src/pages/Index.tsx

import React from 'react';
import { useShop } from '@/context/ShopContext';
import Header from '@/components/Header';
import PlatformSelector from '@/components/PlatformSelector';
import CategoryNav from '@/components/CategoryNav';
import ProductCard from '@/components/ProductCard';
import { AlertCircle, RefreshCcw, PackageSearch, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
    {[...Array(10)].map((_, i) => (
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
);

const Index = () => {
  const { filteredProducts, selectedCategory, loading, error } = useShop();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleApiTest = async () => {
    // Try to access the API directly to help with debugging
    try {
      const urls = [
        'http://localhost:5000/api/health',
        'http://localhost:5000/api/debug',
        `http://${window.location.hostname}:5000/api/health`
      ];
      
      for (const url of urls) {
        try {
          const response = await fetch(url);
          const data = await response.json();
          console.log(`API test success for ${url}:`, data);
          alert(`Successfully connected to ${url}`);
          return;
        } catch (err) {
          console.error(`API test failed for ${url}:`, err);
        }
      }
      
      alert('Failed to connect to any API endpoint. Check console for details.');
    } catch (error) {
      console.error('API test error:', error);
      alert(`API test error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PlatformSelector />
      <CategoryNav />
      
      <main className="container mx-auto px-4 py-6">
        {/* Category Title */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold">{selectedCategory}</h1>
          <p className="text-muted-foreground mt-1">
            Compare prices across multiple platforms
          </p>
        </motion.div>
        
        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle size={20} />
                <h3 className="font-medium">Error loading products</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                >
                  <RefreshCcw size={14} className="mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleApiTest}
                >
                  <AlertCircle size={14} className="mr-2" />
                  Test API Connection
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-center mb-6 text-primary">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading products...</span>
              </div>
              <LoadingSkeleton />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Products Grid */}
        <AnimatePresence>
          {!loading && !error && filteredProducts.length > 0 && (
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Empty State */}
        <AnimatePresence>
          {!loading && !error && filteredProducts.length === 0 && (
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
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;