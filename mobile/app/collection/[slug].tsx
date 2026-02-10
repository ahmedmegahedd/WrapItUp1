import { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { OptimizedImage } from '@/components/OptimizedImage';
import { SaveProductButton } from '@/components/SaveProductButton';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { getCollectionBySlug } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { SkeletonProductGridCard } from '@/components/skeletons';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';
import { colors, spacing, borderRadius } from '@/constants/theme';

export default function CollectionScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { language } = useLanguage();
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFirstFocus = useRef(true);
  const prevSlug = useRef(slug);

  const fetchCollection = useCallback(async (showLoading = false) => {
    if (!slug) return;
    if (showLoading) setLoading(true);
    try {
      const data = await getCollectionBySlug(slug);
      setCollection(data);
    } catch {
      setCollection(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug]);

  useFocusEffect(
    useCallback(() => {
      if (!slug) return;
      if (prevSlug.current !== slug) {
        prevSlug.current = slug;
        isFirstFocus.current = true;
      }
      const showLoading = isFirstFocus.current;
      if (isFirstFocus.current) isFirstFocus.current = false;
      fetchCollection(showLoading);
    }, [slug, fetchCollection])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCollection(false);
  }, [fetchCollection]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.desc}>
          <View style={{ height: 14, width: '80%', backgroundColor: colors.border, borderRadius: 4 }} />
        </View>
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={(k) => String(k)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={() => <SkeletonProductGridCard />}
        />
      </View>
    );
  }

  if (!collection) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{t(language, 'collectionNotFound')}</Text>
      </View>
    );
  }

  const products = (collection.collection_products || [])
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((cp: any) => cp.products)
    .filter((p: any) => p && p.is_active);

  return (
    <>
      <Stack.Screen options={{ title: collection.name }} />
      <View style={styles.container}>
        {collection.description ? (
          <Text style={styles.desc}>{collection.description}</Text>
        ) : null}
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/product/${item.slug}`)}
              activeOpacity={0.8}
            >
              <View style={styles.imgWrap}>
                {item.product_images?.[0]?.image_url ? (
                  <OptimizedImage uri={item.product_images[0].image_url} style={styles.img} />
                ) : (
                  <View style={[styles.img, styles.imgPlaceholder]} />
                )}
                <SaveProductButton productSlug={item.slug} size={20} style={styles.saveBtn} />
              </View>
              <Text style={styles.name} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.price}>{formatPrice(Number(item.discount_price ?? item.base_price))}</Text>
              {(item.points_value ?? 0) > 0 && (
                <Text style={styles.pointsEarned}>
                  {t(language, 'pointsEarnedFromProduct').replace('{{points}}', String(item.points_value))}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: colors.textMuted },
  desc: {
    padding: spacing.lg,
    fontSize: 14,
    color: colors.textMuted,
  },
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
  imgWrap: { position: 'relative', width: '100%', aspectRatio: 1 },
  img: { width: '100%', height: '100%', resizeMode: 'cover' },
  imgPlaceholder: { backgroundColor: colors.border },
  saveBtn: { position: 'absolute', top: spacing.xs, right: spacing.xs },
  name: { padding: spacing.sm, fontWeight: '600', color: colors.text, fontSize: 14 },
  price: { paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, fontWeight: '700', color: colors.primary },
  pointsEarned: { paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, fontSize: 12, color: colors.textMuted },
});
