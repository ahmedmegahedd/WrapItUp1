import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';

const VALUE_KEYS = [
  { title: 'valueQuality', desc: 'valueQualityDesc', icon: 'gift-outline' as const },
  { title: 'valueDelivery', desc: 'valueDeliveryDesc', icon: 'calendar-outline' as const },
  { title: 'valueGifts', desc: 'valueGiftsDesc', icon: 'star-outline' as const },
  { title: 'valueSupport', desc: 'valueSupportDesc', icon: 'language-outline' as const },
];

export function ValuePropositionSection() {
  const { language } = useLanguage();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t(language, 'whyChooseUsTitle')}</Text>
      <View style={styles.grid}>
        {VALUE_KEYS.map((item) => (
          <View key={item.title} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={20} color={colors.gold} />
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
    backgroundColor: colors.background,
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
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    backgroundColor: colors.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
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
