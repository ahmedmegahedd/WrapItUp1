import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAddresses } from '@/contexts/AddressesContext';
import { usePendingDelivery } from '@/contexts/PendingDeliveryContext';
import { useCheckoutPayment } from '@/contexts/CheckoutPaymentContext';
import { useAuth } from '@/contexts/AuthContext';
import { buildMapsLink } from '@/lib/geocoding';
import {
  getTimeSlots,
  getAvailableDates,
  getDeliveryDestinations,
  validatePromoCode,
  trackStartCheckout,
} from '@/lib/api';
import { hapticPrimary, hapticSuccess } from '@/lib/haptics';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { addDays, format, startOfDay } from 'date-fns';

function CheckoutProgressBar({ progress }: { progress: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as any,
  }));

  return (
    <View style={progressStyles.track}>
      <Animated.View style={[progressStyles.fill, barStyle]} />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 3,
    backgroundColor: colors.cardBorder,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});

function buildDefaultDeliveryDays(count = 61): { date: string; status: string }[] {
  const today = startOfDay(new Date());
  const days: { date: string; status: string }[] = [];
  for (let i = 0; i < count; i++) {
    days.push({ date: format(addDays(today, i), 'yyyy-MM-dd'), status: 'available' });
  }
  return days;
}

function CalendarPicker({
  visible,
  onClose,
  onSelectDate,
  minDate,
  maxDate,
  availableDates,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  minDate: Date;
  maxDate: Date;
  availableDates: string[];
}) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
  });

  if (!visible) return null;

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isAvailable = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (availableDates && availableDates.length > 0) {
      return availableDates.includes(dateStr);
    }
    const d = new Date(year, month, day);
    return d >= minDate && d <= maxDate;
  };

  const handleDayPress = (day: number) => {
    if (!isAvailable(day)) return;
    onSelectDate(new Date(year, month, day));
    onClose();
  };

  const prevMonth = () => {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() - 1);
    const now = new Date();
    if (d.getFullYear() < now.getFullYear() ||
      (d.getFullYear() === now.getFullYear() && d.getMonth() < now.getMonth())) return;
    setViewMonth(d);
  };

  const nextMonth = () => {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() + 1);
    const limit = new Date();
    limit.setMonth(limit.getMonth() + 3);
    if (d > limit) return;
    setViewMonth(d);
  };

  return (
    <Pressable
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        zIndex: 1000,
      }}
      onPress={onClose}
    >
      <Pressable onPress={(e) => e.stopPropagation()}>
        <View style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: 20, paddingBottom: 32,
        }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity onPress={prevMonth} style={{ padding: 8 }}>
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{monthName}</Text>
            <TouchableOpacity onPress={nextMonth} style={{ padding: 8 }}>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.textMuted }}>{d}</Text>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map((day, i) => {
              if (!day) return <View key={`empty-${i}`} style={{ width: '14.28%', height: 44 }} />;
              const available = isAvailable(day);
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => handleDayPress(day)}
                  disabled={!available}
                  style={{ width: '14.28%', height: 44, justifyContent: 'center', alignItems: 'center' }}
                >
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    justifyContent: 'center', alignItems: 'center',
                    backgroundColor: available ? colors.primaryLight : 'transparent',
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: available ? '600' : '400', color: available ? colors.primary : colors.textLight }}>
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Pressable>
    </Pressable>
  );
}

export default function CheckoutScreen() {
  const { language } = useLanguage();
  const { session } = useAuth();
  const { addresses } = useAddresses();
  const { takePending } = usePendingDelivery();
  const { items, getTotal, getPointsEarned } = useCart();
  const pointsEarned = getPointsEarned();
  const { setPayload } = useCheckoutPayment();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState(session?.user?.email ?? '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [nameFromAccount, setNameFromAccount] = useState(false);
  const [phoneFromAccount, setPhoneFromAccount] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
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

  // Progress: count filled required fields out of 5
  const progressPct = (() => {
    const filled = [
      customerName.trim().length > 0,
      customerEmail.trim().length > 0,
      deliveryDate.length > 0,
      deliveryTimeSlotId.length > 0,
      deliveryDestinationId.length > 0 || deliveryAddress.trim().length > 0,
    ].filter(Boolean).length;
    return Math.round((filled / 5) * 100);
  })();
  const [calendarVisible, setCalendarVisible] = useState(false);

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

  useEffect(() => {
    if (session?.user) {
      const savedName = session.user.user_metadata?.full_name ?? '';
      if (savedName) { setCustomerName(savedName); setNameFromAccount(true); }
      const savedPhone = session.user.user_metadata?.phone ?? '';
      if (savedPhone) { setCustomerPhone(savedPhone); setPhoneFromAccount(true); }
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      const pending = takePending();
      if (pending) {
        setDeliveryAddress(pending.deliveryAddress);
        setDeliveryMapsLink(pending.deliveryMapsLink);
        setSelectedSavedAddressId(null);
      }
      const cartValue = items.reduce((s, i) => s + i.calculated_price, 0);
      if (cartValue > 0) {
        trackStartCheckout({ cart_value: cartValue });
      }
    }, [takePending, items])
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

  const handlePay = () => {
    if (!customerName.trim()) {
      Alert.alert(t(language, 'error'), t(language, 'pleaseEnterName'));
      return;
    }
    if (!customerEmail.trim()) {
      Alert.alert(t(language, 'error'), t(language, 'pleaseEnterEmail'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      Alert.alert(t(language, 'error'), t(language, 'pleaseEnterValidEmail'));
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
      recipient_name: recipientName.trim() || null,
      recipient_phone: recipientPhone.trim() || null,
      items: items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        selected_variations: i.selected_variations,
        selected_addons: i.selected_addons,
      })),
    };

    setPayload({ orderPayload, total });
    hapticPrimary();
    router.push('/select-payment-method');
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
      <Stack.Screen options={{
        headerShown: true,
        headerTitle: t(language, 'checkout'),
        headerBackTitle: '',
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }} />
      <CheckoutProgressBar progress={progressPct} />
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
          {nameFromAccount && (
            <Text style={styles.autoFillHint}>✓ From your account</Text>
          )}
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
          {phoneFromAccount && (
            <Text style={styles.autoFillHint}>✓ From your account</Text>
          )}

          <Text style={styles.section}>🎁 Recipient Details</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: 12 }}>
            Who is receiving this order? Leave blank if it's for you.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sara Ahmed"
            placeholderTextColor={colors.textMuted}
            value={recipientName}
            onChangeText={setRecipientName}
          />
          <TextInput
            style={styles.input}
            placeholder="e.g. 01012345678"
            placeholderTextColor={colors.textMuted}
            value={recipientPhone}
            onChangeText={setRecipientPhone}
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
              {displayDays.slice(0, 6).map((d: any) => {
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
                onPress={() => setCalendarVisible(true)}
              >
                <Text style={styles.dateChipText}>{t(language, 'seeMore')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

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
            style={styles.payBtn}
            onPress={() => { hapticPrimary(); handlePay(); }}
          >
            <Ionicons name="lock-closed" size={16} color="#fff" style={styles.payLockIcon} />
            <Text style={styles.payBtnText}>{t(language, 'pay')} {formatPrice(total)}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <CalendarPicker
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onSelectDate={(date: Date) => setDeliveryDate(format(date, 'yyyy-MM-dd'))}
        minDate={startOfDay(new Date())}
        maxDate={addDays(startOfDay(new Date()), 90)}
        availableDates={displayDays.map((d: any) => typeof d.date === 'string' ? d.date.split('T')[0] : '').filter(Boolean)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: colors.textMuted, marginBottom: spacing.md },
  btn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  btnText: { color: '#fff', fontWeight: '600' },
  section: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionSub: { fontWeight: '600', color: colors.textMuted, fontSize: 13, marginTop: spacing.sm, marginBottom: spacing.sm },
  pickOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  pickOnMapBtnText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.sm,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textArea: { minHeight: 80 },
  autoFillHint: { fontSize: 11, color: colors.success, marginTop: 3, marginBottom: spacing.sm },
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
    borderColor: colors.cardBorder,
    marginRight: spacing.sm,
    backgroundColor: colors.card,
    minHeight: 40,
    justifyContent: 'center',
  },
  dateChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  dateChipText: { fontSize: 14, color: colors.text },
  dateChipTextSelected: { color: colors.primary, fontWeight: '700' },
  calendarBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  calendarModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: spacing.xl,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  calendarTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  calendarDone: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  calendarDoneButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
  },
  calendarDoneButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: colors.primary, fontWeight: '700' },
  destRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
  },
  destRowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  destName: { fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.sm },
  destFee: { fontWeight: '700', color: colors.primary },
  promoRow: { flexDirection: 'row', gap: spacing.sm },
  promoInput: { flex: 1, marginBottom: 0 },
  promoBtn: {
    backgroundColor: colors.backgroundMuted,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  promoBtnText: { fontWeight: '700', color: colors.primary },
  promoError: { color: colors.error, fontSize: 12, marginTop: 4 },
  promoOk: { color: colors.success, fontSize: 12, marginTop: 4 },
  pointsGradientWrap: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  pointsGradientText: { fontSize: 13, color: '#fff', fontWeight: '600', textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  summaryLabel: { fontSize: 15, color: colors.textMuted },
  summaryValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  totalRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.sm,
  },
  totalLabel: { fontSize: 17, fontWeight: '800', color: colors.text },
  total: { fontSize: 17, fontWeight: '800', color: colors.text },
  payBtn: {
    backgroundColor: colors.primary,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  payLockIcon: { marginRight: 4 },
  payBtnDisabled: { opacity: 0.55 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 17, letterSpacing: 0.4 },
});
