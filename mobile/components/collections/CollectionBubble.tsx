import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { OptimizedImage } from '@/components/OptimizedImage';
import { colors, spacing } from '@/constants/theme';

const BUBBLE_IMAGE_SIZE = 70;
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
  const initial = label?.charAt(0)?.toUpperCase() ?? '';

  const scale = useSharedValue(1);
  const dotScale = useSharedValue(selected ? 1 : 0);

  const wrapAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  useEffect(() => {
    if (selected) {
      scale.value = withSpring(1.08, { damping: 12, stiffness: 200 }, () => {
        scale.value = withSpring(1.0, { damping: 12, stiffness: 200 });
      });
    }
    dotScale.value = withSpring(selected ? 1 : 0, { damping: 12, stiffness: 200 });
  }, [selected]);

  return (
    <TouchableOpacity
      style={styles.bubble}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.imageWrap, selected && styles.imageWrapSelected, wrapAnimStyle]}>
        {imageUrl ? (
          <OptimizedImage uri={imageUrl} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderInitial}>{initial}</Text>
          </View>
        )}
      </Animated.View>
      <Text
        style={[styles.label, selected && styles.labelSelected]}
        numberOfLines={2}
        allowFontScaling
      >
        {label}
      </Text>
      <Animated.View style={[styles.activeDot, dotAnimStyle]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bubble: {
    width: BUBBLE_LABEL_MAX_WIDTH,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  imageWrap: {
    width: BUBBLE_IMAGE_SIZE,
    height: BUBBLE_IMAGE_SIZE,
    borderRadius: BUBBLE_IMAGE_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#FCE7F3',
    borderWidth: 2.5,
    borderColor: '#FCE7F3',
  },
  imageWrapSelected: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  label: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: BUBBLE_LABEL_MAX_WIDTH,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 3,
    alignSelf: 'center',
  },
});
