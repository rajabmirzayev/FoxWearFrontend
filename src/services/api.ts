import axios from 'axios';
import { ApiResponse, AuthData, Banner, Product, Review } from '../types';
import storage from './storage';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Function to check if the token has expired
function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { exp } = JSON.parse(jsonPayload);
    // Adding a 30-second "security margin"
    return Date.now() >= (exp * 1000) - 30000;
  } catch (e) {
    return true;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function getValidToken(): Promise<string | null> {
  let token = storage.getItem('accessToken');
  const refreshToken = storage.getItem('refreshToken');

  if (token && isTokenExpired(token) && refreshToken) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = (async () => {
        try {
          const response = await axios.post<ApiResponse<AuthData>>(`${API_BASE_URL}/api/auth/refresh`, null, {
            params: { refreshToken }
          });
          if (response.data.success) {
            const newToken = response.data.data.accessToken;
            const newRefreshToken = response.data.data.refreshToken;
            const isPersistent = !!localStorage.getItem('refreshToken');
            storage.setItem('accessToken', newToken, isPersistent);
            storage.setItem('refreshToken', newRefreshToken, isPersistent);
            return newToken;
          }
          return null;
        } catch (error) {
          console.error('Proactive refresh failed', error);
          return null;
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();
    }
    return refreshPromise;
  }
  return token;
}

// Request interceptor: Check the token before the request is sent
api.interceptors.request.use(async (config) => {
  // No token check needed for Login and Refresh requests
  if (config.url?.includes('/api/auth/login') || config.url?.includes('/api/auth/refresh')) {
    return config;
  }

  const token = await getValidToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (storage.getItem('refreshToken')) {
    // If there was a refresh token but getValidToken returned null, it means a refresh error occurred
    storage.removeItem('accessToken');
    storage.removeItem('refreshToken');
    storage.removeItem('username');
    
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(new Error('Session expired'));
  }

  return config;
});

// Response interceptor: For fallback 401 or 500 cases (if it's an auth error)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is already from the refresh or login request itself, let's not enter an infinite loop
    if (originalRequest.url?.includes('/api/auth/refresh') || originalRequest.url?.includes('/api/auth/login')) {
      return Promise.reject(error);
    }

    if ((error.response?.status === 401 || error.response?.status === 500) && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const token = await getValidToken();
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } else {
        storage.removeItem('accessToken');
        storage.removeItem('refreshToken');
        storage.removeItem('username');
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const bannerApi = {
  getHomeBanner: () => api.get<ApiResponse<Banner>>('/api/v1/dynamic/banner?placement=homepage'),
};

export const productApi = {
  getMostLiked: () => api.get<ApiResponse<Product[]>>('/api/v1/products/most-liked'),
  like: (productId: number) => api.post(`/api/v1/products/${productId}/like`),
};

export const reviewApi = {
  getFirst10: () => api.get<ApiResponse<Review[]>>('/api/v1/reviews/site/first-10'),
};

export default api;
