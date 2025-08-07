import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ModalDropdownFilter } from '@/components/ModalDropdownFilter';
import { useHostelVisitors } from '@/hooks/useApi';

export default function HostelVisitorsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedVisitorType, setSelectedVisitorType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('today');

  const {
    selectedBranch,
    selectedAcademicYear,
    branches,
    academicYears,
    setSelectedBranch,
    setSelectedAcademicYear
  } = useGlobalFilters();

  // Fetch visitors with filters
  const visitorsParams = useMemo(() => ({
    branch: selectedBranch,
    ...(selectedVisitorType && { visitor_type: selectedVisitorType }),
    ...(selectedStatus && { status: selectedStatus }),
    ...(dateFilter !== 'all' && { date_filter: dateFilter }),
  }), [selectedBranch, selectedVisitorType, selectedStatus, dateFilter]);

  const {
    data: visitors = [],
    loading: visitorsLoading,
    error: visitorsError,
    refetch: refetchVisitors
  } = useHostelVisitors(visitorsParams);

  const visitorTypeOptions = [
    { id: null, name: 'All Types' },
    { id: 'parent', name: 'Parent' },
    { id: 'guardian', name: 'Guardian' },
    { id: 'relative', name: 'Relative' },
    { id: 'friend', name: 'Friend' },
    { id: 'official', name: 'Official' }
  ];

  const statusOptions = [
    { id: null, name: 'All Status' },
    { id: 'checked_in', name: 'Checked In' },
    { id: 'checked_out', name: 'Checked Out' },
    { id: 'pending', name: 'Pending Approval' }
  ];

  const dateFilterOptions = [
    { id: 'today', name: 'Today' },
    { id: 'this_week', name: 'This Week' },
    { id: 'this_month', name: 'This Month' },
    { id: 'all', name: 'All Time' }
  ];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'checked_in': return '#10B981';
      case 'checked_out': return '#6B7280';
      case 'pending': return '#F59E0B';
      default: return '#8B5CF6';
    }
  };

  const handleVisitorAction = (visitor: any) => {
    if (visitor.status === 'checked_in') {
      Alert.alert(
        'Check Out Visitor',
        `Check out ${visitor.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Check Out', onPress: () => console.log('Check out visitor:', visitor.id) }
        ]
      );
    } else if (visitor.status === 'pending') {
      Alert.alert(
        'Approve Visit',
        `Approve visit request for ${visitor.name}?`,
        [
          { text: 'Deny', style: 'destructive', onPress: () => console.log('Deny visitor:', visitor.id) },
          { text: 'Approve', onPress: () => console.log('Approve visitor:', visitor.id) }
        ]
      );
    }
  };

  const renderVisitorCard = (visitor: any) => (
    <View
      key={visitor.id}
      style={[
        styles.visitorCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderLeftColor: getStatusColor(visitor.status)
        }
      ]}
    >
      <View style={styles.visitorHeader}>
        <View style={styles.visitorInfo}>
          <Text style={[styles.visitorName, { color: colors.textPrimary }]}>
            {visitor?.name || 'Unknown Visitor'}
          </Text>
          <Text style={[styles.visitorType, { color: colors.textSecondary }]}>
            {visitor?.visitor_type || 'Unknown'} • {visitor?.phone || 'No phone'}
          </Text>
          {visitor?.student?.name && (
            <Text style={[styles.studentInfo, { color: colors.textSecondary }]}>
              Visiting: {visitor.student.name}
            </Text>
          )}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(visitor.status) }]}>
          <Text style={styles.statusText}>
            {(visitor.status || '').replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.visitDetails}>
        {visitor?.check_in_time && (
          <Text style={[styles.visitTime, { color: colors.textPrimary }]}>
            🕒 Check In: {new Date(visitor.check_in_time).toLocaleString()}
          </Text>
        )}
        {visitor?.check_out_time && (
          <Text style={[styles.visitTime, { color: colors.textSecondary }]}>
            🚪 Check Out: {new Date(visitor.check_out_time).toLocaleString()}
          </Text>
        )}
        {visitor?.purpose && (
          <Text style={[styles.purpose, { color: colors.textSecondary }]}>
            Purpose: {visitor.purpose}
          </Text>
        )}
      </View>

      {(visitor.status === 'checked_in' || visitor.status === 'pending') && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: visitor.status === 'pending' ? colors.primary : '#6B7280'
            }
          ]}
          onPress={() => handleVisitorAction(visitor)}
        >
          <Text style={styles.actionButtonText}>
            {visitor.status === 'pending' ? 'Approve/Deny' : 'Check Out'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Hostel Visitors"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
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
              label="Visitor Type"
              items={visitorTypeOptions}
              selectedValue={selectedVisitorType}
              onValueChange={setSelectedVisitorType}
              compact={true}
            />

            <ModalDropdownFilter
              label="Status"
              items={statusOptions}
              selectedValue={selectedStatus}
              onValueChange={setSelectedStatus}
              compact={true}
            />

            <ModalDropdownFilter
              label="Date"
              items={dateFilterOptions}
              selectedValue={dateFilter}
              onValueChange={setDateFilter}
              compact={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      {visitorsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading visitors...
          </Text>
        </View>
      ) : visitorsError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Failed to load visitors. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetchVisitors}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={visitorsLoading}
              onRefresh={refetchVisitors}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {visitors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No visitors found for the selected criteria
              </Text>
            </View>
          ) : (
            <View style={styles.visitorsList}>
              {visitors.map(renderVisitorCard)}
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Visitor Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/hostel/add-visitor')}
      >
        <Text style={styles.addButtonText}>+ Add Visitor</Text>
      </TouchableOpacity>
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
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  visitorsList: {
    padding: 16,
  },
  visitorCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  visitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  visitorInfo: {
    flex: 1,
  },
  visitorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  visitorType: {
    fontSize: 14,
    marginBottom: 4,
  },
  studentInfo: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  visitDetails: {
    marginBottom: 16,
  },
  visitTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  purpose: {
    fontSize: 12,
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});