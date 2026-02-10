import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { OptimizedImage } from '@/components/OptimizedImage';
import { colors, spacing, borderRadius } from '@/constants/theme';

/** Height variants for editorial staggered layout */
export type EditorialCardSize = 'small' | 'medium' | 'large';

const HEIGHTS: Record<EditorialCardSize, number> = {
  small: 152,
  medium: 188,
  large: 220,
};

function getPrimaryImageUrl(product: any): string | null {
  const images = product?.product_images;
  if (!images?.length) return null;
  const sorted = [...images].sort(
    (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );
  return sorted[0]?.image_url ?? null;
}

interface EditorialProductCardProps {
  product: any;
  size: EditorialCardSize;
  onPress: () => void;
}

/**
 * Editorial product card: image + name only. No price or CTA.
 * Size varies for staggered, premium layout.
 */
export function EditorialProductCard({ product, size, onPress }: EditorialProductCardProps) {
  const imageUrl = getPrimaryImageUrl(product);
  const height = HEIGHTS[size];

  return (
    <TouchableOpacity
      style={[styles.card, { height }]}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={product?.title}
    >
      {imageUrl ? (
        <OptimizedImage uri={imageUrl} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
      <View style={styles.nameWrap}>
        <Text style={styles.name} numberOfLines={2}>
          {product?.title ?? ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
  placeholder: {
    backgroundColor: colors.border,
  },
  nameWrap: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
