
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';

interface PayrollRecord {
  id: string;
  staffName: string;
  department: string;
  role: string;
  basicSalary: number;
  deductions: number;
  bonus: number;
  netSalary: number;
  status: 'Paid' | 'Pending';
  month: string;
  payDate?: string;
}

export default function StaffPayrollScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterMonth, setFilterMonth] = useState('January 2024');
  const [addPayrollModalVisible, setAddPayrollModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);

  const payrollRecords: PayrollRecord[] = [
    {
      id: '1',
      staffName: 'John Smith',
      department: 'Mathematics',
      role: 'Teacher',
      basicSalary: 50000,
      deductions: 2000,
      bonus: 5000,
      netSalary: 53000,
      status: 'Paid',
      month: 'January 2024',
      payDate: '2024-01-31'
    },
    {
      id: '2',
      staffName: 'Emily Johnson',
      department: 'Physics',
      role: 'Head Teacher',
      basicSalary: 60000,
      deductions: 2500,
      bonus: 8000,
      netSalary: 65500,
      status: 'Pending',
      month: 'January 2024'
    },
    {
      id: '3',
      staffName: 'Michael Brown',
      department: 'Administration',
      role: 'Admin',
      basicSalary: 45000,
      deductions: 1500,
      bonus: 3000,
      netSalary: 46500,
      status: 'Paid',
      month: 'January 2024',
      payDate: '2024-01-30'
    }
  ];

  const roles = ['All', 'Teacher', 'Head Teacher', 'Admin', 'Staff'];
  const months = ['January 2024', 'December 2023', 'November 2023'];

  const filteredRecords = payrollRecords.filter(record => {
    const matchesSearch = record.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'All' || record.role === filterRole;
    const matchesMonth = record.month === filterMonth;
    return matchesSearch && matchesRole && matchesMonth;
  });

  const handleViewDetails = (record: PayrollRecord) => {
    setSelectedPayroll(record);
    setDetailsModalVisible(true);
  };

  const handleDownloadSlip = (recordId: string) => {
    console.log('Downloading payslip for:', recordId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderPayrollCard = (record: PayrollRecord) => (
    <View key={record.id} style={[styles.payrollCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.payrollHeader}>
        <View style={styles.staffInfo}>
          <Text style={[styles.staffName, { color: colors.textPrimary }]}>{record.staffName}</Text>
          <Text style={[styles.staffDepartment, { color: colors.textSecondary }]}>
            {record.department} • {record.role}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: record.status === 'Paid' ? '#10B981' : '#F59E0B' }
        ]}>
          <Text style={styles.statusText}>{record.status}</Text>
        </View>
      </View>
      
      <View style={styles.salaryInfo}>
        <View style={styles.salaryRow}>
          <Text style={[styles.salaryLabel, { color: colors.textSecondary }]}>Basic Salary:</Text>
          <Text style={[styles.salaryValue, { color: colors.textPrimary }]}>
            {formatCurrency(record.basicSalary)}
          </Text>
        </View>
        <View style={styles.salaryRow}>
          <Text style={[styles.salaryLabel, { color: colors.textSecondary }]}>Deductions:</Text>
          <Text style={[styles.salaryValue, { color: '#EF4444' }]}>
            -{formatCurrency(record.deductions)}
          </Text>
        </View>
        <View style={styles.salaryRow}>
          <Text style={[styles.salaryLabel, { color: colors.textSecondary }]}>Bonus:</Text>
          <Text style={[styles.salaryValue, { color: '#10B981' }]}>
            +{formatCurrency(record.bonus)}
          </Text>
        </View>
        <View style={[styles.salaryRow, styles.netSalaryRow]}>
          <Text style={[styles.salaryLabel, styles.netSalaryLabel, { color: colors.textPrimary }]}>Net Salary:</Text>
          <Text style={[styles.salaryValue, styles.netSalaryValue, { color: colors.textPrimary }]}>
            {formatCurrency(record.netSalary)}
          </Text>
        </View>
      </View>

      {record.payDate && (
        <Text style={[styles.payDate, { color: colors.textSecondary }]}>
          Paid on: {record.payDate}
        </Text>
      )}
      
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.primary }]}
          onPress={() => handleViewDetails(record)}
        >
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => handleDownloadSlip(record.id)}
        >
          <Text style={styles.downloadButtonText}>Download Slip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Staff Payroll"
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
          placeholder="Search by staff name or department..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Role:</Text>
            {roles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.filterButton,
                  { borderColor: colors.border },
                  filterRole === role && { backgroundColor: colors.primary }
                ]}
                onPress={() => setFilterRole(role)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: filterRole === role ? '#FFFFFF' : colors.textPrimary }
                ]}>
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Month:</Text>
            {months.map((month) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.filterButton,
                  { borderColor: colors.border },
                  filterMonth === month && { backgroundColor: colors.primary }
                ]}
                onPress={() => setFilterMonth(month)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: filterMonth === month ? '#FFFFFF' : colors.textPrimary }
                ]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setAddPayrollModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add Payroll Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Payroll List */}
      <ScrollView style={styles.payrollList}>
        {filteredRecords.length > 0 ? (
          filteredRecords.map(renderPayrollCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No payroll records found
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
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Payroll Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedPayroll && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Staff Information</Text>
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    Name: {selectedPayroll.staffName}
                  </Text>
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    Department: {selectedPayroll.department}
                  </Text>
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    Role: {selectedPayroll.role}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Salary Breakdown</Text>
                  <View style={styles.salaryBreakdown}>
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Basic Salary</Text>
                      <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>
                        {formatCurrency(selectedPayroll.basicSalary)}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Bonus</Text>
                      <Text style={[styles.breakdownValue, { color: '#10B981' }]}>
                        +{formatCurrency(selectedPayroll.bonus)}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Deductions</Text>
                      <Text style={[styles.breakdownValue, { color: '#EF4444' }]}>
                        -{formatCurrency(selectedPayroll.deductions)}
                      </Text>
                    </View>
                    <View style={[styles.breakdownRow, styles.totalRow]}>
                      <Text style={[styles.breakdownLabel, styles.totalLabel, { color: colors.textPrimary }]}>Net Salary</Text>
                      <Text style={[styles.breakdownValue, styles.totalValue, { color: colors.textPrimary }]}>
                        {formatCurrency(selectedPayroll.netSalary)}
                      </Text>
                    </View>
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
  addButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  payrollList: {
    flex: 1,
    padding: 16,
  },
  payrollCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  payrollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  staffDepartment: {
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
  salaryInfo: {
    marginBottom: 12,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  salaryLabel: {
    fontSize: 14,
  },
  salaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  netSalaryRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 8,
  },
  netSalaryLabel: {
    fontWeight: 'bold',
  },
  netSalaryValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  payDate: {
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
  downloadButtonText: {
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
  salaryBreakdown: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 16,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});
