import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import storage from '../services/storage';
import { userApi } from '../services/api';
import { UserProfile } from '../types';

interface AuthContextType {
  isLoggedIn: boolean;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, profile: UserProfile, rememberMe: boolean) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const token = storage.getItem('accessToken');
    if (!token) {
      setIsLoggedIn(false);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      const response = await userApi.getProfile();
      if (response.data.success) {
        setUserProfile(response.data.data);
        setIsLoggedIn(true);
        // Sync storage just in case
        storage.setItem('role', response.data.data.role, !!localStorage.getItem('refreshToken'));
        storage.setItem('username', response.data.data.username, !!localStorage.getItem('refreshToken'));
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error fetching profile in AuthContext:', error);
      // If unauthorized, logout
      if ((error as any).response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = (accessToken: string, refreshToken: string, profile: UserProfile, rememberMe: boolean) => {
    storage.setItem('accessToken', accessToken, rememberMe);
    storage.setItem('refreshToken', refreshToken, rememberMe);
    storage.setItem('username', profile.username, rememberMe);
    storage.setItem('role', profile.role, rememberMe);
    setUserProfile(profile);
    setIsLoggedIn(true);
  };

  const logout = () => {
    storage.removeItem('accessToken');
    storage.removeItem('refreshToken');
    storage.removeItem('username');
    storage.removeItem('role');
    setUserProfile(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      userProfile, 
      loading, 
      login, 
      logout, 
      refreshProfile: fetchProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
