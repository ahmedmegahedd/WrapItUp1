import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getCollections, getProducts } from '@/lib/api';

export interface HomeData {
  featuredCollections: any[];
  featuredProducts: any[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const FEATURED_PRODUCTS_LIMIT = 8;

export function useHomeData(): HomeData {
  const [featuredCollections, setFeaturedCollections] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFirstFocus = useRef(true);

  const fetch = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const [allCollections, products] = await Promise.all([
        getCollections(false, false),
        getProducts(),
      ]);
      // Prefer collections with show_on_homepage; if none, show all
      const homepage = allCollections.filter((c: any) => c.show_on_homepage);
      setFeaturedCollections(homepage.length > 0 ? homepage : allCollections);
      // Use first N products as "featured" (backend can add is_featured later)
      setFeaturedProducts((products || []).slice(0, FEATURED_PRODUCTS_LIMIT));
    } catch (err: any) {
      setFeaturedCollections([]);
      setFeaturedProducts([]);
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetch(false);
  }, [fetch]);

  useFocusEffect(
    useCallback(() => {
      const showLoading = isFirstFocus.current;
      if (isFirstFocus.current) isFirstFocus.current = false;
      fetch(showLoading);
    }, [fetch])
  );

  return {
    featuredCollections,
    featuredProducts,
    loading,
    error,
    refresh,
  };
}
