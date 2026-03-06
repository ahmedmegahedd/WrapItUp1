import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SkeletonShimmer } from './SkeletonShimmer';
import { SkeletonCollectionCard } from './SkeletonCollectionCard';
import { colors, spacing } from '@/constants/theme';

const BUBBLE_SIZE = 80;

export function SkeletonCollections() {
  return (
    <View style={styles.container}>
      {/* Bubble row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bubbleRow}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={styles.bubbleWrap}>
            <SkeletonShimmer width={BUBBLE_SIZE} height={BUBBLE_SIZE} borderRadius={BUBBLE_SIZE / 2} />
            <SkeletonShimmer width={64} height={12} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        ))}
      </ScrollView>

      {/* Grid */}
      <View style={styles.grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCollectionCard key={i} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
    paddingTop: spacing.md,
  },
  bubbleRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  bubbleWrap: {
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
