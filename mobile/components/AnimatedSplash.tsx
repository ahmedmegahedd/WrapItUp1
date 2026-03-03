import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';
import { colors } from '@/constants/theme';

const logoSource = require('@/assets/wrapitup.avif');

/** Delay before logo appears: pink screen only. */
const INTRO_DELAY_MS = 500;
/** Logo opacity 0 → 1 duration. */
const LOGO_OPACITY_MS = 1200;
/** Logo scale 0.6 → 1.08 duration. */
const LOGO_SCALE_UP_MS = 900;
/** Logo scale 1.08 → 1.0 settle duration. */
const LOGO_SCALE_SETTLE_MS = 400;
/** Pause after logo settled before starting exit. */
const SETTLE_PAUSE_MS = 800;
/** Overlay fade-out duration. */
const EXIT_ANIM_MS = 500;
/** Logo scale at exit (subtle). */
const EXIT_LOGO_SCALE = 0.96;

const EASE_OUT_EXPO = Easing.bezier(0.22, 1, 0.36, 1);

interface AnimatedSplashProps {
  onFinish: () => void;
}

/**
 * Full-screen branded splash overlay with logo animation.
 * Runs once on app launch. Can be replaced with Lottie or other animation later.
 */
export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (cancelled) return;
        setReduceMotion(enabled);
        if (enabled) onFinishRef.current();
      })
      .catch(() => {
        if (!cancelled) setReduceMotion(false);
      });

    return () => { cancelled = true; };
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  useEffect(() => {
    if (reduceMotion !== false) return;

    const startLogoAnimation = () => {
      // Slight delay so the logo view is mounted and visible before we animate
      opacity.value = withDelay(
        50,
        withTiming(1, {
          duration: LOGO_OPACITY_MS,
          easing: EASE_OUT_EXPO,
        })
      );
      scale.value = withDelay(
        50,
        withSequence(
          withTiming(1.08, { duration: LOGO_SCALE_UP_MS, easing: EASE_OUT_EXPO }),
          withTiming(1, { duration: LOGO_SCALE_SETTLE_MS, easing: EASE_OUT_EXPO })
        )
      );
    };

    const startExitAnimation = () => {
      overlayOpacity.value = withTiming(
        0,
        { duration: EXIT_ANIM_MS, easing: Easing.out(Easing.ease) },
        (finished) => {
          if (finished) runOnJS(onFinishRef.current)();
        }
      );
      scale.value = withTiming(EXIT_LOGO_SCALE, {
        duration: EXIT_ANIM_MS,
        easing: Easing.out(Easing.ease),
      });
    };

    const introTimer = setTimeout(startLogoAnimation, INTRO_DELAY_MS);
    const logoStartDelay = 50;
    const logoEntranceMs = logoStartDelay + Math.max(LOGO_OPACITY_MS, LOGO_SCALE_UP_MS + LOGO_SCALE_SETTLE_MS);
    const exitStart = INTRO_DELAY_MS + logoEntranceMs + SETTLE_PAUSE_MS;
    const exitTimer = setTimeout(startExitAnimation, exitStart);

    return () => {
      clearTimeout(introTimer);
      clearTimeout(exitTimer);
    };
  }, [reduceMotion]);

  if (reduceMotion === true) return null;
  if (reduceMotion === null) {
    return <View style={styles.overlay} pointerEvents="box-none" />;
  }

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="box-none">
      <View style={styles.centered}>
        <Animated.View style={logoStyle}>
          <Image
            source={logoSource}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="Wrap It Up"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    zIndex: 9999,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 56,
  },
});
