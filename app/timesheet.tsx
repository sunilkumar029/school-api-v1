
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';

export default function TimesheetScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'fill' | 'leave' | 'standby' | 'shifts' | 'requests' | 'faq'>('fill');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar 
        title="Timesheet"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />
      
      <SideDrawer 
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <ScrollView horizontal style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        {[
          { key: 'fill', label: 'Fill Timesheet' },
          { key: 'leave', label: 'Apply Leave' },
          { key: 'standby', label: 'Stand-By' },
          { key: 'shifts', label: 'Shift Management' },
          { key: 'requests', label: 'Requests' },
          { key: 'faq', label: 'FAQ' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? colors.primary : colors.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.content}>
        <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content will be implemented here
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholder: {
    fontSize: 16,
    textAlign: 'center',
  },
});
