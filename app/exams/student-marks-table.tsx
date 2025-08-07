import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  useStudentExamMarks,
  useExamTypes, 
  useBranches, 
  useAcademicYears,
  useStandards,
  useSections
} from '@/hooks/useApi';

interface StudentMark {
  id: number;
  student: {
    id: number;
    first_name: string;
    last_name: string;
    roll_number?: string;
  };
  exam_schedule: {
    department: {
      name: string;
    };
    marks: number;
  };
  obtained_marks: number;
  percentage: number;
}

export default function StudentMarksTableScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [selectedStandard, setSelectedStandard] = useState<number | undefined>();
  const [selectedSection, setSelectedSection] = useState<number | undefined>();
  const [selectedExamType, setSelectedExamType] = useState<number | undefined>();

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

  const marksParams = useMemo(() => {
    const params: any = {
      branch_id: selectedBranch,
      academic_year_id: selectedAcademicYear,
    };
    if (selectedStandard) params.standard_id = selectedStandard;
    if (selectedSection) params.section_id = selectedSection;
    if (selectedExamType) params.exam_type_id = selectedExamType;
    return params;
  }, [selectedBranch, selectedAcademicYear, selectedStandard, selectedSection, selectedExamType]);

  const { 
    data: marks, 
    loading: marksLoading, 
    error: marksError, 
    refetch: refetchMarks 
  } = useStudentExamMarks(marksParams);

  // Group marks by student
  const studentMarks = useMemo(() => {
    if (!marks) return [];

    const studentMap = new Map();

    marks.forEach((mark: StudentMark) => {
      const studentId = mark.student.id;
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student: mark.student,
          subjects: [],
          totalMarks: 0,
          totalMaxMarks: 0,
        });
      }

      const studentData = studentMap.get(studentId);
      studentData.subjects.push({
        subject: mark.exam_schedule.department.name,
        obtainedMarks: mark.obtained_marks,
        maxMarks: mark.exam_schedule.marks,
        percentage: mark.percentage,
      });
      studentData.totalMarks += mark.obtained_marks;
      studentData.totalMaxMarks += mark.exam_schedule.marks;
    });

    return Array.from(studentMap.values()).map(student => ({
      ...student,
      overallPercentage: student.totalMaxMarks > 0 ? (student.totalMarks / student.totalMaxMarks) * 100 : 0,
    }));
  }, [marks]);

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return '#4CAF50';
    if (percentage >= 75) return '#8BC34A';
    if (percentage >= 60) return '#FF9800';
    if (percentage >= 40) return '#FF5722';
    return '#F44336';
  };

  const renderStudentRow = ({ item }: { item: any }) => (
    <View style={[styles.studentRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.studentInfo}>
        <Text style={[styles.studentName, { color: colors.textPrimary }]}>
          {item.student.first_name} {item.student.last_name}
        </Text>
        {item.student.roll_number && (
          <Text style={[styles.rollNumber, { color: colors.textSecondary }]}>
            Roll: {item.student.roll_number}
          </Text>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectsScroll}>
        {item.subjects.map((subject: any, index: number) => (
          <View key={index} style={[styles.subjectCell, { backgroundColor: colors.background }]}>
            <Text style={[styles.subjectName, { color: colors.textSecondary }]}>
              {subject.subject}
            </Text>
            <Text style={[styles.subjectMarks, { color: colors.textPrimary }]}>
              {subject.obtainedMarks}/{subject.maxMarks}
            </Text>
            <View style={[
              styles.percentageBadge,
              { backgroundColor: getGradeColor(subject.percentage) }
            ]}>
              <Text style={styles.percentageText}>
                {subject.percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.totalCell, { backgroundColor: colors.background }]}>
        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
        <Text style={[styles.totalMarks, { color: colors.textPrimary }]}>
          {item.totalMarks}/{item.totalMaxMarks}
        </Text>
        <View style={[
          styles.overallBadge,
          { backgroundColor: getGradeColor(item.overallPercentage) }
        ]}>
          <Text style={styles.overallText}>
            {item.overallPercentage.toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Student Marks"
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
              {selectedSection ? sections?.find(s => s.id === selectedSection)?.name : 'Section'}
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
      {marksLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading marks...
          </Text>
        </View>
      ) : marksError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Failed to load marks. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetchMarks}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={studentMarks}
          renderItem={renderStudentRow}
          keyExtractor={(item) => item.student.id.toString()}
          style={styles.marksList}
          contentContainerStyle={styles.marksListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={marksLoading}
              onRefresh={refetchMarks}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No marks found for the selected criteria
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
  filtersContainer: {
    paddingVertical: 8, // Reduced padding
    paddingHorizontal: 8,
    flexDirection: 'row', // Changed to row for horizontal scrolling
    alignItems: 'center',
  },
  filtersContent: {
    paddingHorizontal: 4, // Added padding for scroll view content
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
  compactFilterButton: {
    borderWidth: 1,
    borderRadius: 20, // Rounded corners for compact buttons
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4, // Space between compact buttons
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactFilterText: {
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
  marksList: {
    flex: 1,
  },
  marksListContent: {
    padding: 16,
  },
  studentRow: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  studentInfo: {
    width: 120,
    marginRight: 16,
  },
  studentName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rollNumber: {
    fontSize: 12,
  },
  subjectsScroll: {
    flex: 1,
    marginRight: 16,
  },
  subjectCell: {
    width: 100,
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  subjectName: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 4,
  },
  subjectMarks: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  percentageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  percentageText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalCell: {
    width: 80,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  totalMarks: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  overallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  overallText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
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