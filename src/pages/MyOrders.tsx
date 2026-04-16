import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AccountSidebar from '../components/AccountSidebar';
import { orderApi } from '../services/api';
import { motion } from 'motion/react';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalDiscountPrice: number;
  shippingFee: number;
  paymentStatus: string;
  paymentMethod: string;
  addressSnapshot: string;
  phoneNumber: string;
  createdAt?: string; // Adding as optional since it's common
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderApi.getMyOrders();
        if (response.data.success) {
          setOrders(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED': 
      case 'COMPLETED': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'PENDING':
      case 'PROCESSING': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'SHIPPED': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
      case 'CANCELLED': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-primary/60 bg-primary/5 border-primary/10';
    }
  };

  const formatEnum = (text: string) => {
    if (!text) return '';
    return text.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method.toUpperCase()) {
      case 'CARD': return 'Card Payment';
      case 'CASH_ON_DELIVERY': return 'Cash on Delivery';
      default: return method;
    }
  };

  return (
    <div className="bg-[#f7f7f6] dark:bg-stone-950 text-on-background selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <AccountSidebar />

          <section className="lg:col-span-9">
            <header className="mb-16">
              <h1 className="font-headline font-black text-5xl md:text-6xl uppercase tracking-tighter text-primary mb-4">My Orders</h1>
              <p className="font-body font-light text-lg text-secondary leading-relaxed">Track your purchases and view order history.</p>
            </header>

            {loading ? (
              <div className="space-y-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white dark:bg-stone-900 rounded-2xl p-8 border border-primary/5 h-48"></div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-32 text-center bg-white dark:bg-stone-900/50 rounded-3xl border border-dashed border-primary/20">
                <span className="material-symbols-outlined text-6xl text-primary/20 mb-6 font-light">shopping_basket</span>
                <h3 className="font-headline text-2xl font-bold uppercase tracking-tight mb-4">No orders yet</h3>
                <p className="font-body font-light text-secondary mb-10 max-w-md mx-auto">You haven't placed any orders yet. Start exploring our collection!</p>
                <a 
                  href="/products" 
                  className="inline-block bg-primary text-white dark:text-background-dark px-10 py-4 text-xs font-bold uppercase tracking-[0.3em] hover:bg-primary/90 transition-all shadow-xl rounded-lg"
                >
                  Start Shopping
                </a>
              </div>
            ) : (
              <div className="space-y-8">
                {orders.map((order) => (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-stone-900 rounded-2xl border border-primary/5 shadow-sm overflow-hidden group hover:border-primary/20 transition-all"
                  >
                    <Link to={`/orders/${order.orderNumber}`} className="block">
                      <div className="p-8 border-b border-primary/5 bg-primary/[0.02] flex flex-wrap items-center justify-between gap-6 group-hover:bg-primary/[0.04] transition-colors">
                        <div className="flex gap-12">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-1">Order Number</p>
                            <p className="font-headline font-bold text-sm text-primary group-hover:text-primary/70 transition-colors">{order.orderNumber || `#${order.id}`}</p>
                          </div>
                          {order.createdAt && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-1">Date Placed</p>
                              <p className="font-headline font-bold text-sm text-primary">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-1">Total Amount</p>
                            <p className="font-headline font-bold text-sm text-primary">₼ {(order.totalDiscountPrice + order.shippingFee).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                            {formatEnum(order.status)}
                          </span>
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${order.paymentStatus === 'PAID' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-amber-500 border-amber-500/20 bg-amber-500/5'}`}>
                            {formatEnum(order.paymentStatus)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-2">Shipping Address</p>
                            <p className="text-xs text-primary leading-relaxed line-clamp-2">{order.addressSnapshot}</p>
                          </div>
                          <div className="flex flex-col md:items-end">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-2">Payment Details</p>
                            <p className="text-xs text-primary">{getPaymentMethodLabel(order.paymentMethod)} • {order.phoneNumber}</p>
                            <div className="mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary/40 group-hover:text-primary transition-colors">
                              View Details
                              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
