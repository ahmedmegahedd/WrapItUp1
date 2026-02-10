import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { getRewards, getLoyaltyBalance, redeemReward } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePointsBalance } from '@/contexts/PointsBalanceContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { hapticSuccess } from '@/lib/haptics';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { OptimizedImage } from '@/components/OptimizedImage';

export default function RewardsScreen() {
  const { language } = useLanguage();
  const { session, signedIn } = useAuth();
  const { refetch: refetchBalance } = usePointsBalance();
  const accountEmail = session?.user?.email ?? null;

  const [rewards, setRewards] = useState<any[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [rewardsList] = await Promise.all([getRewards()]);
      setRewards(rewardsList ?? []);
      if (accountEmail) {
        const b = await getLoyaltyBalance(accountEmail);
        setBalance(b.points_balance);
      } else {
        setBalance(null);
      }
    } catch (_) {
      setRewards([]);
      setBalance(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accountEmail]);

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  const handleRedeem = useCallback(
    async (reward: any) => {
      if (!accountEmail) return;
      if ((balance ?? 0) < reward.points_required) {
        Alert.alert(t(language, 'error'), t(language, 'needMorePoints').replace('{{points}}', String(reward.points_required - (balance ?? 0))));
        return;
      }
      setRedeemingId(reward.id);
      try {
        const result = await redeemReward(accountEmail, reward.id);
        setBalance(result.points_balance);
        refetchBalance();
        hapticSuccess();
        Alert.alert(t(language, 'ok'), `${reward.title} ${t(language, 'redeem')}`);
      } catch (err: any) {
        Alert.alert(t(language, 'error'), err?.response?.data?.message || 'Redeem failed');
      } finally {
        setRedeemingId(null);
      }
    },
    [accountEmail, balance, language, refetchBalance]
  );

  if (loading && rewards.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      <View style={styles.balanceHero}>
        <Text style={styles.balanceHeroLabel}>{t(language, 'yourBalance')}</Text>
        {signedIn && accountEmail ? (
          balance !== null ? (
            <Text style={styles.balanceHeroValue}>
              {t(language, 'yourBalancePoints').replace('{{points}}', balance.toLocaleString())}
            </Text>
          ) : (
            <Text style={styles.balanceHeroMuted}>—</Text>
          )
        ) : (
          <View>
            <Text style={styles.signInPrompt}>{t(language, 'signInToViewPoints')}</Text>
            <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.signInBtnText}>{t(language, 'signIn')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>{t(language, 'rewards')}</Text>
      {rewards.length === 0 ? (
        <Text style={styles.empty}>{t(language, 'noRewardsYet')}</Text>
      ) : (
        rewards.map((reward) => {
          const canRedeem = balance !== null && balance >= reward.points_required;
          const needMore = reward.points_required - (balance ?? 0);
          return (
            <View key={reward.id} style={styles.card}>
              {reward.image_url ? (
                <OptimizedImage uri={reward.image_url} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, styles.placeholder]} />
              )}
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{reward.title}</Text>
                {reward.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>{reward.description}</Text>
                ) : null}
                <Text style={styles.pointsReq}>{reward.points_required} pts</Text>
                {signedIn && balance !== null && (
                  canRedeem ? (
                    <Text style={styles.canRedeem}>{t(language, 'canRedeem')}</Text>
                  ) : (
                    <Text style={styles.needMore}>
                      {t(language, 'needMorePoints').replace('{{points}}', String(Math.max(0, needMore)))}
                    </Text>
                  )
                )}
                <TouchableOpacity
                  style={[styles.redeemBtn, (!signedIn || !canRedeem || redeemingId === reward.id) && styles.redeemBtnDisabled]}
                  onPress={() => handleRedeem(reward)}
                  disabled={!signedIn || !canRedeem || redeemingId === reward.id}
                >
                  {redeemingId === reward.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.redeemBtnText}>{t(language, 'redeem')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  balanceHero: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  balanceHeroLabel: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xs },
  balanceHeroValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  balanceHeroMuted: { fontSize: 18, color: colors.textMuted },
  signInPrompt: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm },
  signInBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  signInBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: { width: 100, height: 100 },
  placeholder: { backgroundColor: colors.border },
  cardBody: { flex: 1, padding: spacing.md, justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  pointsReq: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 4 },
  canRedeem: { fontSize: 12, color: colors.success, marginTop: 2 },
  needMore: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  redeemBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    minWidth: 90,
    alignItems: 'center',
  },
  redeemBtnDisabled: { opacity: 0.5 },
  redeemBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
