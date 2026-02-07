import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useNavigation } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { LanguageSection } from '@/components/account/LanguageSection';
import { accountColors, accountSpacing } from '@/constants/accountTheme';

export default function AccountLanguageScreen() {
  const { language } = useLanguage();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: t(language, 'language'), headerBackTitle: '' });
  }, [language, navigation]);

  return (
    <>
      <Stack.Screen options={{ headerShown: true }} />
      <View style={styles.container}>
        <LanguageSection />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: accountColors.background, paddingTop: accountSpacing.md },
});
