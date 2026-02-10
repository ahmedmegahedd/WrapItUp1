import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getAppSettings, type AppSettings } from '@/lib/api';

const DEFAULT_ORDER = [
  'hero',
  'featured_collections',
  'featured_products',
  'promotion',
  'value_proposition',
  'final_cta',
];

const DEFAULT_SETTINGS: AppSettings = {
  home_section_order: DEFAULT_ORDER,
  promotion_visible: true,
  promotion_title: 'Special offer',
  promotion_message: 'Free delivery on orders over 250 EGP',
  final_cta_headline: 'Ready to surprise someone?',
  final_cta_subtext: 'Browse our collections and order in minutes.',
  final_cta_button: 'Browse all collections',
  featured_products_limit: 8,
};

export function useAppSettings(): AppSettings | null {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      const showLoading = isFirstFocus.current;
      if (isFirstFocus.current) isFirstFocus.current = false;
      getAppSettings()
        .then(setSettings)
        .catch(() => setSettings(DEFAULT_SETTINGS));
    }, [])
  );

  return settings;
}
