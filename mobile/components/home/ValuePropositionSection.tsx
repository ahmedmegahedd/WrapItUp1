import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';

const VALUE_KEYS = [
  { title: 'valueQuality', desc: 'valueQualityDesc' },
  { title: 'valueDelivery', desc: 'valueDeliveryDesc' },
  { title: 'valueGifts', desc: 'valueGiftsDesc' },
  { title: 'valueSupport', desc: 'valueSupportDesc' },
] as const;

export function ValuePropositionSection() {
  const { language } = useLanguage();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t(language, 'whyChooseUsTitle')}</Text>
      <View style={styles.grid}>
        {VALUE_KEYS.map((item, index) => (
          <View key={item.title} style={styles.card}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{['◆', '◇', '○', '●'][index]}</Text>
            </View>
            <Text style={styles.cardTitle}>{t(language, item.title)}</Text>
            <Text style={styles.cardDesc}>{t(language, item.desc)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.backgroundMuted,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  grid: {
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 18,
    color: colors.primary,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
