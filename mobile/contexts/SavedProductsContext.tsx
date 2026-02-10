import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

const getStorageKey = (userId: string) => `@wrapitup_saved_products_${userId}`;

/** Persisted per user: array of product slugs. */
export type SavedProductsContextType = {
  savedSlugs: string[];
  isSaved: (slug: string) => boolean;
  toggle: (slug: string) => boolean;
  add: (slug: string) => void;
  remove: (slug: string) => void;
};

const Context = createContext<SavedProductsContextType | undefined>(undefined);

export function SavedProductsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setSavedSlugs([]);
      return;
    }
    AsyncStorage.getItem(getStorageKey(userId))
      .then((raw) => {
        if (!raw) return;
        try {
          const list = JSON.parse(raw);
          setSavedSlugs(Array.isArray(list) ? list : []);
        } catch {
          setSavedSlugs([]);
        }
      })
      .catch(() => setSavedSlugs([]));
  }, [userId]);

  const persist = useCallback(
    (list: string[]) => {
      setSavedSlugs(list);
      if (userId) AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(list));
    },
    [userId]
  );

  const isSaved = useCallback(
    (slug: string) => savedSlugs.includes(slug),
    [savedSlugs]
  );

  const add = useCallback(
    (slug: string) => {
      if (!slug || savedSlugs.includes(slug)) return;
      persist([...savedSlugs, slug]);
    },
    [savedSlugs, persist]
  );

  const remove = useCallback(
    (slug: string) => {
      persist(savedSlugs.filter((s) => s !== slug));
    },
    [savedSlugs, persist]
  );

  const toggle = useCallback(
    (slug: string): boolean => {
      if (!userId) return false;
      if (savedSlugs.includes(slug)) {
        remove(slug);
        return false;
      }
      add(slug);
      return true;
    },
    [userId, savedSlugs, add, remove]
  );

  return (
    <Context.Provider
      value={{
        savedSlugs,
        isSaved,
        toggle,
        add,
        remove,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useSavedProducts() {
  const ctx = useContext(Context);
  if (ctx === undefined) throw new Error('useSavedProducts must be used within SavedProductsProvider');
  return ctx;
}
