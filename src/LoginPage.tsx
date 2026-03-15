import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './services/api';
import storage from './services/storage';
import { ApiResponse, AuthData } from './types';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post<ApiResponse<AuthData>>('/api/auth/login', {
        username,
        password,
      });

      if (response.data.success) {
        storage.setItem('accessToken', response.data.data.accessToken, rememberMe);
        storage.setItem('refreshToken', response.data.data.refreshToken, rememberMe);
        storage.setItem('username', response.data.data.username, rememberMe);
        navigate('/admin/products');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side: Image Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary/10">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBR2FPomJlSDrL0MX-16dKoAWic-iY6xdPVXwWpr-SFHur82zVOjHITLcXDWMRvno8jwEHfH6iykGfCjs-e-t1MDySuDPQyHfPJoIHNbn4tLF1Z2fcELbJ2SqU6FCZNyLKu_qMo8QmYsq2DjPVU2-u6krrvjxXn61AUKaA-9g7xQ7y4qC-ZZ7wLji5Q33aoLFBKrFkS_TezDl6qadAemYjLDhrHCXyGARr8d6t29szTklMnlViKlwYWthqVBDquRvq9Pw7gM4y9BED4')" }}
        ></div>
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply"></div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-4xl">diamond</span>
            <h1 className="text-2xl font-bold tracking-tight">FoxWear</h1>
          </div>
          <div>
            <h2 className="text-5xl font-light leading-tight mb-6">Redefining <br/><span className="font-bold">Modern Luxury</span></h2>
            <p className="text-lg opacity-90 max-w-md">Experience the pinnacle of craftsmanship and timeless style with our curated seasonal collections.</p>
          </div>
          <div className="text-sm opacity-70">
            © 2024 FoxWear International S.A.
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-background-light">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-4xl">diamond</span>
              <h2 className="text-2xl font-bold">FoxWear</h2>
            </div>
          </div>
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="mt-2 text-primary/60">Please enter your details to access your wardrobe.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="username">Email or Username</label>
                <input 
                  id="username"
                  type="text"
                  required
                  className="block w-full h-14 px-4 bg-white border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400"
                  placeholder="Enter your credentials"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
                  <a className="text-xs font-medium text-primary hover:underline" href="#">Forgot password?</a>
                </div>
                <div className="relative flex items-center">
                  <input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full h-14 px-4 bg-white border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    className="absolute right-4 text-slate-400 hover:text-primary transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input 
                id="remember-me" 
                name="remember-me" 
                type="checkbox" 
                className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary cursor-pointer" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="ml-2 block text-sm text-slate-600 cursor-pointer" htmlFor="remember-me">Remember me for 30 days</label>
            </div>

            <div className="space-y-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-primary/10"></div>
                <span className="flex-shrink mx-4 text-xs uppercase tracking-widest text-slate-400">Or continue with</span>
                <div className="flex-grow border-t border-primary/10"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button type="button" className="flex items-center justify-center gap-2 py-3 px-4 border border-primary/10 rounded-lg hover:bg-primary/5 transition-colors">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYIw3BWre2ZY0lOXDezWT7Oaa56IK6BTmFemi0RLCtwE0Q1UGkSZqG2CMQd1ddSlCcQI1m669XyHXgzKWRBcR0Dg0XSDQP0ZPBmXJfbAjLs8n9Ejw6e2v1EBlNUKhLtMhCecjELKLU0c_9f0TprSSG865q1OdrH-Upjhgx_WQ7blZPzYvWSGQ_hSlvfA9nyYZhkersO6H8uLDzPAerv-lDbBtMhq7wwBx3fpn2Et-n69EATPWnkR_W9dgWy8mZQ_lx0Zgem5tBS-OA" alt="Google" className="w-5 h-5" />
                  <span className="text-sm font-medium">Google</span>
                </button>
                <button type="button" className="flex items-center justify-center gap-2 py-3 px-4 border border-primary/10 rounded-lg hover:bg-primary/5 transition-colors">
                  <span className="material-symbols-outlined text-xl">ios</span>
                  <span className="text-sm font-medium">Apple</span>
                </button>
              </div>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-slate-500">
            Don't have an account? 
            <a className="font-bold text-primary hover:underline ml-1" href="#">Create an account</a>
          </p>

          <div className="mt-auto pt-10">
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/5 text-primary text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary hover:text-white transition-all">
              <span className="material-symbols-outlined mr-2 text-sm">help</span>
              <span className="truncate">Help Center</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
