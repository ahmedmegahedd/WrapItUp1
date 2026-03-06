import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  I18nManager,
  LayoutChangeEvent,
  Easing,
  Pressable,
  AccessibilityRole,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '@/constants/theme';

const THRESHOLD = 0.8;
const PILL_HEIGHT = 64;
const HANDLE_INITIAL_WIDTH = 72;
const PILL_PADDING_H = spacing.lg;
const SUCCESS_DURATION_MS = 1500;
const RETRACT_DURATION_MS = 280;
const COMPLETE_ANIM_MS = 150;
const TAP_THRESHOLD_PX = 8;

export type SlideToAddStatus = 'idle' | 'disabled' | 'locked';

type SlideToAddProps = {
  label: string;
  addedLabel: string;
  soldOutLabel?: string;
  selectOptionsLabel?: string;
  status?: SlideToAddStatus;
  onComplete: () => void;
  onPressFallback?: () => void;
  onLockedPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function SlideToAdd({
  label,
  addedLabel,
  soldOutLabel = 'Sold out',
  selectOptionsLabel = 'Select options to continue',
  status = 'idle',
  onComplete,
  onPressFallback,
  onLockedPress,
  disabled = false,
  accessibilityLabel,
}: SlideToAddProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const [success, setSuccess] = useState(false);
  const slideOffset = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const arrowOpacity = useRef(new Animated.Value(1)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(1)).current;
  const hasTriggeredHapticStart = useRef(false);
  const hasTriggeredComplete = useRef(false);

  const isRTL = I18nManager.isRTL;
  const isLocked = status === 'locked';
  const isDisabled = disabled || status === 'disabled' || success;

  const getMaxSlide = () =>
    Math.max(0, widthRef.current - HANDLE_INITIAL_WIDTH - PILL_PADDING_H * 2);
  const getTriggerAt = () => getMaxSlide() * THRESHOLD;

  const triggerComplete = () => {
    if (hasTriggeredComplete.current) return;
    hasTriggeredComplete.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSuccess(true);
    Animated.parallel([
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successScale, {
        toValue: 1.02,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
    onComplete();
    setTimeout(() => {
      successOpacity.setValue(0);
      successScale.setValue(1);
      slideOffset.setValue(0);
      textOpacity.setValue(1);
      arrowOpacity.setValue(1);
      setSuccess(false);
      hasTriggeredComplete.current = false;
      hasTriggeredHapticStart.current = false;
    }, SUCCESS_DURATION_MS);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isDisabled) return false;
        const maxSlide = getMaxSlide();
        if (maxSlide <= 0) return false;
        const { dx, dy } = gestureState;
        const isHorizontal = Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
        return isHorizontal;
      },
      onPanResponderGrant: () => {
        if (isDisabled) return;
        hasTriggeredHapticStart.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        const maxSlide = getMaxSlide();
        if (isDisabled || maxSlide <= 0) return;
        const dx = gestureState.dx;
        const rawOffset = isRTL ? -dx : dx;
        const clamped = Math.max(0, Math.min(maxSlide, rawOffset));
        slideOffset.setValue(clamped);
        const progress = clamped / maxSlide;
        textOpacity.setValue(1 - progress);
        arrowOpacity.setValue(1 - progress);
      },
      onPanResponderRelease: (_, gestureState) => {
        const maxSlide = getMaxSlide();
        const triggerAt = getTriggerAt();
        if (isDisabled || maxSlide <= 0) return;
        const dx = gestureState.dx;
        const rawOffset = isRTL ? -dx : dx;

        if (rawOffset >= triggerAt) {
          Animated.timing(slideOffset, {
            toValue: maxSlide,
            duration: COMPLETE_ANIM_MS,
            easing: Easing.linear,
            useNativeDriver: false,
          }).start(() => triggerComplete());
          Animated.timing(textOpacity, {
            toValue: 0,
            duration: 80,
            useNativeDriver: true,
          }).start();
          Animated.timing(arrowOpacity, {
            toValue: 0,
            duration: 80,
            useNativeDriver: true,
          }).start();
        } else {
          const isTap = Math.abs(rawOffset) < TAP_THRESHOLD_PX && Math.abs(gestureState.dy) < TAP_THRESHOLD_PX;
          if (isTap && onPressFallback) {
            onPressFallback();
          }
          hasTriggeredHapticStart.current = false;
          Animated.parallel([
            Animated.timing(slideOffset, {
              toValue: 0,
              duration: RETRACT_DURATION_MS,
              easing: Easing.out(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(textOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(arrowOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      widthRef.current = w;
      setWidth(w);
    }
  };

  const maxSlide = Math.max(0, width - HANDLE_INITIAL_WIDTH - PILL_PADDING_H * 2);

  const handleWidth = slideOffset.interpolate({
    inputRange: [0, maxSlide],
    outputRange: [
      HANDLE_INITIAL_WIDTH,
      maxSlide > 0 ? HANDLE_INITIAL_WIDTH + maxSlide : HANDLE_INITIAL_WIDTH,
    ],
  });

  if (success) {
    return (
      <Animated.View
        style={[
          styles.pill,
          styles.pillSuccess,
          { transform: [{ scale: successScale }] },
        ]}
      >
        <Animated.Text
          style={[styles.label, styles.addedLabel, { opacity: successOpacity }]}
        >
          {addedLabel}
        </Animated.Text>
      </Animated.View>
    );
  }

  if (status === 'disabled') {
    return (
      <View style={[styles.pill, styles.pillDisabled]}>
        <Text style={styles.labelDisabled}>{soldOutLabel}</Text>
      </View>
    );
  }

  if (status === 'locked') {
    return (
      <Pressable
        style={[styles.pill, styles.pillLocked]}
        onPress={onLockedPress}
        accessibilityRole={'button' as AccessibilityRole}
        accessibilityLabel={selectOptionsLabel}
      >
        <Text style={styles.labelLocked}>{selectOptionsLabel}</Text>
      </Pressable>
    );
  }

  return (
    <View
      onLayout={handleLayout}
      style={styles.pillWrap}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
    >
      <Animated.View
        style={[styles.pill, disabled && styles.pillDisabled]}
        {...panResponder.panHandlers}
      >
        {/* Track background */}
        <View style={styles.track} />
        {/* Expanding handle (capsule that fills as user slides) */}
        <Animated.View
          style={[
            styles.handle,
            isRTL ? styles.handleRTL : styles.handleLTR,
            { width: handleWidth },
          ]}
        />
        {/* Center label + arrow */}
        <View style={styles.labelWrap} pointerEvents="none">
          <Animated.Text style={[styles.label, { opacity: textOpacity }]}>
            {label}
          </Animated.Text>
          <Animated.View style={[styles.chevron, isRTL && styles.chevronRTL, { opacity: arrowOpacity }]}>
            <Text style={styles.chevronText}>{isRTL ? '‹' : '›'}</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pillWrap: {
    marginVertical: spacing.sm,
    width: '100%',
  },
  pill: {
    height: PILL_HEIGHT,
    minHeight: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    backgroundColor: colors.backgroundMuted,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  pillDisabled: {
    opacity: 0.6,
  },
  pillLocked: {
    backgroundColor: colors.backgroundMuted,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pillSuccess: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: 'rgba(74,124,89,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderRadius: PILL_HEIGHT / 2,
  },
  handle: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: (PILL_HEIGHT - 8) / 2,
    backgroundColor: colors.primary,
    borderWidth: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  handleLTR: {
    left: PILL_PADDING_H,
  },
  handleRTL: {
    right: PILL_PADDING_H,
    left: undefined,
  },
  labelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.25,
  },
  labelDisabled: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.25,
  },
  labelLocked: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  addedLabel: {
    color: colors.success,
    fontWeight: '700',
    fontSize: 18,
  },
  chevron: {
    opacity: 0.4,
  },
  chevronRTL: {
    transform: [{ scaleX: -1 }],
  },
  chevronText: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.textMuted,
  },
});
