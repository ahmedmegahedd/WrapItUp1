import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, spacing } from '@/constants/theme';

interface MarqueeBannerProps {
  text: string;
}

const DURATION = 18000;
const BANNER_WIDTH = 2000;

export function MarqueeBanner({ text }: MarqueeBannerProps) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = 0;
    translateX.value = withRepeat(
      withTiming(-BANNER_WIDTH / 2, { duration: DURATION, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(translateX);
  }, [text]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Duplicate text so the scroll loops seamlessly
  const content = `${text}   ·   ${text}   ·   `;

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.track, animatedStyle]}>
        <Text style={styles.label} numberOfLines={1}>{content}{content}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 34,
    backgroundColor: colors.primary,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.4,
  },
});
