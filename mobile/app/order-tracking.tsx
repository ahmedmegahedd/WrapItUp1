import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { getOrderByNumber } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';
import { colors, spacing, borderRadius } from '@/constants/theme';

const POLL_INTERVAL_MS = 30_000;

const STEPS = [
  {
    status: 'pending',
    labelKey: 'statusOrderPlaced' as const,
    subLabelKey: 'subLabelPending' as const,
    icon: 'receipt-outline' as const,
  },
  {
    status: 'confirmed',
    labelKey: 'statusConfirmed' as const,
    subLabelKey: 'subLabelConfirmed' as const,
    icon: 'checkmark-circle-outline' as const,
  },
  {
    status: 'preparing',
    labelKey: 'statusPreparing' as const,
    subLabelKey: 'subLabelPreparing' as const,
    icon: 'restaurant-outline' as const,
  },
  {
    status: 'out_for_delivery',
    labelKey: 'statusOutForDelivery' as const,
    subLabelKey: 'subLabelOutForDelivery' as const,
    icon: 'bicycle-outline' as const,
  },
  {
    status: 'delivered',
    labelKey: 'statusDelivered' as const,
    subLabelKey: 'subLabelDelivered' as const,
    icon: 'home-outline' as const,
  },
] as const;

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  out_for_delivery: 3,
  delivered: 4,
};

function PulsingStep({ children }: { children: React.ReactNode }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 750 }),
        withTiming(1.0, { duration: 750 }),
      ),
      -1,
    );
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

function SkeletonRow() {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700 }),
        withTiming(0.4, { duration: 700 }),
      ),
      -1,
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.skeletonRow, style]}>
      <View style={styles.skeletonCircle} />
      <View style={styles.skeletonLine} />
    </Animated.View>
  );
}

export default function OrderTrackingScreen() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrder = useCallback(async (silent = false) => {
    if (!orderNumber) return;
    if (!silent) setHasError(false);
    try {
      const data = await getOrderByNumber(orderNumber);
      setOrder(data);
      setLastFetched(new Date());
      setHasError(false);
    } catch {
      if (!silent) setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    fetchOrder();
    intervalRef.current = setInterval(() => fetchOrder(true), POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchOrder]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  const openWhatsApp = () => {
    const phone = '201000000000'; // Replace with real support number
    const message = encodeURIComponent(
      `Hi, I need help with my WrapItUp order ${orderNumber ?? ''}`,
    );
    Linking.openURL(`whatsapp://send?phone=${phone}&text=${message}`);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <View style={styles.root}>
        <Stack.Screen options={{ title: t(language, 'trackOrder') }} />
        <ScrollView contentContainerStyle={styles.loadingContent}>
          {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
          <View style={[styles.skeletonCard, { marginTop: 24 }]} />
        </ScrollView>
      </View>
    );
  }

  // ── Error state ──
  if (hasError || !order) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Stack.Screen options={{ title: t(language, 'trackOrder') }} />
        <Text style={styles.errorText}>{t(language, 'couldNotLoadOrder')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchOrder(); }}>
          <Text style={styles.retryBtnText}>{t(language, 'retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rawStatus: string = order.order_status ?? 'pending';
  const isCancelled = rawStatus === 'cancelled';
  const currentStep = STATUS_INDEX[rawStatus] ?? 0;

  const formattedDate = lastFetched
    ? lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const summaryRows = [
    { label: t(language, 'orderNumberLabel'), value: order.order_number, highlight: true },
    {
      label: t(language, 'orderDate'),
      value: new Date(order.created_at).toLocaleDateString(),
    },
    {
      label: t(language, 'delivery'),
      value: `${new Date(order.delivery_date).toLocaleDateString()} · ${order.delivery_time_slot}`,
    },
    { label: t(language, 'total'), value: formatPrice(Number(order.total)), isTotal: true },
  ];

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: t(language, 'trackOrder') }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cancelled state ── */}
        {isCancelled ? (
          <Animated.View entering={FadeInDown.springify()} style={[styles.card, styles.cancelledCard]}>
            <Text style={styles.cancelledEmoji}>❌</Text>
            <Text style={styles.cancelledTitle}>{t(language, 'statusCancelled')}</Text>
            <Text style={styles.cancelledMessage}>{t(language, 'statusCancelledMessage')}</Text>
            <TouchableOpacity onPress={openWhatsApp}>
              <Text style={styles.cancelledContact}>{t(language, 'statusCancelledContact')}</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* ── Status stepper ── */
          <Animated.View entering={FadeInDown.springify()} style={styles.stepperWrap}>
            {STEPS.map((step, idx) => {
              const isCompleted = idx < currentStep;
              const isActive = idx === currentStep;
              const isFuture = idx > currentStep;
              const isLast = idx === STEPS.length - 1;

              const circleStyle = [
                styles.stepCircle,
                isCompleted && styles.stepCircleCompleted,
                isActive && styles.stepCircleActive,
                isFuture && styles.stepCircleFuture,
              ];

              const iconColor = (isCompleted || isActive) ? '#fff' : colors.textLight;

              const circle = (
                <View style={circleStyle}>
                  <Ionicons name={step.icon} size={20} color={iconColor} />
                </View>
              );

              return (
                <View key={step.status} style={styles.stepRow}>
                  {/* Left column: icon + connector */}
                  <View style={styles.stepLeft}>
                    {isActive ? <PulsingStep>{circle}</PulsingStep> : circle}
                    {!isLast && (
                      <View
                        style={[
                          styles.connector,
                          isCompleted && styles.connectorCompleted,
                        ]}
                      />
                    )}
                  </View>

                  {/* Right column: label + sublabel */}
                  <View style={styles.stepRight}>
                    <Text
                      style={[
                        styles.stepLabel,
                        (isCompleted || isActive) && styles.stepLabelActive,
                        isFuture && styles.stepLabelFuture,
                      ]}
                    >
                      {t(language, step.labelKey)}
                    </Text>
                    {isActive && (
                      <Text style={styles.stepSubLabel}>{t(language, step.subLabelKey)}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* ── Order summary card ── */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
          <Text style={styles.sectionLabel}>{t(language, 'orderSummary')}</Text>
          {summaryRows.map((row, idx) => (
            <View
              key={idx}
              style={[styles.summaryRow, idx === summaryRows.length - 1 && styles.summaryRowLast]}
            >
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text
                style={[
                  styles.summaryValue,
                  row.highlight && styles.summaryValueHighlight,
                  (row as any).isTotal && styles.summaryValueTotal,
                ]}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* ── Last updated row ── */}
        <View style={styles.lastUpdatedRow}>
          <Text style={styles.lastUpdatedText}>
            {formattedDate
              ? `${t(language, 'lastUpdatedJustNow').replace('just now', formattedDate)}`
              : t(language, 'lastUpdatedJustNow')}
          </Text>
          <TouchableOpacity onPress={onRefresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="refresh-outline" size={16} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Bottom buttons (fixed) ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.whatsappBtn} onPress={openWhatsApp} activeOpacity={0.8}>
          <Ionicons name="logo-whatsapp" size={18} color="#25D366" style={{ marginRight: 8 }} />
          <Text style={styles.whatsappBtnText}>{t(language, 'contactSupportWhatsApp')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.backLinkText}>{t(language, 'backToHome')}</Text>
        </TouchableOpacity>
      </View>
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
  root: { flex: 1, backgroundColor: colors.backgroundMuted },
  centered: { justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  loadingContent: { paddingHorizontal: 20, paddingTop: 24, gap: 4 },

  // Error
  errorText: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.md, textAlign: 'center' },
  retryBtn: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  retryBtnText: { color: colors.primary, fontWeight: '600', fontSize: 15 },

  // Skeleton
  skeletonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  skeletonCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cardBorder },
  skeletonLine: { flex: 1, height: 20, borderRadius: 4, backgroundColor: colors.cardBorder },
  skeletonCard: { height: 160, borderRadius: 20, backgroundColor: colors.cardBorder },

  // Stepper
  stepperWrap: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    marginBottom: 16,
    ...CARD_SHADOW,
  },
  stepRow: { flexDirection: 'row' },
  stepLeft: { width: 48, alignItems: 'center' },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleCompleted: { backgroundColor: colors.primary },
  stepCircleActive: { backgroundColor: colors.primary },
  stepCircleFuture: {
    backgroundColor: colors.backgroundMuted,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 32,
    backgroundColor: colors.cardBorder,
  },
  connectorCompleted: { backgroundColor: colors.primary },
  stepRight: { flex: 1, marginLeft: 16, paddingBottom: 28 },
  stepLabel: { fontSize: 15, fontWeight: '500', color: colors.textLight },
  stepLabelActive: { fontWeight: '700', color: colors.text },
  stepLabelFuture: { fontWeight: '500', color: colors.textLight },
  stepSubLabel: { marginTop: 3, fontSize: 13, color: colors.textMuted, lineHeight: 18 },

  // Cancelled
  cancelledCard: { alignItems: 'center', paddingVertical: 32 },
  cancelledEmoji: { fontSize: 48, marginBottom: 12 },
  cancelledTitle: { fontSize: 20, fontWeight: '700', color: colors.error, marginBottom: 6 },
  cancelledMessage: { fontSize: 14, color: colors.textMuted, marginBottom: 8, textAlign: 'center' },
  cancelledContact: { fontSize: 14, color: colors.primary, fontWeight: '600' },

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

  // Summary rows
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  summaryRowLast: { borderBottomWidth: 0 },
  summaryLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  summaryValue: { fontSize: 13, color: colors.text, fontWeight: '600' },
  summaryValueHighlight: { color: colors.primary, fontWeight: '700' },
  summaryValueTotal: { color: colors.primary, fontWeight: '800', fontSize: 15 },

  // Last updated
  lastUpdatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  lastUpdatedText: { fontSize: 12, color: colors.textLight },

  // Bottom bar
  bottomBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 14,
    height: 50,
  },
  whatsappBtnText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  backLink: { alignItems: 'center', paddingVertical: 4 },
  backLinkText: { fontSize: 13, color: colors.textMuted },
});
