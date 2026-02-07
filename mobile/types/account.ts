export interface SavedAddress {
  id: string;
  street: string;
  apartment?: string;
  city: string;
  country: string;
  isDefault: boolean;
}

export interface SavedCardDisplay {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'unknown';
  last4: string;
  isDefault?: boolean;
}

export type AppLanguage = 'en' | 'ar';
