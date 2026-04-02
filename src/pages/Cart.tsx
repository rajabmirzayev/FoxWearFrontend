import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';

export default function Cart() {
  const { cart, removeFromCart, increaseQuantity, decreaseQuantity, cartTotal, cartCount, loading } = useCart();
  const navigate = useNavigate();

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
      <Header />
      
      <main className="flex-1 px-6 py-12 md:px-20 lg:px-12 max-w-7xl mx-auto w-full pt-32">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-10 text-xs font-medium uppercase tracking-widest text-slate-400">
          <Link className="hover:text-primary transition-colors" to="/">Home</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-primary dark:text-slate-100">Shopping Bag</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Product List Section */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-2 uppercase">Shopping Bag</h2>
              <p className="text-slate-500 font-medium">{cartCount} Items selected for checkout</p>
            </div>

            {loading && cart.length === 0 ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-6 bg-primary/5 rounded-xl border border-primary/10">
                <span className="material-symbols-outlined text-6xl text-primary/20">shopping_bag</span>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Your bag is empty</h2>
                  <p className="text-slate-500 mt-2">Looks like you haven't added anything yet.</p>
                </div>
                <Link 
                  to="/products" 
                  className="px-8 py-3 bg-primary hover:bg-[#5a4237] dark:hover:bg-white text-white dark:text-background-dark rounded font-bold uppercase tracking-widest transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="flex flex-col border-t border-primary/10">
                <AnimatePresence mode="popLayout">
                  {cart.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col sm:flex-row gap-6 border-b border-primary/10 items-center sm:items-start py-8"
                    >
                      <div className="w-full aspect-[3/4] bg-primary/5 rounded overflow-hidden sm:w-28 shrink-0">
                        <img 
                          alt={item.productName} 
                          className="w-full h-full object-cover" 
                          src={item.imageUrl}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between h-full w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.productName}</h3>
                            <p className="text-slate-400 text-sm mt-1 uppercase tracking-wider">{item.colorName} | {item.sizeValue}</p>
                          </div>
                          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">₼{item.actualUnitPrice.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-end mt-8 sm:mt-auto">
                          <div className="flex items-center gap-4 bg-background-light dark:bg-background-dark border border-primary/20 rounded-lg p-1 px-3">
                            <button 
                              onClick={() => decreaseQuantity(item.id)}
                              className="hover:text-primary text-slate-400 transition-colors flex items-center justify-center cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-lg">remove</span>
                            </button>
                            <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => increaseQuantity(item.id)}
                              className="hover:text-primary text-slate-400 transition-colors flex items-center justify-center cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span> Remove
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            <Link className="inline-flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest group" to="/products">
              <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
              Continue Shopping
            </Link>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-8 sticky top-32">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight border-b border-primary/10 pb-4 mb-6">Order Summary</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Subtotal</span>
                  <span className="text-slate-900 dark:text-slate-100">₼{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Shipping</span>
                  <span className="text-slate-900 dark:text-slate-100 text-right max-w-[120px]">Calculated at next step</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Taxes</span>
                  <span className="text-slate-900 dark:text-slate-100">₼0.00</span>
                </div>
                <div className="pt-4 border-t border-primary/10 flex justify-between">
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">Total</span>
                  <span className="text-2xl font-black text-primary dark:text-slate-100">₼{cartTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => navigate('/checkout')}
                  disabled={cart.length === 0}
                  className="w-full bg-primary hover:bg-[#5a4237] dark:hover:bg-white text-white dark:text-background-dark font-bold py-5 px-8 rounded transition-all shadow-xl shadow-primary/20 flex items-center justify-center uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Proceed to Checkout
                </button>
                <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest px-4">
                  Free standard shipping on orders over ₼200. Secure checkout powered by Stripe.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
