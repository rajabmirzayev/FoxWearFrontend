import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="py-20 px-6 lg:px-10 bg-primary text-white/90 dark:text-background-light/90">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-2xl font-bold text-white dark:text-background-light">interests</span>
            <h5 className="text-white dark:text-background-light text-lg font-black tracking-tighter uppercase">FoxWear</h5>
          </div>
          <p className="text-white/70 dark:text-background-light/70 text-sm leading-relaxed mb-6 font-light">
            Redefining premium modern fashion with a focus on quality and minimalist aesthetics.
          </p>
          <div className="flex gap-4">
            <a className="size-10 rounded-full border border-white/20 dark:border-background-light/20 flex items-center justify-center text-white dark:text-background-light hover:bg-white dark:hover:bg-background-light hover:text-primary transition-all" href="#">
              <span className="material-symbols-outlined text-xl">share</span>
            </a>
            <a className="size-10 rounded-full border border-white/20 dark:border-background-light/20 flex items-center justify-center text-white dark:text-background-light hover:bg-white dark:hover:bg-background-light hover:text-primary transition-all" href="#">
              <span className="material-symbols-outlined text-xl">camera</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h6 className="text-sm font-bold uppercase tracking-widest mb-2 text-white dark:text-background-light">Pages</h6>
          <Link className="text-sm text-white/60 dark:text-background-light/60 hover:text-white dark:hover:text-background-light transition-colors" to="/">Homepage</Link>
          <Link className="text-sm text-white/60 dark:text-background-light/60 hover:text-white dark:hover:text-background-light transition-colors" to="/products">Products</Link>
          <Link className="text-sm text-white/60 dark:text-background-light/60 hover:text-white dark:hover:text-background-light transition-colors" to="/collections">Collections</Link>
          <Link className="text-sm text-white/60 dark:text-background-light/60 hover:text-white dark:hover:text-background-light transition-colors" to="/about">About Us</Link>
          <Link className="text-sm text-white/60 dark:text-background-light/60 hover:text-white dark:hover:text-background-light transition-colors" to="/contact">Contact</Link>
        </div>

        <div className="flex flex-col gap-4">
          <h6 className="text-sm font-bold uppercase tracking-widest mb-2 text-white dark:text-background-light">Collections</h6>
          <Link className="text-sm text-white/60 dark:text-background-light/60 hover:text-white dark:hover:text-background-light transition-colors" to="/collections/men">Men</Link>
          <Link className="text-sm text-white/60 dark:text-background-light/60 hover:text-white dark:hover:text-background-light transition-colors" to="/collections/women">Women</Link>
          <Link className="text-sm text-white/60 dark:text-background-light/60 hover:text-white dark:hover:text-background-light transition-colors" to="/collections/winter">Winter</Link>
          <Link className="text-sm text-white/60 dark:text-background-light/60 hover:text-white dark:hover:text-background-light transition-colors" to="/collections/summer">Summer</Link>
        </div>

        <div className="flex flex-col gap-4">
          <h6 className="text-sm font-bold uppercase tracking-widest mb-2 text-white dark:text-background-light">Support</h6>
          <Link className="text-sm text-white/60 dark:text-background-light/60 hover:text-white dark:hover:text-background-light transition-colors" to="/shipping">Shipping & Returns</Link>
          <Link className="text-sm text-white/60 dark:text-background-light/60 hover:text-white dark:hover:text-background-light transition-colors" to="/size-guide">Size Guide</Link>
          <Link className="text-sm text-white/60 dark:text-background-light/60 hover:text-white dark:hover:text-background-light transition-colors" to="/contact">Contact Us</Link>
          <Link className="text-sm text-white/60 dark:text-background-light/60 hover:text-white dark:hover:text-background-light transition-colors" to="/faqs">FAQs</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 dark:border-background-light/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 dark:text-background-light/50">
        <div>@ 2024 FOXWEAR INTERNATIONAL. ALL RIGHTS RESERVED.</div>
        <div className="flex gap-8">
          <a className="hover:text-white dark:hover:text-background-light transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-white dark:hover:text-background-light transition-colors" href="#">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
