import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { productApi } from '../services/api';
import { Product, ProductPage } from '../types';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchPopup({ isOpen, onClose }: SearchPopupProps) {
  const { theme } = useTheme();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [pageInfo, setPageInfo] = useState<ProductPage | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSearch = async (isLoadMore = false) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return;
    
    setLoading(true);
    try {
      const currentPage = isLoadMore && pageInfo ? pageInfo.number + 1 : 0;
      const searchParams = {
        page: currentPage,
        size: 12,
        direction: 'DESC',
        keyword: trimmedKeyword,
        sortBy: 'createdAt'
      };
      
      console.log('SearchPopup: Fetching results with params:', searchParams);
      const response = await productApi.getAll(searchParams);
      console.log('SearchPopup: API Response:', response.data);

      if (response.data.success) {
        const newContent = response.data.data.content || [];
        if (isLoadMore) {
          setResults(prev => [...prev, ...newContent]);
        } else {
          setResults(newContent);
        }
        setPageInfo(response.data.data);
      }
    } catch (error) {
      console.error('SearchPopup: Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (keyword.trim().length >= 2) {
        handleSearch();
      } else if (keyword.trim().length === 0) {
        setResults([]);
        setPageInfo(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [keyword]);

  const popupContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-background-light dark:bg-background-dark overflow-y-auto font-display text-primary transition-colors duration-300"
        >
          <div className="relative min-h-screen w-full flex flex-col">
            {/* Header / Search Input Area */}
            <header className="sticky top-0 z-[100] bg-background-light dark:bg-background-dark border-b border-primary/5">
              <div className="max-w-7xl mx-auto px-6 py-6 md:py-8">
                <div className="flex items-center justify-between gap-12">
                  {/* Brand Logo */}
                  <div className="flex items-center gap-3 shrink-0">
                    <img 
                      src={theme === 'light' ? '/src/assets/icon-black.png' : '/src/assets/icon-white.png'} 
                      alt="FoxWear Logo" 
                      className="h-11 w-auto object-contain transition-opacity duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <h1 className="text-primary text-xl font-bold tracking-[0.2em] uppercase">FoxWear</h1>
                  </div>
                  {/* Refined Search Input Container */}
                  <div className="flex-1 max-w-2xl relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
                      <span className="material-symbols-outlined text-primary/40 text-2xl font-extralight group-focus-within:text-primary transition-colors">search</span>
                    </div>
                    <input
                      ref={inputRef}
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                      className="w-full bg-transparent border-0 border-b border-primary/10 focus:border-primary focus:ring-0 focus:outline-none text-lg md:text-xl py-4 pl-14 pr-4 placeholder:text-primary/20 transition-all font-light tracking-tight"
                      placeholder="Search our collections..."
                      type="text"
                    />
                  </div>
                  {/* Refined Close Button */}
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center p-2 text-primary/40 hover:text-primary transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-2xl font-extralight">close</span>
                  </button>
                </div>
                {/* Active Filters / Search Stats */}
                <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-primary/5 pb-4">
                  <div className="text-sm font-light tracking-wide text-primary/50">
                    {keyword ? (
                      <>
                        <span className="italic">Showing results for</span>
                        <span className="text-primary font-medium ml-1.5">"{keyword}"</span>
                      </>
                    ) : (
                      <span className="italic">Start typing to search our collections</span>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Search Results Grid */}
            <main className="flex-1 max-w-7xl mx-auto px-6 py-6 w-full">
              <div className="flex justify-between items-end mb-8">
                <h2 className="text-3xl font-light tracking-tight">
                  Search Results 
                  {pageInfo && (
                    <span className="text-primary/30 text-base ml-3 font-normal tracking-normal">
                      ({pageInfo.totalElements} Items)
                    </span>
                  )}
                </h2>
              </div>

              {loading && results.length === 0 ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
                  {results.map((product) => (
                    <div key={product.id} className="flex flex-col group cursor-pointer">
                      <Link to={`/products/${product.slug}`} onClick={onClose}>
                        <div className="relative aspect-[3/4] overflow-hidden bg-primary/5 mb-4">
                          <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                            style={{
                              backgroundImage: `url("${product.colors[0]?.images.find(img => img.main)?.image || product.colors[0]?.images[0]?.image || 'https://picsum.photos/seed/product/800/1000'}")`
                            }}
                          ></div>
                          <button className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center bg-background-light/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-white">
                            <span className="material-symbols-outlined text-xl">favorite</span>
                          </button>
                          {product.hasDiscount && (
                            <div className="absolute bottom-4 left-4">
                              <span className="bg-background-light px-3 py-1 text-[10px] uppercase tracking-widest font-bold">Sale</span>
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-4">
                          <Link to={`/products/${product.slug}`} onClick={onClose}>
                            <h3 className="text-lg font-medium leading-tight mb-1 group-hover:underline decoration-primary/30 truncate">
                              {product.title}
                            </h3>
                          </Link>
                          <p className="text-primary/60 text-sm mb-3">{product.categoryName}</p>
                          <div className="flex gap-1.5 overflow-x-auto pb-1">
                            {product.colors.map((color, idx) => (
                              <div
                                key={idx}
                                className="w-3 h-3 rounded-full border border-primary/20 shrink-0"
                                style={{ backgroundColor: color.colorCode }}
                                title={color.colorName}
                              ></div>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {product.hasDiscount ? (
                            <>
                              <p className="text-lg font-semibold">₼{product.discountPrice}</p>
                              <p className="text-sm text-primary/40 line-through">₼{product.originalPrice}</p>
                            </>
                          ) : (
                            <p className="text-lg font-semibold">₼{product.originalPrice}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : keyword.trim().length >= 2 && !loading ? (
                <div className="text-center py-20">
                  <p className="text-primary/40 text-lg font-light italic">No items found matching your search.</p>
                </div>
              ) : null}

              {/* Pagination / Load More */}
              {pageInfo && !pageInfo.last && (
                <div className="mt-24 mb-12 flex flex-col items-center gap-6">
                  <p className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.3em]">
                    Showing {results.length} of {pageInfo.totalElements} items
                  </p>
                  <div className="w-48 h-[1px] bg-primary/10 relative">
                    <div
                      className="absolute left-0 top-0 h-full bg-primary transition-all duration-500"
                      style={{ width: `${(results.length / pageInfo.totalElements) * 100}%` }}
                    ></div>
                  </div>
                  <button
                    onClick={() => handleSearch(true)}
                    disabled={loading}
                    className="px-16 py-5 border border-primary text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-background-light transition-all duration-500 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More Results'}
                  </button>
                </div>
              )}
            </main>

            {/* Footer Accent */}
            <footer className="bg-primary/[0.02] border-t border-primary/5 py-16 mt-auto">
              <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
                <div className="text-center md:text-left">
                  <h4 className="text-xl font-light mb-3 italic tracking-tight text-primary">Looking for something else?</h4>
                  <p className="text-primary/50 max-w-sm text-sm leading-relaxed font-light">Our digital concierge is available to guide you through our latest collections and find your perfect fit.</p>
                </div>
                <div className="flex gap-10">
                  <a className="text-[10px] uppercase tracking-[0.2em] font-bold border-b border-primary/20 hover:border-primary pb-2 transition-all" href="#">Chat With Us</a>
                  <a className="text-[10px] uppercase tracking-[0.2em] font-bold border-b border-primary/20 hover:border-primary pb-2 transition-all" href="#">Contact Support</a>
                </div>
              </div>
            </footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(popupContent, document.body);
}
