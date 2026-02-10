import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePointsBalance } from '@/contexts/PointsBalanceContext';
import { useSavedProducts } from '@/contexts/SavedProductsContext';
import { AccountListRow } from '@/components/account/AccountListRow';
import { t } from '@/lib/i18n';
import { accountColors, accountSpacing, accountTypography } from '@/constants/accountTheme';

function getFullName(session: ReturnType<typeof useAuth>['session']): string {
  if (!session?.user) return '';
  const meta = session.user.user_metadata ?? {};
  const full = meta.full_name ?? meta.name ?? session.user.email ?? '';
  return full || session.user.email?.split('@')[0] || '';
}

function hasPhone(session: ReturnType<typeof useAuth>['session']): boolean {
  const phone = session?.user?.user_metadata?.phone;
  return typeof phone === 'string' && phone.trim().length > 0;
}

export default function AccountScreen() {
  const { session, signedIn, signOut } = useAuth();
  const { language } = useLanguage();
  const { balance } = usePointsBalance();
  const { savedSlugs } = useSavedProducts();
  const fullName = getFullName(session);
  const showAddPhonePrompt = signedIn && !hasPhone(session);

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
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerName} numberOfLines={2}>
            {signedIn && fullName ? fullName : t(language, 'account')}
          </Text>
        </View>

        {showAddPhonePrompt && (
          <View style={styles.addPhoneBanner}>
            <Text style={styles.addPhoneBannerText}>{t(language, 'addPhoneLater')}</Text>
          </View>
        )}

        <View style={styles.section}>
          <AccountListRow
            icon="person-outline"
            title={t(language, 'personalInfo')}
            onPress={() => router.push('/account-personal')}
          />
        </View>

        <View style={styles.section}>
          <AccountListRow
            icon="receipt-outline"
            title={t(language, 'pastOrders')}
            onPress={() => router.push('/(tabs)/orders')}
          />
        </View>

        <View style={styles.section}>
          <AccountListRow
            icon="heart-outline"
            title={t(language, 'savedProducts')}
            onPress={() => router.push('/saved-products')}
            rightText={savedSlugs.length > 0 ? String(savedSlugs.length) : undefined}
          />
        </View>

        <View style={styles.section}>
          <AccountListRow
            icon="language-outline"
            title={t(language, 'language')}
            onPress={() => router.push('/account-language')}
          />
        </View>

        <View style={styles.section}>
          <AccountListRow
            icon="gift-outline"
            title={t(language, 'rewards')}
            onPress={() => router.push('/(tabs)/rewards')}
            rightText={signedIn && balance !== null ? `${balance.toLocaleString()} pts` : undefined}
          />
        </View>

        <View style={styles.section}>
          <AccountListRow
            icon="chatbubble-ellipses-outline"
            title={t(language, 'talkToUs')}
            onPress={() => router.push('/talk-to-us')}
          />
        </View>

        {signedIn && (
          <View style={[styles.section, styles.logoutSection]}>
            <AccountListRow
              icon="log-out-outline"
              title={t(language, 'logOut')}
              onPress={handleLogOut}
              destructive
              hideChevron
            />
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: accountColors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  header: {
    backgroundColor: accountColors.backgroundElevated,
    paddingVertical: accountSpacing.xl,
    paddingHorizontal: accountSpacing.lg,
    marginBottom: accountSpacing.lg,
  },
  headerName: {
    ...accountTypography.welcome,
    fontSize: 26,
    fontWeight: '600',
    color: accountColors.text,
  },
  section: {
    marginBottom: accountSpacing.sm,
    backgroundColor: accountColors.backgroundElevated,
    marginHorizontal: accountSpacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutSection: {
    marginTop: accountSpacing.md,
  },
  bottomPad: { height: accountSpacing.xl },
  addPhoneBanner: {
    marginHorizontal: accountSpacing.lg,
    marginBottom: accountSpacing.md,
    padding: accountSpacing.md,
    backgroundColor: accountColors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: accountColors.borderLight,
  },
  addPhoneBannerText: {
    ...accountTypography.caption,
    color: accountColors.textMuted,
    textAlign: 'center',
  },
});
