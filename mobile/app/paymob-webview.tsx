/**
 * PAYMOB WEBVIEW PAYMENT SCREEN
 * Status: Ready — awaiting EXPO_PUBLIC_PAYMOB_IFRAME_ID in .env
 */

import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useLanguage } from '@/contexts/LanguageContext';
import { openPaymobPayment } from '@/lib/paymob';
import { t } from '@/lib/i18n';
import { colors, spacing } from '@/constants/theme';

export default function PaymobWebViewScreen() {
  const { language } = useLanguage();
  const params = useLocalSearchParams<{
    paymentKeyToken: string;
    orderId: string;
    orderNumber: string;
  }>();
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const iframeId = process.env.EXPO_PUBLIC_PAYMOB_IFRAME_ID ?? '';
  const url = iframeId && params.paymentKeyToken
    ? openPaymobPayment(params.paymentKeyToken, iframeId)
    : '';

  const handleNavigationStateChange = useCallback(
    (navState: { url: string }) => {
      const u = navState?.url || '';
      if (u.includes('success=true') || u.includes('/success')) {
        const orderNumber = params.orderNumber;
        if (orderNumber) {
          router.replace({
            pathname: '/order-confirmation',
            params: { orderNumber },
          });
        }
        return;
      }
      if (u.includes('success=false') || u.includes('error')) {
        router.replace('/payment-failed');
        return;
      }
    },
    [params.orderNumber]
  );

  const handleBack = useCallback(() => {
    Alert.alert(
      t(language, 'cancelPaymentQuestion'),
      '',
      [
        { text: t(language, 'cancel'), style: 'cancel' },
        {
          text: t(language, 'ok'),
          onPress: () => router.back(),
        },
      ]
    );
  }, [language]);

  if (!url) {
    return (
      <>
        <Stack.Screen
          options={{
            title: t(language, 'pay'),
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Text style={styles.backBtnText}>← {t(language, 'goBack')}</Text>
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t(language, 'paymentFailed')}</Text>
          <Text style={styles.hint}>EXPO_PUBLIC_PAYMOB_IFRAME_ID is not set.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t(language, 'pay'),
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← {t(language, 'goBack')}</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          incognito
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backgroundMuted,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  backBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  backBtnText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  errorText: { fontSize: 16, color: colors.text, marginBottom: spacing.sm },
  hint: { fontSize: 14, color: colors.textMuted },
});
