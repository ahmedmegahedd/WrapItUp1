import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Stack, useNavigation } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { SupportSection } from '@/components/account/SupportSection';
import { accountColors, accountSpacing } from '@/constants/accountTheme';

export default function TalkToUsScreen() {
  const { language } = useLanguage();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: t(language, 'talkToUs'), headerBackTitle: '' });
  }, [language, navigation]);

  return (
    <>
      <Stack.Screen options={{ headerShown: true }} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SupportSection />
          <View style={styles.bottomPad} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: accountColors.background },
  content: { paddingBottom: accountSpacing.xl * 2 },
  bottomPad: { height: accountSpacing.xl },
});