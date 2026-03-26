import React from 'react';
import { Link } from 'react-router-dom';

interface EmailSentProps {
  email: string;
  title?: string;
  description?: string;
  backToLoginText?: string;
}

export default function EmailSent({ 
  email, 
  title = "Check Your Email", 
  description = "We've sent a link to your inbox. Please follow the instructions to continue.",
  backToLoginText = "Back to Login"
}: EmailSentProps) {
  return (
    <main className="flex-grow flex items-center justify-center px-6 py-24 relative overflow-hidden bg-[#f9f7f2] dark:bg-stone-950 min-h-screen transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#E5DACE] blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#eddcd6] blur-[100px]"></div>
      </div>
      <div className="w-full max-w-md relative z-10 text-center">
        {/* Logo Anchor */}
        <div className="flex justify-center mb-12">
          <h1 className="text-3xl font-black text-[#49352c] dark:text-stone-100 tracking-tighter uppercase font-headline">FOXWEAR</h1>
        </div>

        {/* Main Content Container */}
        <div className="bg-white dark:bg-stone-900 p-8 md:p-12 shadow-sm rounded-sm transition-all duration-300 border border-transparent dark:border-stone-800">
          <div className="w-20 h-20 bg-[#fcdccf] dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="material-symbols-outlined text-[#49352c] dark:text-stone-100 text-4xl">mail</span>
          </div>
          <h2 className="text-2xl font-black text-[#49352c] dark:text-stone-100 uppercase tracking-tight mb-4 font-headline">{title}</h2>
          <p className="text-[#685c57] dark:text-stone-400 font-light text-sm leading-relaxed mb-10">
            {description.replace('{email}', email)}
          </p>
          <Link 
            to="/login"
            className="inline-flex items-center gap-2 group"
          >
            <span className="material-symbols-outlined text-sm text-[#49352c] dark:text-stone-100 transition-transform duration-200 group-hover:-translate-x-1">arrow_back</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#49352c] dark:text-stone-100 hover:text-[#685c57] dark:hover:text-stone-400 transition-colors font-label">{backToLoginText}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
