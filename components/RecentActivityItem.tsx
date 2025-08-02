
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface RecentActivityItemProps {
  icon: string;
  title: string;
  description: string;
  time: string;
}

export const RecentActivityItem: React.FC<RecentActivityItemProps> = ({
  icon,
  title,
  description,
  time,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <Text style={[styles.icon, { color: colors.primary }]}>{icon}</Text>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <Text style={[styles.time, { color: colors.textSecondary }]}>{time}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  icon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
  },
  time: {
    fontSize: 11,
  },
});
