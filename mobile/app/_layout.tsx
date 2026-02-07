import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { PointsBalanceProvider } from '@/contexts/PointsBalanceContext';
import { AddressesProvider } from '@/contexts/AddressesContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  usePushNotifications();
  const { language, isRTL } = useLanguage();
  return (
    <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fff' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="collection/[slug]" options={{ headerShown: true, title: t(language, 'collections') }} />
        <Stack.Screen name="product/[slug]" options={{ headerShown: true }} />
        <Stack.Screen name="checkout" options={{ headerShown: true, title: t(language, 'checkout') }} />
        <Stack.Screen name="order-confirmation" options={{ headerShown: true, title: t(language, 'orderConfirmed') }} />
        <Stack.Screen name="account-personal" options={{ headerShown: true }} />
        <Stack.Screen name="account-language" options={{ headerShown: true }} />
        <Stack.Screen name="talk-to-us" options={{ headerShown: true }} />
      </Stack>
    </View>
  );
}

const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <StripeProvider publishableKey={stripePublishableKey}>
      <AuthProvider>
        <LanguageProvider>
          <PointsBalanceProvider>
            <AddressesProvider>
              <CartProvider>
              <StatusBar style="dark" />
              <AppContent />
              </CartProvider>
            </AddressesProvider>
          </PointsBalanceProvider>
        </LanguageProvider>
      </AuthProvider>
    </StripeProvider>
  );
}
