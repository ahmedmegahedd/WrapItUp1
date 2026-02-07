import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrderByNumber } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePointsBalance } from '@/contexts/PointsBalanceContext';
import { t } from '@/lib/i18n';
import { colors, spacing } from '@/constants/theme';

const ORDER_NUMBERS_KEY = '@wrapitup_order_numbers';

export default function OrderConfirmationScreen() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const { language } = useLanguage();
  const { refetch: refetchBalance } = usePointsBalance();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(!!orderNumber);

  useEffect(() => {
    if (!orderNumber) return;
    getOrderByNumber(orderNumber)
      .then((o) => {
        setOrder(o);
        if ((o?.points_earned ?? 0) > 0) refetchBalance();
        return AsyncStorage.getItem(ORDER_NUMBERS_KEY);
      })
      .then((raw) => {
        const list: string[] = raw ? JSON.parse(raw) : [];
        if (orderNumber && !list.includes(orderNumber)) {
          list.unshift(orderNumber);
          AsyncStorage.setItem(ORDER_NUMBERS_KEY, JSON.stringify(list.slice(0, 50)));
        }
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <>
        <Stack.Screen options={{ title: t(language, 'order') }} />
        <View style={styles.centered}>
          <Text style={styles.error}>{t(language, 'orderNotFound')}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.btnText}>{t(language, 'backToHome')}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t(language, 'orderConfirmed') }} />
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>✓</Text>
        </View>
        <Text style={styles.title}>{t(language, 'thankYou')}</Text>
        <Text style={styles.subtitle}>{t(language, 'orderConfirmedMessage')}</Text>
        <View style={styles.card}>
          <Text style={styles.orderNum}>{order.order_number}</Text>
          <Text style={styles.total}>E£ {Number(order.total).toFixed(2)}</Text>
          {(order.points_earned ?? 0) > 0 && (
            <Text style={styles.pointsEarned}>
              {t(language, 'pointsEarnedConfirmation').replace('{{points}}', String(order.points_earned))}
            </Text>
          )}
          <Text style={styles.meta}>
            {t(language, 'delivery')}: {new Date(order.delivery_date).toLocaleDateString()} · {order.delivery_time_slot}
          </Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.btnText}>{t(language, 'continueShopping')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.link} onPress={() => router.push('/(tabs)/orders')}>
          <Text style={styles.linkText}>{t(language, 'viewOrderHistory')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.backgroundMuted },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: colors.textMuted, marginBottom: spacing.md },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
  icon: { fontSize: 40, color: '#fff', fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: spacing.lg },
  subtitle: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  orderNum: { fontWeight: '700', fontSize: 18, color: colors.text },
  total: { fontSize: 22, fontWeight: '700', color: colors.primary, marginTop: 4 },
  pointsEarned: { fontSize: 14, color: colors.primary, marginTop: 6 },
  meta: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  btn: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { marginTop: spacing.md, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 14 },
});
