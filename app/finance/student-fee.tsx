
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { GlobalFilters } from '@/components/GlobalFilters';
import { useFeeSummary, useStandards, useSections } from '@/hooks/useApi';

interface StudentFee {
  id: string;
  student: {
    id: number;
    name: string;
    roll_number?: string;
  };
  class: string;
  total_fee: number;
  paid_amount: number;
  balance: number;
  status: 'Paid' | 'Partially Paid' | 'Pending';
  due_date: string;
  last_payment_date?: string;
  payment_history: PaymentRecord[];
}

interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: string;
  receipt_no: string;
}

export default function StudentFeeScreen() {
  const { colors } = useTheme();
  const { selectedBranch, selectedAcademicYear } = useGlobalFilters();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedStandard, setSelectedStandard] = useState<number | undefined>();
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentFee | null>(null);

  // Fetch data using global filters
  const feeParams = useMemo(() => ({
    branch: selectedBranch || 1,
    academic_year: selectedAcademicYear || 1,
    ...(selectedStandard && { standard: selectedStandard }),
    ...(selectedSection && { section: selectedSection }),
  }), [selectedBranch, selectedAcademicYear, selectedStandard, selectedSection]);

  const { data: feeSummary, loading: feeLoading, error: feeError, refetch } = useFeeSummary(feeParams);
  const { data: standards } = useStandards({ branch: selectedBranch, academic_year: selectedAcademicYear });
  const { data: sections } = useSections({ branch: selectedBranch, standard: selectedStandard });

  const classes = ['All', ...(standards?.map(s => s.name) || [])];
  const statuses = ['All', 'Paid', 'Partially Paid', 'Pending'];

  // Transform API data to match interface
  const transformedFees: StudentFee[] = useMemo(() => {
    if (!feeSummary) return [];
    
    return feeSummary.map((fee: any) => ({
      id: fee.id?.toString() || Math.random().toString(),
      student: {
        id: fee.student?.id || 0,
        name: fee.student?.name || fee.student_name || 'Unknown Student',
        roll_number: fee.student?.roll_number,
      },
      class: fee.standard?.name || fee.class || 'Unknown',
      total_fee: fee.total_fee || fee.total_amount || 0,
      paid_amount: fee.paid_amount || fee.paid_fee || 0,
      balance: (fee.total_fee || 0) - (fee.paid_amount || 0),
      status: fee.paid_amount >= fee.total_fee ? 'Paid' : 
              fee.paid_amount > 0 ? 'Partially Paid' : 'Pending',
      due_date: fee.due_date || new Date().toISOString().split('T')[0],
      last_payment_date: fee.last_payment_date,
      payment_history: fee.payment_history || [],
    }));
  }, [feeSummary]);

  const filteredFees = useMemo(() => {
    return transformedFees.filter(fee => {
      const matchesSearch = fee.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (fee.student.roll_number && fee.student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesClass = filterClass === 'All' || fee.class === filterClass;
      const matchesStatus = filterStatus === 'All' || fee.status === filterStatus;
      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [transformedFees, searchQuery, filterClass, filterStatus]);

  const handleViewDetails = (student: StudentFee) => {
    setSelectedStudent(student);
    setDetailsModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return '#10B981';
      case 'Partially Paid': return '#F59E0B';
      case 'Pending': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const renderFeeCard = (fee: StudentFee) => (
    <View key={fee.id} style={[styles.feeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.feeHeader}>
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: colors.textPrimary }]}>{fee.student.name}</Text>
          <Text style={[styles.studentClass, { color: colors.textSecondary }]}>
            Class: {fee.class}
            {fee.student.roll_number && ` • Roll: ${fee.student.roll_number}`}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(fee.status) }]}>
          <Text style={styles.statusText}>{fee.status}</Text>
        </View>
      </View>
      
      <View style={styles.feeDetails}>
        <View style={styles.feeRow}>
          <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Total Fee:</Text>
          <Text style={[styles.feeValue, { color: colors.textPrimary }]}>{formatCurrency(fee.total_fee)}</Text>
        </View>
        <View style={styles.feeRow}>
          <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Paid:</Text>
          <Text style={[styles.feeValue, { color: '#10B981' }]}>{formatCurrency(fee.paid_amount)}</Text>
        </View>
        <View style={styles.feeRow}>
          <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Balance:</Text>
          <Text style={[styles.feeValue, { color: fee.balance > 0 ? '#EF4444' : '#10B981' }]}>
            {formatCurrency(fee.balance)}
          </Text>
        </View>
        <View style={styles.feeRow}>
          <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Due Date:</Text>
          <Text style={[styles.feeValue, { color: colors.textPrimary }]}>
            {new Date(fee.due_date).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {fee.last_payment_date && (
        <Text style={[styles.lastPayment, { color: colors.textSecondary }]}>
          Last payment: {new Date(fee.last_payment_date).toLocaleDateString()}
        </Text>
      )}
      
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.primary }]}
          onPress={() => handleViewDetails(fee)}
        >
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDetailsModal = () => (
    <Modal
      visible={detailsModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setDetailsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Fee Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setDetailsModalVisible(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {selectedStudent && (
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Student Information</Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  Name: {selectedStudent.student.name}
                </Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  Class: {selectedStudent.class}
                </Text>
                {selectedStudent.student.roll_number && (
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    Roll Number: {selectedStudent.student.roll_number}
                  </Text>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Fee Summary</Text>
                <View style={[styles.feeSummary, { backgroundColor: colors.background }]}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Fee</Text>
                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                      {formatCurrency(selectedStudent.total_fee)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Paid Amount</Text>
                    <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                      {formatCurrency(selectedStudent.paid_amount)}
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, styles.balanceRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.summaryLabel, styles.balanceLabel, { color: colors.textPrimary }]}>Balance</Text>
                    <Text style={[styles.summaryValue, styles.balanceValue, { 
                      color: selectedStudent.balance > 0 ? '#EF4444' : '#10B981' 
                    }]}>
                      {formatCurrency(selectedStudent.balance)}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Student Fees"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Global Filters */}
      <GlobalFilters />

      {/* Search and Local Filters */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: colors.background, 
            borderColor: colors.border, 
            color: colors.textPrimary 
          }]}
          placeholder="Search by student name or roll number..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Class:</Text>
            {classes.map((cls) => (
              <TouchableOpacity
                key={cls}
                style={[
                  styles.filterButton,
                  { borderColor: colors.border },
                  filterClass === cls && { backgroundColor: colors.primary }
                ]}
                onPress={() => setFilterClass(cls)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: filterClass === cls ? '#FFFFFF' : colors.textPrimary }
                ]}>
                  {cls}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Status:</Text>
            {statuses.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  { borderColor: colors.border },
                  filterStatus === status && { backgroundColor: colors.primary }
                ]}
                onPress={() => setFilterStatus(status)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: filterStatus === status ? '#FFFFFF' : colors.textPrimary }
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Fee List */}
      {feeLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading fee data...
          </Text>
        </View>
      ) : feeError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Failed to load fee data. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetch}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.feeList}
          refreshControl={
            <RefreshControl
              refreshing={feeLoading}
              onRefresh={refetch}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {filteredFees.length > 0 ? (
            filteredFees.map(renderFeeCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                No fee records found
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {renderDetailsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterScrollView: {
    flexDirection: 'row',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    alignSelf: 'center',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
  feeList: {
    flex: 1,
    padding: 16,
  },
  feeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentClass: {
    fontSize: 14,
    marginTop: 2,
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
    marginBottom: 12,
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
  lastPayment: {
    fontSize: 12,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontSize: 20,
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
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 6,
  },
  feeSummary: {
    borderRadius: 8,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceRow: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
  },
  balanceLabel: {
    fontWeight: 'bold',
  },
  balanceValue: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});
