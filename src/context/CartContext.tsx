import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, CartItemData, CartData } from '../types';
import { cartApi } from '../services/api';
import storage from '../services/storage';

interface CartContextType {
  cart: CartItemData[];
  addToCart: (productItemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  increaseQuantity: (itemId: number) => Promise<void>;
  decreaseQuantity: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  cartTotal: number;
  cartOriginalTotal: number;
  cartShippingFee: number;
  cartCount: number;
  couponApplied: boolean;
  couponId: number | null;
  loading: boolean;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItemData[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartOriginalTotal, setCartOriginalTotal] = useState(0);
  const [cartShippingFee, setCartShippingFee] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponId, setCouponId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    const token = storage.getItem('accessToken');
    if (!token) {
      setCart([]);
      setCartTotal(0);
      setCartOriginalTotal(0);
      setCartShippingFee(0);
      setCartCount(0);
      setCouponApplied(false);
      setCouponId(null);
      return;
    }

    try {
      setLoading(true);
      const [cartResponse, countResponse] = await Promise.all([
        cartApi.getCart(),
        cartApi.getCount()
      ]);

      if (cartResponse.data.success) {
        setCart(cartResponse.data.data.items);
        setCartTotal(cartResponse.data.data.totalPrice);
        setCartOriginalTotal(cartResponse.data.data.totalOriginalPrice);
        setCartShippingFee(cartResponse.data.data.shippingFee);
        setCouponApplied(cartResponse.data.data.couponApplied);
        setCouponId(cartResponse.data.data.couponId);
      }
      
      if (countResponse.data.success) {
        setCartCount(countResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productItemId: number, quantity: number) => {
    try {
      const response = await cartApi.addItem({ productItemId, quantity });
      if (response.data.success) {
        await refreshCart();
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (itemId: number) => {
    try {
      const response = await cartApi.removeItem(itemId);
      if (response.data.success) {
        await refreshCart();
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  const increaseQuantity = async (itemId: number) => {
    try {
      const response = await cartApi.increaseQuantity(itemId);
      if (response.data.success) {
        await refreshCart();
      }
    } catch (error) {
      console.error('Failed to increase quantity:', error);
    }
  };

  const decreaseQuantity = async (itemId: number) => {
    try {
      const response = await cartApi.decreaseQuantity(itemId);
      if (response.data.success) {
        await refreshCart();
      }
    } catch (error) {
      console.error('Failed to decrease quantity:', error);
    }
  };

  const clearCart = async () => {
    try {
      const response = await cartApi.clearCart();
      if (response.data.success) {
        setCart([]);
        setCartTotal(0);
        setCartCount(0);
        setCouponApplied(false);
        setCouponId(null);
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const applyCoupon = async (code: string) => {
    try {
      const response = await cartApi.applyCoupon(code);
      if (response.data.success) {
        await refreshCart();
      } else {
        // Use the message from the response if success is false
        throw new Error(response.data.message || 'Coupon could not be applied');
      }
    } catch (error: any) {
      console.error('Failed to apply coupon:', error);
      // Extract message from axios error response if available
      const apiMessage = error.response?.data?.message;
      if (apiMessage) {
        throw new Error(apiMessage);
      }
      // If it's already an Error object from the 'else' block above, it will have the message
      throw error;
    }
  };

  const removeCoupon = async () => {
    try {
      const response = await cartApi.removeCoupon();
      if (response.data.success) {
        await refreshCart();
      }
    } catch (error) {
      console.error('Failed to remove coupon:', error);
    }
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      increaseQuantity,
      decreaseQuantity,
      clearCart, 
      refreshCart,
      cartTotal, 
      cartOriginalTotal,
      cartShippingFee,
      cartCount,
      couponApplied,
      couponId,
      loading,
      applyCoupon,
      removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
};
