import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('Authenticating...');

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    const completeAuth = async () => {
      if (token && refreshToken) {
        try {
          setStatus('Finalizing your session...');
          
          // Fetch profile to get role and username
          const response = await userApi.getProfileWithToken(token);
          if (response.data.success) {
            const profile = response.data.data;
            
            // Use global login function to update state and storage
            login(token, refreshToken, profile, true);
            
            setStatus('Login successful!');
            
            // Redirect based on role
            setTimeout(() => {
              if (profile.role === 'ADMIN') {
                navigate('/admin/dashboard', { replace: true });
              } else if (profile.role === 'COURIER') {
                navigate('/courier/dashboard', { replace: true });
              } else {
                navigate('/', { replace: true });
              }
            }, 500);
          } else {
            throw new Error('Failed to fetch profile');
          }
        } catch (error) {
          console.error('Error completing auth callback:', error);
          setStatus('Authentication failed. Redirecting to login...');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
          return;
        }
      } else {
        console.warn('Auth tokens missing in URL');
        setStatus('Invalid authentication link. Redirecting to login...');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
        return;
      }
    };

    completeAuth();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="text-center space-y-6 max-w-sm w-full px-6">
        <div className="space-y-3 animate-pulse">
          <div className="h-1 bg-primary/10 w-full rounded-full overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 bg-primary w-1/3 animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-headline font-black text-primary uppercase tracking-widest animate-pulse">{status}</h2>
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Security Verification in Progress</p>
        </div>
      </div>
    </div>
  );
}
