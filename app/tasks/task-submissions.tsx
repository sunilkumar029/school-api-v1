import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
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
  useTaskSubmissions, 
  useAllUsersExceptStudents,
  useTasks
} from '@/hooks/useApi';

interface TaskSubmission {
  id: number;
  task: {
    id: number;
    title: string;
    description: string;
    due_date: string;
    created_by: {
      id: number;
      name: string;
    };
  };
  submitted_by: {
    id: number;
    name: string;
    email: string;
  };
  submission_date: string;
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected';
  comments: string;
  file_url?: string;
}

export default function TaskSubmissionsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // Added search query state

  // Global filters
  const {
    selectedBranch,
    selectedAcademicYear,
    setSelectedBranch,
    setSelectedAcademicYear,
    branches,
    academicYears,
    branchesLoading,
    academicYearsLoading
  } = useGlobalFilters();

  // Fetch data
  const { data: users = [], loading: usersLoading } = useAllUsersExceptStudents({ 
    branch: selectedBranch,
    academic_year: selectedAcademicYear 
  });

  const { data: tasks = [], loading: tasksLoading } = useTasks({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
  });

  const submissionsParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    task: selectedTask,
    status: selectedStatus,
    submitted_by: selectedUser,
  }), [selectedBranch, selectedAcademicYear, selectedTask, selectedStatus, selectedUser]);

  const { 
    data: submissions = [], 
    loading: submissionsLoading, 
    error: submissionsError,
    refetch: refetchSubmissions
  } = useTaskSubmissions(submissionsParams);

  // Filter options
  const taskOptions = useMemo(() => [
    { id: 0, name: 'All Tasks' },
    ...tasks.map((task: any) => ({
      id: task.id,
      name: task.title || 'Unnamed Task'
    }))
  ], [tasks]);

  const statusOptions = useMemo(() => [
    { id: 0, name: 'All Statuses' },
    { id: 1, name: 'Submitted' },
    { id: 2, name: 'Reviewed' },
    { id: 3, name: 'Approved' },
    { id: 4, name: 'Rejected' }
  ], []);

  const statusMapping: { [key: number]: string | null } = {
    0: null,
    1: 'submitted',
    2: 'reviewed', 
    3: 'approved',
    4: 'rejected'
  };

  const userOptions = useMemo(() => [
    { id: 0, name: 'All Users' },
    ...users.map((user: any) => ({
      id: user.id,
      name: user.name || user.email || 'Unnamed User'
    }))
  ], [users]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return colors.warning || '#f59e0b';
      case 'reviewed': return colors.info || '#3b82f6';
      case 'approved': return colors.success || '#10b981';
      case 'rejected': return colors.error || '#ef4444';
      default: return colors.textSecondary || '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    if (!status || typeof status !== 'string') return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const handleRefresh = () => {
    refetchSubmissions();
  };

  const handleSubmissionPress = (submission: TaskSubmission) => {
    setSelectedSubmission(submission);
  };

  const renderSubmissionCard = ({ item }: { item: TaskSubmission }) => (
    <TouchableOpacity 
      style={[styles.submissionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleSubmissionPress(item)}
    >
      <View style={styles.submissionHeader}>
        <Text style={[styles.submissionTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.task?.title || 'Untitled Task'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <Text style={[styles.submissionUser, { color: colors.textSecondary }]}>
        Submitted by: {item.submitted_by?.name || item.submitted_by?.email || 'Unknown User'}
      </Text>

      <Text style={[styles.submissionDate, { color: colors.textSecondary }]}>
        Submission Date: {formatDate(item.submission_date)}
      </Text>

      {item.task?.due_date && (
        <Text style={[styles.dueDate, { color: colors.textSecondary }]}>
          Due Date: {formatDate(item.task.due_date)}
        </Text>
      )}

      {item.comments && (
        <Text style={[styles.comments, { color: colors.textSecondary }]} numberOfLines={2}>
          Comments: {item.comments}
        </Text>
      )}

      {item.file_url && (
        <Text style={[styles.fileIndicator, { color: colors.primary }]}>
          📎 File Attached
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
        No Submissions Found
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        There are no task submissions matching your current filters.
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={[styles.errorTitle, { color: colors.error }]}>
        Unable to Load Submissions
      </Text>
      <Text style={[styles.errorText, { color: colors.textSecondary }]}>
        Please check your connection and try again.
      </Text>
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={handleRefresh}
      >
        <Text style={[styles.retryButtonText, { color: colors.surface }]}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (branchesLoading || academicYearsLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar
          title="Task Submissions"
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationPress={() => router.push('/notifications')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading filters...
          </Text>
        </View>
        <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Task Submissions"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationPress={() => router.push('/notifications')}
      />

      {/* Global Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Text style={[styles.filtersLabel, { color: colors.textSecondary }]}>Filters:</Text>

            <ModalDropdownFilter
              label="Branch"
              items={branches || []}
              selectedValue={selectedBranch}
              onValueChange={setSelectedBranch}
              compact={true}
            />

            <ModalDropdownFilter
              label="Academic Year"
              items={academicYears || []}
              selectedValue={selectedAcademicYear}
              onValueChange={setSelectedAcademicYear}
              compact={true}
            />

            <ModalDropdownFilter
              label="Task"
              items={taskOptions}
              selectedValue={selectedTask || 0}
              onValueChange={(value) => setSelectedTask(value === 0 ? null : value)}
              loading={tasksLoading}
              compact={true}
            />

            <ModalDropdownFilter
              label="Status"
              items={statusOptions}
              selectedValue={selectedStatus ? Object.keys(statusMapping).find(key => statusMapping[parseInt(key)] === selectedStatus) || 0 : 0}
              onValueChange={(value) => setSelectedStatus(statusMapping[value as number])}
              compact={true}
            />

            <ModalDropdownFilter
              label="User"
              items={userOptions}
              selectedValue={selectedUser || 0}
              onValueChange={(value) => setSelectedUser(value === 0 ? null : value)}
              loading={usersLoading}
              compact={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBarContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.searchBarInput, { color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="Search submissions..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {submissionsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading submissions...
            </Text>
          </View>
        ) : submissionsError ? (
          renderErrorState()
        ) : (
          <FlatList
            data={submissions}
            renderItem={renderSubmissionCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={submissionsLoading}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchBarInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  submissionCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submissionUser: {
    fontSize: 14,
    marginBottom: 4,
  },
  submissionDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  comments: {
    fontSize: 12,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  fileIndicator: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});