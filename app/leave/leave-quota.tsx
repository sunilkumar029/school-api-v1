import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ProgressBarAndroid,
  Platform,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ModalDropdownFilter } from '@/components/ModalDropdownFilter';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLeaveQuota, useAllUsersExceptStudents } from '@/hooks/useApi';
import { ApiService } from '@/services/ApiService'; // Assuming ApiService is available

interface LeaveQuota {
  id: number;
  employee: {
    id: number;
    name: string;
    email: string;
    department?: {
      id: number;
      name: string;
    };
  };
  leave_type: {
    id: number;
    name: string;
    max_days_per_year: number;
  };
  year: number;
  total_allocated: number;
  used_days: number;
  remaining_days: number;
  pending_days: number;
  last_updated: string;
}

// Mocking or implementing a circuit breaker pattern
const circuitBreaker = (apiCall: Function, fallback: Function) => async (...args: any[]) => {
  try {
    const response = await apiCall(...args);
    if (response.ok) {
      return response.json();
    }
    throw new Error(`API error: ${response.statusText}`);
  } catch (error) {
    console.error("API call failed, falling back:", error);
    return fallback();
  }
};

// Mock fallback data for events
const mockEventsFallback = () => {
  console.log("Using mock events data.");
  return Promise.resolve({ events: [] }); // Return an empty array or mock data
};

// Mock fallback data for classes
const mockClassesFallback = () => {
  console.log("Using mock classes data.");
  return Promise.resolve({ classes: [] }); // Return an empty array or mock data
};

// Mock fallback data for student fees
const mockStudentFeesFallback = () => {
  console.log("Using mock student fees data.");
  return Promise.resolve({ fees: [] }); // Return an empty array or mock data
};


export default function LeaveQuotaScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
  const [selectedLeaveType, setSelectedLeaveType] = useState<number | null>(null);

  // Global filters
  const {
    selectedBranch,
    selectedAcademicYear,
    branches,
    academicYears,
    branchesLoading,
    academicYearsLoading
  } = useGlobalFilters();

  // Fetch data
  const { data: employees = [], loading: employeesLoading } = useAllUsersExceptStudents({
    branch: selectedBranch,
    academic_year: selectedAcademicYear
  });

  const quotaParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    employee: selectedEmployee,
    year: selectedYear,
    leave_type: selectedLeaveType,
  }), [selectedBranch, selectedAcademicYear, selectedEmployee, selectedYear, selectedLeaveType]);

  // Corrected API endpoint for leave quotas
  const {
    data: leaveQuotas = [],
    loading: quotasLoading,
    error: quotasError,
    refetch: refetchQuotas
  } = useLeaveQuota(quotaParams);

  // Extract leave types from quotas
  const leaveTypes = useMemo(() => {
    if (!leaveQuotas || !Array.isArray(leaveQuotas)) return [];

    const types = new Map();
    leaveQuotas.forEach((quota: LeaveQuota) => {
      if (quota.leave_type) {
        types.set(quota.leave_type.id, quota.leave_type);
      }
    });
    return Array.from(types.values());
  }, [leaveQuotas]);

  // Generate year options (current year ± 5 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      years.push({ id: year, name: year.toString() });
    }
    return years;
  }, []);

  // Filter options
  const employeeOptions = useMemo(() => [
    { id: 0, name: 'All Employees' },
    ...(employees || []).map((employee: any) => ({
      id: employee.id,
      name: employee.name || employee.email || 'Unnamed Employee'
    }))
  ], [employees]);

  const leaveTypeOptions = useMemo(() => [
    { id: 0, name: 'All Leave Types' },
    ...(leaveTypes || []).map((type: any) => ({
      id: type.id,
      name: type.name || 'Unnamed Leave Type'
    }))
  ], [leaveTypes]);

  const getUsageColor = (used: number, total: number) => {
    if (total === 0) return colors.textSecondary || '#6b7280'; // Handle division by zero
    const percentage = (used / total) * 100;
    if (percentage >= 90) return colors.error || '#ef4444';
    if (percentage >= 70) return colors.warning || '#f59e0b';
    if (percentage >= 50) return colors.info || '#3b82f6';
    return colors.success || '#10b981';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      // Ensure the date string is valid before creating a Date object
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString();
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
    }
  };

  const handleRefresh = () => {
    refetchQuotas();
  };

  const renderProgressBar = (used: number, total: number) => {
    const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;

    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBackground, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
                backgroundColor: getUsageColor(used, total)
              }
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {percentage.toFixed(1)}%
        </Text>
      </View>
    );
  };

  const renderQuotaCard = ({ item }: { item: LeaveQuota }) => (
    <View style={[styles.quotaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.quotaHeader}>
        <Text style={[styles.employeeName, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.employee?.name || item.employee?.email || 'Unknown Employee'}
        </Text>
        <Text style={[styles.year, { color: colors.primary }]}>
          {item.year}
        </Text>
      </View>

      <Text style={[styles.leaveType, { color: colors.primary }]}>
        {item.leave_type?.name || 'Unknown Leave Type'}
      </Text>

      <View style={styles.quotaStats}>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Allocated:</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{item.total_allocated} days</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Used:</Text>
          <Text style={[styles.statValue, { color: getUsageColor(item.used_days, item.total_allocated) }]}>
            {item.used_days} days
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining:</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>{item.remaining_days} days</Text>
        </View>

        {item.pending_days > 0 && (
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending:</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>{item.pending_days} days</Text>
          </View>
        )}
      </View>

      {renderProgressBar(item.used_days, item.total_allocated)}

      <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
        Last Updated: {formatDate(item.last_updated)}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
        No Leave Quotas Found
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        There are no leave quotas matching your current filters.
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={[styles.errorTitle, { color: colors.error }]}>
        Unable to Load Leave Quotas
      </Text>
      <Text style={[styles.errorText, { color: colors.textSecondary }]}>
        Please check your connection and try again.
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={handleRefresh}
      >
        <Text style={[styles.retryButtonText, { color: colors.surface }]}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (branchesLoading || academicYearsLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar
          title="Leave Quota"
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationPress={() => router.push('/notifications')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading filters...
          </Text>
        </View>
        <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Leave Quota"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationPress={() => router.push('/notifications')}
      />

      {/* Global Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Text style={[styles.filtersLabel, { color: colors.textSecondary }]}>Filters:</Text>

            <ModalDropdownFilter
              label="Branch"
              items={branches || []}
              selectedValue={selectedBranch}
              onValueChange={() => {}} // Read-only from global filters
              compact={true}
            />

            <ModalDropdownFilter
              label="Academic Year"
              items={academicYears || []}
              selectedValue={selectedAcademicYear}
              onValueChange={() => {}} // Read-only from global filters
              compact={true}
            />

            <ModalDropdownFilter
              label="Employee"
              items={employeeOptions}
              selectedValue={selectedEmployee || 0}
              onValueChange={(value) => setSelectedEmployee(value === 0 ? null : value)}
              loading={employeesLoading}
              compact={true}
            />

            <ModalDropdownFilter
              label="Year"
              items={yearOptions}
              selectedValue={selectedYear || new Date().getFullYear()}
              onValueChange={(value) => setSelectedYear(value)}
              compact={true}
            />

            <ModalDropdownFilter
              label="Leave Type"
              items={leaveTypeOptions}
              selectedValue={selectedLeaveType || 0}
              onValueChange={(value) => setSelectedLeaveType(value === 0 ? null : value)}
              compact={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {quotasLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading leave quotas...
            </Text>
          </View>
        ) : quotasError ? (
          renderErrorState()
        ) : (
          <FlatList
            data={leaveQuotas}
            renderItem={renderQuotaCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={quotasLoading}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  quotaCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  year: {
    fontSize: 14,
    fontWeight: '600',
  },
  leaveType: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  quotaStats: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    minWidth: 40,
  },
  lastUpdated: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});