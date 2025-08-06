
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { Picker } from '@react-native-picker/picker';
import { 
  useStationaryFee,
  useBranches, 
  useAcademicYears,
  useStandards,
  useSections,
  useStudentDetails,
} from '@/hooks/useApi';

interface StationaryFeeItem {
  id: number;
  standard: {
    id: number;
    name: string;
    stationary: Array<{
      id: number;
      name: string;
      price: number;
      description: string;
      quantity: number;
      is_active: boolean;
      stationary_type: {
        id: number;
        name: string;
        description: string;
      };
    }>;
  };
  stationaies: Array<{
    stationary_type: any;
  }>;
}

interface StudentRecord {
  id: number;
  user_name: string;
  admission_number: number;
  standard: string;
  section: string;
  items_taken: number;
  total_amount: number;
  pending_amount: number;
  stationary_fee_paid: boolean;
  stationary_fee_amount_paid: number;
  given_stationary: number[];
  given_stationary_count: any;
}

export default function StationeryFeeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [studentDetailsModalVisible, setStudentDetailsModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview');
  
  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [selectedStandard, setSelectedStandard] = useState<number>(1);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data with memoized parameters
  const stationaryFeeParams = useMemo(() => ({
    standard: selectedStandard,
    academic_year: selectedAcademicYear,
    branch: selectedBranch,
    omit: 'created_by,modified_by',
  }), [selectedBranch, selectedAcademicYear, selectedStandard]);

  const { data: stationaryFeeData, loading: feeLoading, refetch: refetchFee } = useStationaryFee(stationaryFeeParams);
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears({ is_active: true });
  const { data: standards } = useStandards({ 
    branch: selectedBranch,
    is_active: true,
    academic_year: selectedAcademicYear,
  });
  const { data: sections } = useSections({ 
    branch: selectedBranch,
    standard: selectedStandard,
    omit: 'created_by',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const calculateTotalStationaryValue = (stationary: any[]) => {
    return stationary.reduce((total, item) => {
      if (item.is_active) {
        return total + (item.price * item.quantity);
      }
      return total;
    }, 0);
  };

  const getActiveStationaryItems = (stationary: any[]) => {
    return stationary.filter(item => item.is_active);
  };

  const handleViewStudentDetails = useCallback((student: any) => {
    setSelectedStudent(student);
    setStudentDetailsModalVisible(true);
  }, []);

  const renderStationaryOverview = () => {
    if (feeLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading stationery data...
          </Text>
        </View>
      );
    }

    if (!stationaryFeeData || stationaryFeeData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No stationery data found for the selected filters
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.overviewContent}>
        {stationaryFeeData.map((item: StationaryFeeItem) => {
          const activeItems = getActiveStationaryItems(item.standard.stationary);
          const totalValue = calculateTotalStationaryValue(item.standard.stationary);
          
          return (
            <View key={item.id} style={[styles.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  {item.standard.name}
                </Text>
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{activeItems.length} Items</Text>
                </View>
              </View>

              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Value</Text>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{formatCurrency(totalValue)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Items</Text>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{activeItems.length}</Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsList}>
                {activeItems.map((stationaryItem: any) => (
                  <View key={stationaryItem.id} style={[styles.itemChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]}>{stationaryItem.name}</Text>
                    <Text style={[styles.itemPrice, { color: colors.primary }]}>{formatCurrency(stationaryItem.price)}</Text>
                    <Text style={[styles.itemQty, { color: colors.textSecondary }]}>Qty: {stationaryItem.quantity}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderStudentsView = () => {
    // Mock student data - in real implementation, this would come from API
    const mockStudents: StudentRecord[] = [
      {
        id: 42,
        user_name: "Namasvi K",
        admission_number: 30001,
        standard: "1st Standard",
        section: "C Section",
        items_taken: 4,
        total_amount: 16220,
        pending_amount: 0,
        stationary_fee_paid: false,
        stationary_fee_amount_paid: 16220,
        given_stationary: [1, 19, 7, 3],
        given_stationary_count: {
          "1": 5,
          "3": 10,
          "7": 30,
          "19": 40
        }
      }
    ];

    const filteredStudents = mockStudents.filter(student => {
      const matchesSearch = student.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           student.admission_number.toString().includes(searchQuery);
      return matchesSearch;
    });

    return (
      <ScrollView style={styles.studentsContent}>
        {filteredStudents.map((student) => (
          <View key={student.id} style={[styles.studentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.studentHeader}>
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, { color: colors.textPrimary }]}>{student.user_name}</Text>
                <Text style={[styles.studentDetails, { color: colors.textSecondary }]}>
                  {student.standard} - {student.section} | #{student.admission_number}
                </Text>
              </View>
              <View style={[styles.statusBadge, { 
                backgroundColor: student.pending_amount > 0 ? '#EF4444' : '#10B981'
              }]}>
                <Text style={styles.statusText}>
                  {student.pending_amount > 0 ? 'Pending' : 'Paid'}
                </Text>
              </View>
            </View>

            <View style={styles.studentStats}>
              <View style={styles.statColumn}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>{student.items_taken}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Items Taken</Text>
              </View>
              <View style={styles.statColumn}>
                <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{formatCurrency(student.total_amount)}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Amount</Text>
              </View>
              <View style={styles.statColumn}>
                <Text style={[styles.statNumber, { color: student.pending_amount > 0 ? '#EF4444' : '#10B981' }]}>
                  {formatCurrency(student.pending_amount)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.viewButton, { borderColor: colors.primary }]}
              onPress={() => handleViewStudentDetails(student)}
            >
              <Text style={[styles.viewButtonText, { color: colors.primary }]}>View Details</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    );
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
                  {standards?.map((standard: any) => (
                    <Picker.Item key={standard.id} label={standard.name} value={standard.id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Section (Optional)</Text>
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

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={() => setFiltersVisible(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderStudentDetailsModal = () => (
    <Modal
      visible={studentDetailsModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setStudentDetailsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.detailsModal, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {selectedStudent?.user_name} - Stationery Details
            </Text>
            <TouchableOpacity onPress={() => setStudentDetailsModalVisible(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedStudent && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Student Information</Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Name:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{selectedStudent.user_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Admission Number:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{selectedStudent.admission_number}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Class:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{selectedStudent.standard} - {selectedStudent.section}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Fee Summary</Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Total Amount:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{formatCurrency(selectedStudent.total_amount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Amount Paid:</Text>
                  <Text style={[styles.detailValue, { color: '#10B981' }]}>{formatCurrency(selectedStudent.stationary_fee_amount_paid)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Pending Amount:</Text>
                  <Text style={[styles.detailValue, { color: selectedStudent.pending_amount > 0 ? '#EF4444' : '#10B981' }]}>
                    {formatCurrency(selectedStudent.pending_amount)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Items Taken</Text>
                {Object.entries(selectedStudent.given_stationary_count || {}).map(([itemId, quantity]) => (
                  <View key={itemId} style={styles.itemRow}>
                    <Text style={[styles.itemText, { color: colors.textPrimary }]}>Item ID: {itemId}</Text>
                    <Text style={[styles.quantityText, { color: colors.textSecondary }]}>Qty: {quantity}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const isLoading = feeLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Stationery Fees"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Header Controls */}
      <View style={[styles.headerControls, { backgroundColor: colors.surface }]}>
        {activeTab === 'students' && (
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Search students..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.primary }]}
          onPress={() => setFiltersVisible(true)}
        >
          <Text style={styles.filterButtonText}>🔍 Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'overview' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('overview')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'overview' ? colors.primary : colors.textSecondary },
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'students' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('students')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'students' ? colors.primary : colors.textSecondary },
            ]}
          >
            Students
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'overview' ? renderStationaryOverview() : renderStudentsView()}
      </View>

      {renderFiltersModal()}
      {renderStudentDetailsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerControls: {
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  filterButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  overviewContent: {
    padding: 16,
  },
  overviewCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemsList: {
    paddingVertical: 8,
  },
  itemChip: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
    minWidth: 120,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemQty: {
    fontSize: 12,
  },
  studentsContent: {
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
  studentDetails: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  studentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statColumn: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  viewButton: {
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 16,
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
  detailsModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 8,
  },
  filtersContent: {
    padding: 20,
  },
  modalContent: {
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
  applyButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemText: {
    fontSize: 14,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
