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
  cartCount: number;
  loading: boolean;
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
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    const token = storage.getItem('accessToken');
    if (!token) {
      setCart([]);
      setCartTotal(0);
      setCartOriginalTotal(0);
      setCartCount(0);
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
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
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
      cartCount,
      loading
    }}>
      {children}
    </CartContext.Provider>
  );
};
