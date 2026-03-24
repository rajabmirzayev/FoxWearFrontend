import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { productApi } from '../services/api';
import { Product } from '../types';

export default function Collections() {
  const [mostLikedProducts, setMostLikedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = await productApi.getMostLiked();
        if (productsRes.data.success) {
          setMostLikedProducts(productsRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching collections data:', error);
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
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-primary font-display min-h-screen transition-colors duration-300 pt-20">
      <Header />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        {/* Page Title */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-black tracking-tighter mb-4 text-primary dark:text-slate-100 uppercase">Our Collections</h1>
          <p className="text-primary/60 dark:text-slate-400 max-w-xl text-lg font-light">
            Curated essentials for the modern minimalist. Discover timeless pieces designed with precision and premium craftsmanship.
          </p>
        </motion.div>

        {/* Collections Bento Grid */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 grid-rows-2 gap-4 h-auto lg:h-[800px] mb-24"
        >
          {/* Tops & Outerwear (Formerly Men) */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-2 lg:col-span-2 row-span-2 group relative overflow-hidden bg-primary/10 rounded-xl"
          >
            <img 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              src="https://foxwear-images.s3.eu-north-1.amazonaws.com/ae31c8c8-a17c-482d-9b2c-cd225055afdd_04269189401-a1.jpg"
              alt="Tops & Outerwear"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
              <h3 className="text-3xl font-bold text-white mb-2 uppercase tracking-tighter">Tops & Outerwear</h3>
              <Link className="text-white/80 text-sm font-medium underline underline-offset-4 hover:text-white" to="/products?parent=Tops,Outerwear">Shop Essentials</Link>
            </div>
          </motion.div>

          {/* Bottoms (Formerly Women) */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-2 lg:col-span-4 row-span-1 group relative overflow-hidden bg-primary/10 rounded-xl"
          >
            <img 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              src="https://foxwear-images.s3.eu-north-1.amazonaws.com/a6592b89-d0e4-4f0c-9537-a30f0db040f0_05247400832-000-a4.jpg"
              alt="Bottoms"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
              <h3 className="text-3xl font-bold text-white mb-2 uppercase tracking-tighter">Bottoms</h3>
              <Link className="text-white/80 text-sm font-medium underline underline-offset-4 hover:text-white" to="/products?parent=Bottoms">View Collection</Link>
            </div>
          </motion.div>

          {/* Footwear (Formerly Outerwear) */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-2 lg:col-span-2 row-span-1 group relative overflow-hidden bg-primary/10 rounded-xl"
          >
            <img 
              className="w-full h-full object-cover object-bottom transition-transform duration-700 group-hover:scale-110" 
              src="https://foxwear-images.s3.eu-north-1.amazonaws.com/7e543d2a-f01a-40f5-93da-7efd176af795_12614721102-a3.jpg"
              alt="Footwear"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 flex flex-col items-start">
              <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-tighter">Footwear</h3>
              <Link className="text-white/80 text-[10px] font-medium underline underline-offset-4 hover:text-white uppercase tracking-widest" to="/products?parent=Footwear">Shop Now</Link>
            </div>
          </motion.div>

          {/* Activewear (Formerly Accessories) */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-2 lg:col-span-2 row-span-1 group relative overflow-hidden bg-primary/10 rounded-xl"
          >
            <img 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              src="https://foxwear-images.s3.eu-north-1.amazonaws.com/e3882073-7e16-42b2-b838-be227e2e2640_T9555968693-ult3.jpg"
              alt="Activewear"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 flex flex-col items-start">
              <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-tighter">Activewear</h3>
              <Link className="text-white/80 text-[10px] font-medium underline underline-offset-4 hover:text-white uppercase tracking-widest" to="/products?parent=Activewear">Shop Now</Link>
            </div>
          </motion.div>
        </motion.section>

        {/* Secondary Grid Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 h-96 mb-24">
          {/* Loungewear & Underwear (Formerly Trousers) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative overflow-hidden bg-primary/10 rounded-xl"
          >
            <img 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              src="https://foxwear-images.s3.eu-north-1.amazonaws.com/b3f2f9d4-8ebd-498a-9383-f67774961be4_manito-silk-DSKNz2MZWW4-unsplash-2.jpg"
              alt="Loungewear & Underwear"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 flex flex-col items-start">
              <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Loungewear & Underwear</h3>
              <Link className="text-white/80 text-xs font-medium underline underline-offset-4 hover:text-white uppercase tracking-widest mt-2" to="/products?parent=Loungewear %26 Underwear">Shop Now</Link>
            </div>
          </motion.div>

          {/* Accessories (Formerly Shoes) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative overflow-hidden bg-primary/10 rounded-xl"
          >
            <img 
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" 
              src="https://foxwear-images.s3.eu-north-1.amazonaws.com/031d2df4-9e89-440c-af4f-d8e5d818c18b_photo-1595367555510-0428cca40e16.avif"
              alt="Accessories"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 flex flex-col items-start">
              <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Accessories</h3>
              <Link className="text-white/80 text-xs font-medium underline underline-offset-4 hover:text-white uppercase tracking-widest mt-2" to="/products?parent=Accessories">Shop Now</Link>
            </div>
          </motion.div>
        </section>

        {/* Creative Style Lookbook Section */}
        <section className="relative h-[600px] mb-24 rounded-2xl overflow-hidden group">
          <img 
            className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105" 
            src="https://foxwear-images.s3.eu-north-1.amazonaws.com/b8b698f4-d1d3-46a2-add9-27baffe97d53_hannah-morgan-ycVFts5Ma4s-unsplash-2.jpg"
            alt="Lookbook"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-primary/20 backdrop-brightness-75"></div>
          <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
            <span className="text-white text-sm tracking-[0.3em] uppercase mb-4">Edition 2024</span>
            <h2 className="text-white text-6xl md:text-8xl font-black mb-8 tracking-tighter uppercase leading-[0.9]">The Quiet<br/>Luxury Edit</h2>
            <Link className="bg-white text-primary px-10 py-4 font-bold rounded-lg hover:bg-primary hover:text-white transition-colors uppercase text-sm tracking-widest" to="/products">Explore Lookbook</Link>
          </div>
        </section>

        {/* Top 10 Liked Products */}
        <section className="mb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="max-w-xl">
              <span className="text-primary text-xs font-bold uppercase tracking-[0.5em] block mb-4">The Selection</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4 text-primary dark:text-slate-100">Top 10 Most Liked</h2>
              <p className="text-primary/60 dark:text-slate-400 font-light text-lg">Our community's favorite pieces this week.</p>
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
              <Link className="text-sm font-bold uppercase tracking-[0.2em] border-b-2 border-primary pb-1 hover:text-primary/70 hover:border-primary/70 transition-all text-primary dark:text-slate-200" to="/products">Explore All</Link>
            </div>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-6 no-scrollbar pb-6 scroll-smooth snap-x"
          >
            {mostLikedProducts.map((product) => (
              <div key={product.id} className="min-w-[280px] snap-start">
                <ProductCard
                  product={product}
                  isLiked={product.liked}
                  onLike={handleLike}
                  onQuickView={setSelectedProduct}
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />

      <QuickViewModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onLike={handleLike}
        isLiked={selectedProduct?.liked || false}
      />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
