import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productApi } from '../services/api';
import { Product, Category, ProductSize, Color, ProductPage, ProductFilter } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
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

  const [activeFilters, setActiveFilters] = useState(() => {
    const genderParams = searchParams.getAll('gender');
    const categoryParams = searchParams.getAll('category');
    const colorParams = searchParams.getAll('color');
    const sizeParams = searchParams.getAll('size');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const keywordParam = searchParams.get('keyword');

    return {
      gender: genderParams,
      category: categoryParams.map(Number),
      color: colorParams,
      size: sizeParams,
      priceRange: [
        minPriceParam ? Number(minPriceParam) : 0,
        maxPriceParam ? Number(maxPriceParam) : 500
      ] as [number, number],
      searchKeyword: keywordParam || ''
    };
  });

  const [ sortBy, setSortBy ] = useState('newest');
  const [ isFilterOpen, setIsFilterOpen ] = useState(false);
  const [ selectedProduct, setSelectedProduct ] = useState<Product | null>(null);
  const [ likedProducts, setLikedProducts ] = useState<Set<number>>(new Set());
  const [ expandedCategories, setExpandedCategories ] = useState<Set<string>>(new Set());

  const groupedCategories = useMemo(() => {
    const groups: { [key: string]: Category[] } = {};
    const mainNames = new Set<string>();
    
    categories.forEach(cat => {
      const pName = cat.parentName || 'Other';
      if (!groups[pName]) {
        groups[pName] = [];
      }
      groups[pName].push(cat);
      mainNames.add(pName);
    });
    
    const main = Array.from(mainNames).sort().map((name, index) => ({
      id: -1 - index,
      name: name,
      parentName: ""
    }));
    
    return { main, groups };
  }, [categories]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const parentParam = searchParams.get('parent');
    if (parentParam && categories.length > 0) {
      const parentNames = parentParam.split(',').map(p => p.trim());
      const children = categories.filter(c => parentNames.includes(c.parentName || 'Other'));
      
      if (children.length > 0) {
        const childIds = children.map(c => c.id);
        
        // Update activeFilters directly.
        setActiveFilters(prev => ({
          ...prev,
          category: childIds
        }));

        // Expand the parent categories in the sidebar
        setExpandedCategories(prev => {
          const next = new Set(prev);
          parentNames.forEach(p => next.add(p));
          return next;
        });

        // Explicitly remove the parent param now that we've processed it
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('parent');
        // We also add the category IDs to the URL immediately to be safe
        newParams.delete('category');
        childIds.forEach(id => newParams.append('category', id.toString()));
        setSearchParams(newParams, { replace: true });
      } else {
        // If no children found, still remove the param to avoid infinite loops
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('parent');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [categories, searchParams, setSearchParams]);

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

  useEffect(() => {
    const genderParams = searchParams.getAll('gender');
    const categoryParams = searchParams.getAll('category');
    const colorParams = searchParams.getAll('color');
    const sizeParams = searchParams.getAll('size');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const keywordParam = searchParams.get('keyword');

    setActiveFilters(prev => {
      const next = {
        gender: genderParams,
        category: categoryParams.map(Number),
        color: colorParams,
        size: sizeParams,
        priceRange: [
          minPriceParam ? Number(minPriceParam) : 0,
          maxPriceParam ? Number(maxPriceParam) : 500
        ] as [number, number],
        searchKeyword: keywordParam || ''
      };
      
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        return next;
      }
      return prev;
    });
  }, [searchParams]);

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    
    // Only manage the parameters we are responsible for
    newParams.delete('gender');
    newParams.delete('category');
    newParams.delete('color');
    newParams.delete('size');
    newParams.delete('minPrice');
    newParams.delete('maxPrice');
    newParams.delete('keyword');

    activeFilters.gender.forEach(g => newParams.append('gender', g));
    activeFilters.category.forEach(c => newParams.append('category', c.toString()));
    activeFilters.color.forEach(c => newParams.append('color', c));
    activeFilters.size.forEach(s => newParams.append('size', s));
    
    if (activeFilters.priceRange[0] > 0) newParams.set('minPrice', activeFilters.priceRange[0].toString());
    if (activeFilters.priceRange[1] < 500) newParams.set('maxPrice', activeFilters.priceRange[1].toString());
    if (activeFilters.searchKeyword) newParams.set('keyword', activeFilters.searchKeyword);
    
    // Sort params to ensure consistent string comparison
    newParams.sort();
    const currentParams = new URLSearchParams(searchParams);
    currentParams.sort();

    if (newParams.toString() !== currentParams.toString()) {
      setSearchParams(newParams, { replace: true });
    }
  }, [activeFilters, setSearchParams, searchParams]);

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
      if (activeFilters.searchKeyword) apiFilters.keyword = activeFilters.searchKeyword;

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters.page]);

  useEffect(() => {
    fetchProducts();
  }, [activeFilters, sortBy, filters.page]);

  const handleLike = useCallback(async (productId: number, e: React.MouseEvent) => {
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
      if (selectedProduct?.id === productId) {
        setSelectedProduct(prev => prev ? { ...prev, liked: !prev.liked } : null);
      }
    } catch (err) {
      console.error('Error liking product', err);
    }
  }, [selectedProduct]);

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

  const toggleParentCategory = (parentName: string) => {
    const children = groupedCategories.groups[parentName] || [];
    const childIds = children.map(c => c.id);
    
    setActiveFilters(prev => {
      const current = prev.category;
      const allSelected = childIds.length > 0 && childIds.every(id => current.includes(id));
      
      if (allSelected) {
        // Unselect all children
        return { ...prev, category: current.filter(id => !childIds.includes(id)) };
      } else {
        // Select all children (avoid duplicates)
        const next = new Set([...current, ...childIds]);
        return { ...prev, category: Array.from(next) };
      }
    });
    setFilters(prev => ({ ...prev, page: 0 }));
  };

  const toggleExpand = (parentName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(parentName)) {
        next.delete(parentName);
      } else {
        next.add(parentName);
      }
      return next;
    });
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
      priceRange: [0, 500],
      searchKeyword: ''
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
            {/* Search Bar */}
            <div className="block">
              <div className="flex items-center border border-primary/10 focus-within:border-primary transition-colors rounded-lg px-4 py-3">
                <span className="material-symbols-outlined text-primary/40 mr-2">search</span>
                <input
                  className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full"
                  placeholder="Search keywords..."
                  type="text"
                  value={activeFilters.searchKeyword}
                  onChange={(e) => {
                    setActiveFilters(prev => ({ ...prev, searchKeyword: e.target.value }));
                    setFilters(prev => ({ ...prev, page: 0 }));
                  }}
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
                <div className="space-y-2 text-sm">
                  {groupedCategories.main.map(mainCat => {
                    const children = groupedCategories.groups[mainCat.name] || [];
                    const isExpanded = expandedCategories.has(mainCat.name);
                    const childIds = children.map(c => c.id);
                    const isAllSelected = childIds.length > 0 && childIds.every(id => activeFilters.category.includes(id));

                    return (
                      <div key={mainCat.id} className="space-y-1">
                        <div className="flex items-center justify-between group">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={() => toggleParentCategory(mainCat.name)}
                              className="rounded-sm border-primary/20 text-primary focus:ring-primary/20 accent-primary"
                            />
                            <span className={`text-sm font-bold transition-colors group-hover:text-primary ${isAllSelected ? 'text-primary' : 'text-slate-900 dark:text-slate-100'}`}>
                              {mainCat.name}
                            </span>
                          </label>
                          {children.length > 0 && (
                            <button
                              onClick={() => toggleExpand(mainCat.name)}
                              className="hover:bg-primary/5 rounded transition-colors"
                            >
                              <span className={`p-1 material-symbols-outlined text-sm transition-transform cursor-pointer duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                keyboard_arrow_down
                              </span>
                            </button>
                          )}
                        </div>

                        {isExpanded && children.length > 0 && (
                          <div className="pl-6 space-y-1 border-l border-primary/10 ml-2">
                            {children.map(child => (
                              <label key={child.id} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={activeFilters.category.includes(child.id)}
                                  onChange={() => toggleFilter('category', child.id)}
                                  className="rounded-sm border-primary/20 text-primary focus:ring-primary/20 accent-primary"
                                />
                                <span className={`text-sm transition-colors group-hover:text-primary ${activeFilters.category.includes(child.id) ? 'text-primary font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                                  {child.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                  products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isLiked={likedProducts.has(product.id)}
                      onLike={handleLike}
                      onQuickView={setSelectedProduct}
                    />
                  ))
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

      <QuickViewModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onLike={handleLike}
        isLiked={selectedProduct ? likedProducts.has(selectedProduct.id) : false}
      />
    </div>
  );
}
