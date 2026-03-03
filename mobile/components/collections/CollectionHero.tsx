import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT_RATIO = 0.4;
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
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.75)']}
        style={styles.gradient}
      />
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  description: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
