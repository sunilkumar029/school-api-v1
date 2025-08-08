
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ModalDropdownFilter } from '@/components/ModalDropdownFilter';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  useTasks, 
  useAllUsersExceptStudents 
} from '@/hooks/useApi';
import { apiService } from '@/api/apiService';

interface Task {
  id: number;
  title: string;
  description: string;
  from_date: string;
  due_date: string;
  created_by: {
    id: number;
    name: string;
  };
  assigned_users: Array<{
    id: number;
    name: string;
  }>;
  departments: Array<{
    id: number;
    name: string;
  }>;
  standards: Array<{
    id: number;
    name: string;
  }>;
  sections: Array<{
    id: number;
    name: string;
  }>;
  is_submitted: boolean;
  submission_task_percentage: number | null;
}

export default function TaskListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignedBy, setSelectedAssignedBy] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Global filters
  const {
    selectedBranch,
    selectedAcademicYear,
    branches,
    academicYears,
    branchesLoading,
    academicYearsLoading
  } = useGlobalFilters();

  // Fetch data
  const { data: users = [] } = useAllUsersExceptStudents({ 
    branch: selectedBranch,
    academic_year: selectedAcademicYear 
  });

  const tasksParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
  }), [selectedBranch, selectedAcademicYear]);

  const { 
    data: tasks = [], 
    loading: tasksLoading, 
    error: tasksError, 
    refetch: refetchTasks 
  } = useTasks(tasksParams);

  const filteredTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    return tasks.filter((task: Task) => {
      const matchesSearch = !searchQuery || 
        (task.title && task.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesAssignedBy = !selectedAssignedBy || 
        (task.created_by && task.created_by.id === selectedAssignedBy);
      
      return matchesSearch && matchesAssignedBy;
    });
  }, [tasks, searchQuery, selectedAssignedBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (task: Task) => {
    if (task.is_submitted) return '#4CAF50';
    
    const dueDate = new Date(task.due_date);
    const today = new Date();
    
    if (dueDate < today) return '#F44336'; // Overdue
    if (dueDate.getTime() - today.getTime() <= 3 * 24 * 60 * 60 * 1000) return '#FF9800'; // Due soon
    return '#2196F3'; // Normal
  };

  const getStatusText = (task: Task) => {
    if (task.is_submitted) return 'Completed';
    
    const dueDate = new Date(task.due_date);
    const today = new Date();
    
    if (dueDate < today) return 'Overdue';
    if (dueDate.getTime() - today.getTime() <= 3 * 24 * 60 * 60 * 1000) return 'Due Soon';
    return 'Pending';
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  const handleEditTask = (task: Task) => {
    setDetailModalVisible(false);
    router.push(`/tasks/add-edit-task?id=${task.id}`);
  };

  const handleDeleteTask = async (task: Task) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteTask(task.id);
              setDetailModalVisible(false);
              refetchTasks();
              Alert.alert('Success', 'Task deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const renderTaskCard = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleTaskPress(item)}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleContainer}>
          <Text style={[styles.taskTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.title || 'Untitled Task'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
            <Text style={styles.statusText}>{getStatusText(item)}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.taskDescription, { color: colors.textSecondary }]} numberOfLines={3}>
        {item.description || 'No description available'}
      </Text>

      <View style={styles.taskMeta}>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          📅 From: {formatDate(item.from_date)}
        </Text>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          ⏰ Due: {formatDate(item.due_date)}
        </Text>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          👤 Created by: {item.created_by?.name || 'Unknown'}
        </Text>
      </View>

      {item.assigned_users && item.assigned_users.length > 0 && (
        <View style={styles.assignedUsers}>
          <Text style={[styles.assignedLabel, { color: colors.textSecondary }]}>
            Assigned to:
          </Text>
          <View style={styles.usersList}>
            {item.assigned_users.slice(0, 3).map((user, index) => (
              <Text key={index} style={[styles.userName, { color: colors.primary }]}>
                {user.name || 'Unknown User'}
              </Text>
            ))}
            {item.assigned_users.length > 3 && (
              <Text style={[styles.moreUsers, { color: colors.textSecondary }]}>
                +{item.assigned_users.length - 3} more
              </Text>
            )}
          </View>
        </View>
      )}

      {item.submission_task_percentage !== null && (
        <View style={styles.progressContainer}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            Progress: {item.submission_task_percentage}%
          </Text>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${item.submission_task_percentage}%`
                }
              ]}
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderDetailModal = () => (
    <Modal
      visible={detailModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setDetailModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Task Details
            </Text>
            <TouchableOpacity
              onPress={() => setDetailModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedTask && (
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>
                {selectedTask.title || 'Untitled Task'}
              </Text>

              <Text style={[styles.detailDescription, { color: colors.textSecondary }]}>
                {selectedTask.description || 'No description available'}
              </Text>

              <View style={styles.detailMeta}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>From Date:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {formatDate(selectedTask.from_date)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Due Date:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {formatDate(selectedTask.due_date)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Created by:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {selectedTask.created_by?.name || 'Unknown'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTask) }]}>
                    <Text style={styles.statusText}>{getStatusText(selectedTask)}</Text>
                  </View>
                </View>
              </View>

              {selectedTask.assigned_users && selectedTask.assigned_users.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Assigned Users:
                  </Text>
                  {selectedTask.assigned_users.map((user, index) => (
                    <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
                      • {user.name || 'Unknown User'}
                    </Text>
                  ))}
                </View>
              )}

              {selectedTask.departments && selectedTask.departments.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Departments:
                  </Text>
                  {selectedTask.departments.map((dept, index) => (
                    <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
                      • {dept.name || 'Unknown Department'}
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleEditTask(selectedTask)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteTask(selectedTask)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const isLoading = tasksLoading || branchesLoading || academicYearsLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Tasks"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          placeholder="Search tasks..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Text style={[styles.filtersLabel, { color: colors.textSecondary }]}>Filters:</Text>
            
            <ModalDropdownFilter
              label="Branch"
              selectedValue={selectedBranch}
              onValueChange={() => {}} // Read-only from global filters
              options={branches.map((branch: any) => ({ 
                label: branch.name || 'Unnamed Branch', 
                value: branch.id 
              }))}
              disabled={true}
            />
            
            <ModalDropdownFilter
              label="Academic Year"
              selectedValue={selectedAcademicYear}
              onValueChange={() => {}} // Read-only from global filters
              options={academicYears.map((year: any) => ({ 
                label: year.name || 'Unnamed Year', 
                value: year.id 
              }))}
              disabled={true}
            />
            
            <ModalDropdownFilter
              label="Assigned By"
              selectedValue={selectedAssignedBy}
              onValueChange={setSelectedAssignedBy}
              options={[
                { label: 'All Users', value: null },
                ...users.map((user: any) => ({ 
                  label: user.name || 'Unnamed User', 
                  value: user.id 
                }))
              ]}
            />
          </View>
        </ScrollView>
      </View>

      {/* Add Task Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/tasks/add-edit-task')}
        >
          <Text style={styles.addButtonText}>+ Add New Task</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading tasks...
          </Text>
        </View>
      ) : tasksError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Failed to load tasks. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetchTasks}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTaskCard}
          keyExtractor={(item) => item.id.toString()}
          style={styles.tasksList}
          contentContainerStyle={styles.tasksListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetchTasks}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No tasks found
              </Text>
            </View>
          }
        />
      )}

      {renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tasksList: {
    flex: 1,
  },
  tasksListContent: {
    padding: 16,
  },
  taskCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  taskHeader: {
    marginBottom: 8,
  },
  taskTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  taskMeta: {
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    marginBottom: 4,
  },
  assignedUsers: {
    marginBottom: 12,
  },
  assignedLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  usersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  userName: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreUsers: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  progressContainer: {
    marginTop: 8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  detailMeta: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  detailSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
