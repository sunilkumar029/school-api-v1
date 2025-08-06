
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { Picker } from '@react-native-picker/picker';
import { useFeeDashboardAnalytics, useBranches, useAcademicYears } from '@/hooks/useApi';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  total_students: number;
  total_standard_fee: number;
  total_students_fee: number;
  total_concessions: number;
  total_payments: number;
  total_pending: number;
  fee_type_analytics: Array<{
    fee_type: number;
    fee_type_name: string;
    expected: number;
    collected: number;
    pending: number;
  }>;
  monthly_collections: Array<{
    month: string;
    collected: number;
    expected: number;
  }>;
  standard_collections: Array<{
    standard: string;
    collected: number;
    expected: number;
  }>;
  latest_paid_fees: Array<{
    id: number;
    user_id: number;
    user__first_name: string;
    user__last_name: string;
    user__standard__name: string;
    amount: number;
    payment_date: string;
  }>;
}

export default function StudentFeeAnalyticsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);

  // Fetch data
  const analyticsParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
  }), [selectedBranch, selectedAcademicYear]);

  const { data: analytics, loading: analyticsLoading, refetch: refetchAnalytics } = useFeeDashboardAnalytics(analyticsParams);
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears({ is_active: true });

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

  const renderSummaryTable = () => {
    if (!analytics) return null;

    const summaryData = [
      { label: 'Total Students', value: analytics.total_students.toString() },
      { label: 'Total Standard Fee', value: formatCurrency(analytics.total_standard_fee) },
      { label: 'Total Student Fee', value: formatCurrency(analytics.total_students_fee) },
      { label: 'Total Concessions', value: formatCurrency(analytics.total_concessions) },
      { label: 'Total Payments', value: formatCurrency(analytics.total_payments) },
      { label: 'Total Pending Amount', value: formatCurrency(analytics.total_pending) },
    ];

    return (
      <View style={[styles.summaryContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Fee Summary</Text>
        {summaryData.map((item, index) => (
          <View key={index} style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{item.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderMonthlyCollection = () => {
    if (!analytics?.monthly_collections) return null;

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Monthly Fee Collection</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.barChart}>
            {analytics.monthly_collections.map((item, index) => {
              const maxValue = Math.max(...analytics.monthly_collections.map(m => Math.max(m.expected, m.collected)));
              const expectedHeight = (item.expected / maxValue) * 120;
              const collectedHeight = (item.collected / maxValue) * 120;
              
              return (
                <View key={index} style={styles.barGroup}>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { height: expectedHeight, backgroundColor: colors.primary + '40' }]} />
                    <View style={[styles.bar, { height: collectedHeight, backgroundColor: colors.primary, marginLeft: 4 }]} />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{item.month}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.primary + '40' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Expected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Collected</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderFeeTypeAnalytics = () => {
    if (!analytics?.fee_type_analytics) return null;

    return (
      <View style={[styles.tableContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Fee Type Analytics</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { color: colors.textPrimary }]}>Fee Type</Text>
          <Text style={[styles.tableHeaderText, { color: colors.textPrimary }]}>Expected</Text>
          <Text style={[styles.tableHeaderText, { color: colors.textPrimary }]}>Collected</Text>
          <Text style={[styles.tableHeaderText, { color: colors.textPrimary }]}>Pending</Text>
        </View>
        {analytics.fee_type_analytics.slice(0, 10).map((item, index) => (
          <View key={index} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.tableCellText, { color: colors.textPrimary }]} numberOfLines={2}>
              {item.fee_type_name}
            </Text>
            <Text style={[styles.tableCellAmount, { color: colors.textSecondary }]}>
              {formatCurrency(item.expected)}
            </Text>
            <Text style={[styles.tableCellAmount, { color: '#10B981' }]}>
              {formatCurrency(item.collected)}
            </Text>
            <Text style={[styles.tableCellAmount, { color: item.pending > 0 ? '#EF4444' : '#10B981' }]}>
              {formatCurrency(item.pending)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderStandardCollection = () => {
    if (!analytics?.standard_collections) return null;

    return (
      <View style={[styles.tableContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Standard-wise Fee Collection</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { color: colors.textPrimary }]}>Standard</Text>
          <Text style={[styles.tableHeaderText, { color: colors.textPrimary }]}>Expected</Text>
          <Text style={[styles.tableHeaderText, { color: colors.textPrimary }]}>Collected</Text>
          <Text style={[styles.tableHeaderText, { color: colors.textPrimary }]}>Pending</Text>
        </View>
        {analytics.standard_collections.filter(item => item.expected > 0).map((item, index) => {
          const pending = item.expected - item.collected;
          return (
            <View key={index} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.tableCellText, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.standard}
              </Text>
              <Text style={[styles.tableCellAmount, { color: colors.textSecondary }]}>
                {formatCurrency(item.expected)}
              </Text>
              <Text style={[styles.tableCellAmount, { color: '#10B981' }]}>
                {formatCurrency(item.collected)}
              </Text>
              <Text style={[styles.tableCellAmount, { color: pending > 0 ? '#EF4444' : '#10B981' }]}>
                {formatCurrency(pending)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderLatestPayments = () => {
    if (!analytics?.latest_paid_fees) return null;

    return (
      <View style={[styles.tableContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Latest Paid Fees</Text>
        {analytics.latest_paid_fees.slice(0, 10).map((payment, index) => (
          <View key={index} style={[styles.paymentCard, { borderBottomColor: colors.border }]}>
            <View style={styles.paymentHeader}>
              <Text style={[styles.paymentStudent, { color: colors.textPrimary }]}>
                {payment.user__first_name} {payment.user__last_name}
              </Text>
              <Text style={[styles.paymentAmount, { color: '#10B981' }]}>
                {formatCurrency(payment.amount)}
              </Text>
            </View>
            <View style={styles.paymentDetails}>
              <Text style={[styles.paymentStandard, { color: colors.textSecondary }]}>
                {payment.user__standard__name}
              </Text>
              <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>
                {formatDate(payment.payment_date)}
              </Text>
            </View>
          </View>
        ))}
      </View>
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Fee Analytics"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Filter Button */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.primary }]}
          onPress={() => setFiltersVisible(true)}
        >
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={analyticsLoading}
            onRefresh={refetchAnalytics}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {analyticsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading analytics...
            </Text>
          </View>
        ) : analytics ? (
          <View style={styles.analyticsContent}>
            {renderSummaryTable()}
            {renderMonthlyCollection()}
            {renderFeeTypeAnalytics()}
            {renderStandardCollection()}
            {renderLatestPayments()}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No analytics data available
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
  filterContainer: {
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  analyticsContent: {
    padding: 16,
  },
  summaryContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 160,
    paddingBottom: 20,
  },
  barGroup: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
  },
  bar: {
    width: 12,
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    width: 32,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  tableContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  tableCellText: {
    flex: 1,
    fontSize: 12,
    textAlign: 'left',
  },
  tableCellAmount: {
    flex: 1,
    fontSize: 11,
    textAlign: 'center',
  },
  paymentCard: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentStudent: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentStandard: {
    fontSize: 12,
  },
  paymentDate: {
    fontSize: 12,
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
    maxHeight: '70%',
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
});
