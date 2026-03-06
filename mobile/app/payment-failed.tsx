import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';

export default function PaymentFailedScreen() {
  const { language } = useLanguage();

  return (
    <>
      <Stack.Screen options={{ title: t(language, 'paymentFailed') }} />
      <View style={styles.centered}>
        <Text style={styles.title}>{t(language, 'paymentFailed')}</Text>
        <Text style={styles.hint}>{t(language, 'changePaymentMethod')}</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.replace('/select-payment-method')}
        >
          <Text style={styles.btnText}>{t(language, 'goBack')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.backgroundMuted,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.error, marginBottom: spacing.sm, letterSpacing: 0.3 },
  hint: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.xl, textAlign: 'center' },
  btn: {
    backgroundColor: colors.primary,
    height: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
});
