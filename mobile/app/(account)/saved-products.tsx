import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSavedProducts } from '@/contexts/SavedProductsContext';
import { getProductBySlug } from '@/lib/api';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { OptimizedImage } from '@/components/OptimizedImage';

function getPrimaryImageUrl(product: any): string | null {
  const images = product?.product_images;
  if (!images?.length) return null;
  const sorted = [...images].sort(
    (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );
  return sorted[0]?.image_url ?? null;
}


export default function SavedProductsScreen() {
  const { language } = useLanguage();
  const { savedSlugs } = useSavedProducts();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (savedSlugs.length === 0) {
      setProducts([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const list: any[] = [];
    for (const slug of savedSlugs) {
      try {
        const p = await getProductBySlug(slug);
        if (p) list.push(p);
      } catch (_) {}
    }
    setProducts(list);
    setLoading(false);
    setRefreshing(false);
  }, [savedSlugs]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchProducts();
    }, [fetchProducts])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  return (
    <>
      <Stack.Screen
        options={{
          title: t(language, 'savedProducts'),
          headerBackTitle: '',
        }}
      />
      <View style={styles.container}>
        {loading && products.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : savedSlugs.length === 0 || products.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>{t(language, 'savedProductsEmpty')}</Text>
            <Text style={styles.emptyHint}>{t(language, 'savedProductsEmptyHint')}</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
            renderItem={({ item }) => {
              const imageUrl = getPrimaryImageUrl(item);
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push(`/product/${item.slug}`)}
                  activeOpacity={0.8}
                >
                  {imageUrl ? (
                    <OptimizedImage uri={imageUrl} style={styles.img} />
                  ) : (
                    <View style={[styles.img, styles.imgPlaceholder]} />
                  )}
                  <Text style={styles.name} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.price}>{formatPrice(Number(item.discount_price ?? item.base_price))}</Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptyHint: { fontSize: 14, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
  grid: { padding: spacing.md, paddingBottom: spacing.xl },
  row: { justifyContent: 'space-between', marginBottom: spacing.md },
  card: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  img: { width: '100%', aspectRatio: 1, resizeMode: 'cover' },
  imgPlaceholder: { backgroundColor: colors.border },
  name: { padding: spacing.sm, fontWeight: '600', color: colors.text, fontSize: 14 },
  price: { paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, fontWeight: '700', color: colors.primary },
});
