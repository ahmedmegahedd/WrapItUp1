import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors } from '@/constants/theme';
import { t, type I18nKey } from '@/lib/i18n';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  collections: 'grid',
  cart: 'cart',
  rewards: 'gift',
  orders: 'receipt',
  account: 'person',
};

const TAB_KEYS: Record<string, I18nKey> = {
  index: 'home',
  collections: 'collections',
  cart: 'cart',
  rewards: 'rewards',
  orders: 'orders',
  account: 'account',
};

interface TabItemProps {
  routeKey: string;
  isFocused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  badge: number | undefined;
  showBadge: boolean;
  onPress: () => void;
}

function TabItem({ routeKey, isFocused, iconName, label, badge, showBadge, onPress }: TabItemProps) {
  const scale = useSharedValue(1);
  const prevBadge = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (showBadge && badge !== prevBadge.current) {
      scale.value = withSequence(
        withSpring(1.45, { damping: 4, stiffness: 300 }),
        withSpring(1, { damping: 8, stiffness: 200 }),
      );
    }
    if (!showBadge) {
      scale.value = withTiming(1, { duration: 150 });
    }
    prevBadge.current = badge;
  }, [badge, showBadge]);

  const badgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      key={routeKey}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      style={styles.tab}
      activeOpacity={0.8}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name={iconName}
          size={22}
          color={isFocused ? colors.primary : 'rgba(255,255,255,0.45)'}
        />
        {showBadge && (
          <Animated.View style={[styles.badge, badgeAnimStyle]}>
            <Text style={styles.badgeText}>{(badge ?? 0) > 99 ? '99+' : badge}</Text>
          </Animated.View>
        )}
      </View>
      <Text style={[styles.label, isFocused && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
      {isFocused && <View style={styles.activeDot} />}
    </TouchableOpacity>
  );
}

export function GlassyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const bottom = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.wrapper, { paddingBottom: bottom }]} pointerEvents="box-none">
      <View style={styles.pill}>
        <View style={styles.tabRow}>
          {state.routes.filter((r) => r.name !== 'rewards' && r.name !== 'orders').map((route) => {
            const { options } = descriptors[route.key];
            const isFocused = state.routes[state.index]?.key === route.key;
            const name = route.name as keyof typeof TAB_ICONS;
            const iconName = TAB_ICONS[name] ?? 'ellipse';
            const labelKey = TAB_KEYS[name];
            const label = labelKey ? t(language, labelKey) : route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const badge = options.tabBarBadge as number | undefined;
            const showBadge = typeof badge === 'number' && badge > 0;

            return (
              <TabItem
                key={route.key}
                routeKey={route.key}
                isFocused={isFocused}
                iconName={iconName}
                label={label}
                badge={badge}
                showBadge={showBadge}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(28, 16, 8, 0.93)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  iconWrap: {
    position: 'relative',
    marginBottom: 2,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
  labelActive: {
    color: colors.primary,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});
