import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { SkeletonShimmer } from './SkeletonShimmer';
import { spacing, borderRadius } from '@/constants/theme';

export function SkeletonProductDetail() {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <SkeletonShimmer
        width={width}
        height={width}
        borderRadius={0}
        style={styles.image}
      />
      <View style={styles.body}>
        <SkeletonShimmer width="40%" height={28} borderRadius={6} />
        <SkeletonShimmer width="80%" height={16} style={{ marginTop: spacing.md }} />
        <SkeletonShimmer width="100%" height={14} style={{ marginTop: spacing.sm }} />
        <SkeletonShimmer width="95%" height={14} style={{ marginTop: spacing.xs }} />
        <SkeletonShimmer width="70%" height={14} style={{ marginTop: spacing.xs }} />
        <View style={styles.section}>
          <SkeletonShimmer width={120} height={16} borderRadius={4} />
          <View style={styles.options}>
            <SkeletonShimmer width={80} height={36} borderRadius={9999} />
            <SkeletonShimmer width={80} height={36} borderRadius={9999} />
            <SkeletonShimmer width={80} height={36} borderRadius={9999} />
          </View>
        </View>
        <View style={styles.section}>
          <SkeletonShimmer width={100} height={16} borderRadius={4} />
          <SkeletonShimmer width="100%" height={56} borderRadius={borderRadius.md} style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  image: {},
  body: { padding: spacing.lg },
  section: { marginTop: spacing.lg },
  options: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
