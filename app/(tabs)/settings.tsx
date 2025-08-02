
import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, fontSizes, ThemeMode, FontSize } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';

export default function SettingsScreen() {
  const { colors, fontSize, themeMode, setThemeMode, setFontSize, resetSettings } = useTheme();
  const { logout, user } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ];

  const fontOptions: { label: string; value: FontSize }[] = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar 
        title="Settings" 
        showSettings={false}
        onMenuPress={() => setDrawerVisible(true)}
      />
      
      <SideDrawer 
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSizes[fontSize] + 4 }]}>
            Appearance
          </Text>
          
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: fontSizes[fontSize] + 2 }]}>
              Theme
            </Text>
            <View style={styles.optionGroup}>
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    themeMode === option.value && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => setThemeMode(option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    { color: themeMode === option.value ? colors.primary : colors.textPrimary },
                    { fontSize: fontSizes[fontSize] }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: fontSizes[fontSize] + 2 }]}>
              Font Size
            </Text>
            <View style={styles.optionGroup}>
              {fontOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    fontSize === option.value && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => setFontSize(option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    { color: fontSize === option.value ? colors.primary : colors.textPrimary },
                    { fontSize: fontSizes[option.value] }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSizes[fontSize] + 4 }]}>
            Account
          </Text>
          
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: fontSizes[fontSize] + 2 }]}>
              User Information
            </Text>
            {user && (
              <View style={styles.userInfo}>
                <Text style={[styles.userText, { color: colors.textSecondary, fontSize: fontSizes[fontSize] }]}>
                  Email: {user.email}
                </Text>
                <Text style={[styles.userText, { color: colors.textSecondary, fontSize: fontSizes[fontSize] }]}>
                  Role: {user.is_superuser ? 'Admin' : user.is_staff ? 'Staff' : 'Student'}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={resetSettings}
          >
            <Text style={[styles.actionButtonText, { fontSize: fontSizes[fontSize] }]}>
              Reset Settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
            onPress={logout}
          >
            <Text style={[styles.actionButtonText, { fontSize: fontSizes[fontSize] }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  optionGroup: {
    gap: 8,
  },
  option: {
    padding: 12,
    borderRadius: 8,
  },
  optionText: {
    fontWeight: '500',
  },
  userInfo: {
    gap: 4,
  },
  userText: {
    lineHeight: 20,
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
