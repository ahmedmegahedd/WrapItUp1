import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { accountColors, accountSpacing, accountTypography } from '@/constants/accountTheme';

const gradientColors = ['#faf8f5', '#f5f1eb'] as const;

export function IdentityHeader({ firstName }: { firstName: string }) {
  const { language } = useLanguage();

  return (
    <LinearGradient colors={gradientColors} style={styles.wrapper}>
      <View style={styles.avatar}>
        <Text style={styles.initial}>{(firstName || '?').charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.welcome}>
        {t(language, 'welcome')}, {firstName || 'Guest'}
      </Text>
      <Text style={styles.subtitle}>{t(language, 'manageSubtitle')}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: accountSpacing.xl,
    paddingBottom: accountSpacing.lg,
    paddingHorizontal: accountSpacing.lg,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: accountColors.beige,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: accountSpacing.md,
  },
  initial: {
    fontSize: 28,
    fontWeight: '300',
    color: accountColors.charcoal,
  },
  welcome: {
    ...accountTypography.welcome,
    color: accountColors.text,
    marginBottom: accountSpacing.xs,
  },
  subtitle: {
    ...accountTypography.welcomeSubtitle,
    color: accountColors.textSecondary,
  },
});
