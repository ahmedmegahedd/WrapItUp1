import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT_RATIO = 0.45;
const HERO_HEIGHT = SCREEN_WIDTH * HERO_HEIGHT_RATIO;

export interface CollectionHeroProps {
  imageUri: string | null;
  title: string;
  description?: string | null;
}

/**
 * Premium editorial hero for collection detail: full-width image with
 * dark gradient overlay and centered title + description for readability.
 */
export function CollectionHero({ imageUri, title, description }: CollectionHeroProps) {
  return (
    <View style={[styles.container, { height: HERO_HEIGHT }]}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
        />
      ) : (
        <View style={styles.placeholder} />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.72)']}
        style={styles.gradient}
      />
      <View style={styles.badge} pointerEvents="none">
        <Text style={styles.badgeText}>COLLECTION</Text>
      </View>
      <View style={styles.textWrap} pointerEvents="none">
        <Text style={styles.title} numberOfLines={3}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.description} numberOfLines={4}>
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.border,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  textWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  badge: {
    position: 'absolute',
    top: 14,
    start: 16,
    backgroundColor: 'rgba(236,72,153,0.85)',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  description: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
