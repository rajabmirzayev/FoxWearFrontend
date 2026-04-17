import axios from 'axios';
import { ApiResponse, AuthData, Banner, Product, Review, ReviewPage, ProductPage, Category, ProductSize, Color, UserProfile, User, RegisterRequest, Address, AddressRequest, CartData, CartItemData, ContactMessageRequest, ContactMessage } from '../types';
import storage from './storage';

export const API_BASE_URL = 'http://localhost:8080';

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
    if (expired) console.log('Token is expired based on JWT exp claim');
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

export const authApi = {
  login: (data: any) => api.post<ApiResponse<AuthData>>('/api/v1/auth/login', data),
  register: (data: RegisterRequest) => api.post<ApiResponse<null>>('/api/v1/auth/register', data),
  refresh: (refreshToken: string) => axios.post<ApiResponse<AuthData>>(`${API_BASE_URL}/api/v1/auth/refresh`, null, {
    params: { refreshToken }
  }),
  forgotPassword: (email: string) => api.post<ApiResponse<null>>('/api/v1/auth/forgot-password', { email }),
  resetPassword: (token: string, data: any) => api.post<ApiResponse<null>>(`/api/v1/auth/reset?token=${token}`, data),
  verifyEmail: () => api.patch<ApiResponse<null>>('/api/v1/auth/verify-email'),
  sendPhoneVerificationCode: (phoneNumber: string) => api.post<ApiResponse<null>>('/api/v1/auth/phone/send', { phoneNumber }),
  verifyPhoneCode: (phoneNumber: string, code: string) => api.post<ApiResponse<null>>('/api/v1/auth/phone/verify', { phoneNumber, code }),
  changePassword: (data: any) => api.patch<ApiResponse<null>>('/api/v1/auth/change-password', data),
};

export const bannerApi = {
  getBanner: (placement: string) => api.get<ApiResponse<Banner>>(`/api/v1/dynamic/banner?placement=${placement}`),
};

export const productApi = {
  getMostLiked: () => api.get<ApiResponse<Product[]>>('/api/v1/products/most-liked'),
  getMyLikedProducts: () => api.get<ApiResponse<Product[]>>('/api/v1/products/my-liked-products'),
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
  getMyReviews: () => api.get<ApiResponse<Review[]>>('/api/v1/reviews/site/my'),
  createSiteReview: (data: { rate: number; description: string; isActive: boolean }) => api.post<ApiResponse<Review>>('/api/v1/reviews/site', data),
  updateSiteReview: (id: number, data: { rate: number; description: string }) => api.put<ApiResponse<Review>>(`/api/v1/reviews/site/${id}`, data),
  deleteSiteReview: (id: number) => api.delete<ApiResponse<{}>>(`/api/v1/reviews/site/${id}`),
  getAverageRate: () => api.get<ApiResponse<number>>('/api/v1/reviews/site/average-rate'),
  
  // Product Reviews
  getProductReviews: (productId: number, params?: { page?: number; size?: number }) => 
    api.get<ApiResponse<ReviewPage>>(`/api/v1/reviews/product/${productId}`, { params }),
  getMyProductReviews: () => api.get<ApiResponse<Review[]>>('/api/v1/reviews/product/my'),
  createProductReview: (productId: number, data: { rate: number; description: string }) => 
    api.post<ApiResponse<Review>>(`/api/v1/reviews/product/${productId}`, { ...data, productId }),
  updateProductReview: (reviewId: number, data: { rate: number; description: string }) => 
    api.put<ApiResponse<Review>>(`/api/v1/reviews/product/${reviewId}`, data),
  deleteProductReview: (reviewId: number) => 
    api.delete<ApiResponse<{}>>(`/api/v1/reviews/product/${reviewId}`),
  getProductAverageRate: (productId: number) => 
    api.get<ApiResponse<number>>(`/api/v1/reviews/product/average-rate/${productId}`),
};

export const userApi = {
  getProfile: () => api.get<ApiResponse<UserProfile>>('/api/v1/users/me'),
  getProfileWithToken: (token: string) => axios.get<ApiResponse<UserProfile>>(`${API_BASE_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateProfile: (data: any) => api.put<ApiResponse<User>>('/api/v1/users', data),
  getUserById: (id: number) => api.get<ApiResponse<User>>(`/api/v1/users/public/${id}`),
  checkUsernameExists: (username: string) => api.get<ApiResponse<boolean>>(`/api/v1/users/public/username-exists/${username}`),
};

export const addressApi = {
  getAll: () => api.get<ApiResponse<Address[]>>('/api/v1/addresses'),
  getById: (id: number) => api.get<ApiResponse<Address>>(`/api/v1/addresses/${id}`),
  create: (data: AddressRequest) => api.post<ApiResponse<Address>>('/api/v1/addresses', data),
  update: (id: number, data: AddressRequest) => api.put<ApiResponse<Address>>(`/api/v1/addresses/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<{}>>(`/api/v1/addresses/${id}`),
};

export const orderApi = {
  create: (data: any) => api.post<ApiResponse<any>>('/api/v1/orders', data),
  getAll: (params: any) => api.get<ApiResponse<any>>('/api/v1/orders', { params }),
  getMyOrders: () => api.get<ApiResponse<any[]>>('/api/v1/orders/my'),
  getByOrderNumber: (orderNumber: string) => api.get<ApiResponse<any>>(`/api/v1/orders/${orderNumber}`),
  getById: (id: number) => api.get<ApiResponse<any>>(`/api/v1/orders/${id}`),
};

export const cartApi = {
  getCart: () => api.get<ApiResponse<CartData>>('/api/v1/carts'),
  addItem: (data: { productItemId: number; quantity: number }) => api.post<ApiResponse<CartItemData>>('/api/v1/carts', data),
  clearCart: () => api.delete<ApiResponse<null>>('/api/v1/carts'),
  increaseQuantity: (itemId: number) => api.patch<ApiResponse<CartItemData>>(`/api/v1/carts/increase/${itemId}`),
  decreaseQuantity: (itemId: number) => api.patch<ApiResponse<CartItemData>>(`/api/v1/carts/decrease/${itemId}`),
  getCount: () => api.get<ApiResponse<number>>('/api/v1/carts/count'),
  removeItem: (itemId: number) => api.delete<ApiResponse<null>>(`/api/v1/carts/${itemId}`),
  applyCoupon: (code: string) => api.patch<ApiResponse<CartData>>(`/api/v1/carts/coupon/${code}`),
  removeCoupon: () => api.delete<ApiResponse<CartData>>('/api/v1/carts/coupon'),
};

export const contactApi = {
  sendMessage: (data: ContactMessageRequest) => api.post<ApiResponse<ContactMessage>>('/api/v1/messages/contact', data),
};

export default api;
