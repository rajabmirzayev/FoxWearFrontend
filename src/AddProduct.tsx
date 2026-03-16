import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './services/api';
import { ApiResponse, CreateProductRequest, Product, Category, ProductSize, Color } from './types';
import Modal from './components/Modal';

export default function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [availableColors, setAvailableColors] = useState<Color[]>([]);

  const [formData, setFormData] = useState<Omit<CreateProductRequest, 'colors'>>({
    title: '',
    description: '',
    originalPrice: 0,
    discountPrice: 0,
    discountRate: 0,
    gender: 'MALE',
    categoryId: 0,
  });

  const [colors, setColors] = useState<CreateProductRequest['colors']>([
    {
      colorName: '',
      colorCode: '#000000',
      images: [{ image: '', isMain: true }],
      items: [{ sizeId: 0, stockQuantity: 0 }]
    }
  ]);

  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});
  const [colorSelectionTypes, setColorSelectionTypes] = useState<string[]>(['custom']);
  const [pricingMaster, setPricingMaster] = useState<'discountPrice' | 'discountRate' | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        const [catRes, sizeRes, colorRes] = await Promise.all([
          api.get<ApiResponse<Category[]>>('/api/admin/products/category'),
          api.get<ApiResponse<ProductSize[]>>('/api/admin/products/size'),
          api.get<ApiResponse<Color[]>>('/api/admin/products/colors')
        ]);
        
        if (catRes.data.success) {
          setCategories(catRes.data.data);
          if (catRes.data.data.length > 0) {
            setFormData(prev => ({ ...prev, categoryId: catRes.data.data[0].id }));
          }
        }
        
        if (sizeRes.data.success) {
          setSizes(sizeRes.data.data);
          if (sizeRes.data.data.length > 0) {
            const firstSizeId = sizeRes.data.data[0].id;
            setColors(prev => prev.map(c => ({
              ...c,
              items: c.items.map(i => ({ ...i, sizeId: firstSizeId }))
            })));
          }
        }

        if (colorRes.data.success) {
          setAvailableColors(colorRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching categories/sizes/colors', err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setIsDirty(true);
    const { name, value } = e.target;
    if (name.includes('Price') || name === 'discountRate' || name === 'categoryId') {
      const sanitized = value.replace(/^0+(?=\d)/, '');
      const numValue = sanitized === '' ? 0 : Number(sanitized);

      setFormData(prev => {
        let finalNumValue = numValue;
        if (name === 'discountRate') {
          finalNumValue = Math.min(100, Math.max(0, numValue));
        } else if (name === 'discountPrice') {
          finalNumValue = Math.min(prev.originalPrice, Math.max(0, numValue));
        }

        const next = { ...prev, [name]: finalNumValue };

        if (name === 'discountPrice') {
          if (finalNumValue > 0) {
            setPricingMaster('discountPrice');
            if (next.originalPrice > 0) {
              next.discountRate = Math.round(((next.originalPrice - finalNumValue) / next.originalPrice) * 100);
            }
          } else {
            setPricingMaster(null);
            next.discountRate = 0;
          }
        } else if (name === 'discountRate') {
          if (finalNumValue > 0) {
            setPricingMaster('discountRate');
            if (next.originalPrice > 0) {
              next.discountPrice = next.originalPrice - (next.originalPrice * finalNumValue / 100);
            }
          } else {
            setPricingMaster(null);
            next.discountPrice = 0;
          }
        } else if (name === 'originalPrice') {
          if (next.originalPrice < next.discountPrice) {
            next.discountPrice = next.originalPrice;
          }

          if (next.originalPrice > 0) {
            if (pricingMaster === 'discountPrice' && next.discountPrice > 0) {
              next.discountRate = Math.round(((next.originalPrice - next.discountPrice) / next.originalPrice) * 100);
            } else if (pricingMaster === 'discountRate' && next.discountRate > 0) {
              next.discountPrice = next.originalPrice - (next.originalPrice * next.discountRate / 100);
            }
          } else {
            next.discountPrice = 0;
            next.discountRate = 0;
            setPricingMaster(null);
          }
        }

        return next;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleColorChange = (index: number, field: string, value: string) => {
    setIsDirty(true);
    setColors(prev => {
      const newColors = [...prev];
      newColors[index] = { ...newColors[index], [field]: value };
      return newColors;
    });
  };

  const addColorOption = () => {
    setIsDirty(true);
    setColors(prev => [...prev, {
      colorName: '',
      colorCode: '#000000',
      images: [{ image: '', isMain: true }],
      items: [{ sizeId: sizes.length > 0 ? sizes[0].id : 0, stockQuantity: 0 }]
    }]);
    setColorSelectionTypes(prev => [...prev, 'custom']);
  };

  const removeColorOption = (index: number) => {
    if (index === 0) return;
    setIsDirty(true);
    setColors(prev => prev.filter((_, i) => i !== index));
    setColorSelectionTypes(prev => prev.filter((_, i) => i !== index));
  };

  const addImage = async (colorIndex: number, file: File) => {
    const color = colors[colorIndex];
    const isFirstEmpty = color.images.length === 1 && color.images[0].image === '';
    
    if (isFirstEmpty) {
      // Use the existing first empty slot
      await handleFileUpload(colorIndex, 0, file);
    } else {
      // Add a new slot and use it
      const newIndex = color.images.length;
      setColors(prev => {
        const newColors = [...prev];
        newColors[colorIndex].images.push({ image: '', isMain: false });
        return newColors;
      });
      await handleFileUpload(colorIndex, newIndex, file);
    }
  };

  const removeImage = (colorIndex: number, imageIndex: number) => {
    if (imageIndex === 0) return;
    setColors(prev => {
      const newColors = [...prev];
      const removedImage = newColors[colorIndex].images[imageIndex];
      newColors[colorIndex].images = newColors[colorIndex].images.filter((_, i) => i !== imageIndex);
      
      if (removedImage.isMain && newColors[colorIndex].images.length > 0) {
        newColors[colorIndex].images[0].isMain = true;
      }
      return newColors;
    });
  };

  const addSize = (colorIndex: number) => {
    setIsDirty(true);
    setColors(prev => {
      const newColors = [...prev];
      newColors[colorIndex].items.push({ sizeId: sizes.length > 0 ? sizes[0].id : 0, stockQuantity: 0 });
      return newColors;
    });
  };

  const removeSize = (colorIndex: number, itemIndex: number) => {
    if (itemIndex === 0) return;
    setIsDirty(true);
    setColors(prev => {
      const newColors = [...prev];
      newColors[colorIndex].items = newColors[colorIndex].items.filter((_, i) => i !== itemIndex);
      return newColors;
    });
  };

  const handleImageChange = (colorIndex: number, imageIndex: number, field: string, value: any) => {
    setIsDirty(true);
    setColors(prev => {
      const newColors = [...prev];
      if (field === 'isMain' && value === true) {
        newColors[colorIndex].images = newColors[colorIndex].images.map((img, idx) => ({
          ...img,
          isMain: idx === imageIndex
        }));
      } else {
        newColors[colorIndex].images[imageIndex] = { ...newColors[colorIndex].images[imageIndex], [field]: value };
      }
      return newColors;
    });
  };

  const handleItemChange = (colorIndex: number, itemIndex: number, field: string, value: any) => {
    setIsDirty(true);
    setColors(prev => {
      const newColors = [...prev];
      let finalValue = value;
      if (field === 'stockQuantity' || field === 'sizeId') {
        const sanitized = String(value).replace(/^0+(?=\d)/, '');
        finalValue = sanitized === '' ? 0 : Number(sanitized);
      }
      newColors[colorIndex].items[itemIndex] = { 
        ...newColors[colorIndex].items[itemIndex], 
        [field]: finalValue 
      };
      return newColors;
    });
  };

  const handleFileUpload = async (colorIndex: number, imageIndex: number, file: File) => {
    const uploadKey = `${colorIndex}-${imageIndex}`;
    setUploadErrors(prev => ({ ...prev, [uploadKey]: '' }));

    if (file.size > 5 * 1024 * 1024) {
      setUploadErrors(prev => ({ ...prev, [uploadKey]: 'Image cannot be larger than 5MB' }));
      return;
    }

    setUploading(prev => ({ ...prev, [uploadKey]: true }));
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<ApiResponse<string>>('/api/v1/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        handleImageChange(colorIndex, imageIndex, 'image', response.data.data);
      } else {
        setUploadErrors(prev => ({ ...prev, [uploadKey]: response.data.message || 'Upload failed' }));
      }
    } catch (err: any) {
      console.error('Upload error', err);
      setUploadErrors(prev => ({ ...prev, [uploadKey]: 'An error occurred during upload' }));
    } finally {
      setUploading(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload: CreateProductRequest = {
        ...formData,
        colors
      };
      const response = await api.post<ApiResponse<Product>>('/api/admin/products', payload);
      if (response.data.success) {
        navigate('/admin/products');
      } else {
        setError(response.data.message || 'Failed to create product');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex-1 overflow-y-auto bg-background-soft px-8 py-8 animate-pulse transition-colors duration-300">
        <div className="max-w-5xl mx-auto">
          {/* Skeleton Header */}
          <div className="mb-8">
            <div className="h-4 w-32 bg-primary/10 rounded mb-4"></div>
            <div className="flex justify-between items-center">
              <div className="h-10 w-64 bg-primary/10 rounded"></div>
              <div className="flex gap-3">
                <div className="h-10 w-24 bg-primary/10 rounded-lg"></div>
                <div className="h-10 w-32 bg-primary/10 rounded-lg"></div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Skeleton Section 1 */}
            <div className="bg-background-light p-8 rounded-xl border border-border-subtle">
              <div className="h-8 w-48 bg-primary/10 rounded mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <div className="h-4 w-24 bg-primary/5 rounded"></div>
                  <div className="h-12 w-full bg-background-soft rounded-lg"></div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <div className="h-4 w-24 bg-primary/5 rounded"></div>
                  <div className="h-32 w-full bg-background-soft rounded-lg"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-primary/5 rounded"></div>
                  <div className="h-12 w-full bg-background-soft rounded-lg"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-primary/5 rounded"></div>
                  <div className="h-12 w-full bg-background-soft rounded-lg"></div>
                </div>
              </div>
            </div>

            {/* Skeleton Section 2 */}
            <div className="bg-background-light p-8 rounded-xl border border-border-subtle">
              <div className="h-8 w-32 bg-primary/10 rounded mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-primary/5 rounded"></div>
                    <div className="h-12 w-full bg-background-soft rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelModal(true);
    } else {
      navigate('/admin/products');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => navigate('/admin/products')}
        title="Discard changes?"
        message="Your changes will not be saved. Are you sure you want to exit?"
        confirmLabel="Yes, exit"
        cancelLabel="No, stay"
        type="warning"
      />
      <div className="flex-1 overflow-y-auto bg-background-soft px-8 py-8 custom-scrollbar transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumbs & Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-primary/50 mb-2">
            <button onClick={() => navigate('/admin/products')} className="hover:text-primary transition-colors cursor-pointer">Products</button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary font-medium">Add New Product</span>
          </nav>
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-primary tracking-tight">Add New Product</h2>
            <div className="flex gap-3">
              <button 
                onClick={handleCancel}
                className="px-6 py-2 border border-primary/20 text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-primary text-white dark:text-background-light font-semibold rounded-lg shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* Section 1: Basic Information */}
          <div className="bg-background-light p-8 rounded-xl shadow-sm border border-border-subtle">
            <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-4">
              <span className="material-symbols-outlined text-primary">info</span>
              <h3 className="text-xl font-bold text-primary">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-primary mb-2">Product Title</label>
                <input 
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-primary focus:outline-none focus:border-primary transition-all placeholder:text-primary/40" 
                  placeholder="e.g. Italian Wool Blazer" 
                  type="text"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-primary mb-2">Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-primary focus:outline-none focus:border-primary transition-all placeholder:text-primary/40" 
                  placeholder="Describe the luxury and materials..." 
                  rows={4}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">Category</label>
                <select 
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-primary focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">Gender</label>
                <div className="flex gap-6 h-[50px] items-center">
                  {['MALE', 'FEMALE', 'UNISEX', 'KIDS'].map((g) => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="gender" 
                        value={g}
                        checked={formData.gender === g}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-primary border-primary/20 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer" 
                      />
                      <span className={`text-sm font-medium transition-colors ${formData.gender === g ? 'text-primary' : 'text-primary/60 group-hover:text-primary/70'}`}>
                        {g.charAt(0) + g.slice(1).toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing */}
          <div className="bg-background-light p-8 rounded-xl shadow-sm border border-border-subtle">
            <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-4">
              <span className="material-symbols-outlined text-primary">payments</span>
              <h3 className="text-xl font-bold text-primary">Pricing</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">Original Price (₼)</label>
                <input 
                  name="originalPrice"
                  value={formData.originalPrice === 0 ? '' : formData.originalPrice}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-primary focus:outline-none focus:border-primary transition-all placeholder:text-primary/40" 
                  placeholder="0.00" 
                  type="number"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">Discount Price (₼)</label>
                <input 
                  name="discountPrice"
                  value={formData.discountPrice === 0 ? '' : formData.discountPrice}
                  onChange={handleInputChange}
                  disabled={pricingMaster === 'discountRate'}
                  min="0"
                  max={formData.originalPrice}
                  className="w-full px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-primary focus:outline-none focus:border-primary transition-all disabled:bg-primary/5 disabled:text-primary/40 disabled:cursor-not-allowed placeholder:text-primary/40" 
                  placeholder="0.00" 
                  type="number"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">Discount Rate (%)</label>
                <input 
                  name="discountRate"
                  value={formData.discountRate === 0 ? '' : formData.discountRate}
                  onChange={handleInputChange}
                  disabled={pricingMaster === 'discountPrice'}
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-primary focus:outline-none focus:border-primary transition-all disabled:bg-primary/5 disabled:text-primary/40 disabled:cursor-not-allowed placeholder:text-primary/40" 
                  placeholder="0" 
                  type="number"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Color Options */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-primary">Color Options</h3>
            </div>
            
            {colors.map((color, cIdx) => (
              <div key={cIdx} className="bg-background-light rounded-xl shadow-sm border-l-4 border-primary overflow-hidden border border-border-subtle relative">
                {cIdx > 0 && (
                  <button 
                    onClick={() => removeColorOption(cIdx)}
                    className="absolute top-4 right-4 text-primary/40 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-2">Select Color</label>
                      <select 
                        value={colorSelectionTypes[cIdx] || 'custom'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setColorSelectionTypes(prev => {
                            const next = [...prev];
                            next[cIdx] = val;
                            return next;
                          });
                          if (val === 'custom') {
                            handleColorChange(cIdx, 'colorName', '');
                            handleColorChange(cIdx, 'colorCode', '#000000');
                          } else {
                            const selected = availableColors.find(c => c.id === Number(val));
                            if (selected) {
                              handleColorChange(cIdx, 'colorName', selected.colorName);
                              handleColorChange(cIdx, 'colorCode', selected.colorCode);
                            }
                          }
                        }}
                        className="w-full px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-primary focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10"
                      >
                        <option value="custom">Custom Color</option>
                        {availableColors.map(c => (
                          <option key={c.id} value={c.id}>{c.colorName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-2">Color Name</label>
                      <input 
                        value={color.colorName}
                        onChange={(e) => handleColorChange(cIdx, 'colorName', e.target.value)}
                        disabled={colorSelectionTypes[cIdx] !== 'custom'}
                        className="w-full px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-primary focus:outline-none focus:border-primary transition-all disabled:bg-primary/5 disabled:text-primary/40 disabled:cursor-not-allowed placeholder:text-primary/40" 
                        placeholder="e.g. Midnight Navy" 
                        type="text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-2">Color Code (Hex)</label>
                      <div className="flex gap-2">
                        <div className="size-12 rounded-lg border border-border-subtle shadow-sm" style={{ backgroundColor: color.colorCode }}></div>
                        <input 
                          value={color.colorCode}
                          onChange={(e) => handleColorChange(cIdx, 'colorCode', e.target.value)}
                          disabled={colorSelectionTypes[cIdx] !== 'custom'}
                          className="flex-1 px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-primary focus:outline-none focus:border-primary uppercase transition-all disabled:bg-primary/5 disabled:text-primary/40 disabled:cursor-not-allowed placeholder:text-primary/40" 
                          type="text"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-primary/50">Product Images</h4>
                        <label className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-primary/20 transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-base font-bold">upload</span> Upload Image
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) addImage(cIdx, file);
                              // Reset input so same file can be selected again if needed
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      <div className="space-y-3">
                        {color.images.map((img, iIdx) => {
                          const uploadKey = `${cIdx}-${iIdx}`;
                          const isUploading = uploading[uploadKey];
                          const fileName = img.image ? img.image.split('/').pop() : 'No image selected';
                          
                          return (
                            <div key={iIdx} className="flex items-center gap-4 bg-transparent py-2 group/img">
                              {/* Preview */}
                              <div 
                                onClick={() => img.image && setSelectedImage(img.image)}
                                className={`size-12 rounded-lg bg-background-soft overflow-hidden shrink-0 relative ${img.image ? 'cursor-pointer' : ''}`}
                              >
                                {img.image ? (
                                  <img className="w-full h-full object-cover" src={img.image} alt="Preview" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-primary/40">
                                    <span className="material-symbols-outlined text-lg">image</span>
                                  </div>
                                )}
                                {isUploading && (
                                  <div className="absolute inset-0 bg-background-light/60 flex items-center justify-center">
                                    <div className="flex space-x-1">
                                      <div className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                      <div className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                      <div className="size-1.5 bg-primary rounded-full animate-bounce"></div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Filename & Error */}
                              <span className="flex-1 text-sm font-semibold text-primary truncate">
                                {uploadErrors[uploadKey] ? (
                                  <span className="text-red-500 font-medium">{uploadErrors[uploadKey]}</span>
                                ) : (
                                  fileName
                                )}
                              </span>

                              {/* Controls */}
                              <div className="flex items-center gap-4 shrink-0">
                                <label className="flex items-center gap-2 cursor-pointer shrink-0 group/main">
                                  <input 
                                    type="checkbox" 
                                    checked={img.isMain}
                                    onChange={(e) => handleImageChange(cIdx, iIdx, 'isMain', e.target.checked)}
                                    className="w-4 h-4 rounded accent-primary text-primary focus:ring-primary border-primary/20 cursor-pointer" 
                                  />
                                  <span className={`text-xs font-bold transition-colors ${img.isMain ? 'text-primary' : 'text-primary/60 group-hover/main:text-primary'}`}>
                                    Main
                                  </span>
                                </label>
                                {iIdx > 0 && (
                                  <button 
                                    onClick={() => removeImage(cIdx, iIdx)}
                                    className="text-primary/40 hover:text-red-500 transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-xl">delete</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Item List (Stock & Size) */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-primary/50">Inventory & Sizes</h4>
                        <button 
                          onClick={() => addSize(cIdx)}
                          className="text-primary text-sm font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">add</span> Add Size
                        </button>
                      </div>
                      <div className="space-y-3">
                        {color.items.map((item, itIdx) => (
                          <div key={itIdx} className="flex items-center gap-3">
                            <div className="flex-1 grid grid-cols-12 gap-3">
                              <div className="col-span-6">
                                <select 
                                  value={item.sizeId}
                                  onChange={(e) => handleItemChange(cIdx, itIdx, 'sizeId', e.target.value)}
                                  className="w-full px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-primary text-sm focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10"
                                >
                                  {sizes.map(size => (
                                    <option key={size.id} value={size.id}>{size.sizeValue}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-6">
                                <input 
                                  value={item.stockQuantity === 0 ? '' : item.stockQuantity}
                                  onChange={(e) => handleItemChange(cIdx, itIdx, 'stockQuantity', e.target.value)}
                                  className="w-full px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-primary text-sm focus:outline-none focus:border-primary transition-all placeholder:text-primary/40" 
                                  placeholder="Stock" 
                                  type="number"
                                />
                              </div>
                            </div>
                            {itIdx > 0 && (
                              <button 
                                onClick={() => removeSize(cIdx, itIdx)}
                                className="text-primary/40 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-lg">close</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Another Color Option Button */}
            <button 
              onClick={addColorOption}
              className="w-full py-8 border-2 border-dashed border-primary/20 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/40 transition-all text-primary/60 hover:text-primary group cursor-pointer"
            >
              <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">add_circle</span>
              <span className="font-bold tracking-wide">Add Another Color Option</span>
            </button>
          </div>
        </div>

        {/* Page Footer */}
          <div className="flex items-center justify-end pt-8 pb-12 border-t border-border-subtle">
            <div className="flex gap-4">
              <button 
                onClick={handleCancel}
                className="px-8 py-3 bg-background-light border border-border-subtle text-primary/60 font-bold rounded-lg hover:bg-background-soft transition-all cursor-pointer"
              >
                Cancel & Exit
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-10 py-3 bg-primary text-white dark:text-background-light font-bold rounded-lg shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Publishing...' : 'Publish Product'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white hover:text-primary transition-colors cursor-pointer z-[101]"
          >
            <span className="material-symbols-outlined text-4xl">close</span>
          </button>
          <div 
            className="max-w-4xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedImage} 
              alt="Full view" 
              className="w-full h-full object-contain bg-background-light" 
              referrerPolicy="no-referrer" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
