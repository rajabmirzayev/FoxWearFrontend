import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';

interface CartItem {
  id: string; // Unique ID for the cart item (product.id + color + size)
  productId: number;
  title: string;
  slug: string;
  price: number;
  image: string;
  color: string;
  colorCode: string;
  size: string;
  quantity: number;
  stockRemaining: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, color: string, colorCode: string, size: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
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
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, colorName: string, colorCode: string, sizeName: string, quantity: number) => {
    const cartItemId = `${product.id}-${colorName}-${sizeName}`;
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === cartItemId);
      
      if (existingItem) {
        return prevCart.map(item => 
          item.id === cartItemId 
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.stockRemaining) }
            : item
        );
      }

      const colorObj = product.colors.find(c => c.colorName === colorName);
      const sizeObj = colorObj?.items.find(i => i.productSize.sizeValue === sizeName);
      const mainImage = colorObj?.images.find(img => img.main)?.image || colorObj?.images[0]?.image || '';

      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        title: product.title,
        slug: product.slug,
        price: product.hasDiscount ? product.discountPrice : product.originalPrice,
        image: mainImage,
        color: colorName,
        colorCode: colorCode,
        size: sizeName,
        quantity: quantity,
        stockRemaining: sizeObj?.stockRemaining || 0
      };

      return [...prevCart, newItem];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === cartItemId 
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stockRemaining)) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      cartTotal, 
      cartCount 
    }}>
      {children}
    </CartContext.Provider>
  );
};
