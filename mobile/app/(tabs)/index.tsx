import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useHomeData } from '@/hooks/useHomeData';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors, spacing } from '@/constants/theme';
import {
  HeroSection,
  FeaturedCollectionsSection,
  FeaturedProductsSection,
  PromotionSection,
  ValuePropositionSection,
  FinalCTASection,
} from '@/components/home';
import { SkeletonHome } from '@/components/skeletons';

const DEFAULT_SECTION_ORDER = [
  'hero',
  'featured_collections',
  'featured_products',
  'promotion',
  'value_proposition',
  'final_cta',
] as const;

export default function HomeScreen() {
  const { language } = useLanguage();
  const appSettings = useAppSettings();
  const sectionOrder = (appSettings?.home_section_order ?? DEFAULT_SECTION_ORDER) as readonly string[];
  const {
    featuredCollections,
    featuredProducts,
    loading,
    error,
    refresh,
  } = useHomeData({ featuredLimit: appSettings?.featured_products_limit ?? 8 });

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  if (loading && featuredCollections.length === 0 && featuredProducts.length === 0) {
    return <SkeletonHome />;
  }

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':
        return <HeroSection key="hero" />;
      case 'featured_collections':
        return <FeaturedCollectionsSection key="featured_collections" collections={featuredCollections} />;
      case 'featured_products':
        return <FeaturedProductsSection key="featured_products" products={featuredProducts} />;
      case 'promotion':
        return (
          <PromotionSection
            key="promotion"
            visible={appSettings?.promotion_visible ?? true}
            title={appSettings?.promotion_title}
            message={appSettings?.promotion_message}
          />
        );
      case 'value_proposition':
        return <ValuePropositionSection key="value_proposition" />;
      case 'final_cta':
        return (
          <FinalCTASection
            key="final_cta"
            headline={appSettings?.final_cta_headline}
            subtext={appSettings?.final_cta_subtext}
            buttonLabel={appSettings?.final_cta_button}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {sectionOrder.map(renderSection)}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{t(language, 'loadCollectionsError')}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundMuted,
  },
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: spacing.md,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#92400e',
  },
});
