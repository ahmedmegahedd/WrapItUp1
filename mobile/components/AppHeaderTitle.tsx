import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors } from '@/constants/theme';

/** Centered brand title for the app header. Pink accent, minimal. */
export function AppHeaderTitle() {
  const { language } = useLanguage();
  return (
    <Text style={styles.title} numberOfLines={1}>
      {t(language, 'appName')}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
});
