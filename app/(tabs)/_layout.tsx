
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';


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
          height: 90,
          paddingTop: 10,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={30} color={color} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ fontSize: 18, color: focused ? colors.primary : colors.textSecondary, marginTop: 4 }}>Home</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="notifications" size={30} color={color} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ fontSize: 18, color: focused ? colors.primary : colors.textSecondary, marginTop: 4 }}>Notifications</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="settings" size={30} color={color} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ fontSize: 16, color: focused ? colors.primary : colors.textSecondary, marginTop: 4 }}>Settings</Text>
          ),
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
      <Tabs.Screen
        name="fee-structure"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
