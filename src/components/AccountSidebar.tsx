import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MENU_ITEMS = [
  { label: 'Profile Details', path: '/profile', icon: 'person' },
  { label: 'Change Password', path: '/change-password', icon: 'lock' },
  { label: 'My Orders', path: '/orders', icon: 'shopping_basket' },
  { label: 'My Reviews', path: '/my-reviews', icon: 'rate_review' },
  { label: 'My Messages', path: '/messages', icon: 'mail' },
  { label: 'My Addresses', path: '/addresses', icon: 'location_on' },
  { label: 'My Favorites', path: '/my-favorites', icon: 'favorite' },
];

export default function AccountSidebar() {
  const location = useLocation();

  return (
    <aside className="lg:col-span-3">
      <div className="sticky top-40 space-y-8">
        <h2 className="font-headline font-black uppercase tracking-widest text-xs text-primary mb-12">Account Settings</h2>
        <ul className="space-y-6">
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link 
                  className={`font-headline uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 transition-colors ${
                    isActive 
                      ? 'font-bold text-primary' 
                      : 'font-light text-stone-400 hover:text-primary'
                  }`} 
                  to={item.path}
                >
                  {isActive && <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
