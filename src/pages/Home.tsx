import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import AddReviewModal from '../components/AddReviewModal';
import { bannerApi, productApi, reviewApi, userApi } from '../services/api';
import { Banner, Product, Review, User } from '../types';
import { formatRelativeTime, isUpdated } from '../services/dateUtils';

export default function Home() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [mostLikedProducts, setMostLikedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reviewsScrollRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);
  const heroTextY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);

  useEffect(() => {
    if (loading || reviews.length === 0) return;

    const interval = setInterval(() => {
      if (!isPaused && reviewsScrollRef.current) {
        const container = reviewsScrollRef.current;
        container.scrollLeft += 1;
        
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isPaused, loading, reviews.length]);

  const fetchReviews = async () => {
    try {
      const reviewsRes = await reviewApi.getSiteReviews({ page: 0, size: 10 });
      if (reviewsRes.data.success) {
        const reviewsData = reviewsRes.data.data.content;
        // Fetch users for each review in parallel
        const reviewsWithUsers = await Promise.all(reviewsData.map(async (review) => {
          try {
            const userRes = await userApi.getUserById(review.userId);
            return { ...review, user: userRes.data.data };
          } catch (err) {
            console.error(`Error fetching user ${review.userId}:`, err);
            return { 
              ...review, 
              user: { 
                firstName: 'User', 
                lastName: '', 
                profilePicture: null,
                id: review.userId,
                username: '',
                email: '',
                phoneNumber: '',
                gender: 'MALE',
                birthDate: '',
                role: 'USER',
                status: 'ACTIVE',
                twoFactorEnabled: false,
                emailVerified: false,
                phoneNumberVerified: false
              } as User
            };
          }
        }));
        setReviews(reviewsWithUsers);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannerRes, productsRes] = await Promise.all([
          bannerApi.getHomeBanner(),
          productApi.getMostLiked()
        ]);

        if (bannerRes.data.success) setBanner(bannerRes.data.data);
        if (productsRes.data.success) setMostLikedProducts(productsRes.data.data);
        
        await fetchReviews();
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLike = async (productId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await productApi.like(productId);
      setMostLikedProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, liked: !p.liked } : p
      ));
      if (selectedProduct?.id === productId) {
        setSelectedProduct(prev => prev ? { ...prev, liked: !prev.liked } : null);
      }
    } catch (error) {
      console.error('Error liking product:', error);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1.0,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <div className="bg-background-light text-primary antialiased overflow-x-hidden transition-colors duration-300 pt-20">
      <Header />
      
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Hero Section */}
      <section className="relative h-[90vh] w-full flex items-center overflow-hidden bg-background-soft">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="absolute inset-0 z-0"
        >
          {!bannerLoaded && banner?.imageUrl && (
            <div className="absolute inset-0 bg-background-soft flex items-center justify-center z-20">
              <div className="flex items-center gap-1.5 h-12">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-1.5 bg-primary/30 rounded-full animate-music-bar"
                    style={{ 
                      height: '100%',
                      animationDelay: `${i * 0.15}s`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          )}
          
          <picture>
            <source media="(max-width: 768px)" srcSet={banner?.mobileImageUrl || banner?.imageUrl} />
            <img 
              alt={banner?.title || "Premium fashion model"} 
              className={`w-full h-full object-cover object-top transition-opacity duration-1000 ${bannerLoaded ? 'opacity-100' : 'opacity-0'}`} 
              src={banner?.imageUrl} 
              onLoad={() => setBannerLoaded(true)}
              referrerPolicy="no-referrer"
            />
          </picture>
          <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/30 to-transparent"></div>
        </motion.div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full">
          <motion.div 
            style={{ y: heroTextY }}
            className="max-w-2xl flex flex-col gap-8"
          >
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="text-white text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase drop-shadow-2xl">
                {banner?.title || "Define Your Style"}
              </h2>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-white/95 text-xl md:text-2xl font-light leading-relaxed max-w-lg tracking-wide drop-shadow-lg"
            >
              {banner?.subtitle || "Curated collections for the modern individual. Experience the pinnacle of minimalist premium fashion."}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="pt-4"
            >
              <Link 
                to={banner?.buttonLink || "/products"} 
                className="inline-block bg-primary dark:bg-background-light text-background-light dark:text-primary px-12 py-5 text-sm font-bold uppercase tracking-[0.2em] rounded-none transition-all hover:bg-background-light dark:hover:bg-primary hover:text-primary dark:hover:text-background-light shadow-2xl"
              >
                {banner?.buttonText || "Shop Now"}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-32 px-6 lg:px-10 max-w-7xl mx-auto">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8"
        >
          <motion.div variants={itemVariants} className="max-w-xl">
            <span className="text-primary text-xs font-bold uppercase tracking-[0.5em] block mb-4">The Selection</span>
            <h3 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4">Top 10 Products</h3>
            <p className="text-primary/70 font-light text-lg">Our most coveted pieces, handpicked for their exceptional design and quality.</p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => scroll('left')}
                className="size-12 border border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white dark:hover:text-background-light transition-all rounded-full cursor-pointer group"
              >
                <span className="material-symbols-outlined transition-transform">west</span>
              </button>
              <button 
                onClick={() => scroll('right')}
                className="size-12 border border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white dark:hover:text-background-light transition-all rounded-full cursor-pointer group"
              >
                <span className="material-symbols-outlined transition-transform">east</span>
              </button>
            </div>
            <Link className="text-sm font-bold uppercase tracking-[0.2em] border-b-2 border-primary pb-1 hover:text-primary/70 hover:border-primary/70 transition-all" to="/products">Explore All</Link>
          </motion.div>
        </motion.div>
        
        <motion.div 
          ref={scrollRef}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="flex overflow-x-auto gap-10 pb-12 no-scrollbar scroll-smooth snap-x"
        >
          {mostLikedProducts.map((product) => (
            <motion.div 
              key={product.id} 
              variants={itemVariants}
              className="flex-shrink-0 snap-start w-[85vw] md:w-[calc(33.333%-1.75rem)] lg:w-[calc(25%-1.875rem)]"
            >
              <ProductCard
                product={product}
                isLiked={product.liked}
                onLike={handleLike}
                onQuickView={setSelectedProduct}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Category Section */}
      <section className="py-16 px-6 lg:px-10 bg-background-soft">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-7xl mx-auto">
          {/* Men Category */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -10 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[16/9] md:aspect-[4/5] group overflow-hidden cursor-pointer shadow-xl"
          >
            <img 
              alt="Men's Collection" 
              className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
              src="https://foxwear-images.s3.eu-north-1.amazonaws.com/9752eed7-83c0-4ca8-913a-206897004977_category-men.jpg" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/40"></div>
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="text-center transform transition-transform duration-700 group-hover:-translate-y-4">
                <span className="text-white/80 text-xs font-bold uppercase tracking-[0.5em] mb-4 block">Essentials</span>
                <h3 className="text-white text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 drop-shadow-2xl">Men</h3>
                <Link to="/products?gender=MALE" className="inline-block bg-white dark:bg-background-light text-primary px-10 py-4 text-xs font-bold uppercase tracking-[0.3em] hover:bg-primary hover:text-white dark:hover:text-background-light transition-all shadow-xl">Shop Now</Link>
              </div>
            </div>
          </motion.div>
          
          {/* Women Category */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -10 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[16/9] md:aspect-[4/5] group overflow-hidden cursor-pointer shadow-xl"
          >
            <img 
              alt="Women's Collection" 
              className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
              src="https://foxwear-images.s3.eu-north-1.amazonaws.com/01ec34a5-251e-434c-b5d5-5f997c9d2072_category-women.jpg" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/40"></div>
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="text-center transform transition-transform duration-700 group-hover:-translate-y-4">
                <span className="text-white/80 text-xs font-bold uppercase tracking-[0.5em] mb-4 block">Elegance</span>
                <h3 className="text-white text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 drop-shadow-2xl">Women</h3>
                <Link to="/products?gender=FEMALE" className="inline-block bg-white dark:bg-background-light text-primary px-10 py-4 text-xs font-bold uppercase tracking-[0.3em] hover:bg-primary hover:text-white dark:hover:text-background-light transition-all shadow-xl">Shop Now</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-32 px-6 lg:px-10 border-b border-primary/5 bg-background-light">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8"
          >
            <motion.div variants={itemVariants} className="max-w-xl">
              <span className="text-primary text-xs font-bold uppercase tracking-[0.5em] block mb-4">Community</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-6">What Our Customers Say</h2>
              <p className="text-primary/70 font-light text-lg">Join thousands of satisfied customers who have experienced the FoxWear difference in quality and style.</p>
            </motion.div>
            <motion.div variants={itemVariants} className="flex items-center gap-6">
              <Link className="text-sm font-bold uppercase tracking-[0.2em] border-b-2 border-primary pb-1 hover:text-primary/70 hover:border-primary/70 transition-all" to="/reviews">View All</Link>
            </motion.div>
          </motion.div>
          
          <motion.div 
            ref={reviewsScrollRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex overflow-x-auto gap-10 pb-12 no-scrollbar"
          >
            {[...reviews, ...reviews].map((review, index) => (
              <div key={`${review.id}-${index}`} className="flex-shrink-0 w-[85vw] md:w-[calc(50%-1.25rem)] lg:w-[calc(33.333%-1.67rem)] flex flex-col gap-8 p-10 bg-background-soft border border-primary/5 rounded-none transition-all hover:shadow-2xl">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span 
                      key={i} 
                      className={`material-symbols-outlined text-xl ${
                        i < review.rate 
                          ? 'text-yellow-500 icon-fill' 
                          : 'text-primary/20'
                      }`}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="text-primary/80 italic text-lg leading-relaxed font-light">"{review.description}"</p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border border-primary/10">
                    {review.user?.profilePicture ? (
                      <img src={review.user.profilePicture} alt={review.user.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="material-symbols-outlined text-2xl">person</span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-sm uppercase tracking-widest block">{review.user?.firstName} {review.user?.lastName?.charAt(0)}.</span>
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="text-xs text-primary/40 uppercase tracking-widest">Verified Buyer</span>
                      <span className="text-[10px] text-primary/20">•</span>
                      <span className="text-[10px] text-primary/40 uppercase tracking-widest">
                        {isUpdated(review.createdAt, review.updatedAt) && <span className="text-primary/60 font-bold mr-1">(UPDATED)</span>}
                        {formatRelativeTime(review.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, delay: 0.5 }}
            className="flex justify-center mt-12"
          >
            <button 
              onClick={() => setIsReviewModalOpen(true)}
              className="group flex items-center gap-3 border-2 border-primary text-primary px-12 py-5 rounded-none font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-white dark:hover:text-background-light transition-all cursor-pointer shadow-xl"
            >
              <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
              Add Review
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />

      <QuickViewModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onLike={handleLike}
        isLiked={selectedProduct?.liked || false}
      />

      <AddReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={fetchReviews}
      />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes music-bar {
          0%, 100% { transform: scaleY(0.3); opacity: 0.3; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        .animate-music-bar {
          animation: music-bar 1s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}
