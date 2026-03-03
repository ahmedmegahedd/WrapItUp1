import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Linking } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrderByNumber, registerPushToken } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePointsBalance } from '@/contexts/PointsBalanceContext';
import { useCheckoutPayment } from '@/contexts/CheckoutPaymentContext';
import { useCart } from '@/contexts/CartContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';
import { colors, spacing, borderRadius } from '@/constants/theme';

const ORDER_NUMBERS_KEY = '@wrapitup_order_numbers';

const PAYMENT_METHOD_KEYS: Record<string, 'creditDebitCard' | 'applePay' | 'instaPay' | 'cashOnDelivery'> = {
  card: 'creditDebitCard',
  apple_pay: 'applePay',
  instapay: 'instaPay',
  cod: 'cashOnDelivery',
};

export default function OrderConfirmationScreen() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const { language } = useLanguage();
  const { refetch: refetchBalance } = usePointsBalance();
  const { clearPayload } = useCheckoutPayment();
  const { clearCart } = useCart();
  const { expoPushToken } = usePushNotifications();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(!!orderNumber);
  const pushRegistered = useRef(false);

  useEffect(() => {
    if (!orderNumber) return;
    getOrderByNumber(orderNumber)
      .then((o) => {
        setOrder(o);
        if ((o?.points_earned ?? 0) > 0) refetchBalance();
        setTimeout(() => {
          try {
            clearCart();
            clearPayload();
          } catch (_) {}
        }, 150);
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

  useEffect(() => {
    if (!order?.customer_email || !expoPushToken || pushRegistered.current) return;
    pushRegistered.current = true;
    registerPushToken(order.customer_email, expoPushToken).catch(() => {});
  }, [order?.customer_email, expoPushToken]);

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

  const paymentMethodLabel = order.payment_method
    ? t(language, PAYMENT_METHOD_KEYS[order.payment_method] || 'creditDebitCard')
    : null;

  const items = order.order_items || [];

  return (
    <>
      <Stack.Screen options={{ title: t(language, 'orderConfirmed') }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>✓</Text>
        </View>
        <Text style={styles.title}>{t(language, 'thankYou')}</Text>
        <Text style={styles.subtitle}>{t(language, 'orderConfirmedMessage')}</Text>
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t(language, 'order')}</Text>
          <Text style={styles.orderNum}>{order.order_number}</Text>
          <Text style={styles.total}>{formatPrice(Number(order.total))}</Text>
          {(order.points_earned ?? 0) > 0 && (
            <Text style={styles.pointsEarned}>
              {t(language, 'pointsEarnedConfirmation').replace('{{points}}', String(order.points_earned))}
            </Text>
          )}
          <Text style={styles.meta}>
            {t(language, 'deliveryDate')}: {new Date(order.delivery_date).toLocaleDateString()}
          </Text>
          <Text style={styles.meta}>
            {t(language, 'timeSlot')}: {order.delivery_time_slot}
          </Text>
          {order.delivery_address ? (
            <Text style={styles.meta}>
              {t(language, 'deliveryAddress')}: {order.delivery_address}
            </Text>
          ) : null}
          {paymentMethodLabel ? (
            <Text style={styles.meta}>
              {t(language, 'paymentMethod')}: {paymentMethodLabel}
            </Text>
          ) : null}
        </View>
        {items.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t(language, 'orderSummary')}</Text>
            {items.map((item: any, idx: number) => (
              <View key={item.id || idx} style={styles.summaryRow}>
                <Text style={styles.summaryTitle}>
                  {item.product_title} × {item.quantity}
                </Text>
                <Text style={styles.summaryLineTotal}>{formatPrice(parseFloat(item.line_total))}</Text>
              </View>
            ))}
          </View>
        )}
        {order.delivery_maps_link ? (
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => Linking.openURL(order.delivery_maps_link)}
          >
            <Text style={styles.trackBtnText}>{t(language, 'trackOrder')}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.btnText}>{t(language, 'backToHome')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.link} onPress={() => router.push('/(tabs)/orders')}>
          <Text style={styles.linkText}>{t(language, 'viewOrderHistory')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
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
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.xs },
  orderNum: { fontWeight: '700', fontSize: 18, color: colors.text },
  total: { fontSize: 22, fontWeight: '700', color: colors.primary, marginTop: 4 },
  pointsEarned: { fontSize: 14, color: colors.primary, marginTop: 6 },
  meta: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  summaryTitle: { fontSize: 14, color: colors.text, flex: 1 },
  summaryLineTotal: { fontSize: 14, fontWeight: '600', color: colors.text },
  trackBtn: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  trackBtnText: { color: colors.primary, fontWeight: '600', fontSize: 16 },
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { marginTop: spacing.md, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 14 },
});
