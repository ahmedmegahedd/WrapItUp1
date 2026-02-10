import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { OptimizedImage } from '@/components/OptimizedImage';
import { router } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getRecommendedAtCheckout } from '@/lib/api';

/** Space reserved for the floating tab bar (GlassyTabBar pill + padding) */
const TAB_BAR_HEIGHT = 76;

function getPrimaryImageUrl(product: any): string | null {
  const images = product?.product_images;
  if (!images?.length) return null;
  const sorted = [...images].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
  return sorted[0]?.image_url ?? null;
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { items, removeItem, updateQuantity, getTotal, getPointsEarned } = useCart();
  const pointsEarned = getPointsEarned();
  const footerBottom = Math.max(insets.bottom, spacing.md) + TAB_BAR_HEIGHT;
  const [recommended, setRecommended] = useState<any[]>([]);

  useEffect(() => {
    getRecommendedAtCheckout()
      .then(setRecommended)
      .catch(() => setRecommended([]));
  }, []);

  const cartProductIds = new Set(items.map((i) => i.product_id));
  const recommendedFiltered = recommended.filter((p) => !cartProductIds.has(p.id));

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cart-outline" size={80} color={colors.border} />
        <Text style={styles.emptyTitle}>{t(language, 'yourCartEmpty')}</Text>
        <Text style={styles.emptySubtitle}>{t(language, 'addItemsHint')}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/collections')}>
          <Text style={styles.buttonText}>{t(language, 'browseCollections')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          recommendedFiltered.length > 0 ? (
            <View style={styles.recommendedSection}>
              <Text style={styles.recommendedTitle}>{t(language, 'peopleAlsoLike')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendedScroll}
              >
                {recommendedFiltered.map((p) => {
                  const imageUrl = getPrimaryImageUrl(p);
                  const price = p.discount_price ?? p.base_price;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.recommendedCard}
                      onPress={() => router.push(`/product/${p.slug}`)}
                      activeOpacity={0.8}
                    >
                      {imageUrl ? (
                        <OptimizedImage uri={imageUrl} style={styles.recommendedThumb} contentFit="cover" />
                      ) : (
                        <View style={[styles.recommendedThumb, styles.thumbPlaceholder]} />
                      )}
                      <Text style={styles.recommendedName} numberOfLines={2}>{p.title}</Text>
                      <Text style={styles.recommendedPrice}>{formatPrice(price)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.product_image ? (
              <OptimizedImage uri={item.product_image} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]} />
            )}
            <View style={styles.details}>
              <Text style={styles.name} numberOfLines={2}>{item.product_title}</Text>
              {Object.keys(item.selected_variations).length > 0 && (
                <Text style={styles.variations}>
                  {Object.entries(item.selected_variations).map(([k, v]) => `${k}: ${v}`).join(', ')}
                </Text>
              )}
              {item.selected_addons.length > 0 && (
                <Text style={styles.addons}>+{item.selected_addons.length} {t(language, 'addOns')}</Text>
              )}
              <View style={styles.qtyRow}>
                {(() => {
                  const minQty = item.minimum_quantity ?? 1;
                  const canDecrease = item.quantity > minQty;
                  return (
                    <>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        style={[styles.qtyBtn, !canDecrease && styles.qtyBtnDisabled]}
                        disabled={!canDecrease}
                      >
                        <Text style={[styles.qtyBtnText, !canDecrease && styles.qtyBtnTextDisabled]}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qty}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        style={styles.qtyBtn}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}
              </View>
            </View>
            <View style={styles.right}>
              <Text style={styles.price}>{formatPrice(item.calculated_price)}</Text>
              <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={12}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <View style={[styles.footer, { paddingBottom: footerBottom }]}>
        {pointsEarned > 0 && (
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pointsGradientWrap}
          >
            <Text style={styles.pointsGradientText}>
              {t(language, 'youWillEarnPoints').replace('{{points}}', String(pointsEarned))}
            </Text>
          </LinearGradient>
        )}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t(language, 'subtotal')}</Text>
          <Text style={styles.summaryValue}>{formatPrice(getTotal())}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t(language, 'deliveryFees')}</Text>
          <Text style={styles.summaryValueMuted}>{t(language, 'atCheckout')}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>{t(language, 'total')}</Text>
          <Text style={styles.total}>{formatPrice(getTotal())}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => router.push('/checkout')}
        >
          <Text style={styles.checkoutBtnText}>{t(language, 'proceedToCheckout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginTop: spacing.md },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  list: { padding: spacing.md, paddingBottom: 260 },
  recommendedSection: { marginTop: spacing.lg, marginBottom: spacing.md },
  recommendedTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  recommendedScroll: { paddingHorizontal: spacing.xs },
  recommendedCard: { width: 120, marginRight: spacing.md },
  recommendedThumb: { width: 120, height: 120, borderRadius: borderRadius.sm },
  recommendedName: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: spacing.xs },
  recommendedPrice: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 2 },
  pointsGradientWrap: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm, marginBottom: spacing.sm },
  pointsGradientText: { fontSize: 13, color: '#fff', fontWeight: '600', textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  summaryLabel: { fontSize: 15, color: colors.textMuted },
  summaryValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  summaryValueMuted: { fontSize: 15, color: colors.textMuted },
  totalRow: { marginTop: spacing.sm, marginBottom: spacing.md },
  totalLabel: { fontSize: 18, fontWeight: '600', color: colors.text },
  total: { fontSize: 22, fontWeight: '700', color: colors.text },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  thumb: { width: 72, height: 72, borderRadius: borderRadius.sm },
  thumbPlaceholder: { backgroundColor: colors.border },
  details: { flex: 1, marginLeft: spacing.md },
  name: { fontWeight: '600', color: colors.text },
  variations: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  addons: { fontSize: 12, color: colors.textMuted },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnDisabled: { opacity: 0.5 },
  qtyBtnText: { fontSize: 18, color: colors.text },
  qtyBtnTextDisabled: { color: colors.textMuted },
  qty: { marginHorizontal: spacing.sm, minWidth: 24, textAlign: 'center', fontWeight: '600' },
  right: { alignItems: 'flex-end' },
  price: { fontWeight: '700', color: colors.text, marginBottom: 4 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkoutBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  checkoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
