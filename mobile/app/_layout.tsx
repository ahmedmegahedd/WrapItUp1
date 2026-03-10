import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { PointsBalanceProvider } from '@/contexts/PointsBalanceContext';
import { AddressesProvider } from '@/contexts/AddressesContext';
import { PendingDeliveryProvider } from '@/contexts/PendingDeliveryContext';
import { SavedProductsProvider } from '@/contexts/SavedProductsContext';
import { CheckoutPaymentProvider } from '@/contexts/CheckoutPaymentContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { SplashGate } from '@/components/SplashGate';
import { t } from '@/lib/i18n';
import { colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  usePushNotifications();
  const { language, isRTL } = useLanguage();
  return (
    <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
      <SplashGate>
      <Stack
        screenOptions={{
          headerShown: false,
          headerBackTitle: 'back',
          contentStyle: { backgroundColor: '#fff' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="collection/[slug]" options={{ headerShown: true, title: t(language, 'collections') }} />
        <Stack.Screen name="product/[slug]" options={{ headerShown: true }} />
        <Stack.Screen name="checkout" options={{ headerShown: true, title: t(language, 'checkout') }} />
        <Stack.Screen name="select-payment-method" options={{ headerShown: true, title: t(language, 'selectPaymentMethod') }} />
        <Stack.Screen name="paymob-webview" options={{ headerShown: true }} />
        <Stack.Screen name="payment-failed" options={{ headerShown: true }} />
        <Stack.Screen name="delivery-address-map" options={{ headerShown: true }} />
        <Stack.Screen name="order-confirmation" options={{ headerShown: false }} />
        <Stack.Screen name="order-tracking" options={{ headerShown: true, title: t(language, 'trackOrder'), headerStyle: { backgroundColor: '#fff' }, headerTintColor: colors.primary, headerShadowVisible: false }} />
        <Stack.Screen name="(account)" options={{ headerShown: false }} />
        <Stack.Screen name="account-personal" options={{ headerShown: true }} />
        <Stack.Screen name="account-language" options={{ headerShown: true }} />
        <Stack.Screen name="talk-to-us" options={{ headerShown: true }} />
      </Stack>
      </SplashGate>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <PointsBalanceProvider>
          <AddressesProvider>
            <PendingDeliveryProvider>
            <SavedProductsProvider>
            <CheckoutPaymentProvider>
            <CartProvider>
            <StatusBar style="dark" />
            <AppContent />
            </CartProvider>
            </CheckoutPaymentProvider>
            </SavedProductsProvider>
            </PendingDeliveryProvider>
          </AddressesProvider>
        </PointsBalanceProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
