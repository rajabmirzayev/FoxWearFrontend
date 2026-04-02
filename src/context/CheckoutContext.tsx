import React, { createContext, useContext, useState, ReactNode } from 'react';

export type PaymentMethod = 'CARD' | 'CASH_ON_DELIVERY';

interface CheckoutData {
  phoneNumber: string;
  addressSnapshot: string;
  orderNote: string;
  couponId: number | null;
  latitude: number | null;
  longitude: number | null;
  paymentMethod: PaymentMethod | null;
}

interface CheckoutContextType {
  checkoutData: CheckoutData;
  updateCheckoutData: (data: Partial<CheckoutData>) => void;
  resetCheckoutData: () => void;
}

const initialData: CheckoutData = {
  phoneNumber: '',
  addressSnapshot: '',
  orderNote: '',
  couponId: null,
  latitude: null,
  longitude: null,
  paymentMethod: null,
};

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [checkoutData, setCheckoutData] = useState<CheckoutData>(initialData);

  const updateCheckoutData = (data: Partial<CheckoutData>) => {
    setCheckoutData((prev) => ({ ...prev, ...data }));
  };

  const resetCheckoutData = () => {
    setCheckoutData(initialData);
  };

  return (
    <CheckoutContext.Provider value={{ checkoutData, updateCheckoutData, resetCheckoutData }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}
