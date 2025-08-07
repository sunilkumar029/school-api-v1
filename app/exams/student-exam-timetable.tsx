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
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  useExams, 
  useExamTypes, 
  useBranches, 
  useAcademicYears,
  useStandards,
  useSections,
  useExamScheduleDetails
} from '@/hooks/useApi';

interface ExamSchedule {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_online: boolean;
  standard: any;
  exam_schedules: Array<{
    id: number;
    start_time: string;
    end_time: string;
    department: {
      name: string;
    };
    marks: number;
  }>;
}

export default function StudentExamTimetableScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [selectedStandard, setSelectedStandard] = useState<number | undefined>();
  const [selectedSection, setSelectedSection] = useState<number | undefined>();
  const [selectedExamType, setSelectedExamType] = useState<number | undefined>();
  const [selectedExam, setSelectedExam] = useState<ExamSchedule | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch data
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears();
  const { data: examTypes } = useExamTypes();

  const standardsParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    is_active: true,
  }), [selectedBranch, selectedAcademicYear]);

  const { data: standards } = useStandards(standardsParams);

  const sectionsParams = useMemo(() => ({
    branch: selectedBranch,
    standard: selectedStandard,
  }), [selectedBranch, selectedStandard]);

  const { data: sections } = useSections(sectionsParams);

  const examsParams = useMemo(() => {
    const params: any = {
      branch: selectedBranch,
      academic_year: selectedAcademicYear,
    };
    if (selectedStandard) params.standard = selectedStandard;
    if (selectedExamType) params.exam_types = selectedExamType;
    return params;
  }, [selectedBranch, selectedAcademicYear, selectedStandard, selectedExamType]);

  const { 
    data: exams, 
    loading: examsLoading, 
    error: examsError, 
    refetch: refetchExams 
  } = useExams(examsParams);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExamPress = (exam: ExamSchedule) => {
    setSelectedExam(exam);
    setModalVisible(true);
  };

  const renderExamCard = ({ item }: { item: ExamSchedule }) => (
    <TouchableOpacity
      style={[styles.examCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleExamPress(item)}
    >
      <View style={styles.examHeader}>
        <Text style={[styles.examName, { color: colors.textPrimary }]}>{item.name}</Text>
        <View style={[
          styles.modeBadge,
          { backgroundColor: item.is_online ? '#4CAF50' : '#FF9800' }
        ]}>
          <Text style={styles.modeText}>
            {item.is_online ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <Text style={[styles.examDate, { color: colors.textSecondary }]}>
        📅 {formatDate(item.start_date)} - {formatDate(item.end_date)}
      </Text>

      <Text style={[styles.standard, { color: colors.textSecondary }]}>
        🎓 {item.standard?.name}
      </Text>

      <View style={styles.schedulePreview}>
        <Text style={[styles.scheduleTitle, { color: colors.textPrimary }]}>
          Subjects ({item.exam_schedules.length}):
        </Text>
        <View style={styles.subjectsList}>
          {item.exam_schedules.slice(0, 3).map((schedule, index) => (
            <Text key={index} style={[styles.subjectName, { color: colors.primary }]}>
              {schedule.department.name}
            </Text>
          ))}
          {item.exam_schedules.length > 3 && (
            <Text style={[styles.moreSubjects, { color: colors.textSecondary }]}>
              +{item.exam_schedules.length - 3} more
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderExamModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {selectedExam?.name}
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedExam && (
            <ScrollView style={styles.modalBody}>
              <View style={styles.examInfo}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Duration:</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {formatDate(selectedExam.start_date)} - {formatDate(selectedExam.end_date)}
                </Text>
              </View>

              <View style={styles.examInfo}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Mode:</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {selectedExam.is_online ? 'Online' : 'Offline'}
                </Text>
              </View>

              <View style={styles.examInfo}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Standard:</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {selectedExam.standard?.name}
                </Text>
              </View>

              <Text style={[styles.scheduleHeader, { color: colors.textPrimary }]}>
                Exam Schedule:
              </Text>

              {selectedExam.exam_schedules.map((schedule, index) => (
                <View key={index} style={[styles.scheduleItem, { backgroundColor: colors.background }]}>
                  <Text style={[styles.subjectTitle, { color: colors.textPrimary }]}>
                    {schedule.department.name}
                  </Text>
                  <Text style={[styles.scheduleTime, { color: colors.textSecondary }]}>
                    🕒 {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                  </Text>
                  <Text style={[styles.scheduleMarks, { color: colors.primary }]}>
                    Max Marks: {schedule.marks}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Exam Timetable"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Compact Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          <TouchableOpacity style={[styles.compactFilterButton, { borderColor: colors.border }]}>
            <Text style={[styles.compactFilterText, { color: colors.textPrimary }]}>
              {branches?.find(b => b.id === selectedBranch)?.name || 'Branch'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.compactFilterButton, { borderColor: colors.border }]}>
            <Text style={[styles.compactFilterText, { color: colors.textPrimary }]}>
              {academicYears?.find(ay => ay.id === selectedAcademicYear)?.name || 'Year'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.compactFilterButton, { borderColor: colors.border }]}>
            <Text style={[styles.compactFilterText, { color: colors.textPrimary }]}>
              {selectedStandard ? standards?.find(s => s.id === selectedStandard)?.name : 'Standard'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.compactFilterButton, { borderColor: colors.border }]}>
            <Text style={[styles.compactFilterText, { color: colors.textPrimary }]}>
              {selectedExamType ? examTypes?.find(et => et.id === selectedExamType)?.name : 'Exam Type'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      {examsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading exams...
          </Text>
        </View>
      ) : examsError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Failed to load exams. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetchExams}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={exams || []}
          renderItem={renderExamCard}
          keyExtractor={(item) => item.id.toString()}
          style={styles.examsList}
          contentContainerStyle={styles.examsListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={examsLoading}
              onRefresh={refetchExams}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No exams found for the selected criteria
              </Text>
            </View>
          }
        />
      )}

      {renderExamModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: 8, // Reduced padding
    paddingHorizontal: 8,
  },
  filtersContent: { // New style for ScrollView content
    paddingHorizontal: 4,
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
  compactFilterButton: { // New style for compact filters
    borderWidth: 1,
    borderRadius: 20, // More rounded
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4, // Spacing between compact filters
    backgroundColor: 'white', // Default background, will be overridden by theme
  },
  compactFilterText: { // New style for compact filter text
    fontSize: 14,
    fontWeight: '500',
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
  examsList: {
    flex: 1,
  },
  examsListContent: {
    padding: 16,
  },
  examCard: {
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
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  examName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  modeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  examDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  standard: {
    fontSize: 14,
    marginBottom: 12,
  },
  schedulePreview: {
    marginTop: 8,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  subjectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectName: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreSubjects: {
    fontSize: 12,
    fontStyle: 'italic',
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
  examInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  scheduleHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  scheduleItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  scheduleMarks: {
    fontSize: 14,
    fontWeight: '600',
  },
});