import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { usePointsBalance } from '@/contexts/PointsBalanceContext';
import { colors } from '@/constants/theme';

/**
 * Gift icon + points in header. Tap → Rewards (or Login if not signed in).
 * Points from backend only. If not logged in, hide points and show only gift icon.
 */
export function HeaderRewardsButton() {
  const router = useRouter();
  const { signedIn } = useAuth();
  const { balance } = usePointsBalance();

  const onPress = () => {
    if (signedIn) {
      router.push('/(tabs)/rewards');
    } else {
      router.push('/(auth)/login');
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.wrap}
      activeOpacity={0.7}
      accessibilityLabel={signedIn ? 'Rewards and points' : 'Sign in to view rewards'}
    >
      <Ionicons name="gift-outline" size={22} color={colors.primary} />
      {signedIn && balance !== null && (
        <Text style={styles.points} numberOfLines={1}>
          {balance.toLocaleString()} pts
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 4,
  },
  points: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
