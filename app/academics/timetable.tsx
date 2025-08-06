
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  useTeacherTimetable, 
  useBranches, 
  useAcademicYears, 
  useDepartments,
  useSections,
  useAllUsers,
  usePeriods
} from '@/hooks/useApi';
import { Picker } from '@react-native-picker/picker';

interface TimetableEntry {
  teacher: {
    first_name: string;
    last_name: string;
    id: number;
  };
  section: {
    name: string;
    standard: {
      name: string;
    };
  };
  department: {
    name: string;
  };
  period_number: number;
  day: string;
}

interface TeacherTimetableData {
  [teacherKey: string]: {
    [day: string]: TimetableEntry[];
  };
}

export default function TimetableScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeView, setActiveView] = useState<'teacher' | 'section'>('teacher');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<number | null>(1); // Default to branch 1
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All Departments');
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [selectedStandard, setSelectedStandard] = useState<string>('All Standards');
  const [selectedSection, setSelectedSection] = useState<number | null>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const departments = [
    'All Departments', 'Computers', 'Telugu', 'Hindi', 'Science2', 
    'Science', 'Mathematics', 'English', 'Telugu2', 'Chemistry', 'Social'
  ];

  // Fetch data
  const { data: branches, loading: branchesLoading } = useBranches({ is_active: true });
  const { data: academicYears, loading: academicYearsLoading } = useAcademicYears();
  
  // Teacher timetable params
  const teacherTimetableParams = useMemo(() => {
    const params: any = {};
    if (selectedBranch) params.branch = selectedBranch;
    return params;
  }, [selectedBranch]);

  const { 
    data: teacherTimetableData, 
    loading: teacherTimetableLoading, 
    error: teacherTimetableError,
    refetch: refetchTeacherTimetable 
  } = useTeacherTimetable(teacherTimetableParams);

  // Section timetable params
  const sectionParams = useMemo(() => {
    const params: any = {};
    if (selectedBranch) params.branch = selectedBranch;
    return params;
  }, [selectedBranch]);

  const { data: sections, loading: sectionsLoading } = useSections(sectionParams);

  // Period params for section view
  const periodParams = useMemo(() => {
    const params: any = {};
    if (selectedBranch) params.section__standard__branch = selectedBranch;
    if (selectedSection) params.section = selectedSection;
    if (selectedDay) params.day = selectedDay;
    return params;
  }, [selectedBranch, selectedSection, selectedDay]);

  const { data: periods, loading: periodsLoading } = usePeriods(periodParams);

  // Get unique standards from sections
  const standards = useMemo(() => {
    if (!sections) return ['All Standards'];
    const uniqueStandards = [...new Set(sections.map((section: any) => section.standard.name))];
    return ['All Standards', ...uniqueStandards];
  }, [sections]);

  // Get sections for selected standard
  const filteredSections = useMemo(() => {
    if (!sections) return [];
    if (selectedStandard === 'All Standards') return sections;
    return sections.filter((section: any) => section.standard.name === selectedStandard);
  }, [sections, selectedStandard]);

  const handleRefreshAll = useCallback(() => {
    refetchTeacherTimetable();
  }, [refetchTeacherTimetable]);

  // Filter teacher timetable data
  const filteredTeacherData = useMemo(() => {
    if (!teacherTimetableData) return {};

    let filtered = { ...teacherTimetableData };

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = Object.keys(filtered).reduce((acc, teacherKey) => {
        if (teacherKey.toLowerCase().includes(searchLower)) {
          acc[teacherKey] = filtered[teacherKey];
        }
        return acc;
      }, {} as any);
    }

    // Filter by department
    if (selectedDepartment !== 'All Departments') {
      filtered = Object.keys(filtered).reduce((acc, teacherKey) => {
        const dayData = filtered[teacherKey];
        if (dayData && dayData[selectedDay] && dayData[selectedDay].length > 0) {
          const hasDepartment = dayData[selectedDay].some((entry: TimetableEntry) => 
            entry.department.name.toLowerCase() === selectedDepartment.toLowerCase()
          );
          if (hasDepartment) {
            acc[teacherKey] = dayData;
          }
        }
        return acc;
      }, {} as any);
    }

    return filtered;
  }, [teacherTimetableData, searchQuery, selectedDepartment, selectedDay]);

  const renderTeacherFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
      {/* Search Bar */}
      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.textPrimary,
          },
        ]}
        placeholder="Search teacher name..."
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Filters Row */}
      <View style={styles.filtersRow}>
        {/* Department Dropdown */}
        <View style={styles.filterItem}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
            Department:
          </Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={selectedDepartment}
              onValueChange={setSelectedDepartment}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={colors.textSecondary}
            >
              {departments.map((dept) => (
                <Picker.Item key={dept} label={dept} value={dept} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Day Selector */}
        <View style={styles.filterItem}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
            Day:
          </Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={selectedDay}
              onValueChange={setSelectedDay}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={colors.textSecondary}
            >
              {days.map((day) => (
                <Picker.Item key={day} label={day} value={day} />
              ))}
            </Picker>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSectionFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
      {/* Common filters */}
      <View style={styles.filtersRow}>
        {/* Academic Year */}
        <View style={styles.filterItem}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
            Academic Year:
          </Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={selectedAcademicYear}
              onValueChange={setSelectedAcademicYear}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={colors.textSecondary}
            >
              <Picker.Item label="All Years" value={null} />
              {academicYears?.map((year: any) => (
                <Picker.Item key={year.id} label={year.year} value={year.id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Branch */}
        <View style={styles.filterItem}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
            Branch:
          </Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={selectedBranch}
              onValueChange={setSelectedBranch}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={colors.textSecondary}
            >
              {branches?.map((branch: any) => (
                <Picker.Item key={branch.id} label={branch.name} value={branch.id} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Section specific filters */}
      <View style={styles.filtersRow}>
        {/* Standard */}
        <View style={styles.filterItem}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
            Standard:
          </Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={selectedStandard}
              onValueChange={setSelectedStandard}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={colors.textSecondary}
            >
              {standards.map((standard) => (
                <Picker.Item key={standard} label={standard} value={standard} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Section */}
        <View style={styles.filterItem}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
            Section:
          </Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={selectedSection}
              onValueChange={setSelectedSection}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={colors.textSecondary}
            >
              <Picker.Item label="Select Section" value={null} />
              {filteredSections.map((section: any) => (
                <Picker.Item 
                  key={section.id} 
                  label={`${section.name} (${section.standard.name})`} 
                  value={section.id} 
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTeacherTimetable = () => {
    if (teacherTimetableLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading teacher timetable...
          </Text>
        </View>
      );
    }

    if (teacherTimetableError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#F44336' }]}>
            {teacherTimetableError}
          </Text>
          <TouchableOpacity
            onPress={handleRefreshAll}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const teacherKeys = Object.keys(filteredTeacherData);

    if (teacherKeys.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No teachers found for the selected criteria
          </Text>
        </View>
      );
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.timetableContainer}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={[styles.teacherNameHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.headerText, { color: colors.textPrimary }]}>Teacher</Text>
            </View>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
              <View key={period} style={[styles.periodHeader, { backgroundColor: colors.background }]}>
                <Text style={[styles.headerText, { color: colors.textPrimary }]}>Period {period}</Text>
              </View>
            ))}
          </View>

          {/* Teacher Rows */}
          {teacherKeys.map(teacherKey => {
            const dayData = filteredTeacherData[teacherKey][selectedDay] || [];
            
            return (
              <View key={teacherKey} style={styles.teacherRow}>
                <View style={[styles.teacherNameCell, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.teacherNameText, { color: colors.textPrimary }]} numberOfLines={2}>
                    {teacherKey}
                  </Text>
                </View>
                
                {[1, 2, 3, 4, 5, 6, 7, 8].map(periodNum => {
                  const periodData = dayData.find((entry: TimetableEntry) => entry.period_number === periodNum);
                  
                  return (
                    <View key={periodNum} style={[
                      styles.periodCell,
                      { 
                        backgroundColor: periodData ? colors.primary + '20' : colors.surface,
                        borderColor: colors.border 
                      }
                    ]}>
                      {periodData ? (
                        <View style={styles.periodContent}>
                          <Text style={[styles.subjectText, { color: colors.textPrimary }]} numberOfLines={1}>
                            {periodData.department.name}
                          </Text>
                          <Text style={[styles.sectionText, { color: colors.textSecondary }]} numberOfLines={1}>
                            {periodData.section.standard.name} {periodData.section.name}
                          </Text>
                        </View>
                      ) : (
                        <Text style={[styles.emptyPeriod, { color: colors.textSecondary }]}>Free</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderSectionTimetable = () => {
    if (periodsLoading || sectionsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading section timetable...
          </Text>
        </View>
      );
    }

    if (!selectedSection) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Please select a section to view timetable
          </Text>
        </View>
      );
    }

    if (!periods || periods.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No timetable found for selected section
          </Text>
        </View>
      );
    }

    // Group periods by period number
    const groupedPeriods = periods.reduce((acc: any, period: any) => {
      if (!acc[period.period_number]) {
        acc[period.period_number] = [];
      }
      acc[period.period_number].push(period);
      return acc;
    }, {});

    const periodNumbers = Object.keys(groupedPeriods).sort((a, b) => parseInt(a) - parseInt(b));

    return (
      <View style={styles.sectionTimetableContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Section Timetable - {selectedDay}
        </Text>
        
        {periodNumbers.map(periodNum => {
          const periodsInSlot = groupedPeriods[periodNum];
          
          return (
            <View key={periodNum} style={[styles.periodSlot, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.periodSlotHeader}>
                <Text style={[styles.periodSlotTitle, { color: colors.primary }]}>
                  Period {periodNum}
                </Text>
              </View>
              
              {periodsInSlot.map((period: any, index: number) => (
                <View key={index} style={styles.periodSlotContent}>
                  <Text style={[styles.subjectText, { color: colors.textPrimary }]}>
                    {period.department_name}
                  </Text>
                  <Text style={[styles.teacherText, { color: colors.textSecondary }]}>
                    Teacher: {period.teacher_name}
                  </Text>
                  <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                    Section: {period.section_name}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  const isLoading = branchesLoading || academicYearsLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Timetable"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* View Toggle */}
      <View style={[styles.viewToggle, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeView === 'teacher' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveView('teacher')}
        >
          <Text
            style={[
              styles.toggleText,
              { color: activeView === 'teacher' ? colors.primary : colors.textSecondary },
            ]}
          >
            Teacher-Based View
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeView === 'section' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveView('section')}
        >
          <Text
            style={[
              styles.toggleText,
              { color: activeView === 'section' ? colors.primary : colors.textSecondary },
            ]}
          >
            Section-Based View
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {activeView === 'teacher' ? renderTeacherFilters() : renderSectionFilters()}

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefreshAll}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {activeView === 'teacher' ? renderTeacherTimetable() : renderSectionTimetable()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewToggle: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filtersContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    margin: 16,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  timetableContainer: {
    minWidth: 800,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  teacherNameHeader: {
    width: 150,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 2,
  },
  periodHeader: {
    width: 120,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 2,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  teacherRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  teacherNameCell: {
    width: 150,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 2,
    padding: 8,
  },
  teacherNameText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  periodCell: {
    width: 120,
    height: 80,
    borderRadius: 4,
    marginRight: 2,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  periodContent: {
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  sectionText: {
    fontSize: 9,
    textAlign: 'center',
  },
  teacherText: {
    fontSize: 9,
    textAlign: 'center',
  },
  emptyPeriod: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  sectionTimetableContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  periodSlot: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  periodSlotHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  periodSlotTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  periodSlotContent: {
    padding: 12,
  },
});
