import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AccountSidebar from '../components/AccountSidebar';
import { orderApi } from '../services/api';
import { motion } from 'motion/react';

interface OrderItem {
  id: number;
  productName: string;
  colorName: string;
  imageUrl: string;
  sizeValue: string;
  slug: string;
  quantity: number;
  priceAtPurchase: number;
  discountAtPurchase: number;
  subTotal: number;
  reviewed: boolean;
}

interface OrderDetailData {
  id: number;
  orderNumber: string;
  status: string;
  totalDiscountPrice: number;
  paymentStatus: string;
  paymentMethod: string;
  addressSnapshot: string;
  latitudeSnapshot: number;
  longitudeSnapshot: number;
  orderNote: string;
  trackingNumber: string;
  estimatedDeliveryDate: string;
  courierId: number;
  phoneNumber: string;
  pickedUpAt: string;
  preparedAt: string;
  deliveredAt: string;
  items: OrderItem[];
}

export default function OrderDetail() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!orderNumber) return;
      try {
        const response = await orderApi.getByOrderNumber(orderNumber);
        if (response.data.success) {
          setOrder(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderNumber]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'PENDING':
      case 'PREPARING':
      case 'READY_FOR_PICKUP': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
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

  if (loading) {
    return (
      <div className="bg-[#f7f7f6] dark:bg-stone-950 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-[#f7f7f6] dark:bg-stone-950 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Order Not Found</h2>
          <Link to="/orders" className="text-primary hover:underline">Back to My Orders</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#f7f7f6] dark:bg-stone-950 text-on-background min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <AccountSidebar />

          <section className="lg:col-span-9">
            <header className="mb-12 flex flex-wrap items-center justify-between gap-6">
              <div>
                <Link to="/orders" className="flex items-center gap-2 text-primary/40 hover:text-primary transition-colors mb-4 text-xs font-bold uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back to Orders
                </Link>
                <h1 className="font-headline font-black text-4xl md:text-5xl uppercase tracking-tighter text-primary">
                  Order {order.orderNumber}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                  {formatEnum(order.status)}
                </span>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${order.paymentStatus === 'PAID' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-amber-500 border-amber-500/20 bg-amber-500/5'}`}>
                  {formatEnum(order.paymentStatus)}
                </span>
              </div>
            </header>

            {/* Order Tracker */}
            {order.status !== 'CANCELLED' && (
              <div className="mb-12 bg-white dark:bg-stone-900 rounded-3xl border border-primary/5 shadow-sm p-10 overflow-hidden relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 w-full">
                  {[
                    { key: 'PENDING', label: 'Ordered', icon: 'shopping_cart' },
                    { key: 'PREPARING', label: 'Preparing', icon: 'inventory_2' },
                    { key: 'READY_FOR_PICKUP', label: 'Ready', icon: 'package_2' },
                    { key: 'SHIPPED', label: 'Shipped', icon: 'local_shipping' },
                    { key: 'DELIVERED', label: 'Delivered', icon: 'check_circle' }
                  ].map((stage, index) => {
                    const stages = ['PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED'];
                    const currentIndex = stages.indexOf(order.status.toUpperCase());
                    const isCompleted = currentIndex >= index;
                    const isActive = currentIndex === index;
                    const isPassed = currentIndex > index;

                    return (
                      <div key={stage.key} className="flex flex-row md:flex-col items-center gap-4 flex-1 relative min-h-[80px] md:min-h-0">
                        {/* Line connector - Only for desktop, perfectly centered between icons with gaps */}
                        {index < stages.length - 1 && (
                          <div 
                            className="hidden md:block absolute h-[2px] bg-primary/5 z-0"
                            style={{ 
                              left: 'calc(50% + 32px)', 
                              width: 'calc(100% - 64px)', 
                              top: '24px' 
                            }}
                          >
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: isPassed ? '100%' : '0%' }}
                              className="h-full bg-emerald-500"
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                        )}
                        
                        <div className={`
                          w-12 h-12 rounded-2xl flex items-center justify-center relative z-20 
                          transition-all duration-500 flex-shrink-0
                          ${isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-stone-50 dark:bg-stone-800 text-primary/20 border border-primary/5'}
                          ${isActive ? 'ring-4 ring-emerald-500/20 scale-110' : ''}
                        `}>
                          <span className="material-symbols-outlined text-xl">{stage.icon}</span>
                          {isActive && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-stone-900 animate-ping" />
                          )}
                        </div>
                        
                        <div className="flex flex-col md:items-center text-left md:text-center mt-2">
                          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 transition-colors ${isCompleted ? 'text-primary' : 'text-primary/20'}`}>
                            {stage.label}
                          </p>
                          {isActive && (
                            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-tight animate-pulse">In Progress</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <div className="lg:col-span-2 space-y-8">
                {/* Order Items */}
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-primary/5 shadow-sm p-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-6 border-b border-primary/5 pb-4">Order Items</h3>
                  <div className="space-y-8">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-6">
                        <Link to={`/product/${item.slug}`} className="w-24 h-32 bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden flex-shrink-0 group">
                          <img 
                            src={item.imageUrl} 
                            alt={item.productName} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </Link>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <Link to={`/product/${item.slug}`} className="font-headline font-bold text-lg text-primary hover:opacity-70 transition-opacity uppercase tracking-tight">
                              {item.productName}
                            </Link>
                            <p className="font-headline font-bold text-lg text-primary">₼ {item.subTotal.toFixed(2)}</p>
                          </div>
                          <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-primary/40">
                            <p>Color: <span className="text-primary">{item.colorName}</span></p>
                            <p>Size: <span className="text-primary">{item.sizeValue}</span></p>
                            <p>Qty: <span className="text-primary">{item.quantity}</span></p>
                          </div>
                          <div className="mt-4">
                            <p className="text-xs text-secondary">₼ {item.priceAtPurchase.toFixed(2)} / unit</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Timeline if needed or simple info */}
                {order.trackingNumber && (
                  <div className="bg-white dark:bg-stone-900 rounded-2xl border border-primary/5 shadow-sm p-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-4">Delivery Information</h3>
                    <div className="flex items-center gap-4 text-primary">
                      <span className="material-symbols-outlined text-3xl font-light">local_shipping</span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Tracking Number</p>
                        <p className="font-headline font-bold text-lg">{order.trackingNumber}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                {/* Summary */}
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-primary/5 shadow-sm p-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-6">Order Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Subtotal</span>
                      <span className="font-bold text-primary">₼ {order.totalDiscountPrice.toFixed(2)}</span>
                    </div>
                    {/* Add shipping fee if available from standard response or logic */}
                    <div className="h-px bg-primary/5 my-4"></div>
                    <div className="flex justify-between">
                      <span className="font-headline font-bold uppercase tracking-widest text-xs">Total</span>
                      <span className="font-headline font-bold text-xl text-primary font-black">₼ {order.totalDiscountPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-primary/5 shadow-sm p-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-6">Delivery Details</h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-2">Address</p>
                      <p className="text-sm text-primary leading-relaxed">{order.addressSnapshot}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-2">Phone</p>
                      <p className="text-sm text-primary">{order.phoneNumber}</p>
                    </div>
                    {order.orderNote && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-2">Order Note</p>
                        <p className="text-sm text-secondary italic">"{order.orderNote}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-primary/5 shadow-sm p-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-6">Payment Method</h3>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary font-light">
                      {order.paymentMethod === 'CARD' ? 'credit_card' : 'payments'}
                    </span>
                    <p className="text-sm font-bold text-primary">{getPaymentMethodLabel(order.paymentMethod)}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
