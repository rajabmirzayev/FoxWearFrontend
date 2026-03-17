import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Products() {
  return (
    <div className="bg-background-light text-primary min-h-screen flex flex-col pt-20">
      <Header />
      <main className="flex-grow flex items-center justify-center py-32 px-6">
        <div className="text-center">
          <span className="text-primary text-xs font-bold uppercase tracking-[0.5em] block mb-4">Explore</span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6">Products</h1>
          <p className="text-primary/70 font-light text-lg max-w-xl mx-auto">Our full catalog of premium minimalist fashion is coming soon.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
