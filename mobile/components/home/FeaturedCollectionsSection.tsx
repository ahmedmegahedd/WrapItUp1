import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { OptimizedImage } from '@/components/OptimizedImage';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';

const CARD_WIDTH = (Dimensions.get('window').width - spacing.lg * 2 - spacing.md) / 2;
const CARD_ASPECT = 0.9;

interface FeaturedCollectionsSectionProps {
  collections: any[];
}

export function FeaturedCollectionsSection({ collections }: FeaturedCollectionsSectionProps) {
  const { language } = useLanguage();

  if (!collections.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t(language, 'featuredCollectionsTitle')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + spacing.md}
        snapToAlignment="start"
      >
        {collections.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => router.push(`/collection/${item.slug}`)}
            activeOpacity={0.9}
          >
            {item.image_url ? (
              <OptimizedImage uri={item.image_url} style={styles.cardImage} />
            ) : (
              <View style={[styles.cardImage, styles.placeholder]} />
            )}
            <View style={styles.cardOverlay} />
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: spacing.lg,
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
    aspectRatio: 1 / CARD_ASPECT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: colors.border,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  cardTitle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});
