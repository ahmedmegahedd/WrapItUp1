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
import { t } from '@/lib/i18n';
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

function formatPrice(product: any): string {
  const price = product.discount_price ?? product.base_price;
  return `${Number(price).toLocaleString()} EGP`;
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
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(`/product/${item.slug}`)}
              activeOpacity={0.9}
            >
              {imageUrl ? (
                <OptimizedImage uri={imageUrl} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, styles.placeholder]} />
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.price}>{formatPrice(item)}</Text>
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
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: colors.border,
  },
  cardInfo: {
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: 14,
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
    color: colors.textMuted,
    marginTop: 2,
  },
});
