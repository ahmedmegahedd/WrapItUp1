import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { OptimizedImage } from '@/components/OptimizedImage';
import { getProductBySlug } from '@/lib/api';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { formatPrice } from '@/lib/format';

interface TodaysPickSectionProps {
  productId: string;
  label?: string;
}

function getPrimaryImageUrl(product: any): string | null {
  const images = product?.product_images;
  if (!images?.length) return null;
  const sorted = [...images].sort(
    (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );
  return sorted[0]?.image_url ?? null;
}

export function TodaysPickSection({ productId, label = "Today's Pick" }: TodaysPickSectionProps) {
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    if (!productId) return;
    // Try fetching by slug first; fall back gracefully
    getProductBySlug(productId)
      .then(setProduct)
      .catch(() => setProduct(null));
  }, [productId]);

  if (!product) return null;

  const imageUrl = getPrimaryImageUrl(product);
  const price = product.discount_price ?? product.base_price;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.labelPill}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: '/product/[slug]', params: { slug: product.slug } })}
        accessibilityRole="button"
        accessibilityLabel={product.title}
      >
        {imageUrl ? (
          <OptimizedImage uri={imageUrl} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]} />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(17,24,39,0.85)']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.overlay}>
          <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
          {price != null && (
            <Text style={styles.price}>{formatPrice(Number(price))}</Text>
          )}
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Add to cart</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  labelPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  card: {
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.card,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: colors.border,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.sm,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.pill,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
