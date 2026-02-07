import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import type { SavedAddress } from '@/types/account';

const getStorageKey = (userId: string) => `@wrapitup_addresses_${userId}`;

type AddressesContextType = {
  addresses: SavedAddress[];
  addAddress: (address: Omit<SavedAddress, 'id'>) => Promise<void>;
  updateAddress: (id: string, address: Partial<SavedAddress>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  getDefaultAddress: () => SavedAddress | null;
};

const Context = createContext<AddressesContextType | undefined>(undefined);

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AddressesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    if (!userId) {
      setAddresses([]);
      return;
    }
    AsyncStorage.getItem(getStorageKey(userId))
      .then((raw) => {
        if (!raw) return;
        try {
          const list = JSON.parse(raw) as SavedAddress[];
          setAddresses(Array.isArray(list) ? list : []);
        } catch {
          setAddresses([]);
        }
      })
      .catch(() => setAddresses([]));
  }, [userId]);

  const persist = useCallback(
    (list: SavedAddress[]) => {
      setAddresses(list);
      if (userId) AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(list));
    },
    [userId],
  );

  const addAddress = useCallback(
    async (address: Omit<SavedAddress, 'id'>) => {
      const newAddr: SavedAddress = {
        ...address,
        id: generateId(),
        isDefault: address.isDefault ?? (addresses.length === 0),
      };
      let next = [...addresses, newAddr];
      if (newAddr.isDefault) {
        next = next.map((a) => (a.id === newAddr.id ? { ...a, isDefault: true } : { ...a, isDefault: false }));
      }
      persist(next);
    },
    [addresses, persist],
  );

  const updateAddress = useCallback(
    async (id: string, updates: Partial<SavedAddress>) => {
      const next = addresses.map((a) =>
        a.id === id ? { ...a, ...updates } : updates.isDefault ? { ...a, isDefault: false } : a,
      );
      persist(next);
    },
    [addresses, persist],
  );

  const removeAddress = useCallback(
    async (id: string) => {
      const removed = addresses.find((a) => a.id === id);
      let next = addresses.filter((a) => a.id !== id);
      if (removed?.isDefault && next.length > 0) {
        next[0] = { ...next[0], isDefault: true };
      }
      persist(next);
    },
    [addresses, persist],
  );

  const setDefaultAddress = useCallback(
    async (id: string) => {
      const next = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
      persist(next);
    },
    [addresses, persist],
  );

  const getDefaultAddress = useCallback(() => {
    return addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  }, [addresses]);

  return (
    <Context.Provider
      value={{
        addresses,
        addAddress,
        updateAddress,
        removeAddress,
        setDefaultAddress,
        getDefaultAddress,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useAddresses() {
  const ctx = useContext(Context);
  if (ctx === undefined) throw new Error('useAddresses must be used within AddressesProvider');
  return ctx;
}
