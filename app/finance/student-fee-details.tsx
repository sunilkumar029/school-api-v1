
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useFeeSummary, useFeePayments, useTotalFeeSummary } from '@/hooks/useApi';

interface FeeSummaryItem {
  fee: {
    id: number;
    amount: number;
    due_date: string;
    fee_type: {
      id: number;
      name: string;
      description: string;
    };
    standard: {
      name: string;
    };
    academic_year: {
      name: string;
    };
  };
  user: {
    id: number;
    first_name: string;
    last_name: string;
    admission_number: number;
  };
  total_paid: number;
  total_fee_amount: number;
  total_amount_to_pay: number;
  total_concession: number | null;
}

interface PaymentHistory {
  user_id: number;
  students_name: string;
  identifier: number;
  standard: string;
  feetype: string;
  payment_type: string;
  amount: number;
  payment_reference: string;
  date: string;
  fee_id: number;
}

export default function StudentFeeDetailsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending' | 'upcoming'>('all');
  const [feeDetailModalVisible, setFeeDetailModalVisible] = useState(false);
  const [selectedFeeItem, setSelectedFeeItem] = useState<FeeSummaryItem | null>(null);
  const [paymentDetailModalVisible, setPaymentDetailModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(null);

  const userId = params.userId as string;
  const academicYear = params.academicYear as string;

  // Fetch fee summary for specific user
  const feeSummaryParams = useMemo(() => ({
    user: userId,
    academic_year: academicYear,
  }), [userId, academicYear]);

  const { data: feeSummary, loading: feeSummaryLoading, refetch: refetchFeeSummary } = useFeeSummary(feeSummaryParams);

  // Fetch payment history
  const paymentParams = useMemo(() => ({
    user: userId,
    omit: 'created_by,modified_by,user__created_by,user__modified_by,fee__created_by,fee__modified_by',
  }), [userId]);

  const { data: paymentHistory, loading: paymentLoading, refetch: refetchPayments } = useFeePayments(paymentParams);

  // Fetch total fee summary for this specific user
  const totalFeeParams = useMemo(() => ({
    branch: 1,
    academic_year: academicYear,
    user: userId,
    limit: 1,
  }), [userId, academicYear]);

  const { data: totalFeeSummary, loading: totalFeeLoading } = useTotalFeeSummary(totalFeeParams);

  const studentData = totalFeeSummary?.[0];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadInvoice = (payment: PaymentHistory) => {
    Alert.alert(
      'Download Invoice',
      `Download invoice for payment of ${formatCurrency(payment.amount)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => {
          // TODO: Implement invoice download functionality
          Alert.alert('Info', 'Invoice download functionality will be implemented');
        }},
      ]
    );
  };

  const renderPendingFees = () => {
    let pendingFees = feeSummary.filter((item: FeeSummaryItem) => {
      const pendingAmount = item.total_amount_to_pay - item.total_paid;
      const dueDate = new Date(item.fee.due_date);
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      switch (paymentFilter) {
        case 'paid':
          return pendingAmount <= 0;
        case 'pending':
          return pendingAmount > 0;
        case 'upcoming':
          return pendingAmount > 0 && dueDate <= thirtyDaysFromNow && dueDate >= today;
        default:
          return true;
      }
    });

    if (pendingFees.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No pending fees
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {pendingFees.map((item: FeeSummaryItem) => {
          const pendingAmount = item.total_amount_to_pay - item.total_paid;
          return (
            <View key={item.fee.id} style={[styles.feeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.feeHeader}>
                <Text style={[styles.feeType, { color: colors.textPrimary }]}>{item.fee.fee_type.name}</Text>
                <View style={[styles.pendingBadge, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.badgeText}>Pending</Text>
                </View>
              </View>
              
              <Text style={[styles.feeDescription, { color: colors.textSecondary }]}>
                {item.fee.fee_type.description}
              </Text>
              
              <View style={styles.feeDetails}>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Total Amount:</Text>
                  <Text style={[styles.feeValue, { color: colors.textPrimary }]}>{formatCurrency(item.fee.amount)}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Paid:</Text>
                  <Text style={[styles.feeValue, { color: '#10B981' }]}>{formatCurrency(item.total_paid)}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Pending:</Text>
                  <Text style={[styles.feeValue, { color: '#EF4444' }]}>{formatCurrency(pendingAmount)}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Due Date:</Text>
                  <Text style={[styles.feeValue, { color: colors.textPrimary }]}>{formatDate(item.fee.due_date)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.viewButton, { borderColor: colors.primary }]}
                onPress={() => {
                  console.log('View Details pressed for fee:', item.fee.id);
                  setSelectedFeeItem(item);
                  setFeeDetailModalVisible(true);
                }}
              >
                <Text style={[styles.viewButtonText, { color: colors.primary }]}>View Details</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  const renderPaymentHistory = () => {
    if (paymentHistory.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No payment history
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {paymentHistory.map((payment: PaymentHistory, index: number) => (
          <View key={index} style={[styles.paymentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.paymentHeader}>
              <View style={styles.paymentInfo}>
                <Text style={[styles.paymentType, { color: colors.textPrimary }]}>{payment.feetype}</Text>
                <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>
                  {formatDateTime(payment.date)}
                </Text>
              </View>
              <Text style={[styles.paymentAmount, { color: '#10B981' }]}>
                {formatCurrency(payment.amount)}
              </Text>
            </View>
            
            <View style={styles.paymentDetails}>
              <View style={styles.paymentRow}>
                <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Payment Method:</Text>
                <Text style={[styles.paymentValue, { color: colors.textPrimary }]}>{payment.payment_type}</Text>
              </View>
              {payment.payment_reference && (
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Reference:</Text>
                  <Text style={[styles.paymentValue, { color: colors.textPrimary }]}>{payment.payment_reference}</Text>
                </View>
              )}
            </View>

            <View style={styles.paymentActions}>
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: colors.primary }]}
                onPress={() => handleDownloadInvoice(payment)}
              >
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>Download Invoice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: colors.border }]}
                onPress={() => {
                  setSelectedPayment(payment);
                  setPaymentDetailModalVisible(true);
                }}
              >
                <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const isLoading = feeSummaryLoading || paymentLoading || totalFeeLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title={studentData ? `${studentData.user_name} - Fee Details` : 'Fee Details'}
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Student Summary */}
      {studentData && (
        <View style={[styles.summaryContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.studentName, { color: colors.textPrimary }]}>{studentData.user_name}</Text>
            <Text style={[styles.studentClass, { color: colors.textSecondary }]}>
              {studentData.standard} - {studentData.section} | #{studentData.admission_number}
            </Text>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Fee</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatCurrency(studentData.totalfee)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
              <Text style={[styles.statValue, { color: studentData.pending_fee > 0 ? '#EF4444' : '#10B981' }]}>
                {formatCurrency(studentData.pending_fee)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Paid</Text>
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {formatCurrency(studentData.totalfee - studentData.pending_fee)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Payment Filter Buttons */}
      <View style={[styles.filterButtonsContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            { backgroundColor: paymentFilter === 'all' ? colors.primary : colors.background, borderColor: colors.border },
          ]}
          onPress={() => setPaymentFilter('all')}
        >
          <Text style={[styles.filterChipText, { color: paymentFilter === 'all' ? '#FFFFFF' : colors.textSecondary }]}>
            All Payments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterChip,
            { backgroundColor: paymentFilter === 'paid' ? colors.primary : colors.background, borderColor: colors.border },
          ]}
          onPress={() => setPaymentFilter('paid')}
        >
          <Text style={[styles.filterChipText, { color: paymentFilter === 'paid' ? '#FFFFFF' : colors.textSecondary }]}>
            Paid
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterChip,
            { backgroundColor: paymentFilter === 'pending' ? colors.primary : colors.background, borderColor: colors.border },
          ]}
          onPress={() => setPaymentFilter('pending')}
        >
          <Text style={[styles.filterChipText, { color: paymentFilter === 'pending' ? '#FFFFFF' : colors.textSecondary }]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterChip,
            { backgroundColor: paymentFilter === 'upcoming' ? colors.primary : colors.background, borderColor: colors.border },
          ]}
          onPress={() => setPaymentFilter('upcoming')}
        >
          <Text style={[styles.filterChipText, { color: paymentFilter === 'upcoming' ? '#FFFFFF' : colors.textSecondary }]}>
            Upcoming Due
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'pending' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('pending')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'pending' ? colors.primary : colors.textSecondary },
            ]}
          >
            Pending Fees
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'history' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'history' ? colors.primary : colors.textSecondary },
            ]}
          >
            Payment History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              refetchFeeSummary();
              refetchPayments();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading fee details...
            </Text>
          </View>
        ) : (
          activeTab === 'pending' ? renderPendingFees() : renderPaymentHistory()
        )}
      </ScrollView>

      {/* Fee Detail Modal */}
      <Modal
        visible={feeDetailModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFeeDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Fee Details</Text>
              <TouchableOpacity onPress={() => setFeeDetailModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedFeeItem && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.primary }]}>Fee Information</Text>
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Fee Type:</Text>
                    <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedFeeItem.fee.fee_type.name}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Description:</Text>
                    <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedFeeItem.fee.fee_type.description}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Standard:</Text>
                    <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedFeeItem.fee.standard.name}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Academic Year:</Text>
                    <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedFeeItem.fee.academic_year.name}</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.primary }]}>Payment Summary</Text>
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Total Amount:</Text>
                    <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{formatCurrency(selectedFeeItem.fee.amount)}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Amount Paid:</Text>
                    <Text style={[styles.modalValue, { color: '#10B981' }]}>{formatCurrency(selectedFeeItem.total_paid)}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Pending Amount:</Text>
                    <Text style={[styles.modalValue, { color: '#EF4444' }]}>{formatCurrency(selectedFeeItem.total_amount_to_pay - selectedFeeItem.total_paid)}</Text>
                  </View>
                  {selectedFeeItem.total_concession && (
                    <View style={styles.modalRow}>
                      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Concession:</Text>
                      <Text style={[styles.modalValue, { color: '#10B981' }]}>{formatCurrency(selectedFeeItem.total_concession)}</Text>
                    </View>
                  )}
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Due Date:</Text>
                    <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{formatDate(selectedFeeItem.fee.due_date)}</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment Detail Modal */}
      <Modal
        visible={paymentDetailModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPaymentDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Payment Details</Text>
              <TouchableOpacity onPress={() => setPaymentDetailModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedPayment && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.primary }]}>Payment Information</Text>
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Fee Type:</Text>
                    <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedPayment.feetype}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Amount:</Text>
                    <Text style={[styles.modalValue, { color: '#10B981' }]}>{formatCurrency(selectedPayment.amount)}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Payment Method:</Text>
                    <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedPayment.payment_type}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Date & Time:</Text>
                    <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{formatDateTime(selectedPayment.date)}</Text>
                  </View>
                  {selectedPayment.payment_reference && (
                    <View style={styles.modalRow}>
                      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Reference:</Text>
                      <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedPayment.payment_reference}</Text>
                    </View>
                  )}
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Standard:</Text>
                    <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedPayment.standard}</Text>
                  </View>
                </View>
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
  summaryContainer: {
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
  summaryHeader: {
    marginBottom: 16,
  },
  studentName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  studentClass: {
    fontSize: 14,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  tabContent: {
    padding: 16,
  },
  feeCard: {
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
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeType: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  feeDescription: {
    fontSize: 14,
    marginBottom: 12,
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
  viewButton: {
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentCard: {
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 12,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentDetails: {
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 14,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 12,
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
  filterButtonsContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
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
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
    fontSize: 18,
    fontWeight: 'bold',
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 14,
    flex: 1,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
});
