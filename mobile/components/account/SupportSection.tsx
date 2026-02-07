import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, type I18nKey } from '@/lib/i18n';
import { accountColors, accountSpacing, accountTypography } from '@/constants/accountTheme';

const links: { key: string; url?: string }[] = [
  { key: 'contactSupport', url: 'mailto:support@wrapitup.com' },
  { key: 'privacyPolicy', url: undefined },
  { key: 'termsAndConditions', url: undefined },
  { key: 'refundPolicy', url: undefined },
];

export function SupportSection() {
  const { language } = useLanguage();

  const handlePress = (item: (typeof links)[0]) => {
    if (item.url) Linking.openURL(item.url);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t(language, 'support')}</Text>
      <View style={styles.card}>
        {links.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.row}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
            disabled={!item.url}
          >
            <Text style={[styles.linkText, !item.url && styles.linkTextDisabled]}>{t(language, item.key as I18nKey)}</Text>
            {item.url && <Ionicons name="chevron-forward" size={18} color={accountColors.textMuted} />}
          </TouchableOpacity>
        ))}
        <Text style={styles.note}>{t(language, 'refundPolicyNote')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: accountSpacing.sectionGap },
  sectionTitle: { ...accountTypography.sectionTitle, color: accountColors.textMuted, marginBottom: accountSpacing.sm, paddingHorizontal: accountSpacing.lg, textTransform: 'uppercase' },
  card: { backgroundColor: accountColors.backgroundElevated, borderRadius: 14, marginHorizontal: accountSpacing.lg, paddingVertical: 4, borderWidth: 1, borderColor: accountColors.borderLight },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: accountSpacing.md },
  linkText: { ...accountTypography.cardValue, color: accountColors.text },
  linkTextDisabled: { color: accountColors.textMuted },
  note: { ...accountTypography.caption, color: accountColors.textMuted, paddingHorizontal: accountSpacing.md, paddingBottom: accountSpacing.md, fontStyle: 'italic' },
});
