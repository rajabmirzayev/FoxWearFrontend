import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.resetPassword(token, {
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.data.message || 'An error occurred.');
      }
    } catch (err: any) {
      if (err.response?.status === 422) {
        setError('Reset link has expired (15 minutes). Please request a new one.');
      } else {
        setError(err.response?.data?.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex items-center justify-center min-h-screen px-6 py-24 bg-[#f9f7f2] dark:bg-stone-950 transition-colors duration-300">
        <div className="w-full max-w-md text-center">
          <div className="bg-[#F5F5F5] dark:bg-stone-900 p-10 md:p-14 shadow-sm border border-transparent dark:border-stone-800 transition-all duration-300">
            <div className="w-20 h-20 bg-[#49352c] dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="material-symbols-outlined text-white dark:text-stone-100 text-4xl">check_circle</span>
            </div>
            <h1 className="text-3xl font-black text-[#49352c] dark:text-stone-100 uppercase tracking-tight mb-4 font-headline">Success!</h1>
            <p className="text-[#49352c]/60 dark:text-stone-400 font-body text-sm font-light leading-relaxed mb-8">
              Your password has been successfully updated. Redirecting you to login...
            </p>
            <Link 
              to="/login"
              className="w-full bg-primary text-white dark:text-stone-950 py-5 px-8 font-label text-[11px] tracking-[0.3em] uppercase font-bold block hover:bg-primary/90 transition-all duration-300 rounded-lg"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="bg-[#f9f7f2] dark:bg-stone-950 text-[#1c1816] dark:text-stone-100 min-h-screen selection:bg-[#E5DACE] selection:text-[#49352c] transition-colors duration-300">
      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 bg-[#f9f7f2]/90 dark:bg-stone-950/90 backdrop-blur-md flex justify-center items-center px-8 py-8">
        <div className="text-xl font-black text-[#49352c] dark:text-stone-100 tracking-tighter uppercase font-headline">
          FOXWEAR
        </div>
      </header>

      <main className="flex items-center justify-center min-h-screen px-6 py-24">
        {/* Main Card Container */}
        <div className="w-full max-w-md">
          {/* Contextual Navigation (Back Button) */}
          <div className="mb-12 flex justify-start">
            <Link to="/login" className="group flex items-center gap-2 text-[#49352c]/60 dark:text-stone-400 hover:text-[#49352c] dark:hover:text-stone-100 transition-colors duration-300">
              <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
              <span className="font-label text-[10px] tracking-[0.3em] uppercase font-bold">Back</span>
            </Link>
          </div>

          {/* Content Canvas */}
          <section className="bg-[#F5F5F5] dark:bg-stone-900 p-10 md:p-14 shadow-sm border border-transparent dark:border-stone-800">
            <header className="mb-10 text-center">
              <h1 className="text-4xl md:text-5xl font-black text-[#49352c] dark:text-stone-100 uppercase tracking-tight mb-4 leading-tight font-headline">
                Create New Password
              </h1>
              <p className="text-[#49352c]/60 dark:text-stone-400 font-body text-sm font-light leading-relaxed">
                Please enter your new password below.
              </p>
            </header>

            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Input: New Password */}
              <div className="space-y-2">
                <label className="font-label text-[10px] tracking-[0.2em] uppercase font-bold text-[#49352c]/70 dark:text-stone-400 block ml-1">
                  New Password
                </label>
                <div className="relative group">
                  <input 
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all text-[#49352c] dark:text-white" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#49352c]/40 dark:text-stone-500 hover:text-[#49352c] dark:hover:text-stone-300 transition-colors" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Input: Confirm New Password */}
              <div className="space-y-2">
                <label className="font-label text-[10px] tracking-[0.2em] uppercase font-bold text-[#49352c]/70 dark:text-stone-400 block ml-1">
                  Confirm New Password
                </label>
                <div className="relative group">
                  <input 
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all text-[#49352c] dark:text-white" 
                    placeholder="••••••••" 
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                  <button 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#49352c]/40 dark:text-stone-500 hover:text-[#49352c] dark:hover:text-stone-300 transition-colors" 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="flex items-start gap-3 p-4 bg-[#E5DACE]/30 dark:bg-stone-800/50">
                <span className="material-symbols-outlined text-[#49352c]/40 dark:text-stone-500 text-sm mt-0.5">info</span>
                <p className="text-[11px] leading-relaxed text-[#49352c]/50 dark:text-stone-400 font-body font-light">
                  Must be at least 8 characters, include uppercase, lowercase, and a symbol.
                </p>
              </div>

              {error && (
                <div className="text-red-500 text-[10px] font-bold uppercase tracking-wider text-center">
                  {error}
                </div>
              )}

              {/* Primary Action */}
              <div className="pt-4">
                <button 
                  className="w-full bg-primary hover:bg-primary/90 text-white dark:text-stone-950 py-5 px-8 font-label text-[11px] tracking-[0.3em] uppercase font-bold transition-all duration-300 shadow-xl shadow-[#49352c]/5 disabled:opacity-50 cursor-pointer rounded-lg" 
                  type="submit"
                  disabled={loading || !token}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>

            {/* Support Link */}
            <footer className="mt-12 text-center">
              <Link 
                to="/contact"
                className="text-[#49352c]/40 dark:text-stone-500 hover:text-[#49352c] dark:hover:text-stone-300 font-label text-[10px] tracking-[0.1em] transition-colors uppercase border-b border-transparent hover:border-[#49352c]/20 pb-1"
              >
                Contact Support
              </Link>
            </footer>
          </section>

          {/* Brand Aesthetic Element */}
          <div className="mt-12 grid grid-cols-2 gap-4 opacity-40 grayscale group hover:grayscale-0 transition-all duration-700 pointer-events-none">
            <div className="h-32 bg-[#E5DACE] overflow-hidden">
              <img 
                className="w-full h-full object-cover" 
                alt="Architectural detail" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1CiiUVMKfWhmI4lLH4Q0TuYY4iinoAIs77fvsb4AtVLgxBuq-UjXuzW42A9oV0m2C6AT3j3dbhUD7WGw2x_65aeCUZW__fecDeHTixzOL_Tqt78hPvESOacjVF1E1IPt2NpbECNMk5GpZ3JfuxLuk_XqztZADazrCoqRwQN8ew700ZwaWsbi0x8INOg_tls1k8E_xkNAVqMbP-rG6amGIaMCjaQcO6u5o9Ki6sbLEULmwEhSUqX4blHefdsLRfZAOlrgxMsieGuZ0"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="h-32 bg-[#E5DACE] overflow-hidden translate-y-6">
              <img 
                className="w-full h-full object-cover" 
                alt="Cotton fabric texture" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAO4ZqHzSMGJqc_vFWrVJ9XTPrvcDul_oAPKNgqMEo_S7uXaqX_72SG3Kq48JEewmF-_qe4OJCQ7KIck7NYokl9nxm7t9x02Eg4HuyOONVxBJS9OuZjaa5w1rqO53Bjf23ynKzAo8JWzK_97KxfBrP4u2_4a1uCPzw6z4_-b6G6yDB48UIiORP5X_qRMa67LwwG4UbifZ6yVQsLZSk0M6JlF6hOw2tU0IyFb5zz13OFHtQFHVU55mp9U_tpYSzXfmfCKEDw0Bos0sSN"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Visual Anchor / Footer Accent */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 pointer-events-none select-none overflow-hidden whitespace-nowrap opacity-[0.03]">
        <span className="font-headline text-[15rem] font-black uppercase tracking-tighter text-[#49352c] dark:text-stone-100">FOXWEAR</span>
      </div>
    </div>
  );
}
