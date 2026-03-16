import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from './services/api';
import storage from './services/storage';
import { ApiResponse } from './types';
import { useTheme } from './context/ThemeContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const username = storage.getItem('username') || 'Admin';

  const handleLogout = async () => {
    const refreshToken = storage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post<ApiResponse<string>>('/api/logout', null, {
          params: { refreshToken }
        });
      } catch (err) {
        console.error('Logout error', err);
      }
    }
    storage.removeItem('accessToken');
    storage.removeItem('refreshToken');
    storage.removeItem('username');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-soft text-primary font-display transition-colors duration-300">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-sidebar-bg flex flex-col shadow-xl transition-colors duration-300">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="size-10 bg-white rounded-full flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">forest</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-text leading-tight">FoxWear</h1>
            <p className="text-xs text-sidebar-text/60 font-medium uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          <NavLink 
            to="/admin/dashboard" 
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-white/10 text-sidebar-text shadow-inner' : 'text-sidebar-text/70 hover:bg-white/5 hover:text-sidebar-text'}`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-medium">Dashboard</span>
          </NavLink>
          <NavLink 
            to="/admin/products" 
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-white/10 text-sidebar-text shadow-inner' : 'text-sidebar-text/70 hover:bg-white/5 hover:text-sidebar-text'}`}
          >
            <span className="material-symbols-outlined">apparel</span>
            <span className="text-sm font-medium">Products</span>
          </NavLink>
          <NavLink 
            to="/admin/orders" 
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-white/10 text-sidebar-text shadow-inner' : 'text-sidebar-text/70 hover:bg-white/5 hover:text-sidebar-text'}`}
          >
            <span className="material-symbols-outlined">shopping_bag</span>
            <span className="text-sm font-medium">Orders</span>
          </NavLink>
          <NavLink 
            to="/admin/sales" 
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-white/10 text-sidebar-text shadow-inner' : 'text-sidebar-text/70 hover:bg-white/5 hover:text-sidebar-text'}`}
          >
            <span className="material-symbols-outlined">payments</span>
            <span className="text-sm font-medium">Sales</span>
          </NavLink>
          <NavLink 
            to="/admin/customers" 
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-white/10 text-sidebar-text shadow-inner' : 'text-sidebar-text/70 hover:bg-white/5 hover:text-sidebar-text'}`}
          >
            <span className="material-symbols-outlined">group</span>
            <span className="text-sm font-medium">Customers</span>
          </NavLink>
          <div className="pt-4 mt-4 border-t border-white/10">
            <p className="px-4 text-[10px] font-bold text-sidebar-text/40 uppercase tracking-[0.2em] mb-2">System</p>
            <NavLink 
              to="/admin/settings" 
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-white/10 text-sidebar-text shadow-inner' : 'text-sidebar-text/70 hover:bg-white/5 hover:text-sidebar-text'}`}
            >
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm font-medium">Settings</span>
            </NavLink>
          </div>
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-2">
            <div className="size-8 rounded-full bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-sidebar-text text-sm">person</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate text-sidebar-text">{username}</p>
              <p className="text-xs text-sidebar-text/60 truncate">Administrator</p>
            </div>
            <button 
              onClick={toggleTheme} 
              className="text-sidebar-text/40 hover:text-sidebar-text transition-colors mr-2"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              <span className="material-symbols-outlined text-sm">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>
            <button onClick={handleLogout} className="text-sidebar-text/40 hover:text-sidebar-text transition-colors">
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background-soft">
        {children}
      </main>
    </div>
  );
}
