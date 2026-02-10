import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { getCollections, getProducts, getCollectionBySlug } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';
import {
  CollectionBubble,
  EditorialProductCard,
  ViewAllCard,
  type EditorialCardSize,
} from '@/components/collections';
import { OptimizedImage } from '@/components/OptimizedImage';

const TAB_BAR_PILL_HEIGHT = 56;
const EDITORIAL_SIZES: EditorialCardSize[] = ['medium', 'small', 'large', 'small', 'medium', 'large', 'medium'];
const PREVIEW_LIMIT = 7;

export default function CollectionsScreen() {
  const { language, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const listBottomPadding = Math.max(insets.bottom, 12) + TAB_BAR_PILL_HEIGHT + spacing.xl;

  const [viewMode, setViewMode] = useState<'bubbles' | 'full'>('bubbles');
  const [collections, setCollections] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [collectionProducts, setCollectionProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const isFirstFocus = useRef(true);

  const fetchCollections = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const list = await getCollections();
      setCollections(list);
    } catch (err: any) {
      setCollections([]);
      setError(err?.response?.status ? `API error ${err.response.status}` : err?.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const showLoading = isFirstFocus.current;
      if (isFirstFocus.current) isFirstFocus.current = false;
      fetchCollections(showLoading);
    }, [fetchCollections])
  );

  const loadProductsForSelection = useCallback(async (id: string | null) => {
    setProductsLoading(true);
    try {
      if (id === null) {
        const products = await getProducts(false, true);
        setAllProducts(products);
        setCollectionProducts([]);
      } else {
        const coll = collections.find((c) => c.id === id);
        if (coll) {
          const data = await getCollectionBySlug(coll.slug);
          const products = (data.collection_products || [])
            .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map((cp: any) => cp.products)
            .filter((p: any) => p && p.is_active !== false);
          setCollectionProducts(products);
        } else {
          setCollectionProducts([]);
        }
      }
    } catch {
      setCollectionProducts([]);
      if (id === null) setAllProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [collections]);

  useFocusEffect(
    useCallback(() => {
      if (collections.length === 0) return;
      if (selectedId === null) {
        if (allProducts.length === 0) loadProductsForSelection(null);
      } else {
        loadProductsForSelection(selectedId);
      }
    }, [collections.length, selectedId, loadProductsForSelection])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCollections(false).then(() => {
      if (selectedId === null) loadProductsForSelection(null);
      else loadProductsForSelection(selectedId);
    });
  }, [fetchCollections, selectedId, loadProductsForSelection]);

  const handleSelectBubble = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id === null) {
      if (allProducts.length === 0) loadProductsForSelection(null);
      else setCollectionProducts([]);
    } else {
      loadProductsForSelection(id);
    }
  }, [allProducts.length, loadProductsForSelection]);

  const displayProducts =
    selectedId === null ? allProducts : collectionProducts;
  const previewProducts = displayProducts.slice(0, PREVIEW_LIMIT);
  const selectedSlug = selectedId ? collections.find((c) => c.id === selectedId)?.slug : null;

  const handleViewAll = useCallback(() => {
    if (selectedId === null) {
      setViewMode('full');
    } else if (selectedSlug) {
      router.push(`/collection/${selectedSlug}`);
    }
  }, [selectedId, selectedSlug]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (viewMode === 'full') {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backToBubbles}
          onPress={() => setViewMode('bubbles')}
          activeOpacity={0.8}
        >
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.primary} />
          <Text style={styles.backToBubblesText}>{t(language, 'allCollections')}</Text>
        </TouchableOpacity>
        <ScrollView
          style={styles.fullList}
          contentContainerStyle={[styles.fullListContent, { paddingBottom: listBottomPadding }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {collections.length === 0 ? (
            <View style={styles.emptyWrap}>
              {error ? (
                <>
                  <Text style={styles.emptyText}>{t(language, 'couldntLoadCollections')}</Text>
                  <Text style={styles.emptySubtext}>{error}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyText}>{t(language, 'noCollectionsYet')}</Text>
                  <Text style={styles.emptySubtext}>{t(language, 'noCollectionsHint')}</Text>
                </>
              )}
            </View>
          ) : (
            collections.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.row}
                onPress={() => router.push(`/collection/${item.slug}`)}
                activeOpacity={0.8}
              >
                {item.image_url ? (
                  <OptimizedImage uri={item.image_url} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]} />
                )}
                <View style={styles.textWrap}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  const columnGap = spacing.sm;
  const halfWidth = (screenWidth - spacing.lg * 2 - columnGap) / 2;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: listBottomPadding }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.bubbleSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bubbleList}
          >
            <CollectionBubble
              collection={null}
              imageUrlOverride={collections[0]?.image_url}
              label={t(language, 'all')}
              selected={selectedId === null}
              onPress={() => handleSelectBubble(null)}
            />
            {collections.map((c) => (
              <CollectionBubble
                key={c.id}
                collection={c}
                label={c.name}
                selected={selectedId === c.id}
                onPress={() => handleSelectBubble(c.id)}
              />
            ))}
          </ScrollView>
        </View>

        {error && collections.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{t(language, 'couldntLoadCollections')}</Text>
            <Text style={styles.emptySubtext}>{error}</Text>
          </View>
        ) : productsLoading && previewProducts.length === 0 ? (
          <View style={styles.loadingProducts}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.editorialGrid}>
            <View style={[styles.column, { width: halfWidth }]}>
              {[0, 2, 4, 6].map((i) => {
                const product = previewProducts[i];
                if (!product) return null;
                return (
                  <View key={product.id} style={styles.cardWrap}>
                    <EditorialProductCard
                      product={product}
                      size={EDITORIAL_SIZES[i] ?? 'medium'}
                      onPress={() => router.push(`/product/${product.slug}`)}
                    />
                  </View>
                );
              })}
            </View>
            <View style={[styles.column, { width: halfWidth, marginStart: columnGap }]}>
              {[1, 3, 5].map((i) => {
                const product = previewProducts[i];
                if (!product) return null;
                return (
                  <View key={product.id} style={styles.cardWrap}>
                    <EditorialProductCard
                      product={product}
                      size={EDITORIAL_SIZES[i] ?? 'medium'}
                      onPress={() => router.push(`/product/${product.slug}`)}
                    />
                  </View>
                );
              })}
              <View style={styles.cardWrap}>
                <ViewAllCard label={t(language, 'viewAll')} onPress={handleViewAll} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  bubbleSection: {
    paddingVertical: spacing.md,
    paddingStart: spacing.lg,
    paddingEnd: spacing.xs,
  },
  bubbleList: {
    paddingEnd: spacing.lg,
    alignItems: 'center',
    gap: 0,
  },
  editorialGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  column: {
    gap: spacing.md,
  },
  cardWrap: {
    width: '100%',
  },
  loadingProducts: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyWrap: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: { fontSize: 17, fontWeight: '600', color: colors.textMuted },
  emptySubtext: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  backToBubbles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backToBubblesText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  fullList: { flex: 1 },
  fullListContent: { padding: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
  },
  thumbPlaceholder: { backgroundColor: colors.border },
  textWrap: { flex: 1, marginStart: spacing.md },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  desc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 24, color: colors.textMuted },
});
