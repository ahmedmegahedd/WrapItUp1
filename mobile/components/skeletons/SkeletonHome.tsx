import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SkeletonShimmer } from './SkeletonShimmer';
import { SkeletonCollectionCard } from './SkeletonCollectionCard';
import { SkeletonProductCard } from './SkeletonProductCard';
import { spacing } from '@/constants/theme';

export function SkeletonHome() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <SkeletonShimmer width="70%" height={32} borderRadius={8} />
        <SkeletonShimmer width="90%" height={18} style={{ marginTop: spacing.sm }} />
        <SkeletonShimmer width={160} height={48} borderRadius={9999} style={{ marginTop: spacing.lg }} />
      </View>
      <View style={styles.section}>
        <SkeletonShimmer width={180} height={20} borderRadius={4} style={{ marginBottom: spacing.md }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          <SkeletonCollectionCard />
          <SkeletonCollectionCard />
          <SkeletonCollectionCard />
        </ScrollView>
      </View>
      <View style={styles.section}>
        <SkeletonShimmer width={140} height={20} borderRadius={4} style={{ marginBottom: spacing.md }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          <SkeletonProductCard />
          <SkeletonProductCard />
          <SkeletonProductCard />
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: spacing.xl },
  hero: { padding: spacing.lg, paddingTop: spacing.xl },
  section: { paddingVertical: spacing.lg },
  hScroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
});
