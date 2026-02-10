import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { getOnboardingConfig } from '@/lib/api';
import { setHasSeenOnboarding } from '@/lib/onboardingStorage';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';
import type { OnboardingSlide } from '@/lib/api';

const ICONS: (keyof typeof Ionicons.glyphMap)[] = ['gift-outline', 'heart-outline', 'cart-outline', 'sparkles-outline'];

export default function OnboardingScreen() {
  const [slides, setSlides] = useState<OnboardingSlide[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getOnboardingConfig().then((config) => {
      if (config.enabled && config.slides.length > 0) {
        setSlides(config.slides);
      } else {
        router.replace('/(tabs)');
        return;
      }
      setReady(true);
    }).catch(() => {
      router.replace('/(tabs)');
    });
  }, []);

  if (!ready || slides.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <OnboardingSlides slides={slides} />;
}

function OnboardingSlides({ slides }: { slides: OnboardingSlide[] }) {
  const { language } = useLanguage();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const isRTL = I18nManager.isRTL;
  const isLast = index >= slides.length - 1;

  const handleSkip = async () => {
    await setHasSeenOnboarding();
    router.replace('/(tabs)');
  };

  const handleNext = async () => {
    if (isLast) {
      await setHasSeenOnboarding();
      router.replace('/(tabs)');
      return;
    }
    const next = isRTL ? index - 1 : index + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  };

  const onMomentumScrollEnd = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(i, slides.length - 1)));
  };

  const renderItem = ({ item, index: i }: { item: OnboardingSlide; index: number }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={ICONS[i % ICONS.length]}
          size={64}
          color={colors.primary}
        />
      </View>
      <Text style={styles.title}>{item.title || ''}</Text>
      <Text style={styles.subtitle}>{item.subtitle || ''}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.skipBtn, isRTL ? styles.skipBtnRTL : undefined]}
        onPress={handleSkip}
        activeOpacity={0.8}
      >
        <Text style={styles.skipText}>{t(language, 'onboardingSkip')}</Text>
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={renderItem}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        bounces={false}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.cta} onPress={handleNext} activeOpacity={0.9}>
          <Text style={styles.ctaText}>
            {isLast ? t(language, 'onboardingGetStarted') : t(language, 'onboardingNext')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  skipBtn: { position: 'absolute', top: 52, right: spacing.lg, zIndex: 10 },
  skipBtnRTL: { right: undefined, left: spacing.lg },
  skipText: { fontSize: 16, color: colors.textMuted, fontWeight: '500' },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
    paddingTop: spacing.lg,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
