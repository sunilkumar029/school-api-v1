import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ModalDropdownFilter } from '@/components/ModalDropdownFilter';
import { useStandards, useSections, useExamTypes, useStudentMarksTable, useBranches, useAcademicYears } from '@/hooks/useApi';

interface StudentMark {
  id: number;
  student: {
    id: number;
    name: string;
    roll_number?: string;
  };
  subject: {
    id: number;
    name: string;
  };
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  exam_type: string;
  exam_date: string;
}

export default function StudentMarksTableScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null); // Changed to string for section name
  const [selectedExamType, setSelectedExamType] = useState<string | null>(null); // Changed to string for exam type name
  const [searchQuery, setSearchQuery] = useState('');

  const {
    selectedBranch,
    selectedAcademicYear,
    branches,
    academicYears,
    setSelectedBranch,
    setSelectedAcademicYear
  } = useGlobalFilters();

  // Fetch filter data
  const { data: apiStandards } = useStandards({
    branch: selectedBranch,
    academic_year: selectedAcademicYear
  });
  const { data: apiSections } = useSections({
    branch: selectedBranch,
    standard: selectedStandard
  });
  const { data: apiExamTypes } = useExamTypes();

  // Ensure colors object exists with fallback
  const safeColors = colors || {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    primary: '#6200EE',
    textPrimary: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
  };

  const marksParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    ...(selectedStandard && { standard: selectedStandard }),
    ...(selectedSection && { section: selectedSection }),
    ...(selectedExamType && { exam_type: selectedExamType }),
  }), [selectedBranch, selectedAcademicYear, selectedStandard, selectedSection, selectedExamType]);

  const {
    data: studentMarks,
    loading: marksLoading,
    error: marksError,
    refetch: refetchMarks
  } = useStudentMarksTable(marksParams);

  const filteredMarks = useMemo(() => {
    if (!studentMarks || !Array.isArray(studentMarks)) return [];

    return studentMarks.filter((mark: StudentMark) => {
      const matchesSearch = searchQuery === '' ||
        mark.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mark.subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mark.student.roll_number && mark.student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [studentMarks, searchQuery]);

  const groupedMarks = useMemo(() => {
    const grouped: { [key: string]: StudentMark[] } = {};

    filteredMarks.forEach((mark: StudentMark) => {
      const studentKey = `${mark.student.id}-${mark.student.name}`;
      if (!grouped[studentKey]) {
        grouped[studentKey] = [];
      }
      grouped[studentKey].push(mark);
    });

    return grouped;
  }, [filteredMarks]);

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return '#4CAF50'; // A
    if (percentage >= 80) return '#8BC34A'; // B
    if (percentage >= 70) return '#FFC107'; // C
    if (percentage >= 60) return '#FF9800'; // D
    return '#F44336'; // F
  };

  const renderStudentMarks = (studentKey: string, marks: StudentMark[]) => {
    const student = marks[0].student;
    const totalMarksObtained = marks.reduce((sum, mark) => sum + mark.marks_obtained, 0);
    const totalMaxMarks = marks.reduce((sum, mark) => sum + mark.total_marks, 0);
    const overallPercentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;

    return (
      <View key={studentKey} style={[styles.studentCard, { backgroundColor: safeColors.surface, borderColor: safeColors.border }]}>
        <View style={styles.studentHeader}>
          <View style={styles.studentInfo}>
            <Text style={[styles.studentName, { color: safeColors.textPrimary }]}>
              {student.name}
            </Text>
            {student.roll_number && (
              <Text style={[styles.rollNumber, { color: safeColors.textSecondary }]}>
                Roll: {student.roll_number}
              </Text>
            )}
          </View>
          <View style={styles.overallScore}>
            <Text style={[styles.overallPercentage, { color: getGradeColor(overallPercentage) }]}>
              {overallPercentage.toFixed(1)}%
            </Text>
            <Text style={[styles.overallMarks, { color: safeColors.textSecondary }]}>
              {totalMarksObtained}/{totalMaxMarks}
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.marksTable}>
            <View style={[styles.tableHeader, { backgroundColor: safeColors.primary + '20' }]}>
              <Text style={[styles.tableHeaderText, { color: safeColors.primary }]}>Subject</Text>
              <Text style={[styles.tableHeaderText, { color: safeColors.primary }]}>Marks</Text>
              <Text style={[styles.tableHeaderText, { color: safeColors.primary }]}>%</Text>
              <Text style={[styles.tableHeaderText, { color: safeColors.primary }]}>Grade</Text>
              <Text style={[styles.tableHeaderText, { color: safeColors.primary }]}>Exam</Text>
            </View>

            {marks.map((mark, index) => (
              <View key={index} style={[styles.tableRow, { borderBottomColor: safeColors.border }]}>
                <Text style={[styles.tableCell, { color: safeColors.textPrimary }]}>
                  {mark.subject.name}
                </Text>
                <Text style={[styles.tableCell, { color: safeColors.textPrimary }]}>
                  {mark.marks_obtained}/{mark.total_marks}
                </Text>
                <Text style={[styles.tableCell, { color: getGradeColor(mark.percentage) }]}>
                  {mark.percentage.toFixed(1)}%
                </Text>
                <Text style={[styles.tableCell, { color: getGradeColor(mark.percentage) }]}>
                  {mark.grade}
                </Text>
                <Text style={[styles.tableCell, { color: safeColors.textSecondary }]}>
                  {mark.exam_type}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: safeColors.background }]}>
      <TopBar
        title="Student Marks Table"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: safeColors.surface }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: safeColors.background,
              borderColor: safeColors.border,
              color: safeColors.textPrimary,
            },
          ]}
          placeholder="Search by student name, roll number, or subject..."
          placeholderTextColor={safeColors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <GlobalFilters />

      {/* Additional Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: safeColors.surface, borderBottomColor: safeColors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Text style={[styles.filtersLabel, { color: safeColors.textSecondary }]}>Filters:</Text>
            
            {apiStandards && apiStandards.length > 0 && (
              <ModalDropdownFilter
                label="Class"
                items={[{ id: null, name: 'All Classes' }, ...apiStandards.map(s => ({ id: s.id, name: s.name }))]}
                selectedValue={selectedStandard}
                onValueChange={(value) => {
                  setSelectedStandard(value);
                  setSelectedSection(null); // Reset dependent filters
                  setSelectedExamType(null);
                }}
                compact={true}
              />
            )}
            
            {apiSections && apiSections.length > 0 && (
              <ModalDropdownFilter
                label="Section"
                items={[{ id: null, name: 'All Sections' }, ...apiSections.map(s => ({ id: s.id, name: s.name }))]}
                selectedValue={selectedSection}
                onValueChange={(value) => {
                  setSelectedSection(value);
                  setSelectedExamType(null); // Reset dependent filters
                }}
                compact={true}
              />
            )}
            
            {apiExamTypes && apiExamTypes.length > 0 && (
              <ModalDropdownFilter
                label="Exam Type"
                items={[{ id: null, name: 'All Exam Types' }, ...apiExamTypes.map(et => ({ id: et.name, name: et.name }))]}
                selectedValue={selectedExamType}
                onValueChange={(value) => {
                  setSelectedExamType(value);
                }}
                compact={true}
              />
            )}
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      {marksLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={safeColors.primary} />
          <Text style={[styles.loadingText, { color: safeColors.textSecondary }]}>
            Loading student marks...
          </Text>
        </View>
      ) : marksError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Failed to load student marks. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetchMarks}
            style={[styles.retryButton, { backgroundColor: safeColors.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={marksLoading}
              onRefresh={refetchMarks}
              colors={[safeColors.primary]}
              tintColor={safeColors.primary}
            />
          }
        >
          {Object.keys(groupedMarks).length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: safeColors.textSecondary }]}>
                No student marks found for the selected criteria
              </Text>
            </View>
          ) : (
            <View style={styles.marksContainer}>
              {Object.entries(groupedMarks).map(([studentKey, marks]) =>
                renderStudentMarks(studentKey, marks)
              )}
            </View>
          )}
        </ScrollView>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  filtersScroll: {
    flexDirection: 'row',
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
  filterButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 70,
  },
  filterText: {
    fontSize: 12,
    textAlign: 'center',
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
  content: {
    flex: 1,
  },
  marksContainer: {
    padding: 16,
  },
  studentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rollNumber: {
    fontSize: 14,
  },
  overallScore: {
    alignItems: 'flex-end',
  },
  overallPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  overallMarks: {
    fontSize: 12,
  },
  marksTable: {
    minWidth: 600,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
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