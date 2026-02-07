import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';

/**
 * Optional highlight/promotion banner. Content from i18n; can later be driven by API (e.g. admin promo message).
 */
export function PromotionSection() {
  const { language } = useLanguage();

  return (
    <View style={styles.section}>
      <View style={styles.banner}>
        <Text style={styles.badge}>{t(language, 'promotionTitle')}</Text>
        <Text style={styles.message}>{t(language, 'promotionMessage')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  banner: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});
