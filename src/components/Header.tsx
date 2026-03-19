import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import storage from '../services/storage';
import { userApi } from '../services/api';
import { UserProfile } from '../types';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = storage.getItem('accessToken');
    if (token) {
      setIsLoggedIn(true);
      fetchProfile();
    } else {
      setIsLoggedIn(false);
      setUserProfile(null);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userApi.getProfile();
      if (response.data.success) {
        setUserProfile(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleLogout = () => {
    storage.removeItem('accessToken');
    storage.removeItem('refreshToken');
    storage.removeItem('username');
    setIsLoggedIn(false);
    setUserProfile(null);
    setShowMenu(false);
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background-light/70 backdrop-blur-xl border-b border-primary/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="text-primary">
            <span className="material-symbols-outlined text-3xl font-bold">
              interests
            </span>
          </div>
          <h1 className="text-primary text-xl font-black tracking-tighter uppercase">FoxWear</h1>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-10">
          {[
            { name: 'Homepage', path: '/' },
            { name: 'Products', path: '/products' },
            { name: 'Collections', path: '/collections' },
            { name: 'About Us', path: '/about' },
            { name: 'Contact', path: '/contact' }
          ].map((item) => (
            <Link 
              key={item.name}
              to={item.path} 
              className="relative text-xs font-bold tracking-[0.2em] uppercase text-primary group transition-colors py-2"
            >
              {item.name}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </nav>

        {/* Action Icons */}
        <div className="flex items-center gap-6 text-primary">
          <button 
            onClick={toggleTheme}
            className="hover:opacity-70 transition-all cursor-pointer"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            <span className="material-symbols-outlined">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
          <button className="hover:opacity-70 transition-all cursor-pointer">
            <span className="material-symbols-outlined">search</span>
          </button>
          <button className="hover:opacity-70 transition-all relative cursor-pointer">
            <span className="material-symbols-outlined">shopping_bag</span>
            <span className="absolute -top-1 -right-1 bg-primary text-[10px] text-white dark:text-background-light rounded-full size-4 flex items-center justify-center font-bold shadow-lg">0</span>
          </button>
          
          {isLoggedIn ? (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border border-primary/10 hover:opacity-70 transition-all cursor-pointer"
              >
                {userProfile?.profilePicture ? (
                  <img 
                    src={userProfile.profilePicture} 
                    alt={userProfile.firstName} 
                    className="w-full h-full object-cover rounded-full" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <span className="material-symbols-outlined text-2xl">person</span>
                )}
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-3 w-48 bg-background-light dark:bg-background-soft border border-primary/10 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-primary/5 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Logged in as</p>
                    <p className="text-xs font-bold truncate text-primary">{userProfile?.firstName} {userProfile?.lastName}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-primary/5 transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="hover:opacity-70 transition-all cursor-pointer">
              <span className="material-symbols-outlined">person</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
