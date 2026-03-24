import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Product, ProductSize } from '../types';
import { productApi } from '../services/api';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onLike: (productId: number, e: React.MouseEvent) => void;
  isLiked: boolean;
}

export default function QuickViewModal({ product, onClose, onLike, isLiked }: QuickViewModalProps) {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);

  const productSizes = useMemo(() => {
    if (!product) return [];
    const sizeMap = new Map<number, ProductSize>();
    product.colors.forEach(color => {
      color.items.forEach(item => {
        if (item.productSize) {
          sizeMap.set(item.productSize.id, item.productSize);
        }
      });
    });
    return Array.from(sizeMap.values()).sort((a, b) => a.id - b.id);
  }, [product]);

  useEffect(() => {
    if (product) {
      setSelectedColorIndex(0);
      setSelectedImageIndex(0);
      setSelectedSizeId(null);
    }
  }, [product]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedColorIndex]);

  const modalContent = (
    <AnimatePresence>
      {product && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6 md:p-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/90 rounded-full z-20 hover:bg-primary hover:text-white dark:bg-background-light text-primary transition-all duration-300 cursor-pointer"
            >
              <span className="dark:hover:text-background-light material-symbols-outlined p-2 font-light">close</span>
            </button>

            <div className="w-full md:w-1/2 flex flex-col bg-primary/5">
              <div className="relative flex-1 min-h-[400px] md:min-h-0">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`${product.id}-${selectedColorIndex}-${selectedImageIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    src={product.colors[selectedColorIndex]?.images[selectedImageIndex]?.image}
                    alt={product.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
                
                {product.colors[selectedColorIndex]?.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex(prev => (prev === 0 ? product.colors[selectedColorIndex].images.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-background-dark/80 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all z-10 cursor-pointer"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex(prev => (prev === product.colors[selectedColorIndex].images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-background-dark/80 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all z-10 cursor-pointer"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </>
                )}
              </div>

              {product.colors[selectedColorIndex]?.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto bg-white dark:bg-background-dark/50 border-t border-primary/5">
                  {product.colors[selectedColorIndex].images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-16 h-20 flex-shrink-0 overflow-hidden rounded border-2 transition-all ${
                        selectedImageIndex === idx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.image}
                        alt={`${product.title} thumbnail ${idx}`}
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
                <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">{product.categoryName}</span>
                <h2 className="text-4xl font-light text-primary leading-tight dark:text-slate-100">{product.title}</h2>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-semibold text-primary dark:text-slate-100">₼{product.discountPrice}</span>
                  {product.hasDiscount && (
                    <span className="text-lg text-slate-400 line-through">₼{product.originalPrice}</span>
                  )}
                </div>
              </div>

              <p className="text-slate-500 text-sm leading-relaxed">
                {product.description || "Experience the pinnacle of craftsmanship with this exquisite piece from our latest collection."}
              </p>

              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-primary/40 uppercase tracking-widest">Available Colors</span>
                  <div className="flex gap-2">
                    {product.colors.map((c, idx) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedColorIndex(idx)}
                        className={`w-7 h-7 rounded-full border cursor-pointer hover:scale-110 transition-all shadow-sm flex items-center justify-center ${
                          selectedColorIndex === idx ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-primary/10'
                        }`}
                        style={{ backgroundColor: c.colorCode }}
                        title={c.colorName}
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
                    {productSizes.map(s => {
                      const isAvailableForColor = product.colors[selectedColorIndex]?.items.some(item => item.productSize.id === s.id && item.stockRemaining > 0);
                      
                      return (
                        <button
                          key={s.id}
                          onClick={() => isAvailableForColor && setSelectedSizeId(s.id)}
                          disabled={!isAvailableForColor}
                          className={`border text-xs py-2 transition-all uppercase tracking-wider cursor-pointer ${
                            selectedSizeId === s.id
                              ? 'bg-primary text-white border-primary'
                              : isAvailableForColor
                                ? 'border-primary/10 hover:border-primary hover:text-primary'
                                : 'border-primary/5 text-slate-300 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {s.sizeValue}
                        </button>
                      );
                    })}
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
                  onClick={(e) => onLike(product.id, e)}
                  className={`px-6 border border-primary/10 transition-all duration-300 flex items-center justify-center group/btn cursor-pointer
                    bg-white dark:bg-slate-900
                    ${isLiked ? 'border-red-500/20' : ''}`}
                >
                  <span className={`material-symbols-outlined transition-all duration-300
                    ${isLiked 
                      ? 'text-red-500 icon-fill' 
                      : 'text-slate-900 dark:text-slate-100 group-hover/btn:icon-fill'}`}>
                    favorite
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
