import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { AccessibilityInfo } from 'react-native';

let reducedMotion: boolean | null = null;

async function isReduceMotionEnabled(): Promise<boolean> {
  if (reducedMotion !== null) return reducedMotion;
  try {
    reducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    reducedMotion = false;
  }
  return reducedMotion;
}

/**
 * Light impact for primary button press. Skips if reduce motion is enabled.
 */
export async function hapticPrimary(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (await isReduceMotionEnabled()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (_) {}
}

/**
 * Medium impact for add-to-cart, save/unsave. Skips if reduce motion is enabled.
 */
export async function hapticImpact(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (await isReduceMotionEnabled()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (_) {}
}

/**
 * Success notification for reward redeem, checkout success. Skips if reduce motion is enabled.
 */
export async function hapticSuccess(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (await isReduceMotionEnabled()) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (_) {}
}

/**
 * Error notification for payment failure, validation errors. Skips if reduce motion is enabled.
 */
export async function hapticError(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (await isReduceMotionEnabled()) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (_) {}
}
