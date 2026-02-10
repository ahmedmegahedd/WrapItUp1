import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SkeletonShimmer } from './SkeletonShimmer';
import { spacing, borderRadius } from '@/constants/theme';

const CARD_WIDTH = Dimensions.get('window').width * 0.4;

export function SkeletonProductCard() {
  return (
    <View style={styles.card}>
      <SkeletonShimmer height={CARD_WIDTH} width={CARD_WIDTH} borderRadius={borderRadius.lg} />
      <View style={styles.info}>
        <SkeletonShimmer width="100%" height={14} borderRadius={4} />
        <SkeletonShimmer width="60%" height={14} borderRadius={4} style={{ marginTop: spacing.xs }} />
        <SkeletonShimmer width="45%" height={14} borderRadius={4} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  info: { padding: spacing.md },
});
