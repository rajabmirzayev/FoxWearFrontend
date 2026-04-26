import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../services/api';

interface CourierOrder {
  id: number;
  orderNumber: string;
  userId: number;
  status: string;
  totalDiscountPrice: number;
  shippingFee: number;
  paymentStatus: string;
  paymentMethod: string;
  addressSnapshot: string;
  phoneNumber: string;
  latitudeSnapshot: number;
  longitudeSnapshot: number;
}

export default function CourierDashboard() {
  const { userProfile } = useAuth();

  return (
    <div className="p-12 space-y-12 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[80vh] text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/[0.01] -z-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-primary/[0.02] rounded-full blur-[120px] -z-10"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="size-32 bg-white dark:bg-stone-900 shadow-2xl shadow-primary/20 rounded-[40px] flex items-center justify-center text-primary mb-10 border border-primary/5"
      >
        <span className="material-symbols-outlined text-6xl">local_shipping</span>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="space-y-6"
      >
        <h1 className="text-7xl font-black text-primary tracking-tighter uppercase leading-none">
          Specialist<br />Dashboard
        </h1>
        <p className="text-primary/40 max-w-xl mx-auto font-medium text-lg tracking-tight leading-relaxed">
          Welcome back, <span className="text-primary font-black uppercase">{userProfile?.firstName}</span>. Your portal is synchronized and ready for new logistic assignments.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="pt-12 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl"
      >
        <div className="p-8 bg-white dark:bg-stone-900 border border-primary/5 rounded-[32px] shadow-sm text-left group hover:border-primary/20 transition-all cursor-default">
           <p className="text-[10px] font-black text-primary/20 uppercase tracking-[0.3em] mb-4">Real-time status</p>
           <div className="flex items-center gap-3">
              <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-sm font-black text-primary uppercase tracking-widest">Active & Online</p>
           </div>
        </div>
        <div className="p-8 bg-white dark:bg-stone-900 border border-primary/5 rounded-[32px] shadow-sm text-left group hover:border-primary/20 transition-all cursor-default">
           <p className="text-[10px] font-black text-primary/20 uppercase tracking-[0.3em] mb-4">Market Pulse</p>
           <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary/20 text-xl">trending_up</span>
              <p className="text-sm font-black text-primary uppercase tracking-widest">High Demand</p>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
