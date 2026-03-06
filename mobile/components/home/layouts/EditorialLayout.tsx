/**
 * EditorialLayout — Asymmetric 2-column staggered grid.
 * Left column has taller cards, right column has shorter cards, alternating.
 * Uses EditorialProductCard for the rich image+overlay treatment.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { EditorialProductCard } from '@/components/collections/EditorialProductCard';
import { colors, spacing } from '@/constants/theme';

interface EditorialLayoutProps {
  products: any[];
  collections: any[];
  title?: string;
}

export function EditorialLayout({ products, title = 'Best Sellers' }: EditorialLayoutProps) {
  if (!products.length) return null;

  // Split into left and right columns
  const leftCol: any[] = [];
  const rightCol: any[] = [];
  products.forEach((p, i) => {
    if (i % 2 === 0) leftCol.push(p);
    else rightCol.push(p);
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.titleAccent} />
        <Text style={styles.subtitle}>Hand-picked for you</Text>
      </View>

      <View style={styles.grid}>
        {/* Left column — larger cards */}
        <View style={styles.column}>
          {leftCol.map((item, idx) => (
            <View key={item.id} style={[styles.cardWrap, idx > 0 && styles.cardGap]}>
              <EditorialProductCard
                product={item}
                size={idx % 2 === 0 ? 'large' : 'medium'}
                onPress={() => router.push(`/product/${item.slug}`)}
              />
            </View>
          ))}
        </View>

        {/* Right column — offset smaller cards */}
        <View style={[styles.column, styles.rightColumn]}>
          {rightCol.map((item, idx) => (
            <View key={item.id} style={[styles.cardWrap, idx > 0 && styles.cardGap]}>
              <EditorialProductCard
                product={item}
                size={idx % 2 === 0 ? 'small' : 'medium'}
                onPress={() => router.push(`/product/${item.slug}`)}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.backgroundMuted,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  titleAccent: {
    marginTop: 6,
    marginBottom: 6,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  column: {
    flex: 1,
  },
  rightColumn: {
    marginTop: spacing.xl,
  },
  cardWrap: {
    width: '100%',
  },
  cardGap: {
    marginTop: spacing.sm,
  },
});
