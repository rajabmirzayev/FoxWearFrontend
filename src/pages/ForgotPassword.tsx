import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import EmailSent from '../components/EmailSent';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.forgotPassword(email);
      if (response.data.success) {
        setEmailSent(true);
      } else {
        setError(response.data.message || 'An error occurred. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <EmailSent 
        email={email} 
        description="We've sent a password reset link to {email}. Please check your inbox and follow the instructions."
      />
    );
  }

  return (
    <main className="flex-grow flex items-center justify-center px-6 py-24 relative overflow-hidden bg-[#f9f7f2] dark:bg-stone-950 min-h-screen text-[#1c1816] dark:text-stone-100 transition-colors duration-300">
      {/* Atmospheric Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#E5DACE] blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#eddcd6] blur-[100px]"></div>
      </div>

      {/* Centered Reset Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo Anchor */}
        <div className="flex justify-center mb-12">
          <h1 className="text-3xl font-black text-[#49352c] dark:text-stone-100 tracking-tighter uppercase font-headline">FOXWEAR</h1>
        </div>

        {/* Main Form Container */}
        <div className="bg-white dark:bg-stone-900 p-8 md:p-12 shadow-sm rounded-sm transition-all duration-300 border border-transparent dark:border-stone-800">
          {/* Header Text Section */}
          <header className="mb-10 text-center">
            <h2 className="text-2xl font-black text-[#49352c] dark:text-stone-100 uppercase tracking-tight mb-4 font-headline">Reset Your Password</h2>
            <p className="text-[#685c57] dark:text-stone-400 font-light text-sm leading-relaxed">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>
          </header>

          {/* Form Fields */}
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="font-label text-[10px] tracking-[0.2em] uppercase font-bold text-[#49352c]/70 dark:text-stone-400 block ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <input 
                  className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all text-[#49352c] dark:text-white" 
                  id="email" 
                  name="email" 
                  placeholder="email@example.com" 
                  required 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-[10px] font-bold uppercase tracking-wider text-center">
                {error}
              </div>
            )}

            {/* Primary Action */}
            <button 
              className="w-full bg-primary hover:bg-primary/90 text-white dark:text-stone-950 py-5 px-6 uppercase text-[11px] font-bold tracking-[0.3em] transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer rounded-lg" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          {/* Secondary Actions */}
          <div className="mt-10 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 group">
              <span className="material-symbols-outlined text-sm text-[#49352c] dark:text-stone-100 transition-transform duration-200 group-hover:-translate-x-1">arrow_back</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#49352c] dark:text-stone-100 hover:text-[#685c57] dark:hover:text-stone-400 transition-colors font-label">Back to Login</span>
            </Link>
          </div>
        </div>

        {/* Footer Branding / Minimalist Note */}
        <div className="mt-12 text-center">
          <p className="text-[10px] font-light text-[#685c57]/40 uppercase tracking-[0.4em] font-label">
            Refined Essentials © 2024
          </p>
        </div>
      </div>

      {/* Image Grid (Editorial Asymmetry) - Hidden on mobile, decorative on large screens */}
      <div className="fixed inset-0 pointer-events-none -z-10 hidden xl:flex justify-between px-20 items-center opacity-20">
        <div className="w-48 h-72 translate-y-24 bg-[#D2B48C] overflow-hidden rounded-sm rotate-[-4deg]">
          <img 
            className="w-full h-full object-cover" 
            alt="Minimalist high-fashion portrait" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA27_cb4v63PuslS9WwfeQv9GZYpKL-Y8I2iQmNcin3UbuEFCShCza6tnbZfpp1KLh4UZ661gojWJBgBqmvVC1RVPlRuAWrug3hW6ITC4y2jkjPsJvoPCa_-Fi1DZVNEQDUngddP_IVrzXvR13VigMTXHGEmpDa8-kJfQQ7ippPCb9KtMlIXS0FXDo02SQJ0t8j1bn0QxWxoYtFxqbykhKc_CTL48YrHJrdJnWnrkoHMDV8X-7d9zhkettTEVIL7t1sa78mYjM4vaiO"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="w-64 h-96 -translate-y-32 bg-[#E5DACE] overflow-hidden rounded-sm rotate-[3deg]">
          <img 
            className="w-full h-full object-cover" 
            alt="Leather garment texture" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUOiqXBEkPj-2g9DIs-EEPHnvNhVPp3wZB6F5ua5a43cJnAZsxMPSXQC7Fxyte8P7DQ7db4gT6Q5EnRhOw3WRhFWSpip_8mivgPLw3DSaeu8Cfib6mlhwyUHuoKJWfSQX9bJG8H4yqdYst8F7q9osHmI88IIn3IWQUU4o3TKXNDsrDBW6KZGQvzFQBeg-AO317NGGFVcbERJddOOLRd-7vdyUIXG8xQwWfFYRpziquUE-7GGv076dj-ZE1hraPSMxVVzsNLnllknSO"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </main>
  );
}
