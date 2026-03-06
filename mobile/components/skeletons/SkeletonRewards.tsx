import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SkeletonShimmer } from './SkeletonShimmer';
import { colors, spacing, borderRadius } from '@/constants/theme';

export function SkeletonRewards() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero card */}
      <SkeletonShimmer height={160} borderRadius={borderRadius.lg} style={styles.hero} />

      {/* Balance row */}
      <View style={styles.balanceRow}>
        <SkeletonShimmer width={80} height={14} borderRadius={4} />
        <SkeletonShimmer width={100} height={22} borderRadius={4} style={{ marginTop: 6 }} />
      </View>

      {/* Redeem button */}
      <SkeletonShimmer height={50} borderRadius={borderRadius.pill} style={styles.btn} />

      {/* Rewards list header */}
      <SkeletonShimmer width={140} height={18} borderRadius={4} style={styles.sectionHeader} />

      {/* Reward cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={styles.rewardCard}>
          <SkeletonShimmer width={48} height={48} borderRadius={borderRadius.md} />
          <View style={styles.rewardText}>
            <SkeletonShimmer width="60%" height={14} borderRadius={4} />
            <SkeletonShimmer width="40%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
          <SkeletonShimmer width={72} height={32} borderRadius={borderRadius.pill} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  hero: { marginBottom: spacing.lg },
  balanceRow: { marginBottom: spacing.md },
  btn: { marginBottom: spacing.xl },
  sectionHeader: { marginBottom: spacing.md },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rewardText: { flex: 1 },
});
