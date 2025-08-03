
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme, fontSize, setFontSize } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [preferences, setPreferences] = useState({
    systemNotifications: true,
    emailNotifications: true,
    phoneNotifications: false,
    twoFactorAuth: false,
  });

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    if (theme === 'system') {
      // Handle system theme
      toggleTheme();
    } else {
      toggleTheme();
    }
  };

  // const toggleTheme = () => {
  //   if (isDark) {
  //     handleThemeChange('light');
  //   } else {
  //     handleThemeChange('dark');
  //   }
  // };

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
  };

  const handlePasswordChange = () => {
    if (passwords.new !== passwords.confirm) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (passwords.new.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    // Handle password change logic here
    Alert.alert('Success', 'Password changed successfully');
    setShowPasswordModal(false);
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
      {children}
    </View>
  );

  const SettingItem = ({
    title,
    subtitle,
    onPress,
    rightElement
  }: {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Settings"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        showNotifications={true}
        showSettings={false}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <ScrollView style={styles.scrollView}>
        {/* Appearance Section */}
        <SettingSection title="Appearance">
          <SettingItem
            title="Theme"
            subtitle={isDark ? 'Dark' : 'Light'}
            onPress={() => {
              Alert.alert(
                'Select Theme',
                '',
                [
                  { text: 'Light', onPress: () => handleThemeChange('light') },
                  { text: 'Dark', onPress: () => handleThemeChange('dark') },
                  { text: 'System Default', onPress: () => handleThemeChange('system') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
            rightElement={<Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>}
          />

          <SettingItem
            title="Font Size"
            subtitle={fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}
            onPress={() => {
              Alert.alert(
                'Select Font Size',
                '',
                [
                  { text: 'Small', onPress: () => handleFontSizeChange('small') },
                  { text: 'Medium', onPress: () => handleFontSizeChange('medium') },
                  { text: 'Large', onPress: () => handleFontSizeChange('large') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
            rightElement={<Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>}
          />

          <SettingItem
            title="Language"
            subtitle="English"
            onPress={() => {
              Alert.alert('Coming Soon', 'Multi-language support will be available soon');
            }}
            rightElement={<Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>}
          />
        </SettingSection>

        {/* Account Settings Section */}
        <SettingSection title="Account Settings">
          <SettingItem
            title="Change Password"
            subtitle="Update your password"
            onPress={() => setShowPasswordModal(true)}
            rightElement={<Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>}
          />

          <SettingItem
            title="Two-Factor Authentication"
            subtitle="Enhanced security for your account"
            rightElement={
              <Switch
                value={preferences.twoFactorAuth}
                onValueChange={(value) =>
                  setPreferences(prev => ({ ...prev, twoFactorAuth: value }))
                }
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
          />

          {user?.role === 'admin' && (
            <SettingItem
              title="Role Switcher"
              subtitle="Switch between roles"
              onPress={() => {
                Alert.alert('Coming Soon', 'Role switching will be available soon');
              }}
              rightElement={<Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>}
            />
          )}
        </SettingSection>

        {/* Notification Preferences Section */}
        <SettingSection title="Notification Preferences">
          <SettingItem
            title="System Notifications"
            subtitle="In-app notifications"
            rightElement={
              <Switch
                value={preferences.systemNotifications}
                onValueChange={(value) =>
                  setPreferences(prev => ({ ...prev, systemNotifications: value }))
                }
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
          />

          <SettingItem
            title="Email Notifications"
            subtitle="Receive notifications via email"
            rightElement={
              <Switch
                value={preferences.emailNotifications}
                onValueChange={(value) =>
                  setPreferences(prev => ({ ...prev, emailNotifications: value }))
                }
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
          />

          <SettingItem
            title="Phone Notifications"
            subtitle="SMS notifications"
            rightElement={
              <Switch
                value={preferences.phoneNotifications}
                onValueChange={(value) =>
                  setPreferences(prev => ({ ...prev, phoneNotifications: value }))
                }
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
          />
        </SettingSection>

        {/* About App Section */}
        <SettingSection title="About App">
          <SettingItem
            title="App Version"
            subtitle="1.0.0"
          />

          <SettingItem
            title="Terms of Service"
            onPress={() => {
              Alert.alert('Coming Soon', 'Terms of Service will be available soon');
            }}
            rightElement={<Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>}
          />

          <SettingItem
            title="Privacy Policy"
            onPress={() => {
              Alert.alert('Coming Soon', 'Privacy Policy will be available soon');
            }}
            rightElement={<Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>}
          />

          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: '#FF6B6B' }]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </SettingSection>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Change Password</Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Current Password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={passwords.current}
              onChangeText={(text) => setPasswords(prev => ({ ...prev, current: text }))}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="New Password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={passwords.new}
              onChangeText={(text) => setPasswords(prev => ({ ...prev, new: text }))}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Confirm New Password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={passwords.confirm}
              onChangeText={(text) => setPasswords(prev => ({ ...prev, confirm: text }))}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handlePasswordChange}
              >
                <Text style={styles.modalButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
