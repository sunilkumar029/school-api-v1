
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';

interface StudentFee {
  id: string;
  studentName: string;
  class: string;
  totalFee: number;
  paidAmount: number;
  balance: number;
  status: 'Paid' | 'Partially Paid' | 'Pending';
  dueDate: string;
  lastPaymentDate?: string;
  paymentHistory: PaymentRecord[];
}

interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: string;
  receiptNo: string;
}

export default function StudentFeeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentFee | null>(null);

  const studentFees: StudentFee[] = [
    {
      id: '1',
      studentName: 'John Smith',
      class: '10-A',
      totalFee: 5000,
      paidAmount: 5000,
      balance: 0,
      status: 'Paid',
      dueDate: '2024-03-31',
      lastPaymentDate: '2024-01-15',
      paymentHistory: [
        { id: '1', amount: 2500, date: '2024-01-15', method: 'Bank Transfer', receiptNo: 'RCP001' },
        { id: '2', amount: 2500, date: '2024-02-15', method: 'Cash', receiptNo: 'RCP002' }
      ]
    },
    {
      id: '2',
      studentName: 'Emily Davis',
      class: '11-B',
      totalFee: 5500,
      paidAmount: 3000,
      balance: 2500,
      status: 'Partially Paid',
      dueDate: '2024-02-28',
      lastPaymentDate: '2024-01-10',
      paymentHistory: [
        { id: '3', amount: 3000, date: '2024-01-10', method: 'Online', receiptNo: 'RCP003' }
      ]
    },
    {
      id: '3',
      studentName: 'Michael Brown',
      class: '12-A',
      totalFee: 6000,
      paidAmount: 0,
      balance: 6000,
      status: 'Pending',
      dueDate: '2024-01-31',
      paymentHistory: []
    }
  ];

  const classes = ['All', '9-A', '10-A', '11-B', '12-A'];
  const statuses = ['All', 'Paid', 'Partially Paid', 'Pending'];

  const filteredFees = studentFees.filter(fee => {
    const matchesSearch = fee.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 'All' || fee.class === filterClass;
    const matchesStatus = filterStatus === 'All' || fee.status === filterStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleViewDetails = (student: StudentFee) => {
    setSelectedStudent(student);
    setDetailsModalVisible(true);
  };

  const handleUpdatePayment = (student: StudentFee) => {
    setSelectedStudent(student);
    setPaymentModalVisible(true);
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderFeeCard = (fee: StudentFee) => (
    <View key={fee.id} style={[styles.feeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.feeHeader}>
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: colors.textPrimary }]}>{fee.studentName}</Text>
          <Text style={[styles.studentClass, { color: colors.textSecondary }]}>Class: {fee.class}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(fee.status) }]}>
          <Text style={styles.statusText}>{fee.status}</Text>
        </View>
      </View>
      
      <View style={styles.feeDetails}>
        <View style={styles.feeRow}>
          <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Total Fee:</Text>
          <Text style={[styles.feeValue, { color: colors.textPrimary }]}>{formatCurrency(fee.totalFee)}</Text>
        </View>
        <View style={styles.feeRow}>
          <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Paid:</Text>
          <Text style={[styles.feeValue, { color: '#10B981' }]}>{formatCurrency(fee.paidAmount)}</Text>
        </View>
        <View style={styles.feeRow}>
          <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Balance:</Text>
          <Text style={[styles.feeValue, { color: fee.balance > 0 ? '#EF4444' : '#10B981' }]}>
            {formatCurrency(fee.balance)}
          </Text>
        </View>
        <View style={styles.feeRow}>
          <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Due Date:</Text>
          <Text style={[styles.feeValue, { color: colors.textPrimary }]}>{fee.dueDate}</Text>
        </View>
      </View>

      {fee.lastPaymentDate && (
        <Text style={[styles.lastPayment, { color: colors.textSecondary }]}>
          Last payment: {fee.lastPaymentDate}
        </Text>
      )}
      
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.primary }]}
          onPress={() => handleViewDetails(fee)}
        >
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>View Details</Text>
        </TouchableOpacity>
        {fee.balance > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => handleUpdatePayment(fee)}
          >
            <Text style={styles.updateButtonText}>Update Payment</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
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

      {/* Search and Filters */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Search by student name..."
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
      <ScrollView style={styles.feeList}>
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

      {/* Details Modal */}
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
                    Name: {selectedStudent.studentName}
                  </Text>
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    Class: {selectedStudent.class}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Fee Summary</Text>
                  <View style={styles.feeSummary}>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Fee</Text>
                      <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                        {formatCurrency(selectedStudent.totalFee)}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Paid Amount</Text>
                      <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                        {formatCurrency(selectedStudent.paidAmount)}
                      </Text>
                    </View>
                    <View style={[styles.summaryRow, styles.balanceRow]}>
                      <Text style={[styles.summaryLabel, styles.balanceLabel, { color: colors.textPrimary }]}>Balance</Text>
                      <Text style={[styles.summaryValue, styles.balanceValue, { color: selectedStudent.balance > 0 ? '#EF4444' : '#10B981' }]}>
                        {formatCurrency(selectedStudent.balance)}
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedStudent.paymentHistory.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Payment History</Text>
                    {selectedStudent.paymentHistory.map((payment) => (
                      <View key={payment.id} style={[styles.paymentRecord, { borderColor: colors.border }]}>
                        <View style={styles.paymentInfo}>
                          <Text style={[styles.paymentAmount, { color: colors.textPrimary }]}>
                            {formatCurrency(payment.amount)}
                          </Text>
                          <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>
                            {payment.date}
                          </Text>
                        </View>
                        <View style={styles.paymentDetails}>
                          <Text style={[styles.paymentMethod, { color: colors.textSecondary }]}>
                            {payment.method}
                          </Text>
                          <Text style={[styles.receiptNo, { color: colors.textSecondary }]}>
                            Receipt: {payment.receiptNo}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
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
  feeList: {
    flex: 1,
    padding: 16,
  },
  feeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
  updateButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#F9FAFB',
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
    borderTopColor: '#E5E7EB',
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
  paymentRecord: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentDate: {
    fontSize: 14,
    marginTop: 2,
  },
  paymentDetails: {
    alignItems: 'flex-end',
  },
  paymentMethod: {
    fontSize: 14,
  },
  receiptNo: {
    fontSize: 12,
    marginTop: 2,
  },
});
