import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

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
          <Link to="/login" className="hover:opacity-70 transition-all cursor-pointer">
            <span className="material-symbols-outlined">person</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
