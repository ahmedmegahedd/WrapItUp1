import { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { OptimizedImage } from '@/components/OptimizedImage';
import { SaveProductButton } from '@/components/SaveProductButton';
import { CollectionHero } from '@/components/collections/CollectionHero';
import { FilterSortRow } from '@/components/collections/FilterSortRow';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { getCollectionBySlug } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { SkeletonProductGridCard } from '@/components/skeletons';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';
import { colors, spacing, borderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_WIDTH * 0.4;

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

  if (!collection && !loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{t(language, 'collectionNotFound')}</Text>
      </View>
    );
  }

  const products = collection
    ? (collection.collection_products || [])
        .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((cp: any) => cp.products)
        .filter((p: any) => p && p.is_active)
    : [];

  const listHeader = (
    <>
      <CollectionHero
        imageUri={collection?.image_url ?? null}
        title={collection?.name ?? ''}
        description={collection?.description ?? null}
      />
      <FilterSortRow />
    </>
  );

  const loadingHeader = (
    <>
      <View style={[styles.heroSkeleton, { height: HERO_HEIGHT }]} />
      <View style={styles.filterSortSkeleton}>
        <View style={styles.controlSkeleton} />
        <View style={styles.controlSkeleton} />
      </View>
    </>
  );

  return (
    <>
      <Stack.Screen options={{ title: collection?.name ?? '' }} />
      <View style={styles.container}>
        <FlatList
          data={loading ? [1, 2, 3, 4, 5, 6] : products}
          keyExtractor={(item) => (typeof item === 'object' && item?.id ? item.id : String(item))}
          numColumns={2}
          ListHeaderComponent={loading ? loadingHeader : listHeader}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.columnRow}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          renderItem={({ item }) =>
            loading ? (
              <SkeletonProductGridCard />
            ) : (
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
                  <View style={styles.saveBtnWrap}>
                    <SaveProductButton productSlug={item.slug} size={18} />
                  </View>
                </View>
                <Text style={styles.name} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.price}>{formatPrice(Number(item.discount_price ?? item.base_price))}</Text>
                {(item.points_value ?? 0) > 0 && (
                  <Text style={styles.pointsEarned}>
                    ⭐ {item.points_value} pts
                  </Text>
                )}
                <View style={styles.addHint}>
                  <Text style={styles.addHintText}>🛒 Add</Text>
                </View>
              </TouchableOpacity>
            )
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: colors.textMuted },
  heroSkeleton: {
    width: '100%',
    backgroundColor: colors.border,
  },
  filterSortSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.backgroundMuted,
    gap: spacing.sm,
  },
  controlSkeleton: {
    flex: 1,
    height: 44,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
  },
  grid: { padding: spacing.md, paddingBottom: spacing.xl },
  columnRow: { justifyContent: 'space-between', marginBottom: spacing.md },
  card: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  imgWrap: { position: 'relative', width: '100%', aspectRatio: 1 },
  img: { width: '100%', height: '100%', resizeMode: 'cover' },
  imgPlaceholder: { backgroundColor: colors.border },
  saveBtnWrap: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
    fontWeight: '600',
    color: colors.text,
    fontSize: 13,
  },
  price: {
    paddingHorizontal: 10,
    paddingBottom: 6,
    fontWeight: '800',
    color: colors.primary,
    fontSize: 15,
  },
  pointsEarned: { paddingHorizontal: 10, paddingBottom: 4, fontSize: 12, color: colors.textMuted },
  addHint: {
    height: 32,
    backgroundColor: '#FDF2F8',
    borderTopWidth: 1,
    borderTopColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});
