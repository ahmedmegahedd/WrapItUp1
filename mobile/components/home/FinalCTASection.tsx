import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface FinalCTASectionProps {
  headline?: string;
  subtext?: string;
  buttonLabel?: string;
}

export function FinalCTASection({ headline, subtext, buttonLabel }: FinalCTASectionProps) {
  const { language } = useLanguage();

  const displayHeadline = (headline?.trim() || t(language, 'finalCtaHeadline'));
  const displaySubtext = (subtext?.trim() || t(language, 'finalCtaSubtext'));
  const displayButton = (buttonLabel?.trim() || t(language, 'finalCtaButton'));

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <Text style={styles.headline}>{displayHeadline}</Text>
        <Text style={styles.subtext}>{displaySubtext}</Text>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.push('/(tabs)/collections')}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>{displayButton}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headline: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtext: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cta: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 200,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
