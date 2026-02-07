import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { accountColors, accountSpacing, accountTypography, accountBorderRadius, accountShadow } from '@/constants/accountTheme';

export function CardsSection() {
  const { language } = useLanguage();
  const savedCards: { id: string; brand: 'visa' | 'mastercard'; last4: string; isDefault?: boolean }[] = [];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t(language, 'savedCards')}</Text>
      <View style={[styles.card, accountShadow.soft]}>
        <Text style={styles.subtitle}>{t(language, 'savedCardsSubtitle')}</Text>
        {savedCards.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="card-outline" size={32} color={accountColors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>{t(language, 'noSavedCards')}</Text>
            <Text style={styles.emptyHint}>{t(language, 'noSavedCardsHint')}</Text>
          </View>
        ) : (
          savedCards.map((c) => (
            <View key={c.id} style={styles.cardRow}>
              <Text style={styles.cardBrand}>{c.brand === 'visa' ? 'Visa' : 'Mastercard'}</Text>
              <Text style={styles.cardLast4}>•••• {c.last4}</Text>
              {c.isDefault && <Text style={styles.defaultTag}>{t(language, 'default')}</Text>}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: accountSpacing.sectionGap },
  sectionTitle: { ...accountTypography.sectionTitle, color: accountColors.textMuted, marginBottom: accountSpacing.sm, paddingHorizontal: accountSpacing.lg, textTransform: 'uppercase' },
  card: { backgroundColor: accountColors.backgroundElevated, borderRadius: accountBorderRadius.md, marginHorizontal: accountSpacing.lg, padding: accountSpacing.md, borderWidth: 1, borderColor: accountColors.borderLight },
  subtitle: { ...accountTypography.caption, color: accountColors.textSecondary, marginBottom: accountSpacing.md },
  empty: { alignItems: 'center', paddingVertical: accountSpacing.lg },
  emptyIconWrap: { marginBottom: accountSpacing.sm },
  emptyTitle: { ...accountTypography.cardTitle, color: accountColors.text, marginBottom: 4 },
  emptyHint: { ...accountTypography.caption, color: accountColors.textMuted },
  cardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: accountColors.borderLight },
  cardBrand: { ...accountTypography.cardValue, color: accountColors.text, marginRight: 8 },
  cardLast4: { ...accountTypography.cardValue, color: accountColors.textSecondary },
  defaultTag: { marginLeft: 'auto', fontSize: 11, color: accountColors.success },
});
