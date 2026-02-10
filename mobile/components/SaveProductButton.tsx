import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedProducts } from '@/contexts/SavedProductsContext';
import { hapticImpact } from '@/lib/haptics';
import { colors } from '@/constants/theme';

interface SaveProductButtonProps {
  productSlug: string;
  size?: number;
  style?: ViewStyle;
}

export function SaveProductButton({ productSlug, size = 24, style }: SaveProductButtonProps) {
  const { signedIn } = useAuth();
  const { isSaved, toggle } = useSavedProducts();
  const saved = isSaved(productSlug);

  const onPress = () => {
    if (!signedIn) {
      router.push('/(auth)/login');
      return;
    }
    hapticImpact();
    toggle(productSlug);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.btn, style]}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      activeOpacity={0.8}
    >
      <Ionicons
        name={saved ? 'heart' : 'heart-outline'}
        size={size}
        color={saved ? colors.primary : colors.text}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
