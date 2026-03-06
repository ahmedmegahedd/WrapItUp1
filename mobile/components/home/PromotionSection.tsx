import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors, spacing } from '@/constants/theme';

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
      <LinearGradient
        colors={['#B85C38', '#8F4429']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <Text style={styles.decorEmoji}>🎁</Text>
        <View style={styles.badgePill}>
          <Text style={styles.badge}>{displayTitle}</Text>
        </View>
        <Text style={styles.message}>{displayMessage}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  banner: {
    borderRadius: 20,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  decorEmoji: {
    position: 'absolute',
    top: -10,
    right: -10,
    fontSize: 80,
    opacity: 0.12,
    transform: [{ rotate: '15deg' }],
  },
  badgePill: {
    backgroundColor: colors.backgroundMuted,
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  message: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
