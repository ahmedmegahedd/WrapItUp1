import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

const CARD_HEIGHT = 172;

interface ViewAllCardProps {
  label: string;
  onPress: () => void;
}

/**
 * The 8th slot in the editorial grid: "View All". Visually distinct but part of the layout.
 */
export function ViewAllCard({ label, onPress }: ViewAllCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ width: '100%', height: CARD_HEIGHT, borderRadius: 20 }, animStyle]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 200 }); }}
        onPressOut={() => { scale.value = withSpring(1.0, { damping: 15, stiffness: 200 }); }}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <LinearGradient
          colors={['#FDF2F8', '#FCE7F3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.inner}>
            <View style={styles.iconCircle}>
              <Ionicons name="apps-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.label}>View All Collections</Text>
            <Text style={styles.subtitle}>Browse everything →</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
