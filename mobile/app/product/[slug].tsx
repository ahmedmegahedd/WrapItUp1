import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { OptimizedImage } from '@/components/OptimizedImage';
import { useFocusEffect } from '@react-navigation/native';
import { SlideToAdd } from '@/components/SlideToAdd';
import { useLocalSearchParams, Stack } from 'expo-router';
import { getProductBySlug, getProductAddons } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { language } = useLanguage();
  const { addItem } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const isFirstFocus = useRef(true);
  const prevSlug = useRef(slug);
  const { width: screenWidth } = useWindowDimensions();

  const fetchProduct = useCallback(async (showLoading = false) => {
    if (!slug) return;
    if (showLoading) setLoading(true);
    try {
      const p = await getProductBySlug(slug);
      setProduct(p);
      const defaults: Record<string, string> = {};
      (p.product_variations || []).forEach((v: any) => {
        const opts = v.product_variation_options || [];
        if (opts.length) defaults[v.name] = opts[0].id;
      });
      setSelectedVariations(defaults);
      const addonList = await getProductAddons(p.id).catch(() => []);
      setAddons(addonList);
    } catch {
      setProduct(null);
      setAddons([]);
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
      fetchProduct(showLoading);
    }, [slug, fetchProduct])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProduct(false);
  }, [fetchProduct]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{t(language, 'productNotFound')}</Text>
      </View>
    );
  }

  let unitPrice = Number(product.discount_price ?? product.base_price);
  (product.product_variations || []).forEach((v: any) => {
    const optId = selectedVariations[v.name];
    const opt = (v.product_variation_options || []).find((o: any) => o.id === optId);
    if (opt) unitPrice += Number(opt.price_modifier ?? 0);
  });
  addons.forEach((a) => {
    if (selectedAddons.includes(a.id)) unitPrice += Number(a.price ?? 0);
  });
  const calculatedPrice = unitPrice * quantity;

  const images = (product.product_images || [])
    .slice()
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      product_title: product.title,
      product_slug: product.slug,
      product_image: images[0]?.image_url,
      base_price: product.base_price,
      discount_price: unitPrice,
      quantity,
      selected_variations: selectedVariations,
      selected_addons: selectedAddons,
      points_value: product.points_value ?? 0,
    });
    // Cart badge updates via CartContext; SlideToAdd shows "Added ✓" then resets.
  };

  return (
    <>
      <Stack.Screen options={{ title: product.title }} />
      <View style={styles.container}>
        {/* Image gallery OUTSIDE ScrollView so horizontal swipe works on phone */}
        {images.length > 0 ? (
          <View style={[styles.galleryWrap, { width: screenWidth, height: screenWidth }]}>
            <FlatList
              data={images}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              bounces={true}
              overScrollMode="auto"
              decelerationRate="fast"
              getItemLayout={(_: any, index: number) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
              renderItem={({ item }) => (
                <View style={{ width: screenWidth, height: screenWidth }}>
                  <OptimizedImage
                    uri={item.image_url}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                </View>
              )}
              style={{ width: screenWidth, height: screenWidth }}
            />
          </View>
        ) : (
          <View style={[styles.image, styles.imagePlaceholder, { width: screenWidth, height: screenWidth }]} />
        )}
        {images.length > 1 && images.length > 0 ? (
          <Text style={styles.imageCount}>
            Swipe to see all {images.length} images
          </Text>
        ) : null}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.body}>
          <Text style={styles.price}>E£ {unitPrice.toFixed(2)}</Text>
          {(product.points_value ?? 0) > 0 && (
            <Text style={styles.pointsEarned}>
              {t(language, 'pointsEarnedFromProduct').replace('{{points}}', String((product.points_value ?? 0) * quantity))}
            </Text>
          )}
          {product.description ? (
            <Text style={styles.desc}>{product.description}</Text>
          ) : null}

          {(product.product_variations || []).map((v: any) => (
            <View key={v.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{v.name}</Text>
              <View style={styles.options}>
                {(v.product_variation_options || []).map((opt: any) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.option,
                      selectedVariations[v.name] === opt.id && styles.optionSelected,
                    ]}
                    onPress={() => setSelectedVariations((prev) => ({ ...prev, [v.name]: opt.id }))}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedVariations[v.name] === opt.id && styles.optionTextSelected,
                      ]}
                    >
                      {opt.label}
                      {Number(opt.price_modifier) > 0 ? ` (+E£ ${Number(opt.price_modifier).toFixed(2)})` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {addons.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t(language, 'addOnsLabel')}</Text>
              {addons.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.addonRow}
                  onPress={() =>
                    setSelectedAddons((prev) =>
                      prev.includes(a.id) ? prev.filter((id) => id !== a.id) : [...prev, a.id]
                    )
                  }
                >
                  <View style={[styles.checkbox, selectedAddons.includes(a.id) && styles.checkboxSelected]} />
                  <Text style={styles.addonName}>{a.name}</Text>
                  <Text style={styles.addonPrice}>E£ {Number(a.price).toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.qtyRow}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => q + 1)}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.addBtnWrap}>
            <SlideToAdd
              label={t(language, 'slideToAddToCart')}
              addedLabel={t(language, 'addedCheck')}
              soldOutLabel={t(language, 'soldOut')}
              selectOptionsLabel={t(language, 'selectOptionsToContinue')}
              status={product.in_stock === false ? 'disabled' : 'idle'}
              onComplete={handleAddToCart}
              onPressFallback={handleAddToCart}
              accessibilityLabel={t(language, 'slideToAddToCart')}
            />
            <Text style={styles.priceHint}>E£ {calculatedPrice.toFixed(2)}</Text>
          </View>
        </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  scrollView: { flex: 1 },
  content: { paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: colors.textMuted },
  galleryWrap: { backgroundColor: colors.border },
  galleryFlatList: { flexGrow: 0 },
  gallery: { backgroundColor: colors.border },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.border },
  imagePlaceholder: {},
  imageCount: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  body: { padding: spacing.lg },
  price: { fontSize: 24, fontWeight: '700', color: colors.primary },
  pointsEarned: { marginTop: spacing.xs, fontSize: 14, color: colors.textMuted },
  desc: { marginTop: spacing.sm, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  section: { marginTop: spacing.lg },
  sectionTitle: { fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.backgroundMuted },
  optionText: { fontSize: 14, color: colors.text },
  optionTextSelected: { color: colors.primary, fontWeight: '600' },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  addonName: { flex: 1, fontSize: 15, color: colors.text },
  addonPrice: { fontWeight: '600', color: colors.primary },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontSize: 20, color: colors.text },
  qtyValue: { minWidth: 28, textAlign: 'center', fontWeight: '700', fontSize: 16 },
  addBtnWrap: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  priceHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
