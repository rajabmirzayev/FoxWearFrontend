import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <Header />
      
      <main className="max-w-7xl mx-auto px-8 py-24">
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-2">
            <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">Shopping Bag</h1>
            <p className="text-primary/60 font-medium">{cartCount} items in your bag</p>
          </header>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-6 bg-background-soft rounded-3xl border border-border-subtle">
              <span className="material-symbols-outlined text-6xl text-primary/20">shopping_bag</span>
              <div className="text-center">
                <h2 className="text-xl font-bold text-primary">Your bag is empty</h2>
                <p className="text-primary/60 mt-2">Looks like you haven't added anything yet.</p>
              </div>
              <Link 
                to="/products" 
                className="px-8 py-3 bg-primary text-white dark:text-background-light rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Cart Items List */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <AnimatePresence mode="popLayout">
                  {cart.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex gap-6 p-6 bg-background-soft rounded-3xl border border-border-subtle group"
                    >
                      <Link to={`/product/${item.slug}`} className="size-32 rounded-2xl overflow-hidden bg-background-light border border-border-subtle shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </Link>

                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <Link to={`/product/${item.slug}`} className="text-lg font-black text-primary hover:underline underline-offset-4">{item.title}</Link>
                            <div className="flex items-center gap-3 mt-1 text-sm text-primary/60 font-medium">
                              <div className="flex items-center gap-1.5">
                                <div className="size-3 rounded-full border border-border-subtle" style={{ backgroundColor: item.colorCode }}></div>
                                <span>{item.color}</span>
                              </div>
                              <span className="text-primary/20">|</span>
                              <span>Size: {item.size}</span>
                            </div>
                          </div>
                          <p className="text-lg font-black text-primary">{item.price.toFixed(2)} ₼</p>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center bg-background-light rounded-full border border-border-subtle p-1">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="size-8 flex items-center justify-center text-primary hover:bg-primary/10 rounded-full transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">remove</span>
                            </button>
                            <span className="w-10 text-center font-bold text-primary">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="size-8 flex items-center justify-center text-primary hover:bg-primary/10 rounded-full transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                          </div>

                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-xs font-black uppercase tracking-widest text-red-500 hover:underline underline-offset-4 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 p-8 bg-background-soft rounded-3xl border border-border-subtle space-y-6">
                  <h3 className="text-xl font-black text-primary uppercase tracking-tight">Order Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-primary/60 font-medium">
                      <span>Subtotal</span>
                      <span>{cartTotal.toFixed(2)} ₼</span>
                    </div>
                    <div className="flex justify-between text-primary/60 font-medium">
                      <span>Shipping</span>
                      <span className="text-emerald-500">Free</span>
                    </div>
                    <div className="pt-4 border-t border-border-subtle flex justify-between">
                      <span className="text-lg font-black text-primary">Total</span>
                      <span className="text-lg font-black text-primary">{cartTotal.toFixed(2)} ₼</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/checkout')}
                    className="w-full py-4 bg-primary text-white dark:text-background-light rounded-full font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                  >
                    Checkout Now
                  </button>

                  <div className="pt-4 flex items-center justify-center gap-4 opacity-40 grayscale">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
