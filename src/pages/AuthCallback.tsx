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
      
      // Redirect to home page
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    };

    completeAuth();
  }, [searchParams, navigate, login]);

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
