
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

export default function UsersScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'staff' | 'teachers' | 'students' | 'parents' | 'drivers'>('staff');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar 
        title="Users Management"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />
      
      <SideDrawer 
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {[
          { key: 'staff', label: 'Staff' },
          { key: 'teachers', label: 'Teachers' },
          { key: 'students', label: 'Students' },
          { key: 'parents', label: 'Parents' },
          { key: 'drivers', label: 'Drivers' },
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
      </View>

      <View style={styles.content}>
        <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} management will be implemented here
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
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
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
