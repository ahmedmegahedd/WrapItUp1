import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { OptimizedImage } from '@/components/OptimizedImage';
import { router } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen() {
  const { language } = useLanguage();
  const { items, removeItem, updateQuantity, getTotal, getPointsEarned } = useCart();
  const pointsEarned = getPointsEarned();

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
                <TouchableOpacity
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  style={styles.qtyBtn}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  style={styles.qtyBtn}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.right}>
              <Text style={styles.price}>E£ {item.calculated_price.toFixed(2)}</Text>
              <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={12}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.totalLabel}>{t(language, 'total')}</Text>
        <Text style={styles.total}>E£ {getTotal().toFixed(2)}</Text>
        {pointsEarned > 0 && (
          <Text style={styles.pointsLine}>
            {t(language, 'youWillEarnPoints').replace('{{points}}', String(pointsEarned))}
          </Text>
        )}
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
  list: { padding: spacing.md, paddingBottom: 200 },
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
  qtyBtnText: { fontSize: 18, color: colors.text },
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
  totalLabel: { fontSize: 14, color: colors.textMuted },
  total: { fontSize: 22, fontWeight: '700', color: colors.text },
  pointsLine: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  checkoutBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  checkoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
