import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../services/api';
import storage from '../services/storage';
import { ApiResponse } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function CourierLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { userProfile } = useAuth();
  const username = userProfile?.firstName || storage.getItem('username') || 'Courier';

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
    <div className="flex h-screen overflow-hidden bg-[#f7f7f6] dark:bg-stone-950 text-primary font-display transition-colors duration-300">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white dark:bg-stone-900 border-r border-primary/5 flex flex-col shadow-[20px_0_40px_rgba(0,0,0,0.02)] transition-colors duration-300 z-50">
        <div className="p-8 border-b border-primary/5 flex items-center gap-4">
          <div className="size-12 bg-primary rounded-2xl flex items-center justify-center text-white dark:text-stone-900 shadow-xl shadow-primary/20">
            <span className="material-symbols-outlined text-2xl">local_shipping</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-primary tracking-tighter uppercase leading-none">FoxCourier</h1>
            <p className="text-[10px] text-primary/40 font-black uppercase tracking-[0.2em] mt-1">Specialist Portal</p>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div className="space-y-2">
             <p className="px-4 text-[10px] font-black text-primary/20 uppercase tracking-[0.3em] mb-4">Operations</p>
             <NavLink 
               to="/courier/dashboard" 
               className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${isActive ? 'bg-primary text-white dark:text-stone-950 shadow-2xl shadow-primary/30' : 'text-primary/40 hover:bg-primary/5 hover:text-primary cursor-pointer'}`}
             >
               <span className="material-symbols-outlined text-xl">dashboard</span>
               <span className="text-[11px] font-black uppercase tracking-[0.15em]">Overview</span>
             </NavLink>
             <NavLink 
               to="/courier/ready-orders" 
               className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${isActive ? 'bg-primary text-white dark:text-stone-950 shadow-2xl shadow-primary/30' : 'text-primary/40 hover:bg-primary/5 hover:text-primary cursor-pointer'}`}
             >
               <span className="material-symbols-outlined text-xl">inventory_2</span>
               <span className="text-[11px] font-black uppercase tracking-[0.15em]">Marketplace</span>
             </NavLink>
             <NavLink 
               to="/courier/active-deliveries" 
               className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${isActive ? 'bg-primary text-white dark:text-stone-950 shadow-2xl shadow-primary/30' : 'text-primary/40 hover:bg-primary/5 hover:text-primary cursor-pointer'}`}
             >
               <span className="material-symbols-outlined text-xl">near_me</span>
               <span className="text-[11px] font-black uppercase tracking-[0.15em]">active task</span>
             </NavLink>
          </div>
          
          <div className="space-y-2">
             <p className="px-4 text-[10px] font-black text-primary/20 uppercase tracking-[0.3em] mb-4">Personal</p>
             <NavLink 
               to="/profile" 
               className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-primary/40 hover:bg-primary/5 hover:text-primary cursor-pointer"
             >
               <span className="material-symbols-outlined text-xl">person</span>
               <span className="text-[11px] font-black uppercase tracking-[0.15em]">My Profile</span>
             </NavLink>
             <NavLink 
               to="/courier/delivered-orders" 
               className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${isActive ? 'bg-primary text-white dark:text-stone-950 shadow-2xl shadow-primary/30' : 'text-primary/40 hover:bg-primary/5 hover:text-primary cursor-pointer'}`}
             >
               <span className="material-symbols-outlined text-xl">history</span>
               <span className="text-[11px] font-black uppercase tracking-[0.15em]">Delivered Orders</span>
             </NavLink>
          </div>
        </nav>

        <div className="p-8 border-t border-primary/5 bg-primary/[0.02]">
          <div className="flex items-center gap-4 mb-6">
            <div className="size-12 rounded-2xl bg-primary text-white dark:text-stone-900 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-xl">person</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[11px] font-black text-primary uppercase truncate tracking-widest">{username}</p>
              <p className="text-[9px] text-primary/40 uppercase font-black tracking-[0.2em]">Verified Courier</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button 
               onClick={toggleTheme} 
               title="Toggle Appearance"
               className="flex-1 py-3 bg-white dark:bg-stone-800 hover:bg-primary hover:text-white dark:hover:text-stone-950 transition-all rounded-xl border border-primary/10 flex items-center justify-center shadow-sm cursor-pointer group"
             >
               <span className="material-symbols-outlined text-lg">
                 {theme === 'light' ? 'dark_mode' : 'light_mode'}
               </span>
             </button>
             <button 
               onClick={handleLogout} 
               title="Sign Out"
               className="flex-1 py-3 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white transition-all rounded-xl border border-red-500/10 flex items-center justify-center shadow-sm cursor-pointer"
             >
               <span className="material-symbols-outlined text-lg">logout</span>
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
