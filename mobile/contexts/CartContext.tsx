import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = '@wrapitup_cart';

export interface CartItem {
  id: string;
  product_id: string;
  product_title: string;
  product_slug: string;
  product_image?: string;
  base_price: number;
  discount_price?: number;
  quantity: number;
  selected_variations: Record<string, string>;
  selected_addons: string[];
  calculated_price: number;
  /** Loyalty points earned when purchasing this line (from product.points_value). */
  points_value?: number;
}

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'calculated_price'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  /** Total loyalty points the customer will earn from this cart (backend is source of truth; this is for display only). */
  getPointsEarned: () => number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setItems(JSON.parse(raw));
          } catch (_) {}
        }
        setHydrated(true);
      })
      .catch(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, 'id' | 'calculated_price'>) => {
    const unitPrice = item.discount_price ?? item.base_price;
    const newItem: CartItem = {
      ...item,
      id: `${item.product_id}-${Date.now()}-${Math.random()}`,
      calculated_price: unitPrice * item.quantity,
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, quantity, calculated_price: (i.discount_price ?? i.base_price) * quantity }
          : i
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const getTotal = useCallback(() => items.reduce((s, i) => s + i.calculated_price, 0), [items]);
  const getItemCount = useCallback(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const getPointsEarned = useCallback(
    () => items.reduce((s, i) => s + (i.points_value ?? 0) * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        getPointsEarned,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (ctx === undefined) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
