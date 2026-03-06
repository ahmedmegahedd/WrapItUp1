import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { hapticPrimary } from '@/lib/haptics';
import { colors, spacing, borderRadius } from '@/constants/theme';

const SUPABASE_NOT_CONFIGURED_MSG =
  'Supabase is not configured. Copy mobile/env.example to mobile/.env, set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (from your Supabase project → Settings → API), then restart: npx expo start';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t(language, 'error'), t(language, 'pleaseEnterEmailPassword'));
      return;
    }
    hapticPrimary();
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert(
        t(language, 'loginFailed'),
        error.message === 'Supabase not configured' ? SUPABASE_NOT_CONFIGURED_MSG : error.message
      );
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        {!isSupabaseConfigured && (
          <View style={styles.configBanner}>
            <Text style={styles.configBannerText}>{t(language, 'configBanner')}</Text>
          </View>
        )}
        <Text style={styles.title}>{t(language, 'appName')}</Text>
        <Text style={styles.subtitle}>{t(language, 'signInSubtitle')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t(language, 'email')}
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder={t(language, 'password')}
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t(language, 'signIn')}</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.link}>
            <Text style={styles.linkText}>{t(language, 'dontHaveAccount')}</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.backgroundMuted,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  link: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  configBanner: {
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  configBannerText: {
    color: colors.warning,
    fontSize: 12,
    textAlign: 'center',
  },
});
