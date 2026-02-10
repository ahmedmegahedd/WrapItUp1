import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.inner}>
        <Ionicons name="grid-outline" size={32} color={colors.primary} />
        <Text style={styles.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundMuted,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
});
