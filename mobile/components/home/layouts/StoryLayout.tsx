/**
 * StoryLayout — Full-screen paging product cards with a progress indicator.
 * Swipe horizontally to browse products like Instagram stories.
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { OptimizedImage } from '@/components/OptimizedImage';
import { SaveProductButton } from '@/components/SaveProductButton';
import { ProductBadge, resolveBadge } from '@/components/ProductBadge';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { formatPrice } from '@/lib/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_WIDTH * 1.28;

function getPrimaryImageUrl(product: any): string | null {
  const images = product?.product_images;
  if (!images?.length) return null;
  const sorted = [...images].sort(
    (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );
  return sorted[0]?.image_url ?? null;
}

interface StoryLayoutProps {
  products: any[];
  collections: any[];
  title?: string;
}

export function StoryLayout({ products, title = 'Best Sellers' }: StoryLayoutProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  if (!products.length) return null;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(idx);
  };

  return (
    <View style={styles.wrapper}>
      {/* Progress dots */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.dots}>
          {products.slice(0, 12).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {products.map((item) => {
          const imageUrl = getPrimaryImageUrl(item);
          const badge = resolveBadge(item);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.slide}
              activeOpacity={0.95}
              onPress={() => router.push(`/product/${item.slug}`)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              {imageUrl ? (
                <OptimizedImage uri={imageUrl} style={styles.image} contentFit="cover" />
              ) : (
                <View style={[styles.image, styles.placeholder]} />
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.75)']}
                style={styles.gradient}
                start={{ x: 0, y: 0.3 }}
                end={{ x: 0, y: 1 }}
              />
              <View style={styles.info}>
                <Text style={styles.itemTitle} numberOfLines={3}>{item.title}</Text>
                <Text style={styles.price}>
                  {formatPrice(Number(item.discount_price ?? item.base_price))}
                </Text>
                <View style={styles.ctaRow}>
                  <View style={styles.ctaBtn}>
                    <Text style={styles.ctaBtnText}>Shop now</Text>
                  </View>
                </View>
              </View>
              <SaveProductButton
                productSlug={item.slug}
                size={24}
                style={styles.saveBtn}
              />
              {badge && (
                <View style={styles.badgeWrap}>
                  <ProductBadge variant={badge} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.backgroundMuted,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dot: {
    height: 5,
    borderRadius: borderRadius.pill,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 5,
    backgroundColor: colors.border,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: CARD_HEIGHT,
    paddingHorizontal: spacing.lg,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: colors.border,
    borderRadius: 22,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: '55%',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.lg,
  },
  itemTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.sm,
  },
  ctaRow: {
    flexDirection: 'row',
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  saveBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg + spacing.md,
  },
  badgeWrap: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg + spacing.sm,
  },
});
