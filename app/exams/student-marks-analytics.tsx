
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
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
  useStudentMarksAnalytics, 
  useSubjects,
  useClasses,
  useExams
} from '@/hooks/useApi';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  subject_wise: {
    subject: string;
    average_marks: number;
    highest_marks: number;
    lowest_marks: number;
    pass_percentage: number;
    students_count: number;
  }[];
  class_wise: {
    class_name: string;
    average_marks: number;
    total_students: number;
    passed_students: number;
    failed_students: number;
  }[];
  overall_stats: {
    total_students: number;
    overall_average: number;
    overall_pass_percentage: number;
    grade_distribution: {
      grade: string;
      count: number;
      percentage: number;
    }[];
  };
}

export default function StudentMarksAnalyticsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'subject' | 'class' | 'overall'>('overall');

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
  const { data: subjects = [], loading: subjectsLoading } = useSubjects({ 
    branch: selectedBranch,
    academic_year: selectedAcademicYear 
  });

  const { data: classes = [], loading: classesLoading } = useClasses({
    branch: selectedBranch,
    academic_year: selectedAcademicYear
  });

  const { data: exams = [], loading: examsLoading } = useExams({
    branch: selectedBranch,
    academic_year: selectedAcademicYear
  });

  const analyticsParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    subject: selectedSubject,
    class: selectedClass,
    exam: selectedExam,
  }), [selectedBranch, selectedAcademicYear, selectedSubject, selectedClass, selectedExam]);

  const { 
    data: analyticsData, 
    loading: analyticsLoading, 
    error: analyticsError,
    refetch: refetchAnalytics
  } = useStudentMarksAnalytics(analyticsParams);

  // Filter options
  const subjectOptions = useMemo(() => [
    { id: 0, name: 'All Subjects' },
    ...(subjects || []).map((subject: any) => ({
      id: subject.id,
      name: subject.name || 'Unnamed Subject'
    }))
  ], [subjects]);

  const classOptions = useMemo(() => [
    { id: 0, name: 'All Classes' },
    ...(classes || []).map((cls: any) => ({
      id: cls.id,
      name: cls.name || 'Unnamed Class'
    }))
  ], [classes]);

  const examOptions = useMemo(() => [
    { id: 0, name: 'All Exams' },
    ...(exams || []).map((exam: any) => ({
      id: exam.id,
      name: exam.name || 'Unnamed Exam'
    }))
  ], [exams]);

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case 'A': case 'A+': return colors.success || '#10b981';
      case 'B': case 'B+': return colors.info || '#3b82f6';
      case 'C': case 'C+': return colors.warning || '#f59e0b';
      case 'D': case 'F': return colors.error || '#ef4444';
      default: return colors.textSecondary || '#6b7280';
    }
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return colors.success || '#10b981';
    if (percentage >= 60) return colors.info || '#3b82f6';
    if (percentage >= 40) return colors.warning || '#f59e0b';
    return colors.error || '#ef4444';
  };

  const handleRefresh = () => {
    refetchAnalytics();
  };

  const renderViewModeToggle = () => (
    <View style={[styles.viewModeContainer, { backgroundColor: colors.surface }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.viewModeToggle}>
          {[
            { key: 'overall', label: 'Overall' },
            { key: 'subject', label: 'By Subject' },
            { key: 'class', label: 'By Class' }
          ].map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.viewModeButton,
                { 
                  backgroundColor: viewMode === mode.key ? colors.primary : 'transparent',
                  borderColor: colors.border
                }
              ]}
              onPress={() => setViewMode(mode.key as 'subject' | 'class' | 'overall')}
            >
              <Text style={[
                styles.viewModeText,
                { color: viewMode === mode.key ? colors.surface : colors.textPrimary }
              ]}>
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderOverallStats = () => {
    if (!analyticsData?.overall_stats) return null;

    const stats = analyticsData.overall_stats;

    return (
      <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Overall Performance</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {stats.total_students || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Students</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.info }]}>
              {(stats.overall_average || 0).toFixed(1)}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average Marks</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: getPerformanceColor(stats.overall_pass_percentage || 0) }]}>
              {(stats.overall_pass_percentage || 0).toFixed(1)}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pass Rate</Text>
          </View>
        </View>

        {stats.grade_distribution && stats.grade_distribution.length > 0 && (
          <View style={styles.gradeDistribution}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Grade Distribution</Text>
            {stats.grade_distribution.map((grade, index) => (
              <View key={index} style={styles.gradeItem}>
                <View style={styles.gradeInfo}>
                  <Text style={[styles.gradeName, { color: getGradeColor(grade.grade) }]}>
                    Grade {grade.grade}
                  </Text>
                  <Text style={[styles.gradeCount, { color: colors.textSecondary }]}>
                    {grade.count} students ({grade.percentage.toFixed(1)}%)
                  </Text>
                </View>
                <View style={[styles.gradeBar, { backgroundColor: colors.background }]}>
                  <View 
                    style={[
                      styles.gradeBarFill, 
                      { 
                        width: `${grade.percentage}%`,
                        backgroundColor: getGradeColor(grade.grade)
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderSubjectAnalytics = () => {
    if (!analyticsData?.subject_wise || analyticsData.subject_wise.length === 0) {
      return (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No subject-wise data available
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.analyticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Subject-wise Performance</Text>
        
        {analyticsData.subject_wise.map((subject, index) => (
          <View key={index} style={[styles.subjectItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.subjectName, { color: colors.primary }]}>
              {subject.subject}
            </Text>
            
            <View style={styles.subjectStats}>
              <View style={styles.subjectStatRow}>
                <Text style={[styles.subjectStatLabel, { color: colors.textSecondary }]}>Average:</Text>
                <Text style={[styles.subjectStatValue, { color: colors.textPrimary }]}>
                  {subject.average_marks.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.subjectStatRow}>
                <Text style={[styles.subjectStatLabel, { color: colors.textSecondary }]}>Highest:</Text>
                <Text style={[styles.subjectStatValue, { color: colors.success }]}>
                  {subject.highest_marks}%
                </Text>
              </View>
              
              <View style={styles.subjectStatRow}>
                <Text style={[styles.subjectStatLabel, { color: colors.textSecondary }]}>Lowest:</Text>
                <Text style={[styles.subjectStatValue, { color: colors.error }]}>
                  {subject.lowest_marks}%
                </Text>
              </View>
              
              <View style={styles.subjectStatRow}>
                <Text style={[styles.subjectStatLabel, { color: colors.textSecondary }]}>Pass Rate:</Text>
                <Text style={[styles.subjectStatValue, { color: getPerformanceColor(subject.pass_percentage) }]}>
                  {subject.pass_percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderClassAnalytics = () => {
    if (!analyticsData?.class_wise || analyticsData.class_wise.length === 0) {
      return (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No class-wise data available
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.analyticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Class-wise Performance</Text>
        
        {analyticsData.class_wise.map((classData, index) => (
          <View key={index} style={[styles.classItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.className, { color: colors.primary }]}>
              {classData.class_name}
            </Text>
            
            <View style={styles.classStats}>
              <View style={styles.classStatRow}>
                <Text style={[styles.classStatLabel, { color: colors.textSecondary }]}>Total Students:</Text>
                <Text style={[styles.classStatValue, { color: colors.textPrimary }]}>
                  {classData.total_students}
                </Text>
              </View>
              
              <View style={styles.classStatRow}>
                <Text style={[styles.classStatLabel, { color: colors.textSecondary }]}>Average Marks:</Text>
                <Text style={[styles.classStatValue, { color: colors.info }]}>
                  {classData.average_marks.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.classStatRow}>
                <Text style={[styles.classStatLabel, { color: colors.textSecondary }]}>Passed:</Text>
                <Text style={[styles.classStatValue, { color: colors.success }]}>
                  {classData.passed_students}
                </Text>
              </View>
              
              <View style={styles.classStatRow}>
                <Text style={[styles.classStatLabel, { color: colors.textSecondary }]}>Failed:</Text>
                <Text style={[styles.classStatValue, { color: colors.error }]}>
                  {classData.failed_students}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={[styles.errorTitle, { color: colors.error }]}>
        Unable to Load Analytics
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
          title="Student Marks Analytics"
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
        title="Student Marks Analytics"
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
              label="Subject"
              items={subjectOptions}
              selectedValue={selectedSubject || 0}
              onValueChange={(value) => setSelectedSubject(value === 0 ? null : value)}
              loading={subjectsLoading}
              compact={true}
            />
            
            <ModalDropdownFilter
              label="Class"
              items={classOptions}
              selectedValue={selectedClass || 0}
              onValueChange={(value) => setSelectedClass(value === 0 ? null : value)}
              loading={classesLoading}
              compact={true}
            />
            
            <ModalDropdownFilter
              label="Exam"
              items={examOptions}
              selectedValue={selectedExam || 0}
              onValueChange={(value) => setSelectedExam(value === 0 ? null : value)}
              loading={examsLoading}
              compact={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* View Mode Toggle */}
      {renderViewModeToggle()}

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={analyticsLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {analyticsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading analytics...
            </Text>
          </View>
        ) : analyticsError ? (
          renderErrorState()
        ) : (
          <View style={styles.analyticsContent}>
            {viewMode === 'overall' && renderOverallStats()}
            {viewMode === 'subject' && renderSubjectAnalytics()}
            {viewMode === 'class' && renderClassAnalytics()}
          </View>
        )}
      </ScrollView>

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
  viewModeContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  viewModeToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  analyticsContent: {
    padding: 16,
  },
  statsCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  analyticsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  gradeDistribution: {
    marginTop: 16,
  },
  gradeItem: {
    marginBottom: 12,
  },
  gradeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gradeName: {
    fontSize: 14,
    fontWeight: '600',
  },
  gradeCount: {
    fontSize: 14,
  },
  gradeBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  gradeBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  subjectItem: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  subjectStats: {
    gap: 4,
  },
  subjectStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subjectStatLabel: {
    fontSize: 14,
  },
  subjectStatValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  classItem: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  classStats: {
    gap: 4,
  },
  classStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  classStatLabel: {
    fontSize: 14,
  },
  classStatValue: {
    fontSize: 14,
    fontWeight: '600',
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
