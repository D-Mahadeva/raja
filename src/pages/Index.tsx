
import React from 'react';
import { useShop } from '@/context/ShopContext';
import Header from '@/components/Header';
import PlatformSelector from '@/components/PlatformSelector';
import CategoryNav from '@/components/CategoryNav';
import ProductCard from '@/components/ProductCard';

const Index = () => {
  const { filteredProducts, selectedCategory } = useShop();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PlatformSelector />
      <CategoryNav />
      
      <main className="container mx-auto px-4 py-6">
        {/* Category Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{selectedCategory}</h1>
          <p className="text-muted-foreground mt-1">
            Compare prices across multiple platforms
          </p>
        </div>
        
        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">No products found</h2>
              <p className="text-muted-foreground">
                Try changing your filters or search term
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
