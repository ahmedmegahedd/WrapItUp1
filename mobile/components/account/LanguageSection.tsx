import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AppLanguage } from '@/types/account';
import { t } from '@/lib/i18n';
import { accountColors, accountSpacing, accountTypography, accountBorderRadius, accountShadow } from '@/constants/accountTheme';

export function LanguageSection() {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t(language, 'language')}</Text>
      <View style={[styles.card, accountShadow.soft]}>
        <TouchableOpacity
          style={[styles.option, language === 'en' && styles.optionActive]}
          onPress={() => setLanguage('en')}
          activeOpacity={0.7}
        >
          <Text style={[styles.optionText, language === 'en' && styles.optionTextActive]}>{t(language, 'english')}</Text>
          {language === 'en' && <View style={styles.dot} />}
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity
          style={[styles.option, language === 'ar' && styles.optionActive]}
          onPress={() => setLanguage('ar')}
          activeOpacity={0.7}
        >
          <Text style={[styles.optionText, language === 'ar' && styles.optionTextActive]}>{t(language, 'arabic')}</Text>
          {language === 'ar' && <View style={styles.dot} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: accountSpacing.sectionGap },
  sectionTitle: { ...accountTypography.sectionTitle, color: accountColors.textMuted, marginBottom: accountSpacing.sm, paddingHorizontal: accountSpacing.lg, textTransform: 'uppercase' },
  card: { backgroundColor: accountColors.backgroundElevated, borderRadius: accountBorderRadius.md, marginHorizontal: accountSpacing.lg, overflow: 'hidden', borderWidth: 1, borderColor: accountColors.borderLight },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: accountSpacing.md },
  optionActive: { backgroundColor: accountColors.cream },
  optionText: { ...accountTypography.cardValue, color: accountColors.text },
  optionTextActive: { fontWeight: '600', color: accountColors.charcoal },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: accountColors.goldMuted },
  separator: { height: 1, backgroundColor: accountColors.borderLight, marginLeft: accountSpacing.lg },
});
