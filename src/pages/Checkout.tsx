import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate order placement
    setTimeout(() => {
      setIsProcessing(false);
      clearCart();
      alert('Order placed successfully! Thank you for shopping with FoxWear.');
      navigate('/');
    }, 2000);
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <Header />
      
      <main className="max-w-7xl mx-auto px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-7 space-y-8">
            <header>
              <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Checkout</h1>
              <p className="text-primary/60 font-medium mt-2">Complete your order details below</p>
            </header>

            <form onSubmit={handlePlaceOrder} className="space-y-8">
              {/* Shipping Information */}
              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary/40">Shipping Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">First Name</label>
                    <input required type="text" className="w-full bg-background-soft border border-border-subtle rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Last Name</label>
                    <input required type="text" className="w-full bg-background-soft border border-border-subtle rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Email Address</label>
                  <input required type="email" className="w-full bg-background-soft border border-border-subtle rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Shipping Address</label>
                  <input required type="text" className="w-full bg-background-soft border border-border-subtle rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white" placeholder="123 Fashion St, Baku" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">City</label>
                    <input required type="text" className="w-full bg-background-soft border border-border-subtle rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white" placeholder="Baku" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Phone Number</label>
                    <input required type="tel" className="w-full bg-background-soft border border-border-subtle rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white" placeholder="+994 50 000 00 00" />
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary/40">Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="relative flex items-center gap-4 p-4 bg-background-soft border-2 border-primary rounded-xl cursor-pointer">
                    <input type="radio" name="payment" defaultChecked className="size-4 text-primary focus:ring-primary" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-primary">Credit / Debit Card</span>
                      <span className="text-[10px] text-primary/60 uppercase tracking-widest">Visa, Mastercard</span>
                    </div>
                  </label>
                  <label className="relative flex items-center gap-4 p-4 bg-background-soft border border-border-subtle rounded-xl cursor-pointer hover:border-primary/20 transition-colors">
                    <input type="radio" name="payment" className="size-4 text-primary focus:ring-primary" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-primary">Cash on Delivery</span>
                      <span className="text-[10px] text-primary/60 uppercase tracking-widest">Pay when you receive</span>
                    </div>
                  </label>
                </div>
              </section>

              <button 
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-primary text-white dark:text-background-light rounded-full font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span className="material-symbols-outlined">lock</span>
                )}
                {isProcessing ? 'Processing...' : `Pay ${cartTotal.toFixed(2)} ₼`}
              </button>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <div className="p-8 bg-background-soft rounded-3xl border border-border-subtle space-y-6">
                <h3 className="text-xl font-black text-primary uppercase tracking-tight">Your Items</h3>
                <div className="space-y-4 max-h-[400px] overflow-auto pr-2 custom-scrollbar">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="size-16 rounded-xl overflow-hidden bg-background-light border border-border-subtle shrink-0">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-primary truncate">{item.title}</h4>
                        <p className="text-[10px] text-primary/60 font-medium uppercase tracking-widest">
                          {item.color} / {item.size} x {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-primary">{(item.price * item.quantity).toFixed(2)} ₼</p>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-border-subtle space-y-3">
                  <div className="flex justify-between text-sm text-primary/60 font-medium">
                    <span>Subtotal</span>
                    <span>{cartTotal.toFixed(2)} ₼</span>
                  </div>
                  <div className="flex justify-between text-sm text-primary/60 font-medium">
                    <span>Shipping</span>
                    <span className="text-emerald-500">Free</span>
                  </div>
                  <div className="pt-4 border-t border-border-subtle flex justify-between">
                    <span className="text-lg font-black text-primary">Total</span>
                    <span className="text-lg font-black text-primary">{cartTotal.toFixed(2)} ₼</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                <span className="material-symbols-outlined text-emerald-500">verified_user</span>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-relaxed">
                  Your payment is secured with 256-bit SSL encryption. We never store your card details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
