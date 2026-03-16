import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { bannerApi, productApi, reviewApi } from './services/api';
import { Banner, Product, Review } from './types';

export default function Home() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [mostLikedProducts, setMostLikedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannerRes, productsRes, reviewsRes] = await Promise.all([
          bannerApi.getHomeBanner(),
          productApi.getMostLiked(),
          reviewApi.getFirst10()
        ]);

        if (bannerRes.data.success) setBanner(bannerRes.data.data);
        if (productsRes.data.success) setMostLikedProducts(productsRes.data.data);
        if (reviewsRes.data.success) setReviews(reviewsRes.data.data);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLike = async (productId: number) => {
    try {
      await productApi.like(productId);
      // Optionally update local state if needed, but the API might not return the new like count
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

  return (
    <div className="bg-background-light text-primary antialiased overflow-x-hidden transition-colors duration-300 pt-20">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[90vh] w-full flex items-center overflow-hidden bg-background-soft">
        <div className="absolute inset-0 z-0">
          {/* Skeleton Loader / Placeholder Background */}
          {!bannerLoaded && (
            <div className="absolute inset-0 bg-background-soft animate-pulse flex items-center justify-center">
              <div className="w-24 h-24 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
          
          <picture>
            <source media="(max-width: 768px)" srcSet={banner?.mobileImageUrl || banner?.imageUrl} />
            <img 
              alt={banner?.title || "Premium fashion model"} 
              className={`w-full h-full object-cover object-top transition-opacity duration-1000 ${bannerLoaded ? 'opacity-100' : 'opacity-0'}`} 
              src={banner?.imageUrl || "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop"} 
              onLoad={() => setBannerLoaded(true)}
              referrerPolicy="no-referrer"
            />
          </picture>
          {/* Enhanced Overlay for Legibility */}
          <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/30 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full">
          <div className="max-w-2xl flex flex-col gap-8">
            <div className="overflow-hidden">
              <h2 className="text-white text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase drop-shadow-2xl animate-in slide-in-from-bottom-10 duration-1000">
                {banner?.title || "Define Your Style"}
              </h2>
            </div>
            <p className="text-white/95 text-xl md:text-2xl font-light leading-relaxed max-w-lg tracking-wide drop-shadow-lg animate-in fade-in duration-1000 delay-300">
              {banner?.subtitle || "Curated collections for the modern individual. Experience the pinnacle of minimalist premium fashion."}
            </p>
            <div className="pt-4 animate-in fade-in duration-1000 delay-500">
              <Link 
                to={banner?.buttonLink || "/products"} 
                className="inline-block bg-white dark:bg-background-light text-primary px-12 py-5 text-sm font-bold uppercase tracking-[0.2em] rounded-none transition-all hover:bg-primary hover:text-white dark:hover:text-background-light shadow-2xl"
              >
                {banner?.buttonText || "Shop Now"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-32 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-xl">
            <span className="text-primary text-xs font-bold uppercase tracking-[0.5em] block mb-4">The Selection</span>
            <h3 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4">Top 10 Products</h3>
            <p className="text-primary/70 font-light text-lg">Our most coveted pieces, handpicked for their exceptional design and quality.</p>
          </div>
          <div className="flex items-center gap-6">
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
          </div>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-10 pb-12 no-scrollbar scroll-smooth snap-x"
        >
          {mostLikedProducts.map((product) => {
            const mainColor = product.colors[0];
            const mainImage = mainColor?.images.find(img => img.main)?.image || mainColor?.images[0]?.image;

            return (
              <div key={product.id} className="flex-shrink-0 group cursor-pointer snap-start w-[85vw] md:w-[calc(33.333%-1.75rem)] lg:w-[calc(25%-1.875rem)]">
                <div className="aspect-[3/4] overflow-hidden mb-6 relative bg-background-soft">
                  <Link to={`/products/${product.slug}`}>
                    <img 
                      alt={product.title} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                      src={mainImage} 
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                  <button 
                    onClick={() => handleLike(product.id)}
                    className="absolute top-4 right-4 z-20 size-10 bg-white/90 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-primary transition-all duration-300 group/wishlist cursor-pointer shadow-lg"
                  >
                    <span className="material-symbols-outlined text-xl leading-none group-hover/wishlist:[font-variation-settings:'FILL'_1] transition-all">favorite</span>
                  </button>
                  {product.hasDiscount && (
                    <div className="absolute top-4 left-4 bg-primary text-white dark:text-background-light text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">
                      Sale -{product.discountRate}%
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest truncate flex-grow group-hover:text-primary transition-colors">{product.title}</h4>
                    <div className="flex gap-1.5 pt-0.5">
                      {product.colors.slice(0, 3).map((color) => (
                        <span 
                          key={color.id} 
                          className="size-3 rounded-full border border-black/10 shadow-xs" 
                          style={{ backgroundColor: color.colorCode }}
                          title={color.colorName}
                        ></span>
                      ))}
                    </div>
                  </div>
                  <p className="text-primary font-bold text-lg">
                    {product.hasDiscount ? (
                      <span className="flex items-center gap-3">
                        <span className="line-through text-primary/40 text-sm font-light">₼{product.originalPrice}</span>
                        <span>₼{product.discountPrice}</span>
                      </span>
                    ) : (
                      `₼${product.originalPrice}`
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Category Section */}
      <section className="py-16 px-6 lg:px-10 bg-background-soft">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-7xl mx-auto">
          {/* Men Category */}
          <div className="relative aspect-[16/9] md:aspect-[4/5] group overflow-hidden cursor-pointer">
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
          </div>
          {/* Women Category */}
          <div className="relative aspect-[16/9] md:aspect-[4/5] group overflow-hidden cursor-pointer">
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
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-32 px-6 lg:px-10 border-b border-primary/5 bg-background-light">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-primary text-xs font-bold uppercase tracking-[0.5em] block mb-4">Community</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-6">What Our Customers Say</h2>
            <p className="text-primary/70 font-light text-lg max-w-2xl mx-auto">Join thousands of satisfied customers who have experienced the FoxWear difference in quality and style.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
            {reviews.map((review, index) => (
              <div key={index} className="flex flex-col gap-8 p-10 bg-background-soft border border-primary/5 rounded-none transition-all hover:shadow-2xl">
                <div className="flex text-primary">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`material-symbols-outlined text-xl ${i < review.rate ? '[font-variation-settings:\'FILL\'_1]' : ''}`}>star</span>
                  ))}
                </div>
                <p className="text-primary/80 italic text-lg leading-relaxed font-light">"{review.description}"</p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border border-primary/10">
                    {review.user.profilePicture ? (
                      <img src={review.user.profilePicture} alt={review.user.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="material-symbols-outlined text-2xl">person</span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-sm uppercase tracking-widest block">{review.user.firstName} {review.user.lastName.charAt(0)}.</span>
                    <span className="text-xs text-primary/40 uppercase tracking-widest">Verified Buyer</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button className="group flex items-center gap-3 border-2 border-primary text-primary px-12 py-5 rounded-none font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-white dark:hover:text-background-light transition-all cursor-pointer shadow-xl">
              <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
              Write a Review
            </button>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
