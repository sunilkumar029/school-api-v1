
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface EventItemProps {
  title: string;
  time: string;
  type: string;
  onPress?: () => void;
}

export const EventItem: React.FC<EventItemProps> = ({
  title,
  time,
  type,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.timeContainer}>
        <Text style={[styles.time, { color: colors.primary }]}>{time}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.type, { color: colors.textSecondary }]}>{type}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  timeContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  type: {
    fontSize: 12,
  },
});
