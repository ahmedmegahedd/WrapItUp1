import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { OptimizedImage } from '@/components/OptimizedImage';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { formatPrice } from '@/lib/format';

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
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ height }, animStyle]}>
      <TouchableOpacity
        style={[styles.card, { height }]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 200 }); }}
        onPressOut={() => { scale.value = withSpring(1.0, { damping: 15, stiffness: 200 }); }}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={product?.title}
      >
        {imageUrl ? (
          <OptimizedImage uri={imageUrl} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]} />
        )}
        <LinearGradient
          colors={['transparent', 'transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.82)']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.nameWrap}>
          <Text style={styles.name} numberOfLines={2}>
            {product?.title ?? ''}
          </Text>
          {(product?.discount_price ?? product?.base_price) != null && (
            <View style={styles.pricePill}>
              <Text style={styles.price}>
                {formatPrice(Number(product.discount_price ?? product.base_price))}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(252,231,243,0.6)',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  image: {
    width: '100%',
    flex: 1,
    minHeight: 0,
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
  nameWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    marginRight: spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pricePill: {
    backgroundColor: 'rgba(236,72,153,0.85)',
    borderRadius: 9999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  price: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
