import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getHasSeenOnboarding } from '@/lib/onboardingStorage';
import { getOnboardingConfig } from '@/lib/api';
import { colors } from '@/constants/theme';

export default function Index() {
  const { loading, signedIn } = useAuth();
  const [initDone, setInitDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seen = await getHasSeenOnboarding();
      if (cancelled) return;
      if (seen) {
        setInitDone(true);
        return;
      }
      try {
        const config = await getOnboardingConfig();
        if (cancelled) return;
        if (config.enabled && config.slides && config.slides.length > 0) {
          router.replace('/onboarding');
          return;
        }
      } catch (_) {}
      setInitDone(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!initDone) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (signedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
