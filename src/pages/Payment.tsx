import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCheckout } from '../context/CheckoutContext';
import Header from '../components/Header';
import { orderApi } from '../services/api';

export default function Payment() {
  const { cart, cartTotal, cartOriginalTotal, cartShippingFee, clearCart, refreshCart } = useCart();
  const { checkoutData, updateCheckoutData, resetCheckoutData } = useCheckout();
  const navigate = useNavigate();
  
  const discount = cartOriginalTotal - cartTotal;

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Card Details State
  const [cardDetails, setCardDetails] = useState({
    fullName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim().slice(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }

    setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutData.paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    if (checkoutData.paymentMethod === 'CARD') {
      if (!cardDetails.fullName || cardDetails.cardNumber.length < 19 || cardDetails.expiryDate.length < 5 || cardDetails.cvv.length < 3) {
        setError('Please fill in all card details correctly');
        return;
      }
    }

    setIsProcessing(true);
    setError(null);

    try {
      const [expiryMonth, expiryYear] = cardDetails.expiryDate.split('/');
      
      const response = await orderApi.create({
        paymentMethod: checkoutData.paymentMethod,
        addressSnapshot: checkoutData.addressSnapshot,
        orderNote: checkoutData.orderNote,
        latitude: checkoutData.latitude,
        longitude: checkoutData.longitude,
        couponId: checkoutData.couponId,
        phoneNumber: checkoutData.phoneNumber,
        cardNumber: checkoutData.paymentMethod === 'CARD' ? cardDetails.cardNumber.replace(/\s/g, '') : null,
        expiryMonth: checkoutData.paymentMethod === 'CARD' ? expiryMonth : null,
        expiryYear: checkoutData.paymentMethod === 'CARD' ? expiryYear : null,
        cvc: checkoutData.paymentMethod === 'CARD' ? cardDetails.cvv : null,
      });

      if (response.data.success) {
        // Clear local state
        clearCart();
        resetCheckoutData();
        // Refresh cart count from server
        await refreshCart();
        
        // Navigate to profile or success page
        navigate('/profile', { 
          state: { 
            orderSuccess: true, 
            orderNumber: response.data.data.orderNumber 
          } 
        });
      } else {
        setError(response.data.message || 'Failed to place order');
      }
    } catch (err: any) {
      console.error('Order placement error:', err);
      const message = err.response?.data?.message || 'An error occurred while placing your order. Please try again.';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
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
          <Link className="hover:text-primary transition-colors" to="/">Home</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <Link className="hover:text-primary transition-colors" to="/cart">Shopping Bag</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <Link className="hover:text-primary transition-colors" to="/checkout">Checkout</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-primary dark:text-slate-100">Payment</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8">
            <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-8 uppercase">Payment Method</h2>
            
            <form onSubmit={handlePlaceOrder} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label 
                  className={`relative flex flex-col p-6 rounded-xl border cursor-pointer transition-all ${
                    checkoutData.paymentMethod === 'CARD' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-primary/10 hover:border-primary/30'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    className="hidden" 
                    onChange={() => updateCheckoutData({ paymentMethod: 'CARD' })}
                    checked={checkoutData.paymentMethod === 'CARD'}
                  />
                  <div className="flex justify-between items-start mb-4">
                    <span className="material-symbols-outlined text-3xl text-primary">credit_card</span>
                    {checkoutData.paymentMethod === 'CARD' && (
                      <span className="material-symbols-outlined text-primary">check_circle</span>
                    )}
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Credit / Debit Card</span>
                  <span className="text-sm text-slate-500 mt-1">Visa, Mastercard, Maestro</span>
                </label>

                <label 
                  className={`relative flex flex-col p-6 rounded-xl border cursor-pointer transition-all ${
                    checkoutData.paymentMethod === 'CASH_ON_DELIVERY' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-primary/10 hover:border-primary/30'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    className="hidden" 
                    onChange={() => updateCheckoutData({ paymentMethod: 'CASH_ON_DELIVERY' })}
                    checked={checkoutData.paymentMethod === 'CASH_ON_DELIVERY'}
                  />
                  <div className="flex justify-between items-start mb-4">
                    <span className="material-symbols-outlined text-3xl text-primary">payments</span>
                    {checkoutData.paymentMethod === 'CASH_ON_DELIVERY' && (
                      <span className="material-symbols-outlined text-primary">check_circle</span>
                    )}
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Cash on Delivery</span>
                  <span className="text-sm text-slate-500 mt-1">Pay when you receive your order</span>
                </label>
              </div>

              {/* Card Details Section */}
              {checkoutData.paymentMethod === 'CARD' && (
                <div className="p-8 bg-primary/5 rounded-xl border border-primary/10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Full Name on Card</label>
                      <input 
                        type="text"
                        name="fullName"
                        placeholder="JOHN DOE"
                        className="w-full bg-transparent border-0 border-b border-primary/20 focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 text-sm font-medium transition-all placeholder:text-primary/40 dark:text-white uppercase"
                        value={cardDetails.fullName}
                        onChange={handleCardChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Card Number</label>
                      <input 
                        type="text"
                        name="cardNumber"
                        placeholder="0000 0000 0000 0000"
                        className="w-full bg-transparent border-0 border-b border-primary/20 focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 text-sm font-medium transition-all placeholder:text-primary/40 dark:text-white"
                        value={cardDetails.cardNumber}
                        onChange={handleCardChange}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Expiry Date</label>
                        <input 
                          type="text"
                          name="expiryDate"
                          placeholder="MM/YY"
                          className="w-full bg-transparent border-0 border-b border-primary/20 focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 text-sm font-medium transition-all placeholder:text-primary/40 dark:text-white"
                          value={cardDetails.expiryDate}
                          onChange={handleCardChange}
                          maxLength={5}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">CVV</label>
                        <input 
                          type="password"
                          name="cvv"
                          placeholder="•••"
                          className="w-full bg-transparent border-0 border-b border-primary/20 focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 text-sm font-medium transition-all placeholder:text-primary/40 dark:text-white"
                          value={cardDetails.cvv}
                          onChange={handleCardChange}
                          maxLength={3}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="pt-8 flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="px-8 py-4 border border-primary/20 text-primary font-bold uppercase tracking-widest text-sm rounded hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  Back to Checkout
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !checkoutData.paymentMethod}
                  className="flex-1 bg-primary hover:bg-[#5a4237] dark:hover:bg-white text-white dark:text-background-dark font-bold py-4 px-8 rounded transition-all shadow-xl shadow-primary/20 flex items-center justify-center uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white dark:border-background-dark"></div>
                  ) : (
                    'Confirm Order'
                  )}
                </button>
              </div>
            </form>
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
              
              <div className="space-y-4">
                <div className="p-4 bg-background-light dark:bg-background-dark rounded-lg border border-primary/10">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Shipping To</h4>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2">{checkoutData.addressSnapshot}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{checkoutData.phoneNumber}</p>
                </div>
                {checkoutData.orderNote && (
                  <div className="p-4 bg-background-light dark:bg-background-dark rounded-lg border border-primary/10">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Order Note</h4>
                    <p className="text-sm italic text-slate-600 dark:text-slate-400">"{checkoutData.orderNote}"</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest px-4 mt-8">
                Delivery is free for orders over 70 AZN. Secure checkout powered by FOXWEAR.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
