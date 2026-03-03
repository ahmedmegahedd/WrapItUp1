import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';

export interface FilterSortRowProps {
  onFilterPress?: () => void;
  onSortPress?: () => void;
}

/**
 * Single row below collection hero: Filter (left) and Sort (right).
 * Equal width, minimal, RTL-aware.
 */
export function FilterSortRow({ onFilterPress, onSortPress }: FilterSortRowProps) {
  const { language } = useLanguage();

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.control}
        onPress={onFilterPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t(language, 'filter')}
      >
        <Text style={styles.label}>{t(language, 'filter')}</Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>
      <View style={styles.gap} />
      <TouchableOpacity
        style={styles.control}
        onPress={onSortPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t(language, 'sort')}
      >
        <Text style={styles.label}>{t(language, 'sort')}</Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.backgroundMuted,
    gap: spacing.sm,
  },
  control: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gap: { width: spacing.sm },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chevron: {
    fontSize: 12,
    color: colors.textMuted,
    marginStart: 4,
  },
});
