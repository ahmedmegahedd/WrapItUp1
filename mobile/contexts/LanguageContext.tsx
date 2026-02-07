import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import type { AppLanguage } from '@/types/account';

const STORAGE_KEY = '@wrapitup_language';

type LanguageContextType = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  isRTL: boolean;
};

const Context = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'ar' || stored === 'en') {
        setLanguageState(stored);
        const needRTL = stored === 'ar';
        if (I18nManager.isRTL !== needRTL) {
          I18nManager.forceRTL(needRTL);
        }
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang: AppLanguage) => {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
    const needRTL = lang === 'ar';
    if (I18nManager.isRTL !== needRTL) {
      I18nManager.forceRTL(needRTL);
      // User may need to reload app for RTL to take effect
    }
  }, []);

  const isRTL = language === 'ar';

  return (
    <Context.Provider value={{ language, setLanguage, isRTL }}>
      {children}
    </Context.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(Context);
  if (ctx === undefined) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
