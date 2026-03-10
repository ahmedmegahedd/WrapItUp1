import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Linking } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withSequence,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
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

  // Celebration animations
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));
  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  useEffect(() => {
    if (!orderNumber) return;
    const run = async () => {
      // Step 1: Fetch order — failure here is the only reason to show error UI
      let fetchedOrder = null;
      try {
        fetchedOrder = await getOrderByNumber(orderNumber);
        setOrder(fetchedOrder);
      } catch (err) {
        console.warn('[OrderConfirmation] Failed to fetch order:', err);
        setOrder(null);
        setLoading(false);
        return;
      }

      // Step 2: Trigger celebration animations
      iconScale.value = withSequence(
        withSpring(1.2, { damping: 5, stiffness: 260 }),
        withSpring(1, { damping: 8, stiffness: 200 }),
      );
      iconRotate.value = withSequence(
        withTiming(-8, { duration: 120 }),
        withSpring(0, { damping: 6, stiffness: 180 }),
      );
      confettiOpacity.value = withSequence(
        withDelay(100, withTiming(1, { duration: 300 })),
        withDelay(1200, withTiming(0, { duration: 600 })),
      );

      // Step 3: Refetch loyalty balance if points were earned
      if ((fetchedOrder?.points_earned ?? 0) > 0) refetchBalance();

      // Step 4: Update order history in AsyncStorage — isolated, never affects order display
      try {
        const raw = await AsyncStorage.getItem(ORDER_NUMBERS_KEY);
        const list: string[] = raw ? JSON.parse(raw) : [];
        if (!list.includes(orderNumber)) {
          list.unshift(orderNumber);
          await AsyncStorage.setItem(ORDER_NUMBERS_KEY, JSON.stringify(list.slice(0, 50)));
        }
      } catch (err) {
        // AsyncStorage failure is non-fatal — order is already displayed
        console.warn('[OrderConfirmation] AsyncStorage update failed:', err);
      }

      setLoading(false);
    };
    run();
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
        <View style={styles.celebrationZone}>
          {/* Confetti dots */}
          <Animated.View style={[styles.confettiWrap, confettiStyle]} pointerEvents="none">
            {[
              { top: 0, left: '15%', bg: colors.primary, size: 8 },
              { top: 8, left: '72%', bg: colors.gold, size: 6 },
              { top: 20, left: '38%', bg: colors.success, size: 7 },
              { top: 4, left: '55%', bg: colors.primary, size: 5 },
              { top: 16, left: '85%', bg: colors.gold, size: 8 },
              { top: 24, left: '8%', bg: colors.success, size: 6 },
            ].map((dot, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  top: dot.top,
                  left: dot.left as any,
                  width: dot.size,
                  height: dot.size,
                  borderRadius: dot.size / 2,
                  backgroundColor: dot.bg,
                }}
              />
            ))}
          </Animated.View>

          <Animated.View style={[styles.iconWrap, iconAnimStyle]}>
            <Text style={styles.icon}>✓</Text>
          </Animated.View>
        </View>

        <Animated.Text entering={FadeInDown.delay(200).springify()} style={styles.title}>
          {t(language, 'thankYou')}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(320).springify()} style={styles.subtitle}>
          {t(language, 'orderConfirmedMessage')}
        </Animated.Text>
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
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2, alignItems: 'stretch' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: colors.textMuted, marginBottom: spacing.md },
  celebrationZone: {
    alignItems: 'center',
    position: 'relative',
    marginTop: spacing.xl,
    height: 120,
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
  },
  confettiWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  icon: { fontSize: 38, color: '#fff', fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: spacing.lg, letterSpacing: 0.3 },
  subtitle: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  orderNum: { fontWeight: '800', fontSize: 20, color: colors.text },
  total: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 },
  pointsEarned: { fontSize: 13, color: colors.gold, marginTop: 6, fontWeight: '700' },
  meta: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  summaryTitle: { fontSize: 14, color: colors.text, flex: 1 },
  summaryLineTotal: { fontSize: 14, fontWeight: '600', color: colors.text },
  trackBtn: {
    marginTop: spacing.lg,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  trackBtnText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  link: { marginTop: spacing.md, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
