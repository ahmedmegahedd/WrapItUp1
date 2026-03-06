import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';

const DURATION = 1200;

interface SkeletonShimmerProps {
  style?: object;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

export function SkeletonShimmer({
  style,
  width = '100%',
  height = 16,
  borderRadius = 4,
}: SkeletonShimmerProps) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.75, { duration: DURATION, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.base, { width, height, borderRadius }, style]}>
      <Animated.View style={[styles.shimmer, { borderRadius }, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#EDE8DF',
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F7F3EE',
  },
});
