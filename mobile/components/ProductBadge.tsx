import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius } from '@/constants/theme';

export type BadgeVariant = 'sale' | 'new' | 'bestseller' | 'limited';

interface ProductBadgeProps {
  variant: BadgeVariant;
  label?: string;
}

const BADGE_META: Record<BadgeVariant, { label: string; bg: string; text: string }> = {
  sale: { label: 'SALE', bg: colors.primary, text: '#fff' },
  new: { label: 'NEW', bg: '#10B981', text: '#fff' },
  bestseller: { label: 'TOP', bg: '#F59E0B', text: '#fff' },
  limited: { label: 'LIMITED', bg: '#6366F1', text: '#fff' },
};

export function ProductBadge({ variant, label }: ProductBadgeProps) {
  const meta = BADGE_META[variant];
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.label, { color: meta.text }]}>{label ?? meta.label}</Text>
    </View>
  );
}

export function resolveBadge(product: any): BadgeVariant | null {
  if (!product) return null;
  if (product.discount_price != null && product.discount_price < product.base_price) return 'sale';
  const createdAt = product.created_at ? new Date(product.created_at) : null;
  if (createdAt) {
    const daysOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 14) return 'new';
  }
  if ((product.points_value ?? 0) > 0) return 'bestseller';
  return null;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
