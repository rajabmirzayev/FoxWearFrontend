import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './services/api';
import { ApiResponse, Product, ProductPage, ProductFilter, Category, ProductSize, Color } from './types';

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<ProductPage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProductFilter>({
    page: 0,
    size: 10,
    sortBy: 'updatedAt',
    direction: 'DESC',
    gender: '',
    categoryId: null,
    keyword: '',
    isActive: true,
    isDeleted: false,
    minPrice: '',
    maxPrice: '',
  });

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Filter out empty values for minPrice and maxPrice
      const cleanFilters = { ...filters };
      if (cleanFilters.minPrice === '') delete cleanFilters.minPrice;
      if (cleanFilters.maxPrice === '') delete cleanFilters.maxPrice;

      const response = await api.get<ApiResponse<ProductPage>>('/api/admin/products', {
        params: cleanFilters
      });
      if (response.data.success) {
        setProducts(response.data.data.content);
        setPageInfo(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch products');
      }
    } catch (err: any) {
      console.error('Error fetching products', err);
      setError(err.response?.data?.message || 'An error occurred while fetching products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get<ApiResponse<Category[]>>('/api/admin/products/category');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories', err);
    }
  };

  const fetchSizes = async () => {
    try {
      const response = await api.get<ApiResponse<ProductSize[]>>('/api/admin/products/size');
      if (response.data.success) {
        setSizes(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching sizes', err);
    }
  };

  const fetchColors = async () => {
    try {
      const response = await api.get<ApiResponse<Color[]>>('/api/admin/products/colors');
      if (response.data.success) {
        setColors(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching colors', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSizes();
    fetchColors();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, keyword: searchTerm, page: 0 }));
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'keyword') {
      setSearchTerm(value);
      return;
    }

    let filterValue: any = value;
    if (name === 'categoryId') {
      filterValue = value === 'All' ? null : Number(value);
    } else if (value === 'All') {
      filterValue = '';
    }

    setFilters(prev => ({
      ...prev,
      [name]: filterValue,
      page: 0 // Reset to first page on filter change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await api.delete<ApiResponse<string>>(`/api/admin/products/${id}/soft`);
      if (response.data.success) {
        fetchProducts();
      } else {
        alert(response.data.message || 'Failed to delete product');
      }
    } catch (err: any) {
      console.error('Error deleting product', err);
      alert(err.response?.data?.message || 'An error occurred while deleting the product.');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const response = await api.patch<ApiResponse<Product>>(`/api/admin/products/${id}/activate`);
      if (response.data.success) {
        fetchProducts();
      } else {
        alert(response.data.message || 'Failed to toggle status');
      }
    } catch (err: any) {
      console.error('Error toggling product status', err);
      alert(err.response?.data?.message || 'An error occurred while toggling the product status.');
    }
  };

  return (
    <>
      {/* Header Section */}
      <header className="p-8 pb-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-primary tracking-tight">Products Management</h2>
            <p className="text-primary/60 mt-1">Manage your premium apparel inventory and listings</p>
          </div>
          <button 
            onClick={() => navigate('/admin/products/add')}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined">add</span>
            Add New Product
          </button>
        </div>

        {/* Filters System */}
        <div className="bg-white border border-border-subtle rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Search Bar */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">search</span>
                <input 
                  name="keyword"
                  value={searchTerm}
                  onChange={handleFilterChange}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-subtle bg-background-soft focus:outline-none focus:border-primary text-sm transition-all" 
                  placeholder="Search by name, SKU or brand..." 
                  type="text"
                />
              </div>
            </div>
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <select 
                name="gender"
                value={filters.gender}
                onChange={handleFilterChange}
                className="px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-sm focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10"
              >
                <option value="">Gender: All</option>
                <option value="MALE">Men</option>
                <option value="FEMALE">Women</option>
                <option value="UNISEX">Unisex</option>
                <option value="KIDS">Kids</option>
              </select>
              <select 
                name="categoryId"
                value={filters.categoryId || 'All'}
                onChange={handleFilterChange}
                className="px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-sm focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10"
              >
                <option value="All">Category: All</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select 
                name="color"
                value={filters.color || 'All'}
                onChange={handleFilterChange}
                className="px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-sm focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10"
              >
                <option value="All">Color: All</option>
                {colors.map(color => (
                  <option key={color.id} value={color.colorName}>{color.colorName}</option>
                ))}
              </select>
              <select 
                name="productSize"
                value={filters.productSize || 'All'}
                onChange={handleFilterChange}
                className="px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-sm focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10"
              >
                <option value="All">Size: All</option>
                {sizes.map(size => (
                  <option key={size.id} value={size.sizeValue}>{size.sizeValue}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between pt-4 border-t border-border-subtle gap-4">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setFilters(prev => ({ ...prev, isActive: !prev.isActive, page: 0 }))}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer ${filters.isActive ? 'bg-primary/10 text-primary border-primary/20' : 'bg-background-soft text-primary/40 border-border-subtle'}`}
              >
                Status: {filters.isActive ? 'Active' : 'Inactive'}
              </button>
              <button 
                onClick={() => setFilters(prev => ({ ...prev, isDeleted: !prev.isDeleted, page: 0 }))}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer ${filters.isDeleted ? 'bg-red-50 text-red-600 border-red-200' : 'bg-background-soft text-primary/60 border-border-subtle'}`}
              >
                Deleted: {filters.isDeleted ? 'Yes' : 'No'}
              </button>
              <div className="h-8 w-[1px] bg-border-subtle mx-2"></div>
              <select 
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="bg-transparent text-sm font-medium text-primary border-none focus:outline-none focus:border-primary rounded-md px-2 py-1 transition-all cursor-pointer appearance-none pr-6 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0_center] bg-[size:1.2em_1.2em] bg-no-repeat"
              >
                <option value="updatedAt">Sort by: Last Updated</option>
                <option value="createdAt">Sort by: Newest First</option>
                <option value="discountPrice">Sort by: Price</option>
                <option value="title">Sort by: Name</option>
                <option value="id">Sort by: ID</option>
              </select>
              <button 
                onClick={() => setFilters(prev => ({ ...prev, direction: prev.direction === 'ASC' ? 'DESC' : 'ASC', page: 0 }))}
                className="p-1 hover:bg-primary/5 rounded text-primary/60 transition-colors cursor-pointer"
                title={filters.direction === 'ASC' ? 'Ascending' : 'Descending'}
              >
                <span className="material-symbols-outlined text-lg">
                  {filters.direction === 'ASC' ? 'arrow_upward' : 'arrow_downward'}
                </span>
              </button>
              <div className="flex items-center gap-2 ml-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 text-xs font-bold">₼</span>
                  <input 
                    name="minPrice"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    className="w-24 pl-6 pr-3 py-2 rounded-lg border border-border-subtle bg-background-soft text-sm focus:outline-none focus:border-primary transition-all" 
                    placeholder="Min" 
                    type="number"
                  />
                </div>
                <span className="text-primary/20">-</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 text-xs font-bold">₼</span>
                  <input 
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    className="w-24 pl-6 pr-3 py-2 rounded-lg border border-border-subtle bg-background-soft text-sm focus:outline-none focus:border-primary transition-all" 
                    placeholder="Max" 
                    type="number"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-primary/60">
              <span className="flex items-center gap-2">
                Page Size:
                <select 
                  name="size"
                  value={filters.size}
                  onChange={handleFilterChange}
                  className="bg-transparent border-none p-0 text-primary font-bold focus:outline-none focus:border-primary rounded-md px-1 transition-all cursor-pointer appearance-none pr-4 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0_center] bg-[size:1em_1em] bg-no-repeat"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </span>
              <span>Showing {products.length > 0 ? (filters.page! * filters.size!) + 1 : 0}-{Math.min((filters.page! + 1) * filters.size!, pageInfo?.totalElements || 0)} of {pageInfo?.totalElements || 0} products</span>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <p className="text-sm font-medium">{error}</p>
            <button 
              onClick={() => fetchProducts()}
              className="ml-auto text-xs font-bold uppercase tracking-widest bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </header>

      {/* Data Table Area */}
      <section className="flex-1 overflow-auto px-8 pb-8 custom-scrollbar">
        <div className="bg-white border border-border-subtle rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-background-soft sticky top-0 z-10 border-b border-border-subtle">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-widest">Image</th>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-widest">Product Name</th>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-widest">Gender</th>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-primary/40">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
                      <p className="font-medium">Loading products...</p>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-primary/40">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl">inventory_2</span>
                      <p className="font-medium">No products found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                    products.map((product) => {
                      const mainImage = product.colors[0]?.images.find(img => img.main)?.image || product.colors[0]?.images[0]?.image;
                      const totalStock = product.colors.reduce((acc, color) => 
                        acc + color.items.reduce((iAcc, item) => iAcc + item.stockRemaining, 0), 0
                      );
                      
                      const isProductActive = product.isActive ?? product.active;
                      
                      return (
                        <tr key={product.id} className="hover:bg-background-soft transition-colors group">
                          <td className="px-6 py-4">
                            <div className="size-14 rounded overflow-hidden bg-background-soft border border-border-subtle">
                              <img 
                                className="w-full h-full object-cover" 
                                src={mainImage || 'https://via.placeholder.com/150'} 
                                alt={product.title}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{product.title}</span>
                              <span className="text-xs text-primary/50">SKU: {product.colors[0]?.items[0]?.sku || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">{product.categoryName}</td>
                          <td className="px-6 py-4 text-sm capitalize">{product.gender.toLowerCase()}</td>
                          <td className="px-6 py-4 text-sm font-bold">
                            {product.hasDiscount ? (
                              <div className="flex flex-col">
                                <span className="text-primary">{product.discountPrice.toFixed(2)} ₼</span>
                                <span className="text-xs text-primary/40 line-through">{product.originalPrice.toFixed(2)} ₼</span>
                              </div>
                            ) : (
                              <span>{product.originalPrice.toFixed(2)} ₼</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${totalStock > 10 ? 'bg-green-500' : totalStock > 0 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                              <span>{totalStock} in stock</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleToggleActive(product.id)}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${isProductActive ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'}`}
                            >
                              {isProductActive ? 'Active' : 'Inactive'}
                            </button>
                            {product.isDeleted && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">
                                Deleted
                              </span>
                            )}
                          </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="hover:bg-primary/10 rounded-lg text-primary cursor-pointer" title="Edit">
                            <span className="p-1.5 material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="hover:bg-red-50 rounded-lg text-red-600 cursor-pointer" 
                            title="Delete"
                          >
                            <span className="p-1.5 material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        {pageInfo && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-primary/60">Showing {products.length} of {pageInfo.totalElements} results</p>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handlePageChange(filters.page! - 1)}
                disabled={pageInfo.first}
                className="p-2 rounded-lg border border-primary/10 hover:bg-primary/5 text-primary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              {[...Array(pageInfo.totalPages)].map((_, i) => {
                // Simple pagination logic: show current, first, last, and neighbors
                if (
                  i === 0 || 
                  i === pageInfo.totalPages - 1 || 
                  (i >= filters.page! - 1 && i <= filters.page! + 1)
                ) {
                  return (
                    <button 
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition-all cursor-pointer ${filters.page === i ? 'bg-primary text-white' : 'border border-border-subtle hover:bg-background-soft text-primary'}`}
                    >
                      {i + 1}
                    </button>
                  );
                }
                if (i === 1 || i === pageInfo.totalPages - 2) {
                  return <span key={i} className="px-2 text-primary/40">...</span>;
                }
                return null;
              })}

              <button 
                onClick={() => handlePageChange(filters.page! + 1)}
                disabled={pageInfo.last}
                className="p-2 rounded-lg border border-border-subtle hover:bg-background-soft text-primary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
