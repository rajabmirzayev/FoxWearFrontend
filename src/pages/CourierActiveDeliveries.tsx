import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { orderApi } from '../services/api';

export default function CourierActiveDeliveries() {
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | string | null>(null);

  const fetchActiveOrders = async () => {
    setLoading(true);
    try {
      const response = await orderApi.getActiveDeliveries();
      if (response.data.success) {
        setActiveOrders(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to fetch active deliveries');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async (orderId: number | string) => {
    if (confirm('Are you sure you have delivered this order?')) {
      setActionLoading(orderId);
      try {
        const response = await orderApi.deliverOrder(orderId);
        if (response.data.success) {
          setActiveOrders(prev => prev.filter(order => order.id !== orderId));
        } else {
          alert(response.data.message || 'Failed to mark as delivered');
        }
      } catch (err: any) {
        alert(err.response?.data?.message || 'An error occurred');
      } finally {
        setActionLoading(null);
      }
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  return (
    <div className="p-10 space-y-12 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="px-4 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-4 inline-block border border-primary/5">
            Fleet Operations
          </span>
          <h1 className="text-5xl font-black text-primary tracking-tighter uppercase leading-none">
            Active Tasks
          </h1>
          <p className="text-primary/40 mt-3 font-medium tracking-tight">Current consignments in your possession for delivery.</p>
        </div>
        <button 
          onClick={fetchActiveOrders}
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
          Array.from({ length: 3 }).map((_, i) => (
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
              <div className="pt-8 border-t border-primary/5 space-y-2">
                <div className="h-3 w-full bg-primary/5 rounded" />
                <div className="h-3 w-3/4 bg-primary/5 rounded" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="h-14 bg-primary/5 rounded-[24px]" />
                <div className="h-14 bg-primary/5 rounded-[24px]" />
              </div>
            </div>
          ))
        ) : activeOrders.length === 0 ? (
          <div className="col-span-full py-40 text-center border-2 border-dashed border-primary/5 rounded-[48px] bg-white/50 dark:bg-stone-900/50">
            <span className="material-symbols-outlined text-7xl text-primary/10 mb-6">near_me_disabled</span>
            <p className="text-primary/20 font-black uppercase tracking-[0.4em] text-xs">No active tasks assigned to you</p>
            <Link to="/courier/ready-orders" className="mt-8 text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors cursor-pointer underline underline-offset-8">Visit Marketplace to find orders</Link>
          </div>
        ) : (
          activeOrders.map((order) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-stone-900 border border-primary/5 rounded-[40px] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] hover:border-primary/20 transition-all group flex flex-col justify-between relative overflow-hidden"
            >
              <div className="space-y-8">
                <div className="flex justify-between items-start">
                  <div className="size-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white dark:group-hover:text-stone-950 transition-all duration-500">
                    <span className="material-symbols-outlined text-2xl">local_shipping</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-primary/20 uppercase tracking-widest leading-none mb-2">Collected Value</p>
                    <p className="text-2xl font-black text-primary tracking-tighter leading-none">₼{order.totalDiscountPrice.toFixed(2)}</p>
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

              <div className="mt-10 flex flex-col gap-3">
                <Link 
                  to={`/courier/navigation/${order.id}`}
                  className="w-full py-5 bg-primary/5 text-primary text-[11px] font-black uppercase tracking-[0.3em] rounded-[24px] text-center hover:bg-primary hover:text-white dark:hover:text-stone-950 transition-all cursor-pointer block"
                >
                  View Blueprint
                </Link>
                <button 
                  onClick={() => handleDeliver(order.id)}
                  disabled={actionLoading === order.id}
                  className="w-full py-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-black uppercase tracking-[0.3em] rounded-[24px] text-center hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {actionLoading === order.id ? (
                    <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">task_alt</span>
                      Mark as Delivered
                    </>
                  )}
                </button>
              </div>
              
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
                 <span className="material-symbols-outlined text-9xl">near_me</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
