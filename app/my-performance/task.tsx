
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';

interface Task {
  id: string;
  title: string;
  status: 'In Progress' | 'Done' | 'Late';
  completion: number;
  timeTaken: number;
  timeAllocated: number;
  dueDate: string;
}

export default function TaskPerformanceScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'In Progress' | 'Done' | 'Late'>('all');

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Prepare Lesson Plans',
      status: 'Done',
      completion: 100,
      timeTaken: 4,
      timeAllocated: 5,
      dueDate: '2024-01-15',
    },
    {
      id: '2',
      title: 'Grade Assignments',
      status: 'In Progress',
      completion: 65,
      timeTaken: 3,
      timeAllocated: 4,
      dueDate: '2024-01-20',
    },
    {
      id: '3',
      title: 'Update Student Records',
      status: 'Late',
      completion: 80,
      timeTaken: 6,
      timeAllocated: 4,
      dueDate: '2024-01-10',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return '#34C759';
      case 'In Progress': return '#007AFF';
      case 'Late': return '#FF3B30';
      default: return colors.textSecondary;
    }
  };

  const renderTaskCard = ({ item }: { item: Task }) => (
    <View style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.taskHeader}>
        <Text style={[styles.taskTitle, { color: colors.textPrimary }]}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
          Completion: {item.completion}%
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: getStatusColor(item.status),
                width: `${item.completion}%`
              }
            ]} 
          />
        </View>
      </View>

      <View style={styles.timeInfo}>
        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
          Time: {item.timeTaken}h / {item.timeAllocated}h allocated
        </Text>
        <Text style={[styles.dueDateText, { color: colors.textSecondary }]}>
          Due: {item.dueDate}
        </Text>
      </View>
    </View>
  );

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Task Performance"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Filter */}
      <ScrollView horizontal style={styles.filterContainer} showsHorizontalScrollIndicator={false}>
        {['all', 'In Progress', 'Done', 'Late'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              { 
                backgroundColor: filterStatus === status ? colors.primary : 'transparent',
                borderColor: colors.border
              }
            ]}
            onPress={() => setFilterStatus(status as any)}
          >
            <Text style={[
              styles.filterButtonText,
              { color: filterStatus === status ? '#FFFFFF' : colors.textSecondary }
            ]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredTasks}
        renderItem={renderTaskCard}
        keyExtractor={(item) => item.id}
        style={styles.taskList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskList: {
    padding: 16,
  },
  taskCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
  },
  dueDateText: {
    fontSize: 12,
  },
});
