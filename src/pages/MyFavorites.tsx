import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AccountSidebar from '../components/AccountSidebar';
import { productApi } from '../services/api';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { motion, AnimatePresence } from 'motion/react';

export default function MyFavorites() {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productApi.getMyLikedProducts();
      if (response.data.success) {
        setFavorites(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleLike = async (productId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await productApi.like(productId);
      // Remove from favorites list immediately for better UX
      setFavorites(prev => prev.filter(p => p.id !== productId));
      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Error unliking product:', error);
    }
  };

  return (
    <div className="bg-[#f7f7f6] dark:bg-stone-950 text-on-background selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <AccountSidebar />

          <section className="lg:col-span-9">
            <header className="mb-16">
              <h1 className="font-headline font-black text-5xl md:text-6xl uppercase tracking-tighter text-primary mb-4">My Favorites</h1>
              <p className="font-body font-light text-lg text-secondary leading-relaxed">Your curated collection of must-have pieces.</p>
            </header>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse space-y-4">
                    <div className="aspect-[3/4] bg-primary/5 rounded-2xl"></div>
                    <div className="h-4 bg-primary/5 rounded w-3/4"></div>
                    <div className="h-4 bg-primary/5 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-32 text-center bg-white dark:bg-stone-900/50 rounded-3xl border border-dashed border-primary/20"
              >
                <span className="material-symbols-outlined text-6xl text-primary/20 mb-6 font-light">favorite</span>
                <h3 className="font-headline text-2xl font-bold uppercase tracking-tight mb-4">Your wishlist is empty</h3>
                <p className="font-body font-light text-secondary mb-10 max-w-md mx-auto">Explore our collection and save your favorite pieces for later.</p>
                <a 
                  href="/products" 
                  className="inline-block bg-primary text-white dark:text-background-dark px-10 py-4 text-xs font-bold uppercase tracking-[0.3em] hover:bg-primary/90 transition-all shadow-xl"
                >
                  Start Shopping
                </a>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {favorites.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ProductCard
                        product={product}
                        isLiked={true}
                        onLike={handleLike}
                        onQuickView={setSelectedProduct}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />

      <QuickViewModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onLike={handleLike}
        isLiked={true}
      />
    </div>
  );
}
