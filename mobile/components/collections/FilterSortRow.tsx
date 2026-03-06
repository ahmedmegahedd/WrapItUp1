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
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: spacing.sm,
  },
  control: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EC4899',
  },
  chevron: {
    fontSize: 12,
    color: '#EC4899',
    marginStart: 4,
  },
});
