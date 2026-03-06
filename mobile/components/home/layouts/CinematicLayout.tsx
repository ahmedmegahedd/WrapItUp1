/**
 * CinematicLayout — Parallax hero image + snap horizontal product cards.
 * Each product card has a subtle scale effect as it snaps into focus.
 */
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { OptimizedImage } from '@/components/OptimizedImage';
import { SaveProductButton } from '@/components/SaveProductButton';
import { ProductBadge, resolveBadge } from '@/components/ProductBadge';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { formatPrice } from '@/lib/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.62;
const CARD_HEIGHT = CARD_WIDTH * 1.18;
const SIDE_SPACING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

function getPrimaryImageUrl(product: any): string | null {
  const images = product?.product_images;
  if (!images?.length) return null;
  const sorted = [...images].sort(
    (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );
  return sorted[0]?.image_url ?? null;
}

interface CinematicLayoutProps {
  products: any[];
  collections: any[];
  title?: string;
}

export function CinematicLayout({ products, title = 'Best Sellers' }: CinematicLayoutProps) {
  const scrollX = useRef(new Animated.Value(0)).current;

  if (!products.length) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.titleAccent} />
      </View>

      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + spacing.md}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {products.map((item, index) => {
          const imageUrl = getPrimaryImageUrl(item);
          const badge = resolveBadge(item);
          const inputRange = [
            (index - 1) * (CARD_WIDTH + spacing.md),
            index * (CARD_WIDTH + spacing.md),
            (index + 1) * (CARD_WIDTH + spacing.md),
          ];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.92, 1, 0.92],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View key={item.id} style={[styles.cardWrap, { transform: [{ scale }] }]}>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.92}
                onPress={() => router.push(`/product/${item.slug}`)}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                {imageUrl ? (
                  <OptimizedImage uri={imageUrl} style={styles.cardImage} contentFit="cover" />
                ) : (
                  <View style={[styles.cardImage, styles.placeholder]} />
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(17,24,39,0.82)']}
                  style={styles.gradient}
                  start={{ x: 0, y: 0.4 }}
                  end={{ x: 0, y: 1 }}
                />
                <View style={styles.cardOverlay}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.cardPrice}>
                    {formatPrice(Number(item.discount_price ?? item.base_price))}
                  </Text>
                </View>
                <SaveProductButton
                  productSlug={item.slug}
                  size={22}
                  style={styles.saveBtn}
                />
                {badge && (
                  <View style={styles.badgeWrap}>
                    <ProductBadge variant={badge} />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
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
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  titleAccent: {
    marginTop: 5,
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: SIDE_SPACING,
    gap: spacing.md,
  },
  cardWrap: {
    width: CARD_WIDTH,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  cardImage: {
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
    height: '50%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  saveBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  badgeWrap: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
});
