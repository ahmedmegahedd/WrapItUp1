import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';

const HERO_MIN_HEIGHT = 280;

export function HeroSection() {
  const { language } = useLanguage();

  return (
    <View style={styles.wrapper}>
      <View style={styles.background}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1486427944929-f4c8f8919c65?w=800&q=80' }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
        />
        <View style={styles.overlay} />
        <View style={styles.content}>
          <Text style={styles.headline} numberOfLines={2}>
            {t(language, 'heroHeadline')}
          </Text>
          <Text style={styles.subtext} numberOfLines={2}>
            {t(language, 'heroSubtext')}
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push('/(tabs)/collections')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>{t(language, 'heroCta')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: HERO_MIN_HEIGHT,
    borderRadius: 0,
    overflow: 'hidden',
  },
  background: {
    minHeight: HERO_MIN_HEIGHT,
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  content: {
    zIndex: 1,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    ...(Platform.OS === 'android' && { elevation: 2 }),
  },
  subtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    marginTop: spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 160,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
