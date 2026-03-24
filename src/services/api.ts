import axios from 'axios';
import { ApiResponse, AuthData, Banner, Product, Review, ReviewPage, ProductPage, Category, ProductSize, Color, UserProfile, User } from '../types';
import storage from './storage';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Function to check if the token has expired
function isTokenExpired(token: string): boolean {
  if (!token || token === 'undefined' || token === 'null') return true;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      // Not a standard JWT, might be an opaque token. 
      // In microservices, sometimes tokens are simple strings.
      // If it doesn't look like a JWT, we don't treat it as expired here.
      return false; 
    }
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { exp } = JSON.parse(jsonPayload);
    if (!exp) return false;
    
    // Adding a 30-second "security margin"
    const expired = Date.now() >= (exp * 1000) - 30000;
    return expired;
  } catch (e) {
    console.error('Error parsing token for expiry', e);
    return false; // On parse error, assume it's an opaque token and let the backend decide
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function getValidToken(): Promise<string | null> {
  let token = storage.getItem('accessToken');
  const refreshToken = storage.getItem('refreshToken');

  if (token === 'undefined' || token === 'null') token = null;

  if (token && isTokenExpired(token) && refreshToken) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = (async () => {
        try {
          const response = await axios.post<ApiResponse<AuthData>>(`${API_BASE_URL}/api/v1/auth/refresh`, null, {
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
  if (config.url?.includes('/api/auth/login') || config.url?.includes('/api/v1/auth/refresh')) {
    return config;
  }

  const token = await getValidToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (storage.getItem('refreshToken')) {
    // If there was a refresh token but getValidToken returned null, it means a refresh error occurred
    console.warn('Session expired or refresh failed in request interceptor. Redirecting to login.');
    storage.removeItem('accessToken');
    storage.removeItem('refreshToken');
    storage.removeItem('username');
    storage.removeItem('role');
    
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
    
    if (error.response) {
      console.error(`API Error [${error.response.status}] at ${originalRequest.url}:`, error.response.data);
    } else {
      console.error(`API Network/Unknown Error at ${originalRequest.url}:`, error.message);
    }

    // If the error is already from the refresh or login request itself, let's not enter an infinite loop
    if (originalRequest.url?.includes('/api/v1/auth/refresh') || originalRequest.url?.includes('/api/v1/auth/login')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('401 detected, attempting token refresh...');
      
      const token = await getValidToken();
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } else {
        console.warn('Refresh failed after 401. Redirecting to login.');
        storage.removeItem('accessToken');
        storage.removeItem('refreshToken');
        storage.removeItem('username');
        storage.removeItem('role');
        
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
  like: (productId: number) => api.post(`/api/v1/likes/${productId}`),
  getAll: (params: any) => api.get<ApiResponse<ProductPage>>('/api/v1/products', { params }),
  getAllAdmin: (params: any) => api.get<ApiResponse<ProductPage>>('/api/admin/products', { params }),
  getBySlug: (slug: string) => api.get<ApiResponse<Product>>(`/api/v1/products/${slug}`),
  getCategories: () => api.get<ApiResponse<Category[]>>('/api/v1/products/category'),
  getSizes: () => api.get<ApiResponse<ProductSize[]>>('/api/v1/products/size'),
  getColors: () => api.get<ApiResponse<Color[]>>('/api/v1/products/colors'),
};

export const reviewApi = {
  getSiteReviews: (params?: { page?: number; size?: number }) => api.get<ApiResponse<ReviewPage>>('/api/v1/reviews/site', { params }),
};

export const userApi = {
  getProfile: () => api.get<ApiResponse<UserProfile>>('/api/v1/users/me'),
  getUserById: (id: number) => api.get<ApiResponse<User>>(`/api/v1/users/${id}`),
};

export default api;
