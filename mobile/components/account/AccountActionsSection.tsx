import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { accountColors, accountSpacing, accountTypography } from '@/constants/accountTheme';

export function AccountActionsSection() {
  const { language } = useLanguage();
  const { signOut } = useAuth();

  const handleLogOut = () => {
    Alert.alert(t(language, 'logOutConfirmTitle'), t(language, 'logOutConfirmMessage'), [
      { text: t(language, 'cancel'), style: 'cancel' },
      { text: t(language, 'logOut'), style: 'destructive', onPress: async () => {
        await signOut();
        router.replace('/(auth)/login');
      }},
    ]);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t(language, 'accountActions')}</Text>
      <TouchableOpacity style={styles.logOutBtn} onPress={handleLogOut} activeOpacity={0.7}>
        <Text style={styles.logOutText}>{t(language, 'logOut')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: accountSpacing.sectionGap },
  sectionTitle: { ...accountTypography.sectionTitle, color: accountColors.textMuted, marginBottom: accountSpacing.sm, paddingHorizontal: accountSpacing.lg, textTransform: 'uppercase' },
  logOutBtn: { marginHorizontal: accountSpacing.lg, paddingVertical: accountSpacing.md, alignItems: 'center', borderWidth: 1, borderColor: accountColors.border, borderRadius: 14 },
  logOutText: { ...accountTypography.button, color: accountColors.destructive },
});
