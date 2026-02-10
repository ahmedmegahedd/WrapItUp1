import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrderByNumber } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { SkeletonOrderRow } from '@/components/skeletons';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';
import { colors, spacing, borderRadius } from '@/constants/theme';

const ORDER_NUMBERS_KEY = '@wrapitup_order_numbers';

export default function OrdersScreen() {
  const { language } = useLanguage();
  const [orderNumbers, setOrderNumbers] = useState<string[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrderNumbers = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(ORDER_NUMBERS_KEY);
      setOrderNumbers(raw ? JSON.parse(raw) : []);
    } catch {
      setOrderNumbers([]);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    const raw = await AsyncStorage.getItem(ORDER_NUMBERS_KEY);
    const numbers: string[] = raw ? JSON.parse(raw) : [];
    const list: any[] = [];
    for (const num of numbers) {
      try {
        const order = await getOrderByNumber(num);
        list.push(order);
      } catch (_) {}
    }
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setOrders(list);
  }, []);

  useEffect(() => {
    loadOrderNumbers().then(() => setLoading(false));
  }, [loadOrderNumbers]);

  useEffect(() => {
    if (!loading) fetchOrders();
  }, [loading, orderNumbers, fetchOrders]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadOrderNumbers().then(() => fetchOrders());
      }
    }, [loading, loadOrderNumbers, fetchOrders])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrderNumbers();
    await fetchOrders();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.list}>
          <SkeletonOrderRow />
          <SkeletonOrderRow />
          <SkeletonOrderRow />
          <SkeletonOrderRow />
        </View>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>{t(language, 'noOrdersYet')}</Text>
        <Text style={styles.emptySubtitle}>{t(language, 'orderHistoryHint')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.orderNumber}>{item.order_number}</Text>
              <Text style={styles.total}>{formatPrice(Number(item.total))}</Text>
            </View>
            <Text style={styles.date}>
              {new Date(item.delivery_date).toLocaleDateString()} · {item.delivery_time_slot}
            </Text>
            <View style={styles.statusRow}>
              <Text style={[styles.badge, item.payment_status === 'paid' ? styles.badgePaid : styles.badgePending]}>
                {item.payment_status === 'paid' ? t(language, 'paid') : t(language, 'pending')}
              </Text>
              <Text style={styles.status}>{item.order_status.replace('_', ' ')}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  card: {
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
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontWeight: '700', color: colors.text, fontSize: 16 },
  total: { fontWeight: '700', color: colors.primary },
  date: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgePaid: { backgroundColor: '#d1fae5', color: '#065f46' },
  badgePending: { backgroundColor: '#fef3c7', color: '#92400e' },
  status: { fontSize: 12, color: colors.textMuted },
});
