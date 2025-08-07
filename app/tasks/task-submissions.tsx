
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  useTaskSubmissions, 
  useBranches, 
  useAcademicYears,
  useTasks
} from '@/hooks/useApi';

interface TaskSubmission {
  id: number;
  task: number;
  submitted_by: number;
  submitted_at: string;
  submission_notes: string;
  completion_percent: number;
  submission_link: string;
  submitted_by_detail: {
    id: number;
    name: string;
  };
  created_by_detail: {
    id: number;
    name: string;
  };
}

export default function TaskSubmissionsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>();

  // Fetch data
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears();
  const { data: tasks } = useTasks({ 
    branch: selectedBranch, 
    academic_year: selectedAcademicYear 
  });

  const submissionsParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    task: selectedTaskId,
  }), [selectedBranch, selectedAcademicYear, selectedTaskId]);

  const { 
    data: submissions, 
    loading: submissionsLoading, 
    error: submissionsError, 
    refetch: refetchSubmissions 
  } = useTaskSubmissions(submissionsParams);

  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];
    
    return submissions.filter((submission: TaskSubmission) => {
      const matchesSearch = 
        submission.submitted_by_detail.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.created_by_detail.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.submission_notes.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [submissions, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 90) return '#4CAF50';
    if (percentage >= 70) return '#FF9800';
    if (percentage >= 50) return '#2196F3';
    return '#F44336';
  };

  const getTaskTitle = (taskId: number) => {
    const task = tasks?.find((t: any) => t.id === taskId);
    return task?.title || `Task #${taskId}`;
  };

  const renderSubmissionCard = ({ item }: { item: TaskSubmission }) => (
    <View
      style={[
        styles.submissionCard,
        { backgroundColor: colors.surface, borderColor: colors.border }
      ]}
    >
      <View style={styles.submissionHeader}>
        <View style={styles.submissionTitleContainer}>
          <Text style={[styles.taskTitle, { color: colors.textPrimary }]}>
            {getTaskTitle(item.task)}
          </Text>
          <View style={[
            styles.completionBadge,
            { backgroundColor: getCompletionColor(item.completion_percent) }
          ]}>
            <Text style={styles.completionText}>
              {item.completion_percent}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.submissionMeta}>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          👤 Submitted by: {item.submitted_by_detail.name}
        </Text>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          👨‍💼 Created by: {item.created_by_detail.name}
        </Text>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          📅 Submitted: {formatDate(item.submitted_at)}
        </Text>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          🆔 Task ID: {item.task}
        </Text>
      </View>

      {item.submission_notes && (
        <View style={styles.notesContainer}>
          <Text style={[styles.notesLabel, { color: colors.textPrimary }]}>
            Notes:
          </Text>
          <Text style={[styles.notesText, { color: colors.textSecondary }]}>
            {item.submission_notes}
          </Text>
        </View>
      )}

      {item.submission_link && (
        <TouchableOpacity style={styles.linkContainer}>
          <Text style={[styles.linkLabel, { color: colors.textSecondary }]}>
            Submission Link:
          </Text>
          <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>
            {item.submission_link}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.progressContainer}>
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
          Completion Progress
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: getCompletionColor(item.completion_percent),
                width: `${item.completion_percent}%`
              }
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textPrimary }]}>
          {item.completion_percent}% Complete
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Task Submissions"
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
          placeholder="Search submissions..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <ScrollView horizontal style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Branch</Text>
          <TouchableOpacity style={[styles.filterButton, { borderColor: colors.border }]}>
            <Text style={[styles.filterButtonText, { color: colors.textPrimary }]}>
              {branches?.find(b => b.id === selectedBranch)?.name || 'Select Branch'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Academic Year</Text>
          <TouchableOpacity style={[styles.filterButton, { borderColor: colors.border }]}>
            <Text style={[styles.filterButtonText, { color: colors.textPrimary }]}>
              {academicYears?.find(ay => ay.id === selectedAcademicYear)?.name || 'Select Year'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Task</Text>
          <TouchableOpacity style={[styles.filterButton, { borderColor: colors.border }]}>
            <Text style={[styles.filterButtonText, { color: colors.textPrimary }]}>
              {selectedTaskId ? getTaskTitle(selectedTaskId) : 'All Tasks'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Content */}
      {submissionsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading submissions...
          </Text>
        </View>
      ) : submissionsError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Failed to load submissions. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetchSubmissions}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredSubmissions}
          renderItem={renderSubmissionCard}
          keyExtractor={(item) => item.id.toString()}
          style={styles.submissionsList}
          contentContainerStyle={styles.submissionsListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={submissionsLoading}
              onRefresh={refetchSubmissions}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No submissions found
              </Text>
            </View>
          }
        />
      )}
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
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  filterGroup: {
    marginHorizontal: 8,
    minWidth: 120,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButtonText: {
    fontSize: 14,
    textAlign: 'center',
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
  submissionsList: {
    flex: 1,
  },
  submissionsListContent: {
    padding: 16,
  },
  submissionCard: {
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
  submissionHeader: {
    marginBottom: 12,
  },
  submissionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  completionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  submissionMeta: {
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    marginBottom: 4,
  },
  notesContainer: {
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  linkContainer: {
    marginBottom: 12,
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  linkText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
});
