import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { orderApi } from '../services/api';
import { Link } from 'react-router-dom';

interface CourierOrder {
  id: number;
  orderNumber: string;
  totalDiscountPrice: number;
  addressSnapshot: string;
}

export default function CourierReadyOrders() {
  const [readyOrders, setReadyOrders] = useState<CourierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReadyOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderApi.getReadyOrders();
      if (response.data.success) {
        setReadyOrders(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch ready orders');
      }
    } catch (err: any) {
      console.error('Error fetching ready orders:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadyOrders();
  }, []);

  return (
    <div className="p-10 space-y-12 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="px-4 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-4 inline-block border border-primary/5">
            Logistics Portal
          </span>
          <h1 className="text-5xl font-black text-primary tracking-tighter uppercase leading-none">
            Ready Orders
          </h1>
          <p className="text-primary/40 mt-3 font-medium tracking-tight">Available consignments awaiting specialist pickup.</p>
        </div>
        <button 
          onClick={fetchReadyOrders}
          disabled={loading}
          className="size-16 bg-white dark:bg-stone-900 border border-primary/5 rounded-[24px] flex items-center justify-center text-primary shadow-xl hover:bg-primary hover:text-white dark:hover:text-stone-950 active:scale-95 transition-all disabled:opacity-50 cursor-pointer group"
        >
          <span className={`material-symbols-outlined text-2xl ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>refresh</span>
        </button>
      </header>

      {error && (
        <div className="p-6 bg-red-500/5 border border-red-500/10 text-red-500 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <span className="material-symbols-outlined font-bold">warning</span>
          <p className="text-[11px] font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-primary/[0.02] border border-primary/5 rounded-[40px] p-10 space-y-12 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="size-14 bg-primary/5 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-2 w-20 bg-primary/5 rounded ml-auto" />
                  <div className="h-6 w-24 bg-primary/5 rounded ml-auto" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-2 w-32 bg-primary/5 rounded" />
                <div className="h-8 w-48 bg-primary/5 rounded" />
              </div>
              <div className="pt-8 border-t border-primary/5">
                <div className="h-16 w-full bg-primary/5 rounded-[24px]" />
              </div>
            </div>
          ))
        ) : readyOrders.length === 0 ? (
          <div className="col-span-full py-40 text-center border-2 border-dashed border-primary/5 rounded-[48px] bg-white/50 dark:bg-stone-900/50">
            <span className="material-symbols-outlined text-7xl text-primary/10 mb-6">inventory_2</span>
            <p className="text-primary/20 font-black uppercase tracking-[0.4em] text-xs">The marketplace is currently empty</p>
            <button onClick={fetchReadyOrders} className="mt-8 text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-primary transition-colors cursor-pointer underline underline-offset-8">Polled 1m ago — Refresh?</button>
          </div>
        ) : (
          readyOrders.map((order) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-stone-900 border border-primary/5 rounded-[40px] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] hover:border-primary/20 transition-all group flex flex-col justify-between relative overflow-hidden"
            >
              <div className="space-y-8">
                <div className="flex justify-between items-start">
                  <div className="size-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white dark:group-hover:text-stone-950 transition-all duration-500">
                    <span className="material-symbols-outlined text-2xl">package_2</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-primary/20 uppercase tracking-widest leading-none mb-2">Payout Amount</p>
                    <p className="text-2xl font-black text-primary tracking-tighter leading-none group-hover:scale-110 transition-transform origin-right">₼{order.totalDiscountPrice.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-primary/20 uppercase tracking-[0.3em] leading-none">Order Reference</p>
                  <h3 className="text-2xl font-black text-primary tracking-tight truncate uppercase leading-none">{order.orderNumber}</h3>
                </div>

                <div className="space-y-3 pt-8 border-t border-primary/5">
                   <div className="flex items-start gap-4">
                      <span className="material-symbols-outlined text-primary/20 text-xl mt-1">location_on</span>
                      <p className="text-xs text-primary/60 font-medium leading-relaxed line-clamp-3">{order.addressSnapshot}</p>
                   </div>
                </div>
              </div>

              <Link 
                to={`/courier/ready-orders/${order.id}`}
                className="w-full mt-10 py-5 bg-primary text-white dark:text-stone-950 text-[11px] font-black uppercase tracking-[0.3em] rounded-[24px] text-center hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all cursor-pointer block"
              >
                Accept Order
              </Link>
              
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
                 <span className="material-symbols-outlined text-9xl">move_to_inbox</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
