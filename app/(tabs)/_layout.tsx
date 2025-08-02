
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>🔔</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>⚙️</Text>,
        }}
      />
      {/* All other screens hidden from bottom tabs - accessible via sidebar */}
      <Tabs.Screen
        name="events"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="foodcourt"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="department"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
