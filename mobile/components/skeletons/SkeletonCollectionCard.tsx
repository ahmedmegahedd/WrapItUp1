import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SkeletonShimmer } from './SkeletonShimmer';
import { spacing, borderRadius } from '@/constants/theme';

const CARD_WIDTH = (Dimensions.get('window').width - spacing.lg * 2 - spacing.md) / 2;
const CARD_ASPECT = 0.9;

export function SkeletonCollectionCard() {
  return (
    <View style={styles.card}>
      <SkeletonShimmer
        height={CARD_WIDTH / CARD_ASPECT}
        width={CARD_WIDTH}
        borderRadius={borderRadius.lg}
      />
      <View style={styles.titleWrap}>
        <SkeletonShimmer width="70%" height={18} borderRadius={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    aspectRatio: 1 / CARD_ASPECT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  titleWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md },
});
