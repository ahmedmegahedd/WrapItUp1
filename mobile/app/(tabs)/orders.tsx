import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getMyOrders } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SkeletonOrderRow } from '@/components/skeletons';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';
import { colors, spacing, borderRadius } from '@/constants/theme';

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  label: string;
  bg: string;
  text: string;
  dot: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  pending: {
    label: 'Pending',
    bg: '#FEF3C7',
    text: '#92400E',
    dot: '#F59E0B',
    icon: 'time-outline',
  },
  confirmed: {
    label: 'Confirmed',
    bg: '#D1FAE5',
    text: '#065F46',
    dot: '#10B981',
    icon: 'checkmark-circle-outline',
  },
  preparing: {
    label: 'Preparing',
    bg: '#EDE9FE',
    text: '#5B21B6',
    dot: '#8B5CF6',
    icon: 'restaurant-outline',
  },
  out_for_delivery: {
    label: 'On the Way',
    bg: '#DBEAFE',
    text: '#1E40AF',
    dot: '#3B82F6',
    icon: 'bicycle-outline',
  },
  delivered: {
    label: 'Delivered',
    bg: '#D1FAE5',
    text: '#065F46',
    dot: '#10B981',
    icon: 'home-outline',
  },
  cancelled: {
    label: 'Cancelled',
    bg: '#FEE2E2',
    text: '#991B1B',
    dot: '#EF4444',
    icon: 'close-circle-outline',
  },
};

const formatStatus = (status: string) => status.split('_').join(' ');
const toTitleCase = (str: string) => str.replace(/\b\w/g, (c) => c.toUpperCase());

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] ?? {
    label: toTitleCase(formatStatus(status)),
    bg: '#F3F4F6',
    text: '#374151',
    dot: '#6B7280',
    icon: 'ellipse-outline' as keyof typeof Ionicons.glyphMap,
  };

// ── Order card ─────────────────────────────────────────────────────────────────

function OrderCard({ item, language }: { item: any; language: string }) {
  const cfg = getStatusConfig(item.order_status);
  const isCancelled = item.order_status === 'cancelled';
  const items: any[] = item.order_items ?? [];
  const itemsSummary = items
    .map((i) => `${i.product_title} × ${i.quantity}`)
    .join('  ·  ');
  const pointsEarned = item.points_earned ?? 0;

  const navigateToTracking = () => {
    router.push({ pathname: '/order-tracking', params: { orderNumber: item.order_number } });
  };

  return (
    <TouchableOpacity style={[styles.card, isCancelled && { opacity: 0.72 }]} onPress={navigateToTracking} activeOpacity={0.92}>
      {/* Colored status strip */}
      <View style={[styles.cardStrip, { backgroundColor: cfg.dot }]} />

      <View style={styles.cardBody}>
        {/* Row 1: order number + total */}
        <View style={styles.cardRow}>
          <Text style={[styles.orderNumber, isCancelled && styles.strikethrough]}>
            <Text style={styles.orderNumberLabel}>{t(language as any, 'orderNumberLabel')} </Text>
            {item.order_number}
          </Text>
          <Text style={[styles.total, isCancelled && styles.strikethrough]}>{formatPrice(Number(item.total))}</Text>
        </View>

        {/* Row 2: status badge + delivery date */}
        <View style={[styles.cardRow, { marginBottom: 12 }]}>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: cfg.dot }]} />
            <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.metaText, isCancelled && styles.strikethrough]}>
              {new Date(item.delivery_date).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Row 3: time slot */}
        {!!item.delivery_time_slot && (
          <View style={[styles.metaRow, { marginBottom: 12 }]}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.metaText, isCancelled && styles.strikethrough]}>{item.delivery_time_slot}</Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Row 4: items summary */}
        {itemsSummary.length > 0 && (
          <View style={[styles.metaRow, { marginTop: 12, alignItems: 'flex-start' }]}>
            <Ionicons name="bag-outline" size={13} color={colors.textMuted} style={{ marginTop: 1 }} />
            <Text style={[styles.metaText, { flex: 1 }, isCancelled && styles.strikethrough]} numberOfLines={2}>
              {itemsSummary}
            </Text>
          </View>
        )}

        {/* Row 5: points earned */}
        {pointsEarned > 0 && (
          <View style={[styles.metaRow, { marginTop: 8 }]}>
            <Text style={styles.pointsText}>⭐ {pointsEarned} pts earned</Text>
          </View>
        )}

        {/* Footer: track button */}
        {isCancelled ? (
          <View style={styles.cardFooter}>
            <Text style={{ fontSize: 12, color: colors.error, fontStyle: 'italic' }}>Order Cancelled</Text>
          </View>
        ) : (
          <View style={styles.cardFooter}>
            <Ionicons name="navigate-outline" size={14} color={colors.primary} />
            <Text style={styles.trackText}>{t(language as any, 'trackOrder')}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function OrdersScreen() {
  const { session } = useAuth();
  const { language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchOrders = useCallback(async () => {
    const token = session?.access_token;
    if (!token) {
      setLoading(false);
      return;
    }
    setHasError(false);
    try {
      const data = await getMyOrders(token);
      setOrders(data);
    } catch (err) {
      console.warn('[Orders] Fetch failed:', err);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.access_token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();
    }, [fetchOrders]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const countSubtitle = () => {
    if (orders.length === 0) return t(language as any, 'noOrdersYet');
    if (orders.length === 1) return t(language as any, 'ordersCountSingular');
    return t(language as any, 'ordersCountPlural').replace('{{count}}', String(orders.length));
  };

  // ── Not signed in ──
  if (!session) {
    return (
      <View style={styles.centeredFull}>
        <Text style={styles.emptyEmoji}>🔒</Text>
        <Text style={styles.emptyTitle}>{t(language as any, 'signInToViewOrders')}</Text>
      </View>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.listHeader}>
          <Text style={styles.screenTitle}>{t(language as any, 'myOrders')}</Text>
        </View>
        <View style={styles.skeletonList}>
          <SkeletonOrderRow />
          <SkeletonOrderRow />
          <SkeletonOrderRow />
          <SkeletonOrderRow />
        </View>
      </View>
    );
  }

  // ── Error ──
  if (hasError) {
    return (
      <View style={styles.centeredFull}>
        <Text style={styles.errorText}>{t(language as any, 'couldNotLoadOrders')}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => { setLoading(true); fetchOrders(); }}
        >
          <Text style={styles.retryBtnText}>{t(language as any, 'tapToRetry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Empty ──
  if (orders.length === 0) {
    return (
      <View style={[styles.root, { flex: 1 }]}>
        <View style={styles.listHeader}>
          <Text style={styles.screenTitle}>{t(language as any, 'myOrders')}</Text>
        </View>
        <View style={styles.centeredFull}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>{t(language as any, 'noOrdersYet')}</Text>
          <Text style={styles.emptySubtitle}>{t(language as any, 'orderHistoryHint')}</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.replace('/(tabs)/')}
            activeOpacity={0.85}
          >
            <Text style={styles.shopBtnText}>{t(language as any, 'startShopping')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Order list ──
  return (
    <View style={styles.root}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.screenTitle}>{t(language as any, 'myOrders')}</Text>
            <Text style={styles.screenSubtitle}>{countSubtitle()}</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => <OrderCard item={item} language={language} />}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundMuted },

  listHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  screenSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  listContent: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
  skeletonList: { padding: spacing.md },

  centeredFull: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  shopBtn: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  shopBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  errorText: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.md, textAlign: 'center' },
  retryBtn: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  retryBtnText: { color: colors.primary, fontWeight: '600', fontSize: 15 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardStrip: { height: 4, width: '100%' },
  cardBody: { padding: 16 },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumber: { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
  orderNumberLabel: { fontSize: 11, fontWeight: '500', color: colors.textMuted, letterSpacing: 0.5 },
  total: { fontSize: 17, fontWeight: '800', color: colors.primary },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textMuted },
  pointsText: { fontSize: 12, fontWeight: '600', color: '#D97706' },
  divider: { height: 1, backgroundColor: colors.cardBorder },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    marginTop: 12,
    paddingTop: 12,
  },
  trackText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  strikethrough: { textDecorationLine: 'line-through' as const, color: '#9CA3AF' },
});
