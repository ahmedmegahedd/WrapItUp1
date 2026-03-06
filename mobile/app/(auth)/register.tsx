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
import { registerAccount } from '@/lib/api';
import { normalizePhoneToE164, isValidE164 } from '@/lib/phoneUtils';
import { t } from '@/lib/i18n';
import { hapticPrimary } from '@/lib/haptics';
import { colors, spacing, borderRadius } from '@/constants/theme';

const SUPABASE_NOT_CONFIGURED_MSG =
  'Supabase is not configured. Copy mobile/env.example to mobile/.env, set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (from your Supabase project → Settings → API), then restart: npx expo start';

export default function RegisterScreen() {
  const { signIn } = useAuth();
  const { language } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const phoneE164 = normalizePhoneToE164(phone);
  const emailValid = !!email.trim();
  const phoneValid = isValidE164(phoneE164);
  const passwordValid = password.length >= 6;
  const formValid = emailValid && phoneValid && passwordValid;

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t(language, 'error'), t(language, 'pleaseEnterEmailPassword'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t(language, 'error'), t(language, 'passwordMinLength'));
      return;
    }
    if (!phoneValid) {
      Alert.alert(t(language, 'error'), t(language, 'phoneRequired'));
      return;
    }
    hapticPrimary();
    setLoading(true);
    try {
      await registerAccount({
        email: email.trim().toLowerCase(),
        password,
        full_name: name.trim() || undefined,
        phone: phoneE164,
      });
      const { error } = await signIn(email.trim(), password);
      setLoading(false);
      if (error) {
        Alert.alert(t(language, 'signUpFailed'), error.message);
        return;
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      setLoading(false);
      const msg = err?.response?.data?.message || err?.message || t(language, 'signUpFailed');
      const userMsg =
        typeof msg === 'string' && msg.toLowerCase().includes('phone')
          ? t(language, 'phoneAlreadyRegistered')
          : typeof msg === 'string' && msg.toLowerCase().includes('email')
            ? t(language, 'emailAlreadyRegistered')
            : msg;
      Alert.alert(t(language, 'signUpFailed'), userMsg);
    }
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
        <Text style={styles.title}>{t(language, 'createAccount')}</Text>
        <Text style={styles.subtitle}>{t(language, 'signUpSubtitle')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t(language, 'fullNameOptional')}
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder={t(language, 'email') + ' *'}
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder={t(language, 'phoneRequiredLabel')}
          placeholderTextColor={colors.textMuted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        <TextInput
          style={styles.input}
          placeholder={t(language, 'passwordMin')}
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password-new"
        />

        <TouchableOpacity
          style={[styles.button, (loading || !formValid) && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading || !formValid}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t(language, 'signUp')}</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.link}>
            <Text style={styles.linkText}>{t(language, 'alreadyHaveAccount')}</Text>
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
    fontSize: 26,
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
