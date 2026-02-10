import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  useWindowDimensions,
  Modal,
  Pressable,
} from 'react-native';
import { OptimizedImage } from '@/components/OptimizedImage';
import { SaveProductButton } from '@/components/SaveProductButton';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { getProductBySlug, getProductAddons } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SkeletonProductDetail } from '@/components/skeletons';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { hapticSuccess } from '@/lib/haptics';

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
  const [addedToCartJustNow, setAddedToCartJustNow] = useState(false);
  const [addonSuggestionVisible, setAddonSuggestionVisible] = useState(false);
  const [suggestionModalAddons, setSuggestionModalAddons] = useState<string[]>([]);
  const addedToCartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstFocus = useRef(true);
  const prevSlug = useRef(slug);

  /** Minimum order quantity for this product (1 = no minimum). Used for default quantity and floor. */
  const minQty = product != null && product.minimum_quantity != null && product.minimum_quantity >= 1
    ? product.minimum_quantity
    : 1;
  const canDecrease = quantity > minQty;
  const { width: screenWidth } = useWindowDimensions();

  const fetchProduct = useCallback(async (showLoading = false) => {
    if (!slug) return;
    if (showLoading) setLoading(true);
    try {
      const p = await getProductBySlug(slug);
      setProduct(p);
      // Default quantity to minimum order quantity when set; otherwise 1
      const initialQty = p.minimum_quantity != null && p.minimum_quantity >= 1
        ? p.minimum_quantity
        : 1;
      setQuantity(initialQty);
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
      return () => {
        if (addedToCartTimeoutRef.current) {
          clearTimeout(addedToCartTimeoutRef.current);
          addedToCartTimeoutRef.current = null;
        }
      };
    }, [slug, fetchProduct])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProduct(false);
  }, [fetchProduct]);

  if (loading) {
    return <SkeletonProductDetail />;
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
    const qtyToAdd = Math.max(minQty, quantity);
    addItem({
      product_id: product.id,
      product_title: product.title,
      product_slug: product.slug,
      product_image: images[0]?.image_url,
      base_price: product.base_price,
      discount_price: unitPrice,
      quantity: qtyToAdd,
      selected_variations: selectedVariations,
      selected_addons: selectedAddons,
      points_value: product.points_value ?? 0,
      minimum_quantity: product.minimum_quantity != null && product.minimum_quantity >= 1 ? product.minimum_quantity : undefined,
    });
    hapticSuccess();
    setAddedToCartJustNow(true);
    if (addedToCartTimeoutRef.current) clearTimeout(addedToCartTimeoutRef.current);
    addedToCartTimeoutRef.current = setTimeout(() => setAddedToCartJustNow(false), 2500);
    if (addons.length > 0) {
      setSuggestionModalAddons([]);
      setAddonSuggestionVisible(true);
    }
  };

  const closeAddonSuggestion = () => setAddonSuggestionVisible(false);

  const addAddonsFromSuggestion = () => {
    const addonIds = suggestionModalAddons;
    if (addonIds.length === 0) {
      closeAddonSuggestion();
      return;
    }
    let addonsPrice = 0;
    addonIds.forEach((id) => {
      const a = addons.find((x) => x.id === id);
      if (a) addonsPrice += Number(a.price ?? 0);
    });
    let baseUnit = Number(product.discount_price ?? product.base_price);
    (product.product_variations || []).forEach((v: any) => {
      const optId = selectedVariations[v.name];
      const opt = (v.product_variation_options || []).find((o: any) => o.id === optId);
      if (opt) baseUnit += Number(opt.price_modifier ?? 0);
    });
    const unitWithAddons = baseUnit + addonsPrice;
    addItem({
      product_id: product.id,
      product_title: product.title,
      product_slug: product.slug,
      product_image: images[0]?.image_url,
      base_price: product.base_price,
      discount_price: unitWithAddons,
      quantity: 1,
      selected_variations: selectedVariations,
      selected_addons: addonIds,
      points_value: product.points_value ?? 0,
      minimum_quantity: product.minimum_quantity != null && product.minimum_quantity >= 1 ? product.minimum_quantity : undefined,
    });
    hapticSuccess();
    closeAddonSuggestion();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: product.title,
          headerRight: () => <SaveProductButton productSlug={product.slug} size={24} />,
        }}
      />
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
          <Text style={styles.price}>{formatPrice(unitPrice)}</Text>
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
                      {Number(opt.price_modifier) > 0 ? ` (+${formatPrice(Number(opt.price_modifier))})` : ''}
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
                  <Text style={styles.addonPrice}>{formatPrice(Number(a.price))}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.qtyRow}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={[styles.qtyBtn, !canDecrease && styles.qtyBtnDisabled]}
                onPress={() => setQuantity((q) => Math.max(minQty, q - 1))}
                disabled={!canDecrease}
              >
                <Text style={[styles.qtyBtnText, !canDecrease && styles.qtyBtnTextDisabled]}>−</Text>
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

          {minQty > 1 && (
            <View style={styles.minimumOrderBanner}>
              <Text style={styles.minimumOrderText}>
                {t(language, 'minimumOrderQuantityMessage').replace('{{count}}', String(minQty))}
              </Text>
            </View>
          )}

          {(() => {
            const stock = product.stock_quantity ?? 0;
            const minExceedsStock = minQty > 1 && minQty > stock;
            const addDisabled = product.in_stock === false || minExceedsStock;
            const buttonLabel = addDisabled
              ? t(language, 'soldOut')
              : addedToCartJustNow
                ? t(language, 'addedToCart')
                : t(language, 'addToCart');
            return (
              <View style={styles.addBtnWrap}>
                {minExceedsStock && (
                  <Text style={styles.minimumOrderExceedsStock}>
                    {t(language, 'minimumOrderExceedsStock')
                      .replace('{{min}}', String(minQty))}
                  </Text>
                )}
                <TouchableOpacity
                  style={[
                    styles.addToCartBtn,
                    addDisabled && styles.addToCartBtnDisabled,
                    addedToCartJustNow && styles.addToCartBtnSuccess,
                  ]}
                  onPress={handleAddToCart}
                  disabled={addDisabled}
                  activeOpacity={0.85}
                  accessibilityLabel={buttonLabel}
                >
                  <Text style={[styles.addToCartBtnText, addDisabled && styles.addToCartBtnTextDisabled]}>
                    {buttonLabel}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.priceHint}>{formatPrice(calculatedPrice)}</Text>
              </View>
            );
          })()}
        </View>
        </ScrollView>
      </View>

      <Modal
        visible={addonSuggestionVisible}
        transparent
        animationType="fade"
        onRequestClose={closeAddonSuggestion}
      >
        <Pressable style={styles.modalOverlay} onPress={closeAddonSuggestion}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t(language, 'suggestAddons')}</Text>
            {addons.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.modalAddonRow}
                onPress={() =>
                  setSuggestionModalAddons((prev) =>
                    prev.includes(a.id) ? prev.filter((id) => id !== a.id) : [...prev, a.id]
                  )
                }
              >
                <View style={[styles.checkbox, suggestionModalAddons.includes(a.id) && styles.checkboxSelected]} />
                <Text style={styles.addonName}>{a.name}</Text>
                <Text style={styles.addonPrice}>{formatPrice(Number(a.price))}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={closeAddonSuggestion}>
                <Text style={styles.modalBtnSecondaryText}>{t(language, 'maybeLater')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrimary, suggestionModalAddons.length === 0 && styles.modalBtnPrimaryDisabled]}
                onPress={addAddonsFromSuggestion}
                disabled={suggestionModalAddons.length === 0}
              >
                <Text style={styles.modalBtnPrimaryText}>{t(language, 'addAddonsToCart')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  qtyBtnDisabled: { opacity: 0.5 },
  qtyBtnText: { fontSize: 20, color: colors.text },
  qtyBtnTextDisabled: { color: colors.textMuted },
  qtyValue: { minWidth: 28, textAlign: 'center', fontWeight: '700', fontSize: 16 },
  minimumOrderBanner: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#fef9c3',
    borderRadius: borderRadius.md,
    borderStartWidth: 4,
    borderStartColor: '#eab308',
  },
  minimumOrderText: {
    fontSize: 13,
    color: '#854d0e',
  },
  minimumOrderExceedsStock: {
    fontSize: 13,
    color: '#b91c1c',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  addBtnWrap: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  addToCartBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartBtnDisabled: {
    backgroundColor: colors.border,
    opacity: 0.8,
  },
  addToCartBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  addToCartBtnTextDisabled: {
    color: colors.textMuted,
  },
  priceHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalAddonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalBtnSecondary: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  modalBtnSecondaryText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '500',
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  modalBtnPrimaryDisabled: {
    opacity: 0.5,
  },
  modalBtnPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
