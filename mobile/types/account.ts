export interface SavedAddress {
  id: string;
  street: string;
  apartment?: string;
  /** Neighborhood / district (e.g. from reverse geocoding) */
  area?: string;
  city: string;
  /** State / governorate */
  governorate?: string;
  country: string;
  isDefault: boolean;
  /** From map picker: center lat when address was chosen */
  latitude?: number;
  /** From map picker: center lng when address was chosen */
  longitude?: number;
  /** Single-line address for delivery_address (e.g. built from parts) */
  fullAddress?: string;
  /** Google Maps URL for delivery_maps_link */
  mapsLink?: string;
}

export interface SavedCardDisplay {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'unknown';
  last4: string;
  isDefault?: boolean;
}

export type AppLanguage = 'en' | 'ar';
