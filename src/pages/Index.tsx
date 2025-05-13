import React, { useEffect, useState } from 'react';
import { useShop } from '@/context/ShopContext';
import Header from '@/components/Header';
import PlatformSelector from '@/components/PlatformSelector';
import CategoryNav from '@/components/CategoryNav';
import ProductCard from '@/components/ProductCard';
import NetworkDiagnostics from '@/components/NetworkDiagnostics';
import { 
  AlertCircle, 
  RefreshCcw, 
  PackageSearch, 
  Loader2, 
  Database,
  ServerCrash
} from 'lucide-react';
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
  const { 
    filteredProducts, 
    products,
    selectedCategory, 
    loading, 
    error, 
    reloadProducts 
  } = useShop();
  
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [directApiTest, setDirectApiTest] = useState<{ loading: boolean, data: any | null, error: string | null }>({
    loading: false,
    data: null,
    error: null
  });

  // Debug logging to track product data
  useEffect(() => {
    console.log(`Product data - total: ${products.length}, filtered: ${filteredProducts.length}`);
    
    // Show diagnostics automatically if there's an error
    if (error) {
      setShowDiagnostics(true);
    }
  }, [products, filteredProducts, error]);

  const handleRefresh = () => {
    reloadProducts();
  };

  const testDirectApi = async () => {
    setDirectApiTest({
      loading: true,
      data: null,
      error: null
    });
    
    try {
      // This approach bypasses most CORS issues by making a direct request
      // from the browser to the API
      const url = 'http://localhost:5000/api/products';
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        mode: 'cors', // This is important - try with cors mode explicitly
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Direct API test results:', data);
      
      setDirectApiTest({
        loading: false,
        data: {
          count: Array.isArray(data) ? data.length : 'Not an array',
          sample: Array.isArray(data) && data.length > 0 ? data[0] : null
        },
        error: null
      });
    } catch (err) {
      console.error('Direct API test error:', err);
      setDirectApiTest({
        loading: false,
        data: null,
        error: err.message
      });
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
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                >
                  <ServerCrash size={14} className="mr-2" />
                  {showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={testDirectApi}
                  disabled={directApiTest.loading}
                >
                  {directApiTest.loading ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Database size={14} className="mr-2" />
                      Direct API Test
                    </>
                  )}
                </Button>
              </div>
              
              {/* Direct API Test Results */}
              {(directApiTest.data || directApiTest.error) && (
                <div className="mt-4 p-3 bg-background/50 rounded-md border border-border/60 text-sm">
                  <h4 className="font-medium mb-1">Direct API Test Results:</h4>
                  {directApiTest.error ? (
                    <div className="text-destructive">{directApiTest.error}</div>
                  ) : directApiTest.data ? (
                    <div>
                      <div className="text-green-600">✓ API connection successful!</div>
                      <div>Products found: {directApiTest.data.count}</div>
                      {directApiTest.data.sample && (
                        <div className="mt-1">
                          Sample product: {directApiTest.data.sample.name || 'Unnamed product'}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Network Diagnostics Panel */}
        <AnimatePresence>
          {showDiagnostics && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <NetworkDiagnostics />
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
                  transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.3 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>        

{/* Empty State */}
<AnimatePresence>
  {!loading && !error && filteredProducts.length === 0 && products.length > 0 && (
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

{/* No Products at All State */}
<AnimatePresence>
  {!loading && !error && products.length === 0 && (
    <motion.div 
      className="flex flex-col items-center justify-center py-16"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Database size={48} className="text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">Unable to fetch products</h2>
      <p className="text-muted-foreground text-center max-w-md mb-4">
        We're having trouble connecting to our product database. This might be due to network issues or server problems.
      </p>
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={handleRefresh}
        >
          <RefreshCcw size={16} className="mr-2" />
          Refresh Products
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => setShowDiagnostics(!showDiagnostics)}
        >
          <ServerCrash size={16} className="mr-2" />
          {showDiagnostics ? 'Hide Diagnostics' : 'Run Diagnostics'}
        </Button>
      </div>
    </motion.div>
  )}
</AnimatePresence>
</main>
</div>
);
};

export default Index;       