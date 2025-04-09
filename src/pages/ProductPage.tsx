import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShop, Product } from '@/context/ShopContext';
import Header from '@/components/Header';
import ProductDetail from '@/components/ProductDetail';
import ProductCard from '@/components/ProductCard';
import AddToCartButton from '@/components/AddToCartButton';
import { ArrowLeft, AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

const ProductDetailSkeleton = () => (
  <div className="grid md:grid-cols-2 gap-8 animate-pulse">
    {/* Image Skeleton */}
    <div className="rounded-lg overflow-hidden border border-border/40 bg-white p-4 aspect-square"></div>
    
    {/* Info Skeleton */}
    <div>
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      
      <div className="h-16 bg-gray-200 rounded w-full mb-6"></div>
      
      <div className="space-y-4 mb-8">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border/60 p-3">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="flex justify-between items-end mt-2">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ProductPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const { products, loading, error } = useShop();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  
  useEffect(() => {
    // Find the current product
    setProductLoading(true);
    
    if (!loading) {
      const foundProduct = products.find(p => p.id === productId) || null;
      setProduct(foundProduct);
      
      // Find related products (same category, excluding current product)
      if (foundProduct) {
        const related = products
          .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
          .slice(0, 5);
        setRelatedProducts(related);
      }
      
      setProductLoading(false);
    }
  }, [productId, products, loading]);

  const handleRefresh = () => {
    window.location.reload();
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  // Show error state
  if (error) {
    return (
      <motion.div 
        className="min-h-screen bg-background"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
      >
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle size={20} />
              <h3 className="font-medium">Error loading product data</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-3 mt-3">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft size={14} className="mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
              >
                <RefreshCcw size={14} className="mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show loading state
  if (loading || productLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          {/* Breadcrumb Skeleton */}
          <div className="mb-6 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <span>/</span>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <span>/</span>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          
          {/* Product Detail Skeleton */}
          <ProductDetailSkeleton />
        </main>
      </div>
    );
  }

  // Product not found
  if (!product) {
    return (
      <motion.div 
        className="min-h-screen bg-background"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
      >
        <Header />
        <div className="container mx-auto px-4 py-16">
          <motion.div 
            className="text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold mb-2">Product not found</h2>
            <p className="text-muted-foreground mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Link 
              to="/"
              className="inline-flex items-center text-primary hover:underline"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Home
            </Link>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-background"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">
                  <Home size={14} className="mr-1" />
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/?category=${product.category}`}>
                  {product.category}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        {/* Product Detail */}
        <ProductDetail product={product} />
        
        {/* Related Products */}
        <AnimatePresence>
          {relatedProducts.length > 0 && (
            <motion.div 
              className="mt-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold mb-6">Related Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {relatedProducts.map((product, index) => (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

       {/* Floating Add to Cart Button - ADD THIS LINE RIGHT HERE */}
       {product && <AddToCartButton product={product} />}
       
    </motion.div>
  );
};

export default ProductPage;