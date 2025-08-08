import React, { useState, useEffect, useMemo } from 'react';
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
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ModalDropdownFilter } from '@/components/ModalDropdownFilter';
import { useTotalFeeSummary, useStandards } from '@/hooks/useApi';

interface FeeItem {
  id: number;
  student_name: string;
  standard: string;
  section: string;
  total_fee: number;
  paid_amount: number;
  pending_amount: number;
  status: 'paid' | 'partial' | 'pending';
  due_date: string;
}

export default function StudentFeeListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStandard, setSelectedStandard] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const {
    selectedBranch,
    selectedAcademicYear,
    branches,
    academicYears,
    setSelectedBranch,
    setSelectedAcademicYear
  } = useGlobalFilters();

  // API parameters
  const apiParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    standard: selectedStandard,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  }), [selectedBranch, selectedAcademicYear, selectedStandard, selectedStatus]);

  const { data: feeData, loading, error, refetch } = useTotalFeeSummary(apiParams);
  const { data: standards } = useStandards({
    branch: selectedBranch,
    academic_year: selectedAcademicYear
  });

  const standardOptions = useMemo(() => {
    const options = [{ id: 0, name: 'All Standards' }];
    if (standards) {
      options.push(...standards.map(s => ({ id: s.id, name: s.name })));
    }
    return options;
  }, [standards]);

  const statusOptions = [
    { id: 'all', name: 'All Status' },
    { id: 'paid', name: 'Paid' },
    { id: 'partial', name: 'Partial' },
    { id: 'pending', name: 'Pending' },
  ];

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!feeData) return [];

    let filtered = feeData;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.student_name?.toLowerCase().includes(query) ||
        item.standard?.toLowerCase().includes(query) ||
        item.section?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [feeData, searchQuery]);

  const handleRefresh = () => {
    refetch();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'partial': return '#FF9800';
      case 'pending': return '#F44336';
      default: return colors.textSecondary;
    }
  };

  const handleViewDetails = (item: FeeItem) => {
    router.push(`/finance/student-fee-details?id=${item.id}`);
  };

  const renderFeeItem = (item: FeeItem) => (
    <TouchableOpacity
      key={`fee-card-${item.id}`}
      style={[styles.feeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleViewDetails(item)}
    >
      <View style={styles.feeHeader}>
        <Text style={[styles.studentName, { color: colors.textPrimary }]}>
          {item.student_name}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.feeDetails}>
        <Text style={[styles.classInfo, { color: colors.textSecondary }]}>
          {item.standard} - {item.section}
        </Text>

        <View style={styles.amountRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Total Fee:</Text>
          <Text style={[styles.amount, { color: colors.textPrimary }]}>
            ₹{item.total_fee?.toLocaleString() || 0}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Paid:</Text>
          <Text style={[styles.amount, { color: '#4CAF50' }]}>
            ₹{item.paid_amount?.toLocaleString() || 0}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Pending:</Text>
          <Text style={[styles.amount, { color: '#F44336' }]}>
            ₹{item.pending_amount?.toLocaleString() || 0}
          </Text>
        </View>

        {item.due_date && (
          <Text style={[styles.dueDate, { color: colors.textSecondary }]}>
            Due: {new Date(item.due_date).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar
          title="Student Fee List"
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationsPress={() => router.push('/(tabs)/notifications')}
          onSettingsPress={() => router.push('/(tabs)/settings')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading fee data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Student Fee List"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Global Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContentContainer}
        >
          <View style={styles.filtersRow}>
            <Text style={[styles.filtersLabel, { color: colors.textSecondary }]}>Filters:</Text>

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

            <ModalDropdownFilter
              label="Standard"
              items={standardOptions}
              selectedValue={selectedStandard || 0}
              onValueChange={(value) => setSelectedStandard(value === 0 ? null : value)}
              compact={true}
            />

            <ModalDropdownFilter
              label="Status"
              items={statusOptions}
              selectedValue={selectedStatus}
              onValueChange={setSelectedStatus}
              compact={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          placeholder="Search by student name, standard, or section..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {error && (
          <View style={[styles.errorCard, { backgroundColor: '#FFEBEE', borderColor: '#F44336' }]}>
            <Text style={[styles.errorText, { color: '#C62828' }]}>{error}</Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Fee Summary ({filteredData.length} students)
        </Text>

        {filteredData.map((fee, index) => (
            <TouchableOpacity
              key={`fee-${fee.id}-${index}`}
              style={[styles.feeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleViewDetails(fee)}
            >
              <View style={styles.feeHeader}>
                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: colors.textPrimary }]}>
                    {fee.student?.user?.first_name} {fee.student?.user?.last_name}
                  </Text>
                  <Text style={[styles.admissionNumber, { color: colors.textSecondary }]}>
                    #{fee.student?.admission_number}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(fee.payment_status) }]}>
                  <Text style={styles.statusText}>{fee.payment_status || 'Pending'}</Text>
                </View>
              </View>

              <View style={styles.feeDetails}>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Class:</Text>
                  <Text style={[styles.feeValue, { color: colors.textPrimary }]}>
                    {fee.student?.standard?.name} - {fee.student?.section?.name}
                  </Text>
                </View>

                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Total Amount:</Text>
                  <Text style={[styles.feeValue, { color: colors.textPrimary }]}>
                    ₹{fee.total_amount?.toLocaleString() || '0'}
                  </Text>
                </View>

                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Paid Amount:</Text>
                  <Text style={[styles.feeValue, { color: colors.success || '#10B981' }]}>
                    ₹{fee.paid_amount?.toLocaleString() || '0'}
                  </Text>
                </View>

                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Due Amount:</Text>
                  <Text style={[styles.feeValue, { color: colors.error || '#EF4444' }]}>
                    ₹{fee.due_amount?.toLocaleString() || '0'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.viewButton, { borderColor: colors.primary }]}
                onPress={() => {
                  console.log("View Details pressed for fee:", fee.id);
                  handleViewDetails(fee);
                }}
              >
                <Text style={[styles.viewButtonText, { color: colors.primary }]}>View Details</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

        {filteredData.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No fee data found for the selected criteria
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filtersContentContainer: {
    paddingRight: 32,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: '100%',
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: '600',
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
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  feeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  admissionNumber: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  feeDetails: {
    gap: 8,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  viewButton: {
    marginTop: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
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
});