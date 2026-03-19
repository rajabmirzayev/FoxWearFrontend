import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../services/api';
import { Product, Category, ProductSize, Color, ProductPage, ProductFilter } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState<ProductPage | null>(null);

  const [filters, setFilters] = useState<ProductFilter>({
    page: 0,
    size: 12,
    sortBy: 'createdAt',
    direction: 'DESC',
    gender: [],
    categoryId: [],
    color: [],
    productSize: [],
    minPrice: 0,
    maxPrice: 500,
  });

  const [activeFilters, setActiveFilters] = useState({
    gender: [] as string[],
    category: [] as number[],
    color: [] as string[],
    size: [] as string[],
    priceRange: [0, 500] as [number, number]
  });

  const [sortBy, setSortBy] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [likedProducts, setLikedProducts] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (selectedProduct) {
      setSelectedColorIndex(0);
      setSelectedImageIndex(0);
    }
  }, [selectedProduct]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedColorIndex]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, sizeRes, colorRes] = await Promise.all([
          productApi.getCategories(),
          productApi.getSizes(),
          productApi.getColors()
        ]);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (sizeRes.data.success) setSizes(sizeRes.data.data);
        if (colorRes.data.success) setColors(colorRes.data.data);
      } catch (err) {
        console.error('Error fetching initial data', err);
      }
    };
    fetchInitialData();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const apiFilters: any = {
        page: filters.page,
        size: filters.size,
        sortBy: sortBy === 'price-low' || sortBy === 'price-high' ? 'discountPrice' : 'createdAt',
        direction: sortBy === 'price-low' ? 'ASC' : 'DESC',
      };

      if (activeFilters.gender.length > 0) apiFilters.gender = activeFilters.gender;
      if (activeFilters.category.length > 0) apiFilters.categoryId = activeFilters.category;
      if (activeFilters.color.length > 0) apiFilters.color = activeFilters.color;
      if (activeFilters.size.length > 0) apiFilters.productSize = activeFilters.size;
      
      if (activeFilters.priceRange[0] > 0) apiFilters.minPrice = activeFilters.priceRange[0];
      if (activeFilters.priceRange[1] < 500) apiFilters.maxPrice = activeFilters.priceRange[1];

      const response = await productApi.getAll(apiFilters);
      if (response.data.success) {
        const fetchedProducts = response.data.data.content;
        setProducts(fetchedProducts);
        setPageInfo(response.data.data);
        
        // Initialize likedProducts set from fetched products
        const initialLiked = new Set<number>();
        fetchedProducts.forEach((p: Product) => {
          if (p.liked) initialLiked.add(p.id);
        });
        setLikedProducts(initialLiked);
      }
    } catch (err) {
      console.error('Error fetching products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeFilters, sortBy, filters.page]);

  const handleLike = async (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await productApi.like(productId);
      setLikedProducts(prev => {
        const next = new Set(prev);
        if (next.has(productId)) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return next;
      });
    } catch (err) {
      console.error('Error liking product', err);
    }
  };

  const toggleFilter = (type: keyof typeof activeFilters, value: any) => {
    setActiveFilters(prev => {
      const current = prev[type] as any[];
      const exists = current.includes(value);
      if (exists) {
        return { ...prev, [type]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [type]: [...current, value] };
      }
    });
    setFilters(prev => ({ ...prev, page: 0 }));
  };

  const handlePriceChange = (index: number, value: number) => {
    setActiveFilters(prev => {
      const newRange = [...prev.priceRange] as [number, number];
      newRange[index] = value;
      
      // Ensure values stay within 0-500
      if (newRange[index] < 0) newRange[index] = 0;
      if (newRange[index] > 500) newRange[index] = 500;

      // Ensure min <= max logic
      if (index === 0 && newRange[0] > newRange[1]) {
        newRange[1] = newRange[0];
      } else if (index === 1 && newRange[1] < newRange[0]) {
        newRange[0] = newRange[1];
      }
      
      return { ...prev, priceRange: newRange };
    });
    setFilters(prev => ({ ...prev, page: 0 }));
  };

  const clearFilters = () => {
    setActiveFilters({
      gender: [],
      category: [],
      color: [],
      size: [],
      priceRange: [0, 500]
    });
    setFilters(prev => ({ ...prev, page: 0 }));
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased transition-colors duration-300">
      <Header />

      <main className="max-w-[1440px] mx-auto px-6 lg:px-20 pt-32 pb-10">
        {/* Breadcrumbs & Title */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-primary dark:text-slate-100 font-semibold">All Products</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-light text-primary dark:text-slate-100">Premium Collection</h2>
              <p className="text-slate-500 mt-2">
                Discover our curated selection of {pageInfo?.totalElements || 0} high-end minimalist essentials.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-b border-primary focus:border-primary border-t-0 border-x-0 py-1 pr-8 text-sm font-medium focus:ring-0 focus:outline-none cursor-pointer appearance-none"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
            {/* Mobile Search */}
            <div className="lg:hidden block">
              <div className="flex items-center border border-primary/10 rounded-lg px-4 py-3">
                <span className="material-symbols-outlined text-primary/40 mr-2">search</span>
                <input
                  className="bg-transparent border-none focus:ring-0 text-sm w-full"
                  placeholder="Search keywords..."
                  type="text"
                />
              </div>
            </div>

            {/* Mobile Filter Toggle */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 text-sm font-medium text-primary border border-primary/20 px-4 py-2 rounded hover:bg-primary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-base">filter_list</span>
                Filters
              </button>
            </div>

            <div className={`space-y-8 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
              {/* Gender */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-4">Gender</h4>
                <div className="space-y-2">
                  {['MALE', 'FEMALE', 'UNISEX', 'KIDS'].map(g => (
                    <label key={g} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={activeFilters.gender.includes(g)}
                        onChange={() => toggleFilter('gender', g)}
                        className="rounded-sm border-primary/20 text-primary focus:ring-primary/20 accent-primary"
                      />
                      <span className={`text-sm transition-colors group-hover:text-primary ${activeFilters.gender.includes(g) ? 'text-primary font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                        {g}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-4">Category</h4>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={activeFilters.category.includes(cat.id)}
                        onChange={() => toggleFilter('category', cat.id)}
                        className="rounded-sm border-primary/20 text-primary focus:ring-primary/20 accent-primary"
                      />
                      <span className={`text-sm transition-colors group-hover:text-primary ${activeFilters.category.includes(cat.id) ? 'text-primary font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Color Swatches */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-4">Color</h4>
                <div className="flex flex-wrap gap-3">
                  {colors.map(color => (
                    <button
                      key={color.id}
                      onClick={() => toggleFilter('color', color.colorName)}
                      className={`w-6 h-6 rounded-full border transition-all duration-300 hover:scale-110 relative flex items-center justify-center cursor-pointer ${
                        activeFilters.color.includes(color.colorName)
                          ? 'border-primary ring-2 ring-primary/20 scale-110'
                          : 'border-slate-200'
                      }`}
                      style={{ backgroundColor: color.colorCode }}
                      title={color.colorName}
                    >
                      {activeFilters.color.includes(color.colorName) && (
                        <span
                          className={`material-symbols-outlined text-[10px] font-black ${
                            (() => {
                              const hex = color.colorCode.replace('#', '');
                              const r = parseInt(hex.substring(0, 2), 16);
                              const g = parseInt(hex.substring(2, 4), 16);
                              const b = parseInt(hex.substring(4, 6), 16);
                              const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                              return brightness > 128 ? 'text-black' : 'text-white';
                            })()
                          }`}
                        >
                          check
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-4">Size</h4>
                <div className="grid grid-cols-4 gap-2">
                  {sizes.map(size => (
                    <button
                      key={size.id}
                      onClick={() => toggleFilter('size', size.sizeValue)}
                      className={`border text-xs py-2 transition-colors cursor-pointer ${
                        activeFilters.size.includes(size.sizeValue)
                          ? 'border-primary text-white dark:text-slate-900 bg-primary'
                          : 'border-primary/10 hover:border-primary'
                      }`}
                    >
                      {size.sizeValue}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-4">Price Range</h4>
                <div className="px-2 relative h-6 flex items-center">
                  <div className="h-1 w-full bg-primary/10 rounded relative">
                    <div
                      className="absolute h-full bg-primary"
                      style={{
                        left: `${(activeFilters.priceRange[0] / 500) * 100}%`,
                        right: `${100 - (activeFilters.priceRange[1] / 500) * 100}%`
                      }}
                    ></div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={activeFilters.priceRange[0]}
                    onChange={(e) => handlePriceChange(0, Number(e.target.value))}
                    className="absolute inset-x-0 w-full pointer-events-none appearance-none bg-transparent accent-primary [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto z-20 range-slider-thumb"
                  />
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={activeFilters.priceRange[1]}
                    onChange={(e) => handlePriceChange(1, Number(e.target.value)) }
                    className="absolute inset-x-0 w-full pointer-events-none appearance-none bg-transparent accent-primary [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto z-10 range-slider-thumb"
                  />
                </div>
                <div className="flex justify-between mt-6 gap-4">
                  <div className="flex-1 flex items-center gap-1 bg-white dark:bg-slate-100 border border-primary/10 px-2 py-1.5 rounded shadow-sm">
                    <span className="text-[9px] font-bold text-slate-900 uppercase">Min</span>
                    <div className="flex items-center">
                      <span className="text-[10px] text-slate-500 mr-0.5">₼</span>
                      <input 
                        type="number"
                        value={activeFilters.priceRange[0]}
                        onChange={(e) => handlePriceChange(0, Number(e.target.value))}
                        className="w-full bg-transparent border-none p-0 text-xs font-medium text-slate-900 focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex-1 flex items-center gap-1 bg-white dark:bg-slate-100 border border-primary/10 px-2 py-1.5 rounded shadow-sm">
                    <span className="text-[9px] font-bold text-slate-900 uppercase">Max</span>
                    <div className="flex items-center">
                      <span className="text-[10px] text-slate-500 mr-0.5">₼</span>
                      <input 
                        type="number"
                        value={activeFilters.priceRange[1]}
                        onChange={(e) => handlePriceChange(1, Number(e.target.value))}
                        className="w-full bg-transparent border-none p-0 text-xs font-medium text-slate-900 text-right focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={clearFilters}
                className="w-full bg-primary text-white dark:text-slate-900 py-3 text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
                    <div key={`skeleton-${idx}`} className="animate-pulse space-y-4">
                      <div className="aspect-[3/4] bg-primary/5 rounded-lg"></div>
                      <div className="h-3 w-3/4 bg-primary/5 rounded"></div>
                      <div className="h-4 w-1/2 bg-primary/5 rounded"></div>
                    </div>
                  ))
                ) : products.length === 0 ? (
                  <div className="col-span-full py-32 text-center space-y-6">
                    <div className="size-20 border border-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-3xl text-primary/20 font-light">inventory_2</span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-light text-primary">No matches found</h3>
                      <p className="text-slate-400 text-sm">Try adjusting your filters to discover our other premium items.</p>
                    </div>
                    <button
                      onClick={clearFilters}
                      className="px-8 py-3 border border-primary text-primary text-xs uppercase tracking-widest hover:bg-primary hover:text-white dark:hover:text-slate-900 transition-all duration-300 cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  products.map((product) => {
                    const mainImage = product.colors[0]?.images.find(img => img.main)?.image || product.colors[0]?.images[0]?.image;
                    const hoverImage = product.colors[0]?.images.find(img => !img.main)?.image || mainImage;

                    return (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                        className="group cursor-pointer"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden bg-primary/5 rounded-lg mb-4">
                          <img
                            src={mainImage}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          {hoverImage && hoverImage !== mainImage && (
                            <img
                              src={hoverImage}
                              alt={product.title}
                              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                              referrerPolicy="no-referrer"
                            />
                          )}

                          {product.hasDiscount && (
                            <div className="absolute top-4 left-4 bg-primary text-white dark:text-slate-900 text-[9px] font-bold uppercase tracking-widest px-3 py-1 z-10">
                              -{product.discountRate}%
                            </div>
                          )}

                          <button 
                            onClick={(e) => handleLike(product.id, e)}
                            className={`absolute top-4 right-4 rounded-full transition z-10 cursor-pointer group/btn
                              bg-white text-black hover:text-primary
                              dark:bg-white dark:text-background-light dark:hover:bg-background-light dark:hover:text-white
                              ${likedProducts.has(product.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          >
                            <span className={`material-symbols-outlined text-xl p-2 transition-colors 
                              group-hover/btn:text-black dark:group-hover/btn:text-white
                              ${likedProducts.has(product.id) ? 'text-red-500 [font-variation-settings:"FILL"_1]' : 'group-hover/btn:[font-variation-settings:"FILL"_1]'}`}>
                              favorite
                            </span>
                          </button>

                          <div className="absolute bottom-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            {product.colors.slice(0, 3).map(c => (
                              <span
                                key={c.id}
                                className="w-3 h-3 rounded-full border border-white/50"
                                style={{ backgroundColor: c.colorCode }}
                              ></span>
                            ))}
                          </div>

                          <div className="absolute inset-x-4 bottom-12 translate-y-8 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 z-10">
                            <button
                              onClick={() => setSelectedProduct(product)}
                              className="w-full py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer backdrop-blur-sm
                                bg-primary text-white hover:bg-white hover:text-primary
                                dark:bg-white dark:text-background-light dark:hover:bg-background-light dark:hover:text-white"
                            >
                              Quick View
                            </button>
                          </div>
                        </div>

                        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">{product.title}</h3>
                        <div className="flex items-center gap-3">
                          <p className="text-primary font-semibold">₼{product.discountPrice}</p>
                          {product.hasDiscount && (
                            <p className="text-sm text-slate-400 line-through">₼{product.originalPrice.toFixed(2)}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {pageInfo && pageInfo.totalPages > 1 && (
              <div className="mt-20 flex flex-col items-center gap-6">
                <p className="text-sm text-slate-500">
                  Showing {products.length} of {pageInfo.totalElements} products
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.max(0, prev.page! - 1) }))}
                    disabled={pageInfo.first}
                    className="w-10 h-10 flex items-center justify-center border border-primary/10 hover:border-primary transition-colors text-slate-400 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>

                  {Array.from({ length: pageInfo.totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFilters(prev => ({ ...prev, page: i }))}
                      className={`w-10 h-10 flex items-center justify-center border transition-colors font-medium cursor-pointer ${
                        filters.page === i
                          ? 'bg-primary text-white dark:text-slate-900 border-primary'
                          : 'border-primary/10 hover:border-primary'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pageInfo.totalPages - 1, prev.page! + 1) }))}
                    disabled={pageInfo.last}
                    className="w-10 h-10 flex items-center justify-center border border-primary/10 hover:border-primary transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Quick View Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl bg-background-light dark:bg-background-dark overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px]"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 bg-white/90 rounded-full z-20 hover:bg-primary hover:text-white dark:bg-background-light text-primary transition-all duration-300 cursor-pointer"
              >
                <span className="dark:hover:text-background-light material-symbols-outlined p-2 font-light">close</span>
              </button>

              <div className="w-full md:w-1/2 flex flex-col bg-primary/5">
                <div className="relative flex-1 min-h-[400px] md:min-h-0">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`${selectedProduct.id}-${selectedColorIndex}-${selectedImageIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      src={selectedProduct.colors[selectedColorIndex]?.images[selectedImageIndex]?.image}
                      alt={selectedProduct.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>
                  
                  {/* Navigation Arrows for Images */}
                  {selectedProduct.colors[selectedColorIndex]?.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(prev => (prev === 0 ? selectedProduct.colors[selectedColorIndex].images.length - 1 : prev - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-background-dark/80 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all z-10 cursor-pointer"
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(prev => (prev === selectedProduct.colors[selectedColorIndex].images.length - 1 ? 0 : prev + 1))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-background-dark/80 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all z-10 cursor-pointer"
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {selectedProduct.colors[selectedColorIndex]?.images.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto bg-white dark:bg-background-dark/50 border-t border-primary/5">
                    {selectedProduct.colors[selectedColorIndex].images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-16 h-20 flex-shrink-0 overflow-hidden rounded border-2 transition-all ${
                          selectedImageIndex === idx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img.image}
                          alt={`${selectedProduct.title} thumbnail ${idx}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full md:w-1/2 p-10 flex flex-col justify-center space-y-6">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">{selectedProduct.categoryName}</span>
                  <h2 className="text-4xl font-light text-primary leading-tight dark:text-slate-100">{selectedProduct.title}</h2>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-semibold text-primary dark:text-slate-100">₼{selectedProduct.discountPrice.toFixed(2)}</span>
                    {selectedProduct.hasDiscount && (
                      <span className="text-lg text-slate-400 line-through">₼{selectedProduct.originalPrice.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                <p className="text-slate-500 text-sm leading-relaxed">
                  {selectedProduct.description || "Experience the pinnacle of craftsmanship with this exquisite piece from our latest collection."}
                </p>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-primary/40 uppercase tracking-widest">Available Colors</span>
                    <div className="flex gap-2">
                      {selectedProduct.colors.map((c, idx) => (
                        <div
                          key={c.id}
                          onClick={() => setSelectedColorIndex(idx)}
                          className={`w-7 h-7 rounded-full border cursor-pointer hover:scale-110 transition-all shadow-sm flex items-center justify-center ${
                            selectedColorIndex === idx ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-primary/10'
                          }`}
                          style={{ backgroundColor: c.colorCode }}
                          title={c.name}
                        >
                          {selectedColorIndex === idx && (
                            <span className={`material-symbols-outlined text-[10px] font-black ${
                              (() => {
                                const hex = c.colorCode.replace('#', '');
                                const r = parseInt(hex.substring(0, 2), 16);
                                const g = parseInt(hex.substring(2, 4), 16);
                                const b = parseInt(hex.substring(4, 6), 16);
                                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                                return brightness > 128 ? 'text-black' : 'text-white';
                              })()
                            }`}>check</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-primary/40 uppercase tracking-widest">Select Size</span>
                    <div className="grid grid-cols-5 gap-2">
                      {sizes.map(s => (
                        <button
                          key={s.id}
                          className="border border-primary/10 text-xs py-2 hover:border-primary hover:text-primary transition-all uppercase tracking-wider cursor-pointer"
                        >
                          {s.sizeValue}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer
                    bg-primary text-white border border-primary/10 hover:bg-white hover:text-primary
                    dark:bg-white dark:text-background-light dark:hover:bg-background-light dark:hover:text-white">
                    View Product
                  </button>
                    <button 
                      onClick={(e) => handleLike(selectedProduct.id, e)}
                      className={`px-6 border border-primary/10 transition-all flex items-center justify-center group/btn cursor-pointer
                        bg-primary text-white hover:bg-white hover:text-primary
                        dark:bg-white dark:text-background-light dark:hover:bg-background-light dark:hover:text-white
                        ${likedProducts.has(selectedProduct.id) ? 'text-red-500 border-red-500/20 bg-red-50/50' : ''}`}
                    >
                      <span className={`material-symbols-outlined 
                        group-hover/btn:text-primary dark:group-hover/btn:text-white
                        ${likedProducts.has(selectedProduct.id) ? '[font-variation-settings:"FILL"_1]' : 'group-hover/btn:[font-variation-settings:"FILL"_1]'}`}>
                        favorite
                      </span>
                    </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
