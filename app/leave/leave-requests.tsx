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
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ModalDropdownFilter } from '@/components/ModalDropdownFilter';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLeaveRequests, useAllUsersExceptStudents } from '@/hooks/useApi';
import { GlobalFilters } from '@/components/GlobalFilters';

interface LeaveRequest {
  id: number;
  employee: {
    id: number;
    first_name: string;
    email: string;
    department?: {
      id: number;
      name: string;
    };
  };

  leave_type: string;
  created: string;
  from_date: string;
  to_date: string;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_date: string;
  approved_by?: {
    id: number;
    name: string;
  };
  user: {
    first_name: string;
    email: string;
  }
  approved_date?: string;
  rejection_reason?: string;
}

export default function LeaveRequestsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);


  // Global filters
  const {
    selectedBranch,
    selectedAcademicYear,
    // branches,
    // academicYears,
    branchesLoading,
    academicYearsLoading
  } = useGlobalFilters();

  // const { selectedBranch, selectedAcademicYear } = useGlobalFilters();


  // https://vai.dev.sms.visionariesai.com/api/leave/?branch=1&academic_year=2&employee=204&status=approved&limit=5&omit=modified_by,created_by,l1_approved_by__modified_by,l1_approved_by__group__permissions,l1_approved_by__education_details


  // Fetch 2
  const { data: employees = [], loading: employeesLoading } = useAllUsersExceptStudents({
    branch: selectedBranch,
    academic_year: selectedAcademicYear
  });

  // console.log('employees', employees);

  const requestsParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    employee: selectedEmployee,
    status: selectedStatus,
    leave_type: selectedLeaveType,
    // user: user?.id || null,
    limit: 5,
    omit: 'modified_by,created_by,l1_approved_by__modified_by,l1_approved_by__group__permissions,l1_approved_by__education_details',
    // other: '&user=&limit=5&offset=0&omit=modified_by,created_by,l1_approved_by__modified_by,l1_approved_by__group__permissions,l1_approved_by__education_details',
  }), [selectedBranch, selectedAcademicYear, selectedEmployee, selectedStatus, selectedLeaveType]);


  // &user=&limit=5&offset=0&omit=modified_by,created_by,l1_approved_by__modified_by,l1_approved_by__group__permissions,l1_approved_by__education_details
  const {
    data: leaveRequests = [],
    loading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests
  } = useLeaveRequests(requestsParams);

  // console.log('leaveRequests', leaveRequests);

  // Extract leave types from requests
  const leaveTypes = useMemo(() => {
    const types = new Map();
    leaveRequests.forEach((request: LeaveRequest) => {
      if (request.leave_type) {
        types.set(request.leave_type.id, request.leave_type);
      }
    });
    return Array.from(types.values());
  }, [leaveRequests]);

  // Filter options
  const employeeOptions = useMemo(() => [
    { id: 0, name: 'All Employees' },
    ...employees.map((employee: any) => ({
      id: employee.id,
      name: employee.first_name || employee.email || 'Unnamed Employee'
    }))
  ], [employees]);

  const statusOptions = useMemo(() => [
    { id: 0, name: 'All Statuses' },
    { id: 1, name: 'Pending' },
    { id: 2, name: 'Approved' },
    { id: 3, name: 'Rejected' },
    { id: 4, name: 'Cancelled' }
  ], []);

  const statusMapping = {
    0: null,
    1: 'Pending',
    2: 'Approved',
    3: 'Rejected',
    4: 'Cancelled'
  };

  const leaveTypeOptions = useMemo(() => [
    { id: 0, name: 'All Leave Types' },
    ...leaveTypes.map((type: any) => ({
      id: type.id,
      name: type.name || 'Unnamed Leave Type'
    }))
  ], [leaveTypes]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning || '#f59e0b';
      case 'approved': return colors.success || '#10b981';
      case 'rejected': return colors.error || '#ef4444';
      case 'cancelled': return colors.textSecondary || '#6b7280';
      default: return colors.textSecondary || '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } catch {
      return 0;
    }
  };

  const handleRefresh = () => {
    refetchRequests();
  };

  const handleRequestPress = (request: LeaveRequest) => {
    setSelectedRequest(request);
  };

  const renderRequestCard = ({ item }: { item: LeaveRequest }) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.requestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleRequestPress(item)}
    >
      <View style={styles.requestHeader}>
        <Text style={[styles.employeeName, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.user?.first_name || item.employee?.email || 'Unknown Employee'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <Text style={[styles.leaveType, { color: colors.primary }]}>
        {item.leave_type || 'Unknown Leave Type'}
      </Text>

      <View style={styles.dateRow}>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
          From: {formatDate(item.from_date)}
        </Text>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
          To: {formatDate(item.to_date)}
        </Text>
      </View>

      <Text style={[styles.daysRequested, { color: colors.textSecondary }]}>
        Days Requested: {item.days_requested || calculateDays(item.from_date, item.to_date)}
      </Text>

      {item.reason && (
        <Text style={[styles.reason, { color: colors.textSecondary }]} numberOfLines={2}>
          Reason: {item.reason}
        </Text>
      )}

      <Text style={[styles.appliedDate, { color: colors.textSecondary }]}>
        Applied: {formatDate(item.created)}
      </Text>

      {item.approved_by && (
        <Text style={[styles.approvedBy, { color: colors.textSecondary }]}>
          Approved by: {item.approved_by.name} on {formatDate(item.approved_date || '')}
        </Text>
      )}

      {item.rejection_reason && (
        <Text style={[styles.rejectionReason, { color: colors.error }]} numberOfLines={2}>
          Rejection Reason: {item.rejection_reason}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
        No Leave Requests Found
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        There are no leave requests matching your current filters.
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={[styles.errorTitle, { color: colors.error }]}>
        Unable to Load Leave Requests
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
          title="Leave Requests"
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
        title="Leave Requests"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationPress={() => router.push('/notifications')}
      />

      {/* Global Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            {/* <Text style={[styles.filtersLabel, { color: colors.textSecondary }]}>Filters:</Text> */}

            {/* <ModalDropdownFilter
              label="Branch"
              items={branches || []}
              selectedValue={selectedBranch}
              onValueChange={() => { }} // Read-only from global filters
              compact={true}
            />

            <ModalDropdownFilter
              label="Academic Year"
              items={academicYears || []}
              selectedValue={selectedAcademicYear}
              onValueChange={() => { }} // Read-only from global filters
              compact={true}
            /> */}

            <GlobalFilters />


            <ModalDropdownFilter
              label="Employee"
              items={employeeOptions}
              selectedValue={selectedEmployee || 0}
              onValueChange={(value) => setSelectedEmployee(value === 0 ? null : value)}
              loading={employeesLoading}
              compact={true}
            />

            <ModalDropdownFilter
              label="Status"
              items={statusOptions}
              selectedValue={selectedStatus ? Object.keys(statusMapping).find(key => statusMapping[key] === selectedStatus) || 0 : 0}
              onValueChange={(value) => setSelectedStatus(statusMapping[value])}
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
        {requestsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading leave requests...
            </Text>
          </View>
        ) : requestsError ? (
          renderErrorState()
        ) : (
          <FlatList
            data={leaveRequests}
            renderItem={({ item }) => <View key={item.id}><>{renderRequestCard({ item })}</></View>}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={requestsLoading}
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
  requestCard: {
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
  requestHeader: {
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  leaveType: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
  },
  daysRequested: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  reason: {
    fontSize: 12,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  appliedDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  approvedBy: {
    fontSize: 12,
    marginBottom: 4,
  },
  rejectionReason: {
    fontSize: 12,
    fontStyle: 'italic',
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