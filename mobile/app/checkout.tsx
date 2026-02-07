import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStripe } from '@stripe/stripe-react-native';
import {
  getTimeSlots,
  getAvailableDates,
  getDeliveryDestinations,
  validatePromoCode,
  createOrder,
  createPaymentIntent,
} from '@/lib/api';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { addDays, format } from 'date-fns';

export default function CheckoutScreen() {
  const { language } = useLanguage();
  const { items, getTotal, getPointsEarned, clearCart } = useCart();
  const pointsEarned = getPointsEarned();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTimeSlotId, setDeliveryTimeSlotId] = useState('');
  const [deliveryTimeSlotLabel, setDeliveryTimeSlotLabel] = useState('');
  const [deliveryDestinationId, setDeliveryDestinationId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryMapsLink, setDeliveryMapsLink] = useState('');
  const [cardMessage, setCardMessage] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCodeId, setPromoCodeId] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [availableDays, setAvailableDays] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const today = new Date();
    const end = addDays(today, 60);
    Promise.all([
      getTimeSlots().then(setTimeSlots),
      getAvailableDates(format(today, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')).then(setAvailableDays),
      getDeliveryDestinations().then(setDestinations),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const subtotal = items.reduce((s, i) => s + i.calculated_price, 0);
  const deliveryFee = destinations.find((d) => d.id === deliveryDestinationId)?.fee_egp ?? 0;
  const total = Math.max(0, subtotal - promoDiscount + Number(deliveryFee));

  const applyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoError(null);
    try {
      const res = await validatePromoCode(code, subtotal);
      setPromoDiscount(Number(res.discount_amount_egp));
      setPromoCodeId(res.promo_code_id);
    } catch (e: any) {
      setPromoError(e.response?.data?.message || 'Invalid or expired code');
      setPromoDiscount(0);
      setPromoCodeId(null);
    }
  };

  const handlePay = async () => {
    if (!customerName.trim()) {
      Alert.alert(t(language, 'error'), t(language, 'pleaseEnterName'));
      return;
    }
    if (!customerEmail.trim()) {
      Alert.alert(t(language, 'error'), t(language, 'pleaseEnterEmail'));
      return;
    }
    if (!deliveryDate) {
      Alert.alert(t(language, 'error'), t(language, 'pleaseSelectDate'));
      return;
    }
    if (!deliveryTimeSlotId) {
      Alert.alert(t(language, 'error'), t(language, 'pleaseSelectTimeSlot'));
      return;
    }
    if (destinations.length > 0 && !deliveryDestinationId) {
      Alert.alert(t(language, 'error'), t(language, 'pleaseSelectDestination'));
      return;
    }
    if (!deliveryAddress.trim()) {
      Alert.alert(t(language, 'error'), t(language, 'pleaseEnterAddress'));
      return;
    }
    if (!deliveryMapsLink.trim()) {
      Alert.alert(t(language, 'error'), t(language, 'pleaseEnterMapsLink'));
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim() || undefined,
        delivery_date: deliveryDate,
        delivery_time_slot: deliveryTimeSlotLabel,
        delivery_time_slot_id: deliveryTimeSlotId,
        delivery_destination_id: deliveryDestinationId || undefined,
        delivery_fee_egp: deliveryFee,
        delivery_address: deliveryAddress.trim(),
        delivery_maps_link: deliveryMapsLink.trim(),
        promo_code_id: promoCodeId || undefined,
        discount_amount_egp: promoDiscount,
        card_message: cardMessage.trim() || undefined,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          selected_variations: i.selected_variations,
          selected_addons: i.selected_addons,
        })),
      };

      const order = await createOrder(orderPayload);
      const { clientSecret } = await createPaymentIntent(order.id, total);

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Wrap It Up',
      });

      if (initError) {
        Alert.alert(t(language, 'error'), initError.message);
        setSubmitting(false);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        Alert.alert(t(language, 'error'), presentError.message);
        setSubmitting(false);
        return;
      }

      clearCart();
      setSubmitting(false);
      router.replace({ pathname: '/order-confirmation', params: { orderNumber: order.order_number } });
    } catch (e: any) {
      setSubmitting(false);
      const msg = e.response?.data?.message || e.message || 'Something went wrong';
      Alert.alert(t(language, 'error'), msg);
    }
  };

  const validDays = (availableDays || []).filter((d: any) => d.status === 'available');

  if (items.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: t(language, 'checkout') }} />
        <View style={styles.centered}>
          <Text style={styles.empty}>{t(language, 'yourCartEmpty')}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
            <Text style={styles.btnText}>{t(language, 'goBack')}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t(language, 'checkout') }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.section}>{t(language, 'customer')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t(language, 'fullName')}
            placeholderTextColor={colors.textMuted}
            value={customerName}
            onChangeText={setCustomerName}
          />
          <TextInput
            style={styles.input}
            placeholder={t(language, 'emailRequired')}
            placeholderTextColor={colors.textMuted}
            value={customerEmail}
            onChangeText={setCustomerEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder={t(language, 'phone')}
            placeholderTextColor={colors.textMuted}
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.section}>{t(language, 'deliveryDate')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {validDays.slice(0, 14).map((d: any) => (
              <TouchableOpacity
                key={d.date}
                style={[styles.dateChip, deliveryDate === d.date && styles.dateChipSelected]}
                onPress={() => setDeliveryDate(d.date)}
              >
                <Text style={[styles.dateChipText, deliveryDate === d.date && styles.dateChipTextSelected]}>
                  {format(new Date(d.date), 'EEE d')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {deliveryDate && (
            <>
              <Text style={styles.section}>{t(language, 'timeSlot')}</Text>
              <View style={styles.chips}>
                {timeSlots.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.chip, deliveryTimeSlotId === s.id && styles.chipSelected]}
                    onPress={() => {
                      setDeliveryTimeSlotId(s.id);
                      setDeliveryTimeSlotLabel(s.label || s.id);
                    }}
                  >
                    <Text style={[styles.chipText, deliveryTimeSlotId === s.id && styles.chipTextSelected]}>
                      {s.label || s.id}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {destinations.length > 0 && (
            <>
              <Text style={styles.section}>{t(language, 'destination')}</Text>
              {destinations.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.destRow, deliveryDestinationId === d.id && styles.destRowSelected]}
                  onPress={() => setDeliveryDestinationId(d.id)}
                >
                  <Text style={styles.destName}>{d.name}</Text>
                  <Text style={styles.destFee}>E£ {Number(d.fee_egp).toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          <Text style={styles.section}>{t(language, 'address')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t(language, 'fullDeliveryAddress')}
            placeholderTextColor={colors.textMuted}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder={t(language, 'googleMapsLink')}
            placeholderTextColor={colors.textMuted}
            value={deliveryMapsLink}
            onChangeText={setDeliveryMapsLink}
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={styles.section}>{t(language, 'promoCode')}</Text>
          <View style={styles.promoRow}>
            <TextInput
              style={[styles.input, styles.promoInput]}
              placeholder={t(language, 'code')}
              placeholderTextColor={colors.textMuted}
              value={promoCode}
              onChangeText={(val) => { setPromoCode(val.toUpperCase()); setPromoError(null); }}
            />
            <TouchableOpacity style={styles.promoBtn} onPress={applyPromo}>
              <Text style={styles.promoBtnText}>{t(language, 'apply')}</Text>
            </TouchableOpacity>
          </View>
          {promoError && <Text style={styles.promoError}>{promoError}</Text>}
          {promoDiscount > 0 && <Text style={styles.promoOk}>{t(language, 'discount')}: E£ {promoDiscount.toFixed(2)}</Text>}

          <Text style={styles.section}>{t(language, 'cardMessageOptional')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t(language, 'giftMessagePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={cardMessage}
            onChangeText={setCardMessage}
            multiline
          />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t(language, 'total')}</Text>
            <Text style={styles.total}>E£ {total.toFixed(2)}</Text>
          </View>
          {pointsEarned > 0 && (
            <Text style={styles.pointsLine}>
              {t(language, 'youWillEarnPoints').replace('{{points}}', String(pointsEarned))}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.payBtn, submitting && styles.payBtnDisabled]}
            onPress={handlePay}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payBtnText}>{t(language, 'pay')} E£ {total.toFixed(2)}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: colors.textMuted, marginBottom: spacing.md },
  btn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  btnText: { color: '#fff', fontWeight: '600' },
  section: { fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.sm,
    color: colors.text,
    backgroundColor: colors.card,
  },
  textArea: { minHeight: 80 },
  dateScroll: { marginBottom: spacing.sm },
  dateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.card,
  },
  dateChipSelected: { borderColor: colors.primary, backgroundColor: colors.backgroundMuted },
  dateChipText: { fontSize: 14, color: colors.text },
  dateChipTextSelected: { color: colors.primary, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.backgroundMuted },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: colors.primary, fontWeight: '600' },
  destRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
  },
  destRowSelected: { borderColor: colors.primary },
  destName: { fontWeight: '600', color: colors.text },
  destFee: { fontWeight: '700', color: colors.primary },
  promoRow: { flexDirection: 'row', gap: spacing.sm },
  promoInput: { flex: 1, marginBottom: 0 },
  promoBtn: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  promoBtnText: { fontWeight: '600', color: colors.text },
  promoError: { color: colors.error, fontSize: 12, marginTop: 4 },
  promoOk: { color: colors.success, fontSize: 12, marginTop: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.md },
  totalLabel: { fontSize: 18, fontWeight: '600', color: colors.text },
  total: { fontSize: 22, fontWeight: '700', color: colors.primary },
  pointsLine: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  payBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
