
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface QuickActionButtonProps {
  title?: string;
  icon?: string;
  color?: string;
  key?: string;
  onPress: () => void;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  title,
  icon,
  color,
  key,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.icon, { color: colors.primary }]}>{icon}</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    margin: 6,
    minHeight: 80,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    minWidth: "25%",
    width: "100%",
    // paddingHorizontal: 6,
    // paddingVertical: 12,
  },
  icon: {
    fontSize: 24,
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
