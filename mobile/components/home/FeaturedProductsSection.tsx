import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { OptimizedImage } from '@/components/OptimizedImage';
import { useLanguage } from '@/contexts/LanguageContext';
import { SaveProductButton } from '@/components/SaveProductButton';
import { ProductBadge, resolveBadge } from '@/components/ProductBadge';
import { t } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';
import { colors, spacing, borderRadius } from '@/constants/theme';

const CARD_WIDTH = Dimensions.get('window').width * 0.4;
const CARD_ASPECT = 1.1;

function getPrimaryImageUrl(product: any): string | null {
  const images = product?.product_images;
  if (!images?.length) return null;
  const sorted = [...images].sort(
    (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );
  return sorted[0]?.image_url ?? null;
}

interface FeaturedProductsSectionProps {
  products: any[];
}

export function FeaturedProductsSection({ products }: FeaturedProductsSectionProps) {
  const { language } = useLanguage();

  if (!products.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t(language, 'bestSellersTitle')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + spacing.md}
        snapToAlignment="start"
      >
        {products.map((item) => {
          const imageUrl = getPrimaryImageUrl(item);
          const badge = resolveBadge(item);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(`/product/${item.slug}`)}
              activeOpacity={0.9}
            >
              <View style={styles.cardImageWrap}>
                {imageUrl ? (
                  <OptimizedImage uri={imageUrl} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, styles.placeholder]} />
                )}
                <SaveProductButton productSlug={item.slug} size={22} style={styles.saveBtn} />
                {badge && (
                  <View style={styles.badgeWrap}>
                    <ProductBadge variant={badge} />
                  </View>
                )}
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.price}>{formatPrice(Number(item.discount_price ?? item.base_price))}</Text>
                {(item.points_value ?? 0) > 0 && (
                  <Text style={styles.pointsEarned}>
                    {t(language, 'pointsEarnedFromProduct').replace('{{points}}', String(item.points_value))}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginLeft: spacing.lg,
    paddingLeft: 12,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImageWrap: { width: '100%', aspectRatio: 1, position: 'relative' },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  saveBtn: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  badgeWrap: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  placeholder: {
    backgroundColor: colors.border,
  },
  cardInfo: {
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  pointsEarned: {
    fontSize: 11,
    color: colors.gold,
    marginTop: 3,
    backgroundColor: colors.goldLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
});
