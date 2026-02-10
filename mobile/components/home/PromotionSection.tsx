import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface PromotionSectionProps {
  visible?: boolean;
  title?: string;
  message?: string;
}

/**
 * Optional highlight/promotion banner. Content from admin app settings or i18n fallback.
 */
export function PromotionSection({ visible = true, title, message }: PromotionSectionProps) {
  const { language } = useLanguage();

  if (!visible) return null;

  const displayTitle = (title?.trim() || t(language, 'promotionTitle'));
  const displayMessage = (message?.trim() || t(language, 'promotionMessage'));

  return (
    <View style={styles.section}>
      <View style={styles.banner}>
        <Text style={styles.badge}>{displayTitle}</Text>
        <Text style={styles.message}>{displayMessage}</Text>
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
