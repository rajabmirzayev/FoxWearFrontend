import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import storage from '../services/storage';
import { userApi } from '../services/api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Authenticating...');

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    const completeAuth = async () => {
      if (token && refreshToken) {
        try {
          setStatus('Finalizing your session...');
          // 1. Store tokens first so subsequent API calls can use them
          storage.setItem('accessToken', token, true);
          storage.setItem('refreshToken', refreshToken, true);
          
          // 2. Fetch profile to get role and username
          // This ensures the app doesn't redirect to login due to missing role/username
          const response = await userApi.getProfile();
          if (response.data.success) {
            const profile = response.data.data;
            storage.setItem('role', profile.role, true);
            storage.setItem('username', profile.username, true);
            setStatus('Login successful!');
          }
        } catch (error) {
          console.error('Error completing auth callback:', error);
          setStatus('Session check failed, but redirecting to home...');
        }
      } else {
        console.warn('Auth tokens missing in URL');
        setStatus('Invalid authentication link.');
      }
      
      // Small delay to ensure storage is updated and user sees the status
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    };

    completeAuth();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-primary uppercase tracking-widest">{status}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Please wait while we complete your login.</p>
      </div>
    </div>
  );
}
