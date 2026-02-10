import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFocusEffect } from '@react-navigation/native';
import { getActiveHeroImage, getHeroText } from '@/lib/api';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';

const HERO_MIN_HEIGHT = 280;

export function HeroSection() {
  const { language } = useLanguage();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [text, setText] = useState<{ headline: string; subtext: string; button_label: string } | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      getActiveHeroImage().then((res) => {
        if (!cancelled && res?.image_url) setImageUrl(res.image_url);
      }).catch(() => {});
      getHeroText().then((res) => {
        if (!cancelled) setText(res);
      }).catch(() => {});
      return () => { cancelled = true; };
    }, [])
  );

  const headline = (text?.headline?.trim() || t(language, 'heroHeadline'));
  const subtext = (text?.subtext?.trim() || t(language, 'heroSubtext'));
  const buttonLabel = (text?.button_label?.trim() || t(language, 'heroCta'));

  return (
    <View style={styles.wrapper}>
      <View style={styles.background}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            cachePolicy="disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.placeholderBg]} />
        )}
        <View style={styles.overlay} />
        <View style={styles.content}>
          <Text style={styles.headline} numberOfLines={2}>
            {headline}
          </Text>
          <Text style={styles.subtext} numberOfLines={2}>
            {subtext}
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push('/(tabs)/collections')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>{buttonLabel}</Text>
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
  placeholderBg: {
    backgroundColor: colors.primary,
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
