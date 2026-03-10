import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withSequence,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(!!orderNumber);
  const pushRegistered = useRef(false);

  // Celebration animations
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(0);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  useEffect(() => {
    if (!orderNumber) return;
    const run = async () => {
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

      // Celebration animations
      iconScale.value = withSequence(
        withSpring(1.2, { damping: 5, stiffness: 260 }),
        withSpring(1, { damping: 8, stiffness: 200 }),
      );
      iconRotate.value = withSequence(
        withTiming(-8, { duration: 120 }),
        withSpring(0, { damping: 6, stiffness: 180 }),
      );

      if ((fetchedOrder?.points_earned ?? 0) > 0) refetchBalance();

      try {
        const raw = await AsyncStorage.getItem(ORDER_NUMBERS_KEY);
        const list: string[] = raw ? JSON.parse(raw) : [];
        if (!list.includes(orderNumber)) {
          list.unshift(orderNumber);
          await AsyncStorage.setItem(ORDER_NUMBERS_KEY, JSON.stringify(list.slice(0, 50)));
        }
      } catch (err) {
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
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>{t(language, 'orderNotFound')}</Text>
        <TouchableOpacity style={styles.solidBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.solidBtnText}>{t(language, 'backToHome')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const paymentMethodLabel = order.payment_method
    ? t(language, PAYMENT_METHOD_KEYS[order.payment_method] || 'creditDebitCard')
    : null;

  const items = order.order_items || [];
  const pointsEarned = order.points_earned ?? 0;

  const detailRows = [
    { label: t(language, 'deliveryDateLabel'), value: new Date(order.delivery_date).toLocaleDateString() },
    { label: t(language, 'timeSlotLabel'), value: order.delivery_time_slot },
    ...(order.delivery_address ? [{ label: t(language, 'addressLabel'), value: order.delivery_address }] : []),
    ...(paymentMethodLabel ? [{ label: t(language, 'paymentLabel'), value: paymentMethodLabel }] : []),
    { label: t(language, 'total'), value: formatPrice(Number(order.total)), isTotal: true },
  ];

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Pink hero section */}
      <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
        <Animated.View style={[styles.iconCircle, iconAnimStyle]}>
          <Ionicons name="checkmark" size={40} color="#fff" />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(200).springify()} style={styles.heroTitle}>
          {t(language, 'orderConfirmedHero')}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(300).springify()} style={styles.heroSubtitle}>
          {t(language, 'orderConfirmedMessage')}
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(380).springify()} style={styles.orderNumPill}>
          <Text style={styles.orderNumPillText}>{order.order_number}</Text>
        </Animated.View>
      </View>

      {/* Scrollable content overlaps hero by 20px */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Points earned banner */}
        {pointsEarned > 0 && (
          <Animated.View entering={FadeInDown.delay(420).springify()} style={styles.pointsBanner}>
            <Text style={styles.pointsBannerEmoji}>⭐</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pointsBannerTitle}>{t(language, 'pointsEarnedBannerTitle')}</Text>
              <Text style={styles.pointsBannerSubtitle}>
                {t(language, 'pointsEarnedBannerSubtitle').replace('{{points}}', String(pointsEarned))}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Order details card */}
        <Animated.View entering={FadeInDown.delay(460).springify()} style={styles.card}>
          <Text style={styles.sectionLabel}>{t(language, 'orderDetails')}</Text>
          {detailRows.map((row, idx) => (
            <View
              key={idx}
              style={[
                styles.detailRow,
                idx === detailRows.length - 1 && styles.detailRowLast,
              ]}
            >
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text
                style={[styles.detailValue, (row as any).isTotal && styles.detailValueTotal]}
                numberOfLines={(row.label === t(language, 'addressLabel')) ? 2 : 1}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Order items card */}
        {items.length > 0 && (
          <Animated.View entering={FadeInDown.delay(520).springify()} style={styles.card}>
            <Text style={styles.sectionLabel}>{t(language, 'yourOrder')}</Text>
            {items.map((item: any, idx: number) => (
              <View
                key={item.id || idx}
                style={[styles.itemRow, idx === items.length - 1 && styles.itemRowLast]}
              >
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyBadgeText}>{item.quantity}</Text>
                </View>
                <Text style={styles.itemTitle} numberOfLines={2}>{item.product_title}</Text>
                <Text style={styles.itemLineTotal}>{formatPrice(parseFloat(item.line_total))}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* CTA buttons */}
        <Animated.View entering={FadeInDown.delay(580).springify()} style={styles.ctaWrap}>
          {/* Track Order — always visible, navigates to tracking screen */}
          <TouchableOpacity
            style={styles.solidBtn}
            onPress={() =>
              router.push({ pathname: '/order-tracking', params: { orderNumber: order.order_number } })
            }
            activeOpacity={0.8}
          >
            <Ionicons name="location-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.solidBtnText}>{t(language, 'trackOrder')}</Text>
          </TouchableOpacity>

          {/* Back to Home — outlined */}
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={styles.outlineBtnText}>{t(language, 'backToHome')}</Text>
          </TouchableOpacity>

          {/* View Order History — text link */}
          <TouchableOpacity style={styles.textLink} onPress={() => router.push('/(tabs)/orders')}>
            <Text style={styles.textLinkText}>{t(language, 'viewOrderHistory')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const CARD_SHADOW = {
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 2,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundMuted, padding: spacing.lg },
  errorText: { color: colors.textMuted, marginBottom: spacing.md, fontSize: 15 },

  // Hero
  hero: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingBottom: 48,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  orderNumPill: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  orderNumPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1.5,
  },

  // Scroll
  scrollView: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },

  // Points banner
  pointsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F59E0B',
    padding: 14,
    marginBottom: 16,
  },
  pointsBannerEmoji: { fontSize: 24 },
  pointsBannerTitle: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  pointsBannerSubtitle: { fontSize: 12, color: '#B45309', marginTop: 1 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    marginBottom: 16,
    ...CARD_SHADOW,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  detailValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  detailValueTotal: { color: colors.primary, fontWeight: '800', fontSize: 15 },

  // Item rows
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  itemRowLast: { borderBottomWidth: 0 },
  qtyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBadgeText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  itemTitle: { flex: 1, marginHorizontal: 12, fontSize: 14, fontWeight: '600', color: colors.text },
  itemLineTotal: { fontSize: 14, fontWeight: '700', color: colors.primary },

  // CTAs
  ctaWrap: { gap: 12, marginTop: 8 },
  solidBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  outlineBtn: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  outlineBtnText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  textLink: { marginTop: 4, alignItems: 'center' },
  textLinkText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
