import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AccountSidebar from '../components/AccountSidebar';

export default function Messages() {
  return (
    <div className="bg-[#f7f7f6] dark:bg-stone-950 text-on-background selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <AccountSidebar />

          <section className="lg:col-span-9">
            <header className="mb-16">
              <h1 className="font-headline font-black text-5xl md:text-6xl uppercase tracking-tighter text-primary mb-4">My Messages</h1>
              <p className="font-body font-light text-lg text-secondary leading-relaxed">View and manage your conversations.</p>
            </header>

            <div className="py-32 text-center bg-white dark:bg-stone-900/50 rounded-3xl border border-dashed border-primary/20">
              <span className="material-symbols-outlined text-6xl text-primary/20 mb-6 font-light">mail</span>
              <h3 className="font-headline text-2xl font-bold uppercase tracking-tight mb-4">No messages yet</h3>
              <p className="font-body font-light text-secondary mb-10 max-w-md mx-auto">Your inbox is empty. When you receive messages about your orders or account, they will appear here.</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
