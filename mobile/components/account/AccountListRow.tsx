import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accountColors, accountSpacing, accountTypography } from '@/constants/accountTheme';
import { colors } from '@/constants/theme';

interface AccountListRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  rightText?: string;
  destructive?: boolean;
  hideChevron?: boolean;
}

export function AccountListRow({ icon, title, onPress, rightText, destructive, hideChevron }: AccountListRowProps) {
  const showRight = rightText !== undefined || !hideChevron;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Ionicons
        name={icon}
        size={22}
        color={destructive ? accountColors.destructive : accountColors.charcoalMuted}
      />
      <Text style={[styles.title, destructive && styles.titleDestructive]} numberOfLines={1}>
        {title}
      </Text>
      {showRight && (
        rightText !== undefined ? (
          <Text style={styles.rightText} numberOfLines={1}>{rightText}</Text>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={accountColors.textMuted} />
        )
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: accountSpacing.md,
    paddingHorizontal: accountSpacing.lg,
    backgroundColor: accountColors.backgroundElevated,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: accountColors.borderLight,
  },
  title: {
    flex: 1,
    marginLeft: accountSpacing.md,
    ...accountTypography.cardValue,
    color: accountColors.text,
  },
  titleDestructive: {
    color: accountColors.destructive,
  },
  rightText: {
    ...accountTypography.cardValue,
    color: colors.primary,
    fontWeight: '600',
    marginRight: accountSpacing.xs,
  },
});
