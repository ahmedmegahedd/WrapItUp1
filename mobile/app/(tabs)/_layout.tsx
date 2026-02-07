import { Tabs } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { GlassyTabBar } from '@/components/GlassyTabBar';
import { AppHeaderTitle } from '@/components/AppHeaderTitle';
import { HeaderRewardsButton } from '@/components/HeaderRewardsButton';
import { t } from '@/lib/i18n';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  const { getItemCount } = useCart();
  const { language } = useLanguage();
  const cartCount = getItemCount();

  return (
    <Tabs
      tabBar={(props) => <GlassyTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShown: true,
        headerTitle: () => <AppHeaderTitle />,
        headerTitleAlign: 'center',
        headerRight: () => <HeaderRewardsButton />,
        sceneContainerStyle: { paddingBottom: 88 },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 0,
          overflow: 'visible',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t(language, 'home'),
          tabBarBadge: undefined,
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: t(language, 'collections'),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t(language, 'cart'),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: t(language, 'rewards'),
          href: null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t(language, 'orders'),
          href: null,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t(language, 'account'),
        }}
      />
    </Tabs>
  );
}
