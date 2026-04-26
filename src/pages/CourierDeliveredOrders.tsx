import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { orderApi } from '../services/api';
import { formatRelativeTime } from '../services/dateUtils';

export default function CourierDeliveredOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchDeliveredOrders = async (targetPage: number) => {
    setLoading(true);
    try {
      const response = await orderApi.getMyDeliveredOrders(targetPage, 10);
      if (response.data.success) {
        setOrders(response.data.data.content || []);
        setTotalPages(response.data.data.totalPages || 0);
        setPage(targetPage);
      } else {
        setError(response.data.message || 'Failed to fetch delivered orders');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveredOrders(0);
  }, []);

  return (
    <div className="p-10 space-y-12 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="px-4 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-4 inline-block border border-primary/5">
            Logistics Archive
          </span>
          <h1 className="text-5xl font-black text-primary tracking-tighter uppercase leading-none">
            Delivered Orders
          </h1>
          <p className="text-primary/40 mt-3 font-medium tracking-tight">Chronological record of your completed specialist assignments.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => fetchDeliveredOrders(page)}
                disabled={loading}
                className="size-16 bg-white dark:bg-stone-900 border border-primary/5 rounded-[24px] flex items-center justify-center text-primary shadow-xl hover:bg-primary hover:text-white dark:hover:text-stone-950 active:scale-95 transition-all disabled:opacity-50 cursor-pointer group"
            >
                <span className={`material-symbols-outlined text-2xl ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>refresh</span>
            </button>
        </div>
      </header>

      {error && (
        <div className="p-6 bg-red-500/5 border border-red-500/10 text-red-500 rounded-3xl flex items-center gap-4">
          <span className="material-symbols-outlined font-bold">warning</span>
          <p className="text-[11px] font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-primary/[0.02] border border-primary/5 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="size-14 bg-primary/5 rounded-2xl shrink-0" />
                <div className="space-y-3">
                  <div className="h-2 w-24 bg-primary/5 rounded" />
                  <div className="h-6 w-40 bg-primary/5 rounded" />
                </div>
              </div>
              <div className="h-4 w-48 bg-primary/5 rounded hidden md:block" />
              <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                <div className="h-2 w-20 bg-primary/5 rounded" />
                <div className="h-6 w-24 bg-primary/5 rounded" />
              </div>
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="col-span-full py-40 text-center border-2 border-dashed border-primary/5 rounded-[48px] bg-white/50 dark:bg-stone-900/50">
            <span className="material-symbols-outlined text-7xl text-primary/10 mb-6">archive</span>
            <p className="text-primary/20 font-black uppercase tracking-[0.4em] text-xs">No delivered orders found in archive</p>
          </div>
        ) : (
          orders.map((order) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-stone-900 border border-primary/5 rounded-[32px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.01)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:border-primary/20 transition-all flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group"
            >
              <div className="flex items-center gap-6 w-full md:w-auto relative z-10">
                <div className="size-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-primary/20 uppercase tracking-[0.3em] leading-none mb-2">Ref: {order.orderNumber}</p>
                  <h3 className="text-xl font-black text-primary tracking-tight uppercase leading-none truncate max-w-[200px]">₼{order.totalDiscountPrice.toFixed(2)}</h3>
                </div>
              </div>

              <div className="flex-1 px-0 md:px-10 w-full md:w-auto relative z-10">
                 <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary/20 text-xl shrink-0">location_on</span>
                    <p className="text-xs text-primary/60 font-medium leading-relaxed line-clamp-1">{order.addressSnapshot}</p>
                 </div>
              </div>

              <div className="flex flex-col items-center md:items-end gap-1 w-full md:w-auto relative z-10 shrink-0">
                 <div className="flex items-center gap-2 text-emerald-500">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <p className="text-[10px] font-black uppercase tracking-widest">{formatRelativeTime(order.deliveredAt)}</p>
                 </div>
                 <p className="text-[9px] font-medium text-primary/20 uppercase tracking-tight">
                    {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : 'N/A'}
                 </p>
              </div>

              <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none transform translate-x-4 -translate-y-4">
                 <span className="material-symbols-outlined text-9xl text-emerald-500">verified</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-12">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => fetchDeliveredOrders(i)}
              className={`size-12 rounded-2xl text-[10px] font-black transition-all ${
                page === i 
                  ? 'bg-primary text-white dark:text-stone-950 shadow-xl shadow-primary/20' 
                  : 'bg-white dark:bg-stone-900 text-primary/40 border border-primary/5 hover:border-primary/20'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
