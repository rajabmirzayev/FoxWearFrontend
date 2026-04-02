import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCheckout } from '../context/CheckoutContext';
import Header from '../components/Header';
import { addressApi } from '../services/api';
import { Address } from '../types';

export default function Checkout() {
  const { cart, cartTotal } = useCart();
  const { checkoutData, updateCheckoutData } = useCheckout();
  const navigate = useNavigate();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await addressApi.getAll();
      if (response.data.success) {
        const addrList = response.data.data;
        setAddresses(addrList);
        
        // Set default address if available and not already set
        if (!checkoutData.addressSnapshot && addrList.length > 0) {
          const defaultAddr = addrList.find(a => a.isDefault) || addrList[0];
          selectAddress(defaultAddr);
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError('Failed to load addresses.');
    } finally {
      setLoading(false);
    }
  };

  const selectAddress = (addr: Address) => {
    const snapshot = `${addr.title}: ${addr.city}, ${addr.region}, ${addr.street} ${addr.block ? 'Blok ' + addr.block : ''} ${addr.floor ? 'Mərtəbə ' + addr.floor : ''} ${addr.doorNumber ? 'Mənzil ' + addr.doorNumber : ''}`.trim();
    updateCheckoutData({ 
      addressSnapshot: snapshot,
      latitude: addr.latitude,
      longitude: addr.longitude
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      // Placeholder for coupon validation API
      // const response = await api.get(`/api/v1/coupons/validate?code=${couponCode}`);
      // if (response.data.success) {
      //   updateCheckoutData({ couponId: response.data.data.id });
      // }
      alert('Coupon feature coming soon!');
    } catch (err) {
      console.error('Coupon error:', err);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Always keep +994
    if (!value.startsWith('+994')) return '+994 ';
    
    // Get only digits after +994
    const digits = value.slice(4).replace(/\D/g, '');
    
    let formatted = '+994';
    
    if (digits.length === 0) return '+994 ';
    
    if (digits.length > 0) {
      formatted += ' ' + digits.substring(0, 2);
    }
    if (digits.length > 2) {
      formatted += ' ' + digits.substring(2, 5);
    }
    if (digits.length > 5) {
      formatted += ' ' + digits.substring(5, 7);
    }
    if (digits.length > 7) {
      formatted += ' ' + digits.substring(7, 9);
    }
    
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    updateCheckoutData({ phoneNumber: formatted });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Phone number validation
    const phoneRegex = /^(\+994\s(50|51|55|70|77|99|10)\s\d{3}\s\d{2}\s\d{2})?$/;
    if (!phoneRegex.test(checkoutData.phoneNumber)) {
      setError('Phone number must be in format: +994 50 123 45 67');
      return;
    }

    if (!checkoutData.addressSnapshot) {
      setError('Please select a shipping address');
      return;
    }

    navigate('/payment');
  };

  if (cart.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-32 md:px-20 lg:px-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-10 text-xs font-medium uppercase tracking-widest text-slate-400">
          <Link className="hover:text-primary transition-colors" to="/cart">Cart</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-primary dark:text-slate-100">Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8">
            <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-8 uppercase">Shipping Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Address Selection */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Select Delivery Address</label>
                  <Link to="/addresses" className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1 group">
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span className="group-hover:underline">Add New Address</span>
                  </Link>
                </div>
                
                {loading ? (
                  <div className="h-14 bg-primary/5 animate-pulse rounded-lg"></div>
                ) : (
                  <select 
                    className="w-full bg-transparent border-0 border-b border-primary/20 focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 text-sm font-medium transition-all dark:text-white appearance-none cursor-pointer"
                    onChange={(e) => {
                      const addr = addresses.find(a => a.id === parseInt(e.target.value));
                      if (addr) selectAddress(addr);
                    }}
                    value={addresses.find(a => {
                      const snapshot = `${a.title}: ${a.city}, ${a.region}, ${a.street} ${a.block ? 'Blok ' + a.block : ''} ${a.floor ? 'Mərtəbə ' + a.floor : ''} ${a.doorNumber ? 'Mənzil ' + a.doorNumber : ''}`.trim();
                      return snapshot === checkoutData.addressSnapshot;
                    })?.id || ''}
                  >
                    <option value="" disabled className="bg-white dark:bg-stone-900">Choose an address</option>
                    {addresses.map(addr => (
                      <option key={addr.id} value={addr.id} className="bg-white dark:bg-stone-900">
                        {addr.title} - {addr.fullAddressText}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Phone Number</label>
                <input 
                  required
                  type="tel"
                  placeholder="+994 50 123 45 67"
                  className="w-full bg-transparent border-0 border-b border-primary/20 focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 text-sm font-medium transition-all placeholder:text-primary/40 dark:text-white"
                  value={checkoutData.phoneNumber}
                  onChange={handlePhoneChange}
                  maxLength={17}
                />
                <span className="text-[10px] text-primary/50 mt-1 uppercase tracking-widest text-center block">Hint: Azerbaijan international format</span>
              </div>

              {/* Order Note */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Order Note (Optional)</label>
                <textarea 
                  placeholder="Any special instructions for delivery..."
                  rows={3}
                  className="w-full bg-transparent border-0 border-b border-primary/20 focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 text-sm font-medium transition-all placeholder:text-primary/40 dark:text-white resize-none"
                  value={checkoutData.orderNote}
                  onChange={(e) => updateCheckoutData({ orderNote: e.target.value })}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="pt-8">
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-[#5a4237] dark:hover:bg-white text-white dark:text-background-dark font-bold py-5 px-8 rounded transition-all shadow-xl shadow-primary/20 flex items-center justify-center uppercase tracking-widest text-sm cursor-pointer"
                >
                  Continue to Payment
                </button>
              </div>
            </form>
          </div>

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
                  <span className="text-emerald-500 font-bold">FREE</span>
                </div>
                <div className="pt-4 border-t border-primary/10 flex justify-between">
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">Total</span>
                  <span className="text-2xl font-black text-primary dark:text-slate-100">₼{cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="space-y-3 mb-8 pt-6 border-t border-primary/10">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Coupon Code</label>
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
              </div>

              <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest px-4">
                Taxes and shipping are calculated at this step.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
