import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/constants/theme';

interface OptimizedImageProps {
  uri: string;
  style?: ViewStyle | ViewStyle[];
  contentFit?: 'cover' | 'contain' | 'fill' | 'none';
  /** Optional blurhash for placeholder (if backend provides it later). */
  placeholder?: string;
}

/**
 * Uses expo-image for disk/memory caching and smoother loading.
 * Shows a neutral placeholder until the image loads. Cached after first load.
 */
export function OptimizedImage({
  uri,
  style,
  contentFit = 'cover',
  placeholder,
}: OptimizedImageProps) {
  return (
    <View style={[styles.placeholder, style]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        placeholder={placeholder}
        transition={180}
        cachePolicy="disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
});
