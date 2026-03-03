import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface CheckoutPaymentPayload {
  orderPayload: {
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    delivery_date: string;
    delivery_time_slot: string;
    delivery_time_slot_id: string;
    delivery_destination_id?: string;
    delivery_fee_egp: number;
    delivery_address: string;
    delivery_maps_link: string;
    promo_code_id?: string;
    discount_amount_egp: number;
    card_message?: string;
    items: Array<{
      product_id: string;
      quantity: number;
      selected_variations?: Record<string, string>;
      selected_addons?: string[];
    }>;
  };
  total: number;
}

type CheckoutPaymentContextValue = {
  payload: CheckoutPaymentPayload | null;
  setPayload: (p: CheckoutPaymentPayload | null) => void;
  clearPayload: () => void;
};

const CheckoutPaymentContext = createContext<CheckoutPaymentContextValue | null>(null);

export function CheckoutPaymentProvider({ children }: { children: ReactNode }) {
  const [payload, setPayloadState] = useState<CheckoutPaymentPayload | null>(null);
  const setPayload = useCallback((p: CheckoutPaymentPayload | null) => setPayloadState(p), []);
  const clearPayload = useCallback(() => setPayloadState(null), []);
  return (
    <CheckoutPaymentContext.Provider value={{ payload, setPayload, clearPayload }}>
      {children}
    </CheckoutPaymentContext.Provider>
  );
}

export function useCheckoutPayment() {
  const ctx = useContext(CheckoutPaymentContext);
  if (!ctx) throw new Error('useCheckoutPayment must be used within CheckoutPaymentProvider');
  return ctx;
}
