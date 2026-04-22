import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';

export default function Cart() {
  const { cart, removeFromCart, increaseQuantity, decreaseQuantity, cartTotal, cartOriginalTotal, cartShippingFee, cartCount, couponApplied, applyCoupon, removeCoupon, loading } = useCart();
  const navigate = useNavigate();

  const discount = cartOriginalTotal - cartTotal;
  const [couponCode, setCouponCode] = React.useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false);
  const [couponError, setCouponError] = React.useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      await applyCoupon(couponCode);
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.message);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
    } catch (err) {
      console.error('Failed to remove coupon:', err);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
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

            {/* Free Shipping Notification */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4">
              <div className="bg-emerald-500 text-white rounded-full p-1 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">local_shipping</span>
              </div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Free shipping on orders over 70 AZN
              </p>
            </div>

            {loading && cart.length === 0 ? (
              <div className="flex flex-col border-t border-primary/10 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex flex-col sm:flex-row gap-6 border-b border-primary/10 items-center sm:items-start py-8">
                    <div className="w-full aspect-[3/4] bg-primary/5 rounded overflow-hidden sm:w-28 shrink-0"></div>
                    <div className="flex flex-1 flex-col justify-between h-full w-full space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="h-5 w-48 bg-primary/10 rounded"></div>
                          <div className="h-3 w-32 bg-primary/5 rounded"></div>
                        </div>
                        <div className="h-5 w-20 bg-primary/10 rounded"></div>
                      </div>
                      <div className="flex justify-between items-end mt-8">
                        <div className="h-8 w-24 bg-primary/5 rounded-lg"></div>
                        <div className="h-4 w-16 bg-red-500/5 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
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
                          <div className="text-right">
                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">₼{item.actualUnitPrice.toFixed(2)}</p>
                            {item.originalUnitPrice > item.actualUnitPrice && (
                              <p className="text-sm text-slate-400 line-through">₼{item.originalUnitPrice.toFixed(2)}</p>
                            )}
                          </div>
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

          <div className="lg:col-span-4 relative">
            <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-8 sticky top-32 h-fit">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight border-b border-primary/10 pb-4 mb-6">Order Summary</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Subtotal</span>
                  <span className="text-slate-900 dark:text-slate-100">₼{cartOriginalTotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-500 font-medium">
                    <span>Discount</span>
                    <span>-₼{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Shipping</span>
                  {cartShippingFee > 0 ? (
                    <span className="text-slate-900 dark:text-slate-100">₼{cartShippingFee.toFixed(2)}</span>
                  ) : (
                    <span className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Free</span>
                  )}
                </div>
                <div className="pt-4 border-t border-primary/10 flex justify-between">
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">Total</span>
                  <span className="text-2xl font-black text-primary dark:text-slate-100">₼{cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="space-y-3 mb-8 pt-6 border-t border-primary/10">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Coupon Code</label>
                {couponApplied ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                      <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Coupon Applied</span>
                    </div>
                    <button 
                      onClick={handleRemoveCoupon}
                      className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Enter code"
                        className="flex-1 bg-transparent border-0 border-b border-primary/20 focus:ring-0 focus:border-primary focus:outline-none px-0 py-2 text-[11px] font-medium transition-all placeholder:text-primary/40 dark:text-white"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                        className="px-3 bg-primary text-white dark:text-background-dark font-bold uppercase tracking-widest text-[9px] rounded hover:bg-[#5a4237] dark:hover:bg-white transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      >
                        {isApplyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[10px] text-red-500 font-medium uppercase tracking-widest">{couponError}</p>
                    )}
                  </>
                )}
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
                  Free shipping on orders over 70 AZN. Secure checkout powered by FOXWEAR.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
