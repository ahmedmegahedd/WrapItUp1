import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonShimmer } from './SkeletonShimmer';
import { spacing, borderRadius } from '@/constants/theme';

export function SkeletonOrderRow() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonShimmer width={100} height={16} borderRadius={4} />
        <SkeletonShimmer width={70} height={16} borderRadius={4} />
      </View>
      <SkeletonShimmer width={140} height={12} borderRadius={4} style={{ marginTop: spacing.xs }} />
      <View style={styles.badges}>
        <SkeletonShimmer width={50} height={20} borderRadius={4} />
        <SkeletonShimmer width={80} height={14} borderRadius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badges: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
});
