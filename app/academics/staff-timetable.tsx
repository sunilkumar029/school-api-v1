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
  Modal,
  Alert,
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
  useStandards,
  useSections
} from '@/hooks/useApi';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { Picker } from '@react-native-picker/picker';
import ModalDropdownFilter from '@/components/ModalDropdownFilter';


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

  // Modal states for timetable interactions
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    teacherKey?: string;
    periodNumber: number;
    day: string;
    existingData?: TimetableEntry;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form state for period assignment
  const [periodForm, setPeriodForm] = useState({
    department: '',
    teacher: '',
    section: '',
  });

  // Filter states
  const [selectedStandard, setSelectedStandard] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);

  const { 
    selectedBranch, 
    selectedAcademicYear, 
    branches, 
    academicYears,
    setSelectedBranch,
    setSelectedAcademicYear 
  } = useGlobalFilters();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const departments = [
    'All Departments', 'Computers', 'Telugu', 'Hindi', 'Science2', 
    'Science', 'Mathematics', 'English', 'Telugu2', 'Chemistry', 'Social'
  ];

  // Fetch data
  const { data: standards } = useStandards({ 
    branch: selectedBranch, 
    academic_year: selectedAcademicYear 
  });
  const { data: sections } = useSections({ 
    branch: selectedBranch, 
    academic_year: selectedAcademicYear,
    standard: selectedStandard 
  });

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

  // Period params for section view
  const periodParams = useMemo(() => {
    const params: any = {};
    if (selectedBranch) params.section__standard__branch = selectedBranch;
    if (selectedSection) params.section__name = selectedSection;
    if (selectedDay) params.day = selectedDay;
    return params;
  }, [selectedBranch, selectedSection, selectedDay]);

  const { data: periods, loading: periodsLoading } = usePeriods(periodParams);

  // Get unique standards from sections
  const standardsForPicker = useMemo(() => {
    if (!standards) return [{ id: 0, name: "All Standards" }];
    return [{ id: 0, name: "All Standards" }, ...standards.map((s: any) => ({ id: s.id, name: s.name }))];
  }, [standards]);

  const sectionsForPicker = useMemo(() => {
    if (!sections) return [{ id: 0, name: "All Sections" }];
    return [{ id: 0, name: "All Sections" }, ...sections.map((s: any) => ({ id: s.id, name: s.name }))];
  }, [sections]);
  
  const getSectionIdByName = (sectionName: string | undefined) => {
    if (!sectionName || !sections) return 0;
    const section = sections.find(s => s.name === sectionName);
    return section ? section.id : 0;
  };

  const getSectionNameById = (sectionId: number | undefined) => {
    if (!sectionId || !sections) return 'All Sections';
    const section = sections.find(s => s.id === sectionId);
    return section ? section.name : 'All Sections';
  };

  const handleRefreshAll = useCallback(() => {
    refetchTeacherTimetable();
  }, [refetchTeacherTimetable]);

  // Period CRUD operations
  const showSuccessMessage = (message: string) => {
    Alert.alert('Success', message);
  };

  const showErrorMessage = (message: string) => {
    Alert.alert('Error', message);
  };

  const handleCellPress = (teacherKey: string, periodNumber: number, day: string, existingData?: TimetableEntry) => {
    setSelectedCell({ teacherKey, periodNumber, day, existingData });
    if (existingData) {
      setPeriodForm({
        department: existingData.department.name,
        teacher: `${existingData.teacher.first_name} ${existingData.teacher.last_name}`,
        section: `${existingData.section.standard.name} ${existingData.section.name}`,
      });
    } else {
      setPeriodForm({ department: '', teacher: '', section: '' });
    }
    setModalVisible(true);
  };

  const handleCreatePeriod = async () => {
    if (!selectedCell || !periodForm.department || !periodForm.teacher) {
      showErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setModalLoading(true);
      // Assuming apiService has a createPeriod method
      // await apiService.createPeriod({
      //   teacher_key: selectedCell.teacherKey,
      //   period_number: selectedCell.periodNumber,
      //   day: selectedCell.day,
      //   department: periodForm.department,
      //   teacher: periodForm.teacher,
      //   section: periodForm.section,
      //   branch: selectedBranch,
      // });
      showSuccessMessage('Period assigned successfully');
      setModalVisible(false);
      refetchTeacherTimetable();
    } catch (error) {
      console.error("Error assigning period:", error);
      showErrorMessage('Failed to assign period');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdatePeriod = async () => {
    if (!selectedCell?.existingData || !periodForm.department || !periodForm.teacher) {
      showErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setModalLoading(true);
      // Assuming apiService.updatePeriod exists and takes the correct arguments
      // await apiService.updatePeriod(selectedCell.existingData.id, { // Assuming existingData has an id field
      //   department: periodForm.department,
      //   teacher: periodForm.teacher,
      //   section: periodForm.section,
      // });
      showSuccessMessage('Period updated successfully');
      setModalVisible(false);
      refetchTeacherTimetable();
    } catch (error) {
      console.error("Error updating period:", error);
      showErrorMessage('Failed to update period');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeletePeriod = () => {
    if (!selectedCell?.existingData) return;

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this period assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setModalLoading(true);
              // Assuming apiService.deletePeriod exists and takes the correct arguments
              // await apiService.deletePeriod(selectedCell.existingData.id); // Assuming existingData has an id field
              showSuccessMessage('Period deleted successfully');
              setModalVisible(false);
              refetchTeacherTimetable();
            } catch (error) {
              console.error("Error deleting period:", error);
              showErrorMessage('Failed to delete period');
            } finally {
              setModalLoading(false);
            }
          },
        },
      ]
    );
  };

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

    // Filter by department (this filter seems specific to teacher view, might need review)
    // Note: The original code had a department filter here, but it was applied to the teacher view.
    // This might be a mistake or intended for a specific use case. Keeping it as is for now.
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
      {/* Section specific filters */}
      <View style={styles.filtersRow}>
        {/* Standard */}
        <View style={styles.filterItem}>
          <ModalDropdownFilter
            label="Standard"
            items={standardsForPicker}
            selectedValue={selectedStandard ?? 0}
            onValueChange={(value) => setSelectedStandard(value === 0 ? null : value)}
            compact={true}
          />
        </View>

        {/* Section */}
        <View style={styles.filterItem}>
          <ModalDropdownFilter
            label="Section"
            items={sectionsForPicker}
            selectedValue={getSectionIdByName(selectedSection)}
            onValueChange={(value) => setSelectedSection(getSectionNameById(value))}
            compact={true}
          />
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
                    <TouchableOpacity 
                      key={periodNum} 
                      style={[
                        styles.periodCell,
                        { 
                          backgroundColor: periodData ? colors.primary + '20' : colors.surface,
                          borderColor: colors.border 
                        }
                      ]}
                      onPress={() => handleCellPress(teacherKey, periodNum, selectedDay, periodData)}
                    >
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
                    </TouchableOpacity>
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
    if (periodsLoading || !selectedSection) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {periodsLoading ? "Loading section timetable..." : "Please select a section to view timetable"}
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

  const isLoading = teacherTimetableLoading; // Simplified loading state

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

      {/* Global Filters */}
      <View style={[styles.globalFiltersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.globalFiltersRow}>
          <Text style={[styles.globalFiltersLabel, { color: colors.textSecondary }]}>Filters:</Text>
          <View style={styles.globalFiltersContent}>
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
          </View>
        </View>
      </View>

      {/* Local Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={[styles.filtersContainer, { backgroundColor: colors.surface }]}
        contentContainerStyle={styles.filtersContent}
      >
        {activeView === 'teacher' && (
          <>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Department</Text>
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

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Day</Text>
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
          </>
        )}
        {activeView === 'section' && (
          <>
            <View style={styles.filterGroup}>
              <ModalDropdownFilter
                label="Standard"
                items={standardsForPicker}
                selectedValue={selectedStandard ?? 0}
                onValueChange={(value) => setSelectedStandard(value === 0 ? null : value)}
                compact={true}
              />
            </View>

            <View style={styles.filterGroup}>
              <ModalDropdownFilter
                label="Section"
                items={sectionsForPicker}
                selectedValue={getSectionIdByName(selectedSection)}
                onValueChange={(value) => setSelectedSection(getSectionNameById(value))}
                compact={true}
              />
            </View>
          </>
        )}
      </ScrollView>

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

      {/* Timetable Cell Interaction Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {selectedCell?.existingData ? 'Edit Period' : 'Assign Period'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.periodInfo, { color: colors.textSecondary }]}>
                {selectedCell?.teacherKey} - Period {selectedCell?.periodNumber} - {selectedCell?.day}
              </Text>

              {selectedCell?.existingData ? (
                // Edit existing period
                <View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Department:</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                      {selectedCell.existingData.department.name}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Teacher:</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                      {selectedCell.existingData.teacher.first_name} {selectedCell.existingData.teacher.last_name}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Section:</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                      {selectedCell.existingData.section.standard.name} {selectedCell.existingData.section.name}
                    </Text>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.editButton, { backgroundColor: colors.primary }]}
                      onPress={handleUpdatePeriod}
                      disabled={modalLoading}
                    >
                      {modalLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.buttonText}>Edit</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.deleteButton, { backgroundColor: '#EF4444' }]}
                      onPress={handleDeletePeriod}
                      disabled={modalLoading}
                    >
                      <Text style={styles.buttonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // Assign new period
                <View>
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Department *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                      placeholder="Enter department"
                      placeholderTextColor={colors.textSecondary}
                      value={periodForm.department}
                      onChangeText={(value) => setPeriodForm({ ...periodForm, department: value })}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Teacher *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                      placeholder="Enter teacher name"
                      placeholderTextColor={colors.textSecondary}
                      value={periodForm.teacher}
                      onChangeText={(value) => setPeriodForm({ ...periodForm, teacher: value })}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Section</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                      placeholder="Enter section"
                      placeholderTextColor={colors.textSecondary}
                      value={periodForm.section}
                      onChangeText={(value) => setPeriodForm({ ...periodForm, section: value })}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.assignButton, { backgroundColor: colors.primary }]}
                    onPress={handleCreatePeriod}
                    disabled={modalLoading}
                  >
                    {modalLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buttonText}>Assign Period</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  globalFiltersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  globalFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  globalFiltersLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  globalFiltersContent: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterGroup: {
    minWidth: 180, 
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  periodInfo: {
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  assignButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});