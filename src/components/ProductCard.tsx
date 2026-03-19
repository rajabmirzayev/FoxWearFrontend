import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isLiked: boolean;
  onLike: (productId: number, e: React.MouseEvent) => void;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, isLiked, onLike, onQuickView }) => {
  const mainImage = product.colors[0]?.images.find(img => img.main)?.image || product.colors[0]?.images[0]?.image;
  const hoverImage = product.colors[0]?.images.find(img => !img.main)?.image || mainImage;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-primary/5 rounded-lg mb-4">
        <Link to={`/products/${product.slug}`}>
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
        </Link>

        {product.hasDiscount && (
          <div className="absolute top-4 left-4 bg-primary text-white dark:text-slate-900 text-[9px] font-bold uppercase tracking-widest px-3 py-1 z-10">
            -{product.discountRate}%
          </div>
        )}

        <button 
          onClick={(e) => onLike(product.id, e)}
          className={`absolute top-4 right-4 rounded-full transition-all duration-300 z-10 cursor-pointer group/btn shadow-sm
            bg-white dark:bg-slate-900
            ${isLiked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <span className={`material-symbols-outlined text-xl p-2 transition-all duration-300
            ${isLiked 
              ? 'text-red-500 [font-variation-settings:"FILL"_1]' 
              : 'text-slate-900 dark:text-slate-100 group-hover/btn:[font-variation-settings:"FILL"_1]'}`}>
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
            onClick={() => onQuickView(product)}
            className="w-full py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer backdrop-blur-sm
              bg-primary text-white hover:bg-white hover:text-primary
              dark:bg-white dark:text-background-light dark:hover:bg-background-light dark:hover:text-white"
          >
            Quick View
          </button>
        </div>
      </div>

      <Link to={`/products/${product.slug}`}>
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1 truncate">{product.title}</h3>
        <div className="flex items-center gap-3">
          <p className="text-primary font-semibold">₼{product.discountPrice}</p>
          {product.hasDiscount && (
            <p className="text-sm text-slate-400 line-through">₼{product.originalPrice}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
