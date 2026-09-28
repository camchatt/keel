import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { fonts } from '@/theme';

const ICONS = {
  index: { on: 'people-circle', off: 'people-circle-outline' },
  access: { on: 'key', off: 'key-outline' },
  home: { on: 'home', off: 'home-outline' },
} as const;

export default function TabLayout() {
  const { colors } = useResolvedTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 6,
          ...Platform.select({
            ios: {},
            android: { paddingBottom: 8 },
            default: { paddingBottom: 8 },
          }),
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodyBold,
          fontSize: 11,
          lineHeight: 13,
          marginTop: 2,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Circles',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? ICONS.index.on : ICONS.index.off} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="access"
        options={{
          title: 'Access',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? ICONS.access.on : ICONS.access.off} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? ICONS.home.on : ICONS.home.off} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          href: null,
          title: 'Finance',
        }}
      />
    </Tabs>
  );
}
