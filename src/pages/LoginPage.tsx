import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import storage from '../services/storage';
import { ApiResponse, AuthData } from '../types';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  React.useEffect(() => {
    const token = storage.getItem('accessToken');
    const role = storage.getItem('role');
    if (token) {
      if (role === 'ADMIN') {
        navigate('/admin/products', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [navigate]);

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
        storage.setItem('role', response.data.data.role, rememberMe);
        
        // Redirection logic:
        // 1. If there's a 'from' path in location state, go there
        // 2. Otherwise, if ADMIN go to admin panel, if USER go to home
        const from = location.state?.from?.pathname;
        if (from) {
          navigate(from, { replace: true });
        } else if (response.data.data.role === 'ADMIN') {
          navigate('/admin/products', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
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
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-background-light relative transition-colors duration-300">
        <button 
          onClick={toggleTheme}
          className="absolute top-8 right-8 text-primary hover:opacity-70 transition-all transform hover:scale-110 cursor-pointer"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          <span className="material-symbols-outlined">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-4xl">diamond</span>
              <h2 className="text-2xl font-bold">FoxWear</h2>
            </div>
          </div>
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-black text-primary tracking-tight">Welcome Back</h2>
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
                <label className="text-sm font-semibold text-primary" htmlFor="username">Email or Username</label>
                <input 
                  id="username"
                  type="text"
                  required
                  className="block w-full h-14 px-4 bg-background-light border border-primary/20 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-primary/40"
                  placeholder="Enter your credentials"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-primary" htmlFor="password">Password</label>
                  <a className="text-xs font-medium text-primary hover:underline" href="#">Forgot password?</a>
                </div>
                <div className="relative flex items-center">
                  <input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full h-14 px-4 bg-background-light border border-primary/20 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-primary/40"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors cursor-pointer"
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
                className="h-4 w-4 rounded border-primary/20 accent-primary cursor-pointer" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="ml-2 block text-sm text-primary/60 cursor-pointer" htmlFor="remember-me">Remember me for 30 days</label>
            </div>

            <div className="space-y-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white dark:text-background-light bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-primary/10"></div>
                <span className="flex-shrink mx-4 text-xs uppercase tracking-widest text-primary/40">Or continue with</span>
                <div className="flex-grow border-t border-primary/10"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button type="button" className="flex items-center justify-center gap-2 py-3 px-4 border border-primary/10 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-sm font-medium">Google</span>
                </button>
                <button type="button" className="flex items-center justify-center gap-2 py-3 px-4 border border-primary/10 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05 1.61-3.22 1.61-1.14 0-1.55-.67-2.85-.67-1.31 0-1.89.65-2.88.67-1.15.03-2.36-.83-3.41-2.03-2.14-2.43-2.77-6.84-1.18-9.28 1.09-1.67 2.82-2.72 4.39-2.72 1.21 0 2.1.75 2.91.75.78 0 1.9-.89 3.31-.89 1.58 0 3.11.89 4.02 2.22-3.25 1.61-2.72 5.86.53 7.25-.66 1.64-1.59 3.17-2.62 4.09zM12.03 7.25c-.08-2.01 1.67-3.89 3.51-4.05.18 2.25-2.13 4.13-3.51 4.05z"/>
                  </svg>
                  <span className="text-sm font-medium">Apple</span>
                </button>
              </div>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-primary/50">
            Don't have an account? 
            <a className="font-bold text-primary hover:underline ml-1" href="#">Create an account</a>
          </p>

          <div className="mt-auto pt-10">
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/5 text-primary text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary hover:text-white dark:hover:text-background-light transition-all">
              <span className="material-symbols-outlined mr-2 text-sm">help</span>
              <span className="truncate">Help Center</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
