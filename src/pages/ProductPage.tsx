
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShop, Product } from '@/context/ShopContext';
import Header from '@/components/Header';
import ProductDetail from '@/components/ProductDetail';
import ProductCard from '@/components/ProductCard';
import { ArrowLeft } from 'lucide-react';

const ProductPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const { products } = useShop();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    // Find the current product
    const foundProduct = products.find(p => p.id === productId) || null;
    setProduct(foundProduct);
    
    // Find related products (same category, excluding current product)
    if (foundProduct) {
      const related = products
        .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
        .slice(0, 5);
      setRelatedProducts(related);
    }
  }, [productId, products]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/" className="hover:text-foreground">{product.category}</Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </div>
        </div>
        
        {/* Product Detail */}
        <ProductDetail product={product} />
        
        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-semibold mb-6">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 staggered-children">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductPage;
