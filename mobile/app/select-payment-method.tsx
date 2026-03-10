import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCheckoutPayment } from '@/contexts/CheckoutPaymentContext';
import { useCart } from '@/contexts/CartContext';
import { createOrder, initiatePaymobPayment } from '@/lib/api';
import { hapticPrimary, hapticSuccess, hapticError } from '@/lib/haptics';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';
import { colors, spacing, borderRadius } from '@/constants/theme';

export type PaymentMethodId = 'card' | 'apple_pay' | 'instapay' | 'cod';

const ORDER_NUMBERS_KEY = '@wrapitup_order_numbers';

async function addOrderNumberToStorage(orderNumber: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(ORDER_NUMBERS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(orderNumber)) {
      list.unshift(orderNumber);
      await AsyncStorage.setItem(ORDER_NUMBERS_KEY, JSON.stringify(list.slice(0, 50)));
    }
  } catch (_) {}
}

const METHODS: { id: PaymentMethodId; labelKey: 'creditDebitCard' | 'applePay' | 'instaPay' | 'cashOnDelivery'; available: boolean }[] = [
  { id: 'card', labelKey: 'creditDebitCard', available: true },
  { id: 'apple_pay', labelKey: 'applePay', available: Platform.OS === 'ios' },
  { id: 'instapay', labelKey: 'instaPay', available: true },
  { id: 'cod', labelKey: 'cashOnDelivery', available: true },
];

export default function SelectPaymentMethodScreen() {
  const { language } = useLanguage();
  const { payload, clearPayload } = useCheckoutPayment();
  const { clearCart } = useCart();
  const [selected, setSelected] = useState<PaymentMethodId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [instaPayOrderNumber, setInstaPayOrderNumber] = useState<string | null>(null);
  const [instaPayAmount, setInstaPayAmount] = useState<number>(0);

  if (!payload) {
    return (
      <>
        <Stack.Screen options={{ title: t(language, 'selectPaymentMethod') }} />
        <View style={styles.centered}>
          <Text style={styles.missing}>{t(language, 'orderNotFound')}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
            <Text style={styles.btnText}>{t(language, 'goBack')}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const handleSelect = (id: PaymentMethodId) => {
    const method = METHODS.find((m) => m.id === id);
    if (method && !method.available) return;
    hapticPrimary();
    setSelected(id);
  };

  const runCardPayment = async () => {
    try {
      const orderPayload = { ...payload.orderPayload, payment_method: 'card' };
      const order = await createOrder(orderPayload);
      const nameParts = (payload.orderPayload.customer_name || '').trim().split(/\s+/);
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || '';
      const { paymentKeyToken } = await initiatePaymobPayment(
        payload.total,
        order.id,
        {
          firstName,
          lastName,
          email: payload.orderPayload.customer_email || '',
          phone: payload.orderPayload.customer_phone || '',
        },
      );
      hapticSuccess();
      router.replace({
        pathname: '/paymob-webview',
        params: {
          paymentKeyToken,
          orderId: order.id,
          orderNumber: order.order_number,
        },
      });
    } catch (error: any) {
      setSubmitting(false);
      hapticError();
      const raw = error?.response?.data?.message || error?.message || 'Could not start payment. Please try again.';
      const msg = Array.isArray(raw) ? raw.join('\n') : String(raw);
      Alert.alert(t(language, 'paymentFailed'), msg, [{ text: t(language, 'ok') }]);
    }
  };

  const handleConfirmPay = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      if (selected === 'cod') {
        const orderPayload = { ...payload.orderPayload, payment_method: 'cod' };
        const order = await createOrder(orderPayload);
        const orderNumber = order?.order_number;
        if (!orderNumber) throw new Error('Order number missing');
        hapticSuccess();
        addOrderNumberToStorage(orderNumber).catch(() => {});
        setSubmitting(false);
        clearCart();
        clearPayload();
        router.replace({ pathname: '/order-confirmation', params: { orderNumber } });
        return;
      }
      if (selected === 'instapay') {
        const orderPayload = { ...payload.orderPayload, payment_method: 'instapay' };
        const order = await createOrder(orderPayload);
        setInstaPayAmount(payload.total);
        setInstaPayOrderNumber(order.order_number);
        setSubmitting(false);
        return;
      }
      if (selected === 'card' || selected === 'apple_pay') {
        await runCardPayment();
      }
    } catch (e: any) {
      setSubmitting(false);
      hapticError();
      const raw = e.response?.data?.message || e.message || 'Something went wrong';
      const msg = Array.isArray(raw) ? raw.join('\n') : String(raw);
      Alert.alert(
        t(language, 'paymentFailed'),
        msg,
        [
          { text: t(language, 'changePaymentMethod'), style: 'cancel' },
          { text: t(language, 'retryPayment'), onPress: () => handleConfirmPay() },
        ]
      );
    }
  };

  const closeInstaPayModal = () => {
    if (!instaPayOrderNumber) return;
    const orderNumber = instaPayOrderNumber;
    setInstaPayOrderNumber(null);
    clearCart();
    clearPayload();
    router.replace({ pathname: '/order-confirmation', params: { orderNumber } });
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: t(language, 'selectPaymentMethod') }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.hint}>{t(language, 'paymentRedirectMessage')}</Text>
        {METHODS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[
              styles.methodCard,
              selected === m.id && styles.methodCardSelected,
              !m.available && styles.methodCardDisabled,
            ]}
            onPress={() => handleSelect(m.id)}
            disabled={!m.available}
            activeOpacity={0.7}
          >
            <Text style={[styles.methodLabel, !m.available && styles.methodLabelDisabled]}>
              {t(language, m.labelKey)}
            </Text>
            {!m.available && (
              <Text style={styles.unavailable}>{t(language, 'paymentMethodUnavailable')}</Text>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.confirmBtn, (!selected || submitting) && styles.confirmBtnDisabled]}
          onPress={handleConfirmPay}
          disabled={!selected || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>
              {t(language, 'confirmAndPay')} {formatPrice(payload.total)}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={!!instaPayOrderNumber} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t(language, 'instaPayInstructions')}</Text>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>{t(language, 'instaPayOrderNumber')}</Text>
              <Text style={styles.modalValue}>{instaPayOrderNumber}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>{t(language, 'instaPayAmount')}</Text>
              <Text style={styles.modalValue}>{formatPrice(instaPayAmount)}</Text>
            </View>
            <TouchableOpacity style={styles.modalBtn} onPress={closeInstaPayModal}>
              <Text style={styles.modalBtnText}>{t(language, 'instaPayDone')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {submitting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>{t(language, 'pay')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  missing: { color: colors.textMuted, marginBottom: spacing.md },
  btn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  btnText: { color: '#fff', fontWeight: '600' },
  hint: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  methodCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  methodCardSelected: { borderColor: colors.primary, backgroundColor: colors.backgroundMuted },
  methodCardDisabled: { opacity: 0.7 },
  methodLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  methodLabelDisabled: { color: colors.textMuted },
  unavailable: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  confirmBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalBox: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.xl },
  modalTitle: { fontSize: 16, color: colors.text, marginBottom: spacing.lg },
  modalRow: { marginBottom: spacing.md },
  modalLabel: { fontSize: 12, color: colors.textMuted },
  modalValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalBtn: { marginTop: spacing.xl, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '600' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: spacing.md, fontSize: 16 },
});
