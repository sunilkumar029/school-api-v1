
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { Picker } from '@react-native-picker/picker';
import { useTotalFeeSummary, useStandards, useAcademicYears, useBranches, useSections } from '@/hooks/useApi';

interface StudentFee {
  user_id: number;
  user_name: string;
  admission_number: number;
  academic_year: string;
  academic_year_id: number;
  standard: string;
  standard_id: number;
  section: string;
  section_id: number;
  totalfee: number;
  pending_fee: number;
  transactions: Array<{
    payment_date: string;
    amount: number;
    fee_type: string;
    payment_type: string;
    payment_reference: string;
  }>;
  concessions: Array<{
    amount: number;
    fee_type: string;
  }>;
}

export default function StudentFeeListScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [selectedStandard, setSelectedStandard] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feeRangeMin, setFeeRangeMin] = useState('');
  const [feeRangeMax, setFeeRangeMax] = useState('');

  // Fetch data
  const feeParams = useMemo(() => {
    const params: any = {
      branch: selectedBranch,
      academic_year: selectedAcademicYear,
    };
    if (selectedStandard) params.standard = selectedStandard;
    if (selectedSection) params.section = selectedSection;
    return params;
  }, [selectedBranch, selectedAcademicYear, selectedStandard, selectedSection]);

  const { data: students, loading: studentsLoading, refetch: refetchStudents } = useTotalFeeSummary(feeParams);
  
  const standardParams = useMemo(() => ({
    branch: selectedBranch,
    is_active: true,
    academic_year: selectedAcademicYear,
  }), [selectedBranch, selectedAcademicYear]);

  const { data: standards } = useStandards(standardParams);
  const { data: academicYears } = useAcademicYears({ is_active: true });
  const { data: branches } = useBranches({ is_active: true });
  
  const sectionParams = useMemo(() => ({
    branch: selectedBranch,
    standard: selectedStandard,
    omit: 'created_by',
  }), [selectedBranch, selectedStandard]);

  const { data: sections } = useSections(sectionParams);

  // Filter students based on search and fee range
  const filteredStudents = useMemo(() => {
    let filtered = students.filter((student: StudentFee) => {
      const matchesSearch = student.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           student.admission_number.toString().includes(searchQuery);
      
      let matchesFeeRange = true;
      if (feeRangeMin) {
        matchesFeeRange = matchesFeeRange && student.totalfee >= parseInt(feeRangeMin);
      }
      if (feeRangeMax) {
        matchesFeeRange = matchesFeeRange && student.totalfee <= parseInt(feeRangeMax);
      }
      
      return matchesSearch && matchesFeeRange;
    });

    return filtered;
  }, [students, searchQuery, feeRangeMin, feeRangeMax]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (pendingFee: number) => {
    if (pendingFee <= 0) return '#10B981'; // Paid
    if (pendingFee > 0) return '#EF4444'; // Pending
    return '#F59E0B'; // Partially paid
  };

  const getStatusText = (pendingFee: number, totalFee: number) => {
    if (pendingFee <= 0) return 'Paid';
    if (pendingFee === totalFee) return 'Pending';
    return 'Partially Paid';
  };

  const handleViewDetails = (student: StudentFee) => {
    router.push(`/finance/student-fee-details?userId=${student.user_id}&academicYear=${student.academic_year_id}`);
  };

  const clearFilters = () => {
    setSelectedStandard('');
    setSelectedSection('');
    setSearchQuery('');
    setFeeRangeMin('');
    setFeeRangeMax('');
  };

  const renderFiltersModal = () => (
    <Modal
      visible={filtersVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFiltersVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.filtersModal, { backgroundColor: colors.surface }]}>
          <View style={styles.filtersHeader}>
            <Text style={[styles.filtersTitle, { color: colors.textPrimary }]}>Filters</Text>
            <TouchableOpacity onPress={() => setFiltersVisible(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filtersContent}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Branch</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Picker
                  selectedValue={selectedBranch}
                  onValueChange={setSelectedBranch}
                  style={[styles.picker, { color: colors.textPrimary }]}
                >
                  {branches?.map((branch: any) => (
                    <Picker.Item key={branch.id} label={branch.name} value={branch.id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Academic Year</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Picker
                  selectedValue={selectedAcademicYear}
                  onValueChange={setSelectedAcademicYear}
                  style={[styles.picker, { color: colors.textPrimary }]}
                >
                  {academicYears?.map((year: any) => (
                    <Picker.Item key={year.id} label={year.name} value={year.id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Standard</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Picker
                  selectedValue={selectedStandard}
                  onValueChange={setSelectedStandard}
                  style={[styles.picker, { color: colors.textPrimary }]}
                >
                  <Picker.Item label="All Standards" value="" />
                  {standards?.map((standard: any) => (
                    <Picker.Item key={standard.id} label={standard.name} value={standard.id.toString()} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Section</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Picker
                  selectedValue={selectedSection}
                  onValueChange={setSelectedSection}
                  style={[styles.picker, { color: colors.textPrimary }]}
                >
                  <Picker.Item label="All Sections" value="" />
                  {sections?.map((section: any) => (
                    <Picker.Item key={section.id} label={section.name} value={section.id.toString()} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Fee Range</Text>
              <View style={styles.feeRangeContainer}>
                <TextInput
                  style={[styles.feeRangeInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Min Amount"
                  placeholderTextColor={colors.textSecondary}
                  value={feeRangeMin}
                  onChangeText={setFeeRangeMin}
                  keyboardType="numeric"
                />
                <Text style={[styles.feeRangeTo, { color: colors.textSecondary }]}>to</Text>
                <TextInput
                  style={[styles.feeRangeInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Max Amount"
                  placeholderTextColor={colors.textSecondary}
                  value={feeRangeMax}
                  onChangeText={setFeeRangeMax}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={[styles.clearButton, { borderColor: colors.border }]}
                onPress={clearFilters}
              >
                <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>Clear Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: colors.primary }]}
                onPress={() => setFiltersVisible(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderStudentCard = (student: StudentFee) => {
    const paidAmount = student.totalfee - student.pending_fee;
    const status = getStatusText(student.pending_fee, student.totalfee);
    const statusColor = getStatusColor(student.pending_fee);

    return (
      <View key={student.user_id} style={[styles.studentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.studentHeader}>
          <View style={styles.studentInfo}>
            <Text style={[styles.studentName, { color: colors.textPrimary }]}>{student.user_name}</Text>
            <Text style={[styles.studentDetails, { color: colors.textSecondary }]}>
              {student.standard} - {student.section} | #{student.admission_number}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
        
        <View style={styles.feeDetails}>
          <View style={styles.feeRow}>
            <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Total Fee:</Text>
            <Text style={[styles.feeValue, { color: colors.textPrimary }]}>{formatCurrency(student.totalfee)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Paid:</Text>
            <Text style={[styles.feeValue, { color: '#10B981' }]}>{formatCurrency(paidAmount)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Pending:</Text>
            <Text style={[styles.feeValue, { color: student.pending_fee > 0 ? '#EF4444' : '#10B981' }]}>
              {formatCurrency(student.pending_fee)}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.viewButton, { borderColor: colors.primary }]}
            onPress={() => handleViewDetails(student)}
          >
            <Text style={[styles.viewButtonText, { color: colors.primary }]}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Student Fees"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Search and Filter Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Search by name or admission number..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.primary }]}
          onPress={() => setFiltersVisible(true)}
        >
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={studentsLoading}
            onRefresh={refetchStudents}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {studentsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading student fees...
            </Text>
          </View>
        ) : filteredStudents.length > 0 ? (
          <View style={styles.listContent}>
            {filteredStudents.map(renderStudentCard)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery || feeRangeMin || feeRangeMax ? 'No students match your search criteria' : 'No student fee records found'}
            </Text>
          </View>
        )}
      </ScrollView>

      {renderFiltersModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  studentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  feeDetails: {
    marginBottom: 16,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  feeLabel: {
    fontSize: 14,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filtersModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 8,
  },
  filtersContent: {
    padding: 20,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
  },
  feeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feeRangeInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  feeRangeTo: {
    fontSize: 14,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
