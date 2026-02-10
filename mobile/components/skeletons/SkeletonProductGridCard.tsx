import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonShimmer } from './SkeletonShimmer';
import { spacing, borderRadius } from '@/constants/theme';

/** Matches collection [slug] grid item: ~48% width, square image + name + price */
export function SkeletonProductGridCard() {
  return (
    <View style={styles.card}>
      <SkeletonShimmer style={styles.img} borderRadius={0} />
      <View style={styles.info}>
        <SkeletonShimmer width="90%" height={14} borderRadius={4} />
        <SkeletonShimmer width="50%" height={14} borderRadius={4} style={{ marginTop: spacing.xs }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  img: { width: '100%', aspectRatio: 1 },
  info: { padding: spacing.sm },
});
