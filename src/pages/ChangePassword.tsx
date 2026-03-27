import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AccountSidebar from '../components/AccountSidebar';
import { authApi } from '../services/api';

export default function ChangePassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.changePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      } else {
        setError(response.data.message || 'An error occurred.');
      }
    } catch (err: any) {
      if (err.response?.status === 422) {
        setError('Old password is incorrect.');
      } else {
        setError(err.response?.data?.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#f7f7f6] dark:bg-stone-950 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-24">
          <div className="w-full max-w-md text-center">
            <div className="bg-white dark:bg-stone-900 p-10 md:p-14 shadow-sm border border-stone-200 dark:border-stone-800 rounded-2xl">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="material-symbols-outlined text-primary text-4xl">check_circle</span>
              </div>
              <h1 className="text-3xl font-black text-primary uppercase tracking-tight mb-4 font-headline">Success!</h1>
              <p className="text-stone-500 dark:text-stone-400 font-body text-sm font-light leading-relaxed mb-8">
                Your password has been successfully updated. Redirecting you to profile...
              </p>
              <Link 
                to="/profile"
                className="w-full bg-primary text-white dark:text-stone-950 py-5 px-8 font-headline text-[11px] tracking-[0.3em] uppercase font-bold block hover:bg-primary/90 transition-all duration-300 rounded-lg"
              >
                Go to Profile
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#f7f7f6] dark:bg-stone-950 text-on-background selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <AccountSidebar />

          <section className="lg:col-span-9">
            <div className="max-w-2xl">
              <header className="mb-16">
                <h1 className="font-headline font-black text-5xl md:text-6xl uppercase tracking-tighter text-primary mb-4">Change Password</h1>
                <p className="font-body font-light text-lg text-secondary leading-relaxed text-stone-400">Secure your FOXWEAR account with a new cryptographic key.</p>
              </header>

              {error && (
                <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form className="space-y-12" onSubmit={handleSubmit}>
                <div className="space-y-8">
                  {/* Current Password */}
                  <div className="space-y-2 group">
                    <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Current Password</label>
                    <div className="relative">
                      <input 
                        className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white" 
                        placeholder="••••••••" 
                        type={showOldPassword ? "text" : "password"}
                        value={formData.oldPassword}
                        onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                        required
                      />
                      <button 
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors" 
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showOldPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2 group">
                    <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">New Password</label>
                    <div className="relative">
                      <input 
                        className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white" 
                        placeholder="••••••••" 
                        type={showNewPassword ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        required
                      />
                      <button 
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors" 
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showNewPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-2 group">
                    <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Confirm New Password</label>
                    <div className="relative">
                      <input 
                        className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white" 
                        placeholder="••••••••" 
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                      />
                      <button 
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors" 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-8 pt-12">
                  <button 
                    className="w-full sm:w-auto px-12 py-5 bg-primary text-white dark:text-stone-950 font-headline font-black uppercase tracking-[0.3em] text-[10px] hover:bg-primary/90 transition-colors duration-300 disabled:opacity-50 cursor-pointer rounded-lg" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button 
                    className="w-full sm:w-auto px-12 py-5 border border-outline-variant font-headline font-light uppercase tracking-[0.3em] text-[10px] text-primary hover:bg-surface-container transition-colors dark:text-white dark:hover:bg-stone-800 cursor-pointer rounded-lg" 
                    type="button"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
