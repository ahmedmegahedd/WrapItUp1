import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { OptimizedImage } from '@/components/OptimizedImage';
import { colors, spacing, borderRadius } from '@/constants/theme';

const BUBBLE_SIZE = 88;
const BUBBLE_IMAGE_SIZE = BUBBLE_SIZE - 4;
const BUBBLE_LABEL_MAX_WIDTH = 96;

interface CollectionBubbleProps {
  /** null = "All" bubble */
  collection: { id: string; name: string; image_url?: string } | null;
  /** Optional image URL (e.g. for "All" use first collection's image) */
  imageUrlOverride?: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * Rounded bubble for the collection selector. Shows image + label.
 * RTL-safe (layout flips with direction).
 */
export function CollectionBubble({ collection, imageUrlOverride, label, selected, onPress }: CollectionBubbleProps) {
  const imageUrl = imageUrlOverride ?? collection?.image_url;

  return (
    <TouchableOpacity
      style={[styles.bubble, selected && styles.bubbleSelected]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <View style={[styles.imageWrap, selected && styles.imageWrapSelected]}>
        {imageUrl ? (
          <OptimizedImage uri={imageUrl} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]} />
        )}
      </View>
      <Text
        style={[styles.label, selected && styles.labelSelected]}
        numberOfLines={2}
        allowFontScaling
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bubble: {
    width: BUBBLE_LABEL_MAX_WIDTH,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  bubbleSelected: {
    opacity: 1,
  },
  imageWrap: {
    width: BUBBLE_IMAGE_SIZE,
    height: BUBBLE_IMAGE_SIZE,
    borderRadius: BUBBLE_IMAGE_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: colors.border,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  imageWrapSelected: {
    borderColor: colors.primary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: colors.backgroundMuted,
  },
  label: {
    marginTop: spacing.xs,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: BUBBLE_LABEL_MAX_WIDTH,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
});
