import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
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
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAddresses } from '@/contexts/AddressesContext';
import { usePendingDelivery } from '@/contexts/PendingDeliveryContext';
import { buildMapsLink } from '@/lib/geocoding';
import { useStripe } from '@stripe/stripe-react-native';
import {
  getTimeSlots,
  getAvailableDates,
  getDeliveryDestinations,
  validatePromoCode,
  createOrder,
  createPaymentIntent,
} from '@/lib/api';
import { hapticPrimary, hapticSuccess } from '@/lib/haptics';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { addDays, format, startOfDay } from 'date-fns';

function buildDefaultDeliveryDays(count = 61): { date: string; status: string }[] {
  const today = startOfDay(new Date());
  const days: { date: string; status: string }[] = [];
  for (let i = 0; i < count; i++) {
    days.push({ date: format(addDays(today, i), 'yyyy-MM-dd'), status: 'available' });
  }
  return days;
}

export default function CheckoutScreen() {
  const { language } = useLanguage();
  const { addresses } = useAddresses();
  const { takePending } = usePendingDelivery();
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
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [cardMessage, setCardMessage] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCodeId, setPromoCodeId] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [availableDays, setAvailableDays] = useState<any[]>(() => buildDefaultDeliveryDays());
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  useEffect(() => {
    const today = startOfDay(new Date());
    const end = addDays(today, 60);
    const startStr = format(today, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    const fallback = buildDefaultDeliveryDays(61);

    Promise.all([
      getTimeSlots().then(setTimeSlots).catch(() => setTimeSlots([])),
      getAvailableDates(startStr, endStr)
        .then((list) => {
          const normalized = Array.isArray(list) ? list : [];
          setAvailableDays(normalized.length > 0 ? normalized : fallback);
        })
        .catch(() => setAvailableDays(fallback)),
      getDeliveryDestinations().then(setDestinations).catch(() => setDestinations([])),
    ]).finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      const pending = takePending();
      if (pending) {
        setDeliveryAddress(pending.deliveryAddress);
        setDeliveryMapsLink(pending.deliveryMapsLink);
        setSelectedSavedAddressId(null);
      }
    }, [takePending])
  );

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
      hapticSuccess();
      router.replace({ pathname: '/order-confirmation', params: { orderNumber: order.order_number } });
    } catch (e: any) {
      setSubmitting(false);
      const msg = e.response?.data?.message || e.message || 'Something went wrong';
      Alert.alert(t(language, 'error'), msg);
    }
  };

  const rawAvailable = availableDays || [];
  const validDays = rawAvailable.filter(
    (d: any) => d && (d.status === 'available' || d.status == null) && d.date
  );
  const displayDays = validDays.length > 0 ? validDays : buildDefaultDeliveryDays(14);

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
          <View style={styles.dateRowWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dateScroll}
              contentContainerStyle={styles.dateScrollContent}
            >
              {displayDays.slice(0, 5).map((d: any) => {
                const dateStr = typeof d.date === 'string' ? d.date.split('T')[0] : '';
                if (!dateStr) return null;
                return (
                  <TouchableOpacity
                    key={dateStr}
                    style={[styles.dateChip, deliveryDate === dateStr && styles.dateChipSelected]}
                    onPress={() => setDeliveryDate(dateStr)}
                  >
                    <Text style={[styles.dateChipText, deliveryDate === dateStr && styles.dateChipTextSelected]}>
                      {format(new Date(dateStr), 'EEE d')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={styles.dateChip}
                onPress={() => {
                  setCalendarDate(deliveryDate ? new Date(deliveryDate) : new Date());
                  setCalendarVisible(true);
                }}
              >
                <Text style={styles.dateChipText}>{t(language, 'seeMore')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <Modal visible={calendarVisible} transparent animationType="slide">
            <TouchableOpacity
              style={styles.calendarBackdrop}
              activeOpacity={1}
              onPress={() => setCalendarVisible(false)}
            >
              <View style={styles.calendarModal} onStartShouldSetResponder={() => true}>
                <View style={styles.calendarHeader}>
                  <Text style={styles.calendarTitle}>{t(language, 'deliveryDate')}</Text>
                  <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                    <Text style={styles.calendarDone}>{t(language, 'pay').replace(/ .*/, '')}</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={calendarDate}
                  mode="date"
                  display="calendar"
                  minimumDate={new Date()}
                  maximumDate={addDays(startOfDay(new Date()), 60)}
                  onChange={(_, date) => {
                    if (date) {
                      setCalendarDate(date);
                      setDeliveryDate(format(date, 'yyyy-MM-dd'));
                      if (Platform.OS === 'android') setCalendarVisible(false);
                    }
                  }}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.calendarDoneButton}
                    onPress={() => setCalendarVisible(false)}
                  >
                    <Text style={styles.calendarDoneButtonText}>{t(language, 'done')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          </Modal>

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
                  <Text style={styles.destFee}>{formatPrice(Number(d.fee_egp))}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          <Text style={styles.section}>{t(language, 'address')}</Text>
          {addresses.length > 0 && (
            <>
              <Text style={styles.sectionSub}>{t(language, 'useSavedAddress')}</Text>
              {addresses.map((addr) => {
                const label = addr.fullAddress || [addr.street, addr.area, addr.city].filter(Boolean).join(', ') || addr.city;
                const isSelected = selectedSavedAddressId === addr.id;
                return (
                  <TouchableOpacity
                    key={addr.id}
                    style={[styles.destRow, isSelected && styles.destRowSelected]}
                    onPress={() => {
                      setSelectedSavedAddressId(addr.id);
                      setDeliveryAddress(addr.fullAddress || [addr.street, addr.area, addr.city, addr.governorate, addr.country].filter(Boolean).join(', '));
                      setDeliveryMapsLink(addr.mapsLink || (addr.latitude != null && addr.longitude != null ? buildMapsLink(addr.latitude, addr.longitude) : ''));
                    }}
                  >
                    <Text style={styles.destName} numberOfLines={2}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
          <TouchableOpacity
            style={styles.pickOnMapBtn}
            onPress={() => { hapticPrimary(); router.push({ pathname: '/delivery-address-map', params: { fromCheckout: '1' } }); }}
          >
            <Text style={styles.pickOnMapBtnText}>{t(language, 'pickOnMap')}</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t(language, 'fullDeliveryAddress')}
            placeholderTextColor={colors.textMuted}
            value={deliveryAddress}
            onChangeText={(v) => { setDeliveryAddress(v); setSelectedSavedAddressId(null); }}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder={t(language, 'googleMapsLink')}
            placeholderTextColor={colors.textMuted}
            value={deliveryMapsLink}
            onChangeText={(v) => { setDeliveryMapsLink(v); setSelectedSavedAddressId(null); }}
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
          {promoDiscount > 0 && <Text style={styles.promoOk}>{t(language, 'discount')}: {formatPrice(promoDiscount)}</Text>}

          <Text style={styles.section}>{t(language, 'cardMessageOptional')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t(language, 'giftMessagePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={cardMessage}
            onChangeText={setCardMessage}
            multiline
          />

          {pointsEarned > 0 && (
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pointsGradientWrap}
            >
              <Text style={styles.pointsGradientText}>
                {t(language, 'youWillEarnPoints').replace('{{points}}', String(pointsEarned))}
              </Text>
            </LinearGradient>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t(language, 'subtotal')}</Text>
            <Text style={styles.summaryValue}>{formatPrice(Math.max(0, subtotal - promoDiscount))}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t(language, 'deliveryFees')}</Text>
            <Text style={styles.summaryValue}>{formatPrice(Number(deliveryFee))}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t(language, 'total')}</Text>
            <Text style={styles.total}>{formatPrice(total)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.payBtn, submitting && styles.payBtnDisabled]}
            onPress={() => { hapticPrimary(); handlePay(); }}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payBtnText}>{t(language, 'pay')} {formatPrice(total)}</Text>
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
  sectionSub: { fontWeight: '600', color: colors.textMuted, fontSize: 14, marginTop: spacing.sm, marginBottom: spacing.sm },
  pickOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.backgroundMuted,
  },
  pickOnMapBtnText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
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
  dateRowWrap: {
    height: 52,
    marginBottom: spacing.sm,
  },
  dateScroll: { flex: 1, height: 52 },
  dateScrollContent: { paddingVertical: spacing.xs, alignItems: 'center' },
  dateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.card,
    minHeight: 40,
    justifyContent: 'center',
  },
  dateChipSelected: { borderColor: colors.primary, backgroundColor: colors.backgroundMuted },
  dateChipText: { fontSize: 14, color: colors.text },
  dateChipTextSelected: { color: colors.primary, fontWeight: '600' },
  calendarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  calendarModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingBottom: spacing.xl,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  calendarTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  calendarDone: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  calendarDoneButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  calendarDoneButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' },
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
  pointsGradientWrap: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.xl, marginBottom: spacing.sm },
  pointsGradientText: { fontSize: 13, color: '#fff', fontWeight: '600', textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  summaryLabel: { fontSize: 15, color: colors.textMuted },
  summaryValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  totalRow: { marginTop: spacing.sm, marginBottom: spacing.md },
  totalLabel: { fontSize: 18, fontWeight: '600', color: colors.text },
  total: { fontSize: 22, fontWeight: '700', color: colors.primary },
  payBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
