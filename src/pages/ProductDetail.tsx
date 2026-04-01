import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { productApi, reviewApi, userApi } from '../services/api';
import { Product, Review, User, ApiResponse, ProductColor, ProductItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isLoggedIn, userProfile } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductItem | null>(null);
  const [mainImage, setMainImage] = useState<string>('');
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRate, setAverageRate] = useState<number>(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({ rate: 5, description: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showFlyItem, setShowFlyItem] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await productApi.getBySlug(slug!);
      if (response.data.success) {
        const prod = response.data.data;
        setProduct(prod);
        
        // Default selections
        if (prod.colors && prod.colors.length > 0) {
          const firstColor = prod.colors[0];
          setSelectedColor(firstColor);
          
          const mainImg = firstColor.images.find(img => img.main)?.image || firstColor.images[0]?.image;
          setMainImage(mainImg || '');
          
          if (firstColor.items && firstColor.items.length > 0) {
            setSelectedSize(firstColor.items[0]);
          }
        }
        
        fetchReviews(prod.id);
        fetchAverageRate(prod.id);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (productId: number, page = 0) => {
    setReviewsLoading(true);
    try {
      const response = await reviewApi.getProductReviews(productId, { page, size: 10 });
      if (response.data.success) {
        const content = response.data.data.content;
        
        // Fetch user info for each review
        const reviewsWithUsers = await Promise.all(content.map(async (review) => {
          try {
            const userRes = await userApi.getUserById(review.userId);
            return { ...review, user: userRes.data.data };
          } catch (e: any) {
            // Suppress 404 console error as per user request
            return { ...review, user: null };
          }
        }));
        
        if (page === 0) {
          setReviews(reviewsWithUsers);
        } else {
          setReviews(prev => [...prev, ...reviewsWithUsers]);
        }
        setTotalReviews(response.data.data.totalElements);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchAverageRate = async (productId: number) => {
    try {
      const response = await reviewApi.getProductAverageRate(productId);
      if (response.data.success) {
        setAverageRate(response.data.data ?? 0);
      }
    } catch (err) {
      console.error('Error fetching average rate:', err);
    }
  };

  const handleColorSelect = (color: ProductColor) => {
    setSelectedColor(color);
    const mainImg = color.images.find(img => img.main)?.image || color.images[0]?.image;
    setMainImage(mainImg || '');
    
    // Select first available size for this color
    if (color.items && color.items.length > 0) {
      setSelectedSize(color.items[0]);
    } else {
      setSelectedSize(null);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    
    try {
      await addToCart(selectedSize.id, 1);
      // Trigger fly animation
      setShowFlyItem(mainImage);
      setTimeout(() => setShowFlyItem(null), 1000);
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!product) return;
    
    try {
      await productApi.like(product.id);
      setProduct(prev => prev ? { ...prev, liked: !prev.liked } : null);
    } catch (err) {
      console.error('Error liking product:', err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!product) return;
    
    setSubmittingReview(true);
    try {
      const response = await reviewApi.createProductReview(product.id, newReview);
      if (response.data.success) {
        setIsReviewModalOpen(false);
        setNewReview({ rate: 5, description: '' });
        // Refresh reviews
        fetchReviews(product.id, 0);
        fetchAverageRate(product.id);
        setReviewsPage(0);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <h2 className="text-2xl font-black text-primary mb-4 uppercase tracking-tighter">{error || 'Product not found'}</h2>
          <Link to="/products" className="text-primary dark:text-white underline font-bold uppercase tracking-widest text-sm">Back to Products</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8 flex-1">
        {/* Breadcrumbs */}
        <nav className="flex text-xs font-medium text-slate-500 dark:text-slate-400 mb-8">
          <Link className="hover:text-primary transition-colors" to="/">Home</Link>
          <span className="mx-2">/</span>
          <Link className="hover:text-primary transition-colors" to="/products">Collections</Link>
          <span className="mx-2">/</span>
          <span className="text-primary font-semibold">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Product Gallery (Left) */}
          <div className="lg:col-span-7">
            <div className="flex flex-col-reverse md:flex-row gap-4">
              {/* Thumbnails */}
              <div className="md:w-20 flex md:flex-col gap-4 overflow-x-auto scrollbar-hide">
                {selectedColor?.images.map((img, idx) => (
                  <div 
                    key={img.id}
                    onClick={() => setMainImage(img.image)}
                    className={`aspect-square w-20 shrink-0 cursor-pointer border-2 transition-all ${mainImage === img.image ? 'border-primary' : 'border-transparent hover:border-primary/50'}`}
                  >
                    <img alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" src={img.image} referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              {/* Main Image */}
              <div className="flex-1 aspect-[4/5] bg-primary/5 rounded-lg overflow-hidden group relative">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={mainImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    alt={product.title} 
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" 
                    src={mainImage} 
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
                {product.hasDiscount && (
                  <div className="absolute top-4 left-4 bg-primary text-white dark:text-slate-950 text-xs font-bold px-3 py-1.5 rounded-none uppercase tracking-widest shadow-lg">
                    -{product.discountRate}%
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Info (Right) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="border-b border-primary/10 pb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1 leading-tight tracking-tight">{product.title}</h1>
              <p className="text-primary font-medium tracking-widest text-[10px] uppercase mb-4 opacity-70">FoxWear Signature Collection</p>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  ₼{product.hasDiscount ? product.discountPrice.toFixed(2) : product.originalPrice.toFixed(2)}
                </span>
                {product.hasDiscount && (
                  <>
                    <span className="text-base text-slate-400 line-through">₼{product.originalPrice.toFixed(2)}</span>
                    <span className="bg-primary text-white dark:text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded">SAVE {product.discountRate}%</span>
                  </>
                )}
              </div>
            </div>

            <div className="py-6 space-y-6">
              {/* Color Selection */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3">Color: <span className="text-primary">{selectedColor?.colorName}</span></p>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button 
                      key={color.id}
                      onClick={() => handleColorSelect(color)}
                      className={`size-8 rounded-full border-2 p-0.5 transition-all cursor-pointer ${selectedColor?.id === color.id ? 'border-primary' : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'}`}
                    >
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: color.colorCode }}></div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <div className="flex justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest">Select Size</p>
                  <button className="text-[10px] font-bold text-primary dark:text-white underline uppercase tracking-widest cursor-pointer">Size Guide</button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {selectedColor?.items.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => setSelectedSize(item)}
                      disabled={item.stockRemaining === 0}
                      className={`border py-2 text-xs transition-all cursor-pointer text-slate-900 dark:text-slate-100 ${
                        selectedSize?.id === item.id 
                          ? 'border-2 border-primary font-bold' 
                          : 'border-slate-200 dark:border-slate-700 font-medium hover:border-primary'
                      } ${item.stockRemaining === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                      {item.productSize.sizeValue}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Info */}
              {selectedSize && selectedSize.stockRemaining > 0 && selectedSize.stockRemaining <= 5 && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 animate-pulse">
                  <span className="material-symbols-outlined text-base">warning</span>
                  <p className="text-xs font-bold uppercase tracking-tighter">Only {selectedSize.stockRemaining} left in stock - rare collection item</p>
                </div>
              )}

              {/* SKU Info */}
              {selectedSize && (
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">SKU: {selectedSize.sku}</p>
              )}

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary text-white dark:text-slate-950 py-3 rounded-lg font-bold tracking-widest uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-3 shadow-lg cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">shopping_cart</span>
                  Add to Cart
                </button>
                <button 
                  onClick={handleLike}
                  className={`aspect-square w-12 border rounded-lg flex items-center justify-center transition-all cursor-pointer ${product.liked ? 'bg-primary text-white dark:text-slate-950 border-primary' : 'border-primary text-primary dark:text-white hover:bg-primary hover:text-white dark:hover:text-slate-950'}`}
                >
                  <span className={`material-symbols-outlined text-xl ${product.liked ? 'icon-fill' : ''}`}>favorite</span>
                </button>
              </div>

              {/* Description */}
              <div className="pt-6 border-t border-primary/10">
                <p className="text-xs font-bold uppercase tracking-widest mb-3">Description</p>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs space-y-3">
                  <p>{product.description}</p>
                </div>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider">
                    <span className="material-symbols-outlined text-primary text-xs">check_circle</span> 
                    Artisanal Craftsmanship
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider">
                    <span className="material-symbols-outlined text-primary text-xs">check_circle</span> 
                    Premium Materials
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider">
                    <span className="material-symbols-outlined text-primary text-xs">check_circle</span> 
                    Signature FoxWear Tailoring
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-16 pt-12 border-t border-primary/10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
            <div>
              <h2 className="text-xl font-bold mb-2 uppercase tracking-tight">Customer Reviews</h2>
              <div className="flex items-center gap-3">
                <div className="flex text-primary">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`material-symbols-outlined text-sm ${averageRate >= star - 0.5 ? 'icon-fill' : ''}`}>
                      {averageRate >= star ? 'star' : averageRate >= star - 0.5 ? 'star_half' : 'star'}
                    </span>
                  ))}
                </div>
                <span className="text-xs font-bold">{averageRate.toFixed(1)} out of 5 ({totalReviews} reviews)</span>
              </div>
            </div>
            <button 
              onClick={() => setIsReviewModalOpen(true)}
              className="bg-primary/10 text-primary dark:text-white border border-primary px-6 py-2.5 rounded-lg font-bold text-xs hover:bg-primary hover:text-white dark:hover:text-slate-950 transition-all flex items-center gap-2 uppercase tracking-widest shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">edit_square</span>
              Add New Review
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((review) => (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-primary/5 flex gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="shrink-0">
                  <div className="size-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-bold uppercase tracking-tighter text-sm">
                    {review.user?.profilePicture ? (
                      <img alt={review.user.firstName} className="w-full h-full object-cover" src={review.user.profilePicture} referrerPolicy="no-referrer" />
                    ) : (
                      review.user?.firstName?.charAt(0) || 'A'
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex text-primary mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={`material-symbols-outlined text-[10px] ${review.rate >= star ? 'icon-fill' : ''}`}>star</span>
                    ))}
                  </div>
                  <p className="text-slate-900 dark:text-slate-100 font-bold mb-1 uppercase tracking-tight text-xs">Verified Experience</p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-3 italic">"{review.description}"</p>
                  <div className="flex items-center justify-between">
                    <p className="text-primary font-bold text-[10px] uppercase tracking-widest">
                      {review.user ? `${review.user.firstName} ${review.user.lastName?.charAt(0)}.` : 'Anonymous'}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                      {review.createdAt && new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {reviews.length < totalReviews && (
            <div className="mt-12 text-center">
              <button 
                onClick={() => {
                  const nextPage = reviewsPage + 1;
                  setReviewsPage(nextPage);
                  fetchReviews(product.id, nextPage);
                }}
                disabled={reviewsLoading}
                className="text-sm font-bold text-primary dark:text-white underline uppercase tracking-[0.2em] hover:opacity-70 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {reviewsLoading ? 'Loading...' : 'View More Reviews'}
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
      
      {/* Flying Item Animation */}
      <AnimatePresence>
        {showFlyItem && (
          <motion.div
            initial={{ 
              position: 'fixed',
              top: '50%',
              left: '50%',
              x: '-50%',
              y: '-50%',
              scale: 1,
              opacity: 1,
              zIndex: 9999
            }}
            animate={{ 
              top: '20px',
              left: 'calc(100% - 100px)',
              scale: 0.1,
              opacity: 0,
            }}
            transition={{ 
              duration: 0.8,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="size-40 rounded-xl overflow-hidden shadow-2xl pointer-events-none"
          >
            <img src={showFlyItem} alt="Flying item" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-background-light dark:bg-background-dark w-full max-w-lg p-10 rounded-2xl shadow-2xl border border-primary/10"
            >
              <h3 className="text-2xl font-black uppercase tracking-tighter text-primary mb-6">Share Your Experience</h3>
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-3">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview(prev => ({ ...prev, rate: star }))}
                        className={`material-symbols-outlined text-3xl transition-all cursor-pointer ${newReview.rate >= star ? 'text-primary icon-fill' : 'text-primary/20'}`}
                      >
                        star
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-3">Your Thoughts</label>
                  <textarea 
                    required
                    value={newReview.description}
                    onChange={(e) => setNewReview(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-primary/5 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary min-h-[120px] dark:text-white"
                    placeholder="Describe the quality, fit, and feel..."
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    disabled={submittingReview}
                    className="flex-1 bg-primary text-white dark:text-slate-950 py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg cursor-pointer"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="flex-1 border border-primary text-primary dark:text-white py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
