import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface TopBarProps {
  title: string;
  showNotifications?: boolean;
  showSettings?: boolean;
  showDrawer?: boolean;
  onMenuPress?: () => void;
  onNotificationsPress?: () => void;
  onSettingsPress?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showNotifications = true,
  showSettings = true,
  showDrawer = true,
  onMenuPress,
  onNotificationsPress,
  onSettingsPress,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {showDrawer && (
        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
          <Text style={[styles.menuIcon, { color: colors.textPrimary }]}>☰</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>

      <View style={styles.actions}>
        {showNotifications && (
          <TouchableOpacity style={styles.actionButton} onPress={onNotificationsPress}>
            <Text style={[styles.actionIcon, { color: colors.textPrimary }]}>🔔</Text>
          </TouchableOpacity>
        )}
        {showSettings && (
          <TouchableOpacity style={styles.actionButton} onPress={onSettingsPress}>
            <Text style={[styles.actionIcon, { color: colors.textPrimary }]}>⚙️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  menuButton: {
    padding: 24,
    position: 'absolute',
    left: 16,
  },
  menuIcon: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  actions: {
    flexDirection: 'row',
    position: 'absolute',
    right: 16,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  actionIcon: {
    fontSize: 18,
  },
});