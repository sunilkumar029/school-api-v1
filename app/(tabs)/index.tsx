
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { GlobalFilters } from '@/components/GlobalFilters';
import { OverviewCard } from '@/components/OverviewCard';
import { QuickActionButton } from '@/components/QuickActionButton';
import { RecentActivityItem } from '@/components/RecentActivityItem';
import { EventItem } from '@/components/EventItem';
import { 
  useEvents, 
  useNotifications, 
  useAttendanceDashboard, 
  useFeeDashboardAnalytics,
  useTasks,
  useLeaveRequests,
  useInventoryDashboard
} from '@/hooks/useApi';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { selectedBranch, selectedAcademicYear } = useGlobalFilters();

  // API parameters with global filters
  const apiParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    limit: 5,
  }), [selectedBranch, selectedAcademicYear]);

  // API hooks
  const { data: events, loading: eventsLoading, refetch: refetchEvents } = useEvents({
    ...apiParams,
    ordering: '-start_date',
    limit: 3,
  });

  const { data: notifications, loading: notificationsLoading, refetch: refetchNotifications } = useNotifications({
    ...apiParams,
    ordering: '-created',
    limit: 5,
  });

  const { data: attendanceDashboard, loading: attendanceLoading, refetch: refetchAttendance } = useAttendanceDashboard();

  const { data: feeDashboard, loading: feeLoading, refetch: refetchFees } = useFeeDashboardAnalytics(apiParams);

  const { data: tasks, loading: tasksLoading, refetch: refetchTasks } = useTasks({
    ...apiParams,
    limit: 5,
  });

  const { data: leaveRequests, loading: leaveLoading, refetch: refetchLeave } = useLeaveRequests({
    ...apiParams,
    limit: 5,
  });

  const { data: inventoryDashboard, loading: inventoryLoading, refetch: refetchInventory } = useInventoryDashboard(apiParams);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchEvents(),
      refetchNotifications(),
      refetchAttendance(),
      refetchFees(),
      refetchTasks(),
      refetchLeave(),
      refetchInventory(),
    ]);
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 17) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  };

  const overviewCards = [
    {
      title: 'Attendance',
      value: attendanceDashboard?.attendance_percentage || (attendanceLoading ? '...' : '0%'),
      subtitle: attendanceDashboard?.total_days ? `${attendanceDashboard.present_days}/${attendanceDashboard.total_days} days` : (attendanceLoading ? 'Loading...' : 'No data'),
      color: '#4CAF50',
      onPress: () => router.push('/attendance-dashboard'),
    },
    {
      title: 'Events',
      value: eventsLoading ? '...' : (events?.length?.toString() || '0'),
      subtitle: eventsLoading ? 'Loading...' : 'Upcoming events',
      color: '#2196F3',
      onPress: () => router.push('/(tabs)/events'),
    },
    {
      title: 'Tasks',
      value: tasksLoading ? '...' : (tasks?.length?.toString() || '0'),
      subtitle: tasksLoading ? 'Loading...' : 'Pending tasks',
      color: '#FF9800',
      onPress: () => router.push('/tasks/task-list'),
    },
    {
      title: 'Notifications',
      value: notificationsLoading ? '...' : (notifications?.length?.toString() || '0'),
      subtitle: notificationsLoading ? 'Loading...' : 'Recent updates',
      color: '#9C27B0',
      onPress: () => router.push('/(tabs)/notifications'),
    },
    {
      title: 'Fee Status',
      value: feeLoading ? '...' : (feeDashboard?.total_fees ? `₹${feeDashboard.total_fees}` : '₹0'),
      subtitle: feeLoading ? 'Loading...' : (feeDashboard?.paid_amount ? `₹${feeDashboard.paid_amount} paid` : 'No payments'),
      color: '#F44336',
      onPress: () => router.push('/finance/student-fee-analytics'),
    },
    {
      title: 'Inventory',
      value: inventoryLoading ? '...' : (inventoryDashboard?.total_items?.toString() || '0'),
      subtitle: inventoryLoading ? 'Loading...' : (inventoryDashboard?.low_stock_count ? `${inventoryDashboard.low_stock_count} low stock` : 'All good'),
      color: '#607D8B',
      onPress: () => router.push('/inventory-dashboard'),
    },
  ];

  const quickActions = [
    {
      title: 'Apply Leave',
      icon: '🏖️',
      color: '#E91E63',
      onPress: () => router.push('/leave/leave-requests'),
    },
    {
      title: 'View Timetable',
      icon: '📅',
      color: '#3F51B5',
      onPress: () => router.push('/academics/staff-timetable'),
    },
    {
      title: 'Mark Attendance',
      icon: '✅',
      color: '#4CAF50',
      onPress: () => router.push('/academics/student-attendance'),
    },
    {
      title: 'Chat',
      icon: '💬',
      color: '#FF5722',
      onPress: () => router.push('/chat'),
    },
    {
      title: 'Student Fees',
      icon: '💳',
      color: '#795548',
      onPress: () => router.push('/finance/student-fee-list'),
    },
    {
      title: 'Support',
      icon: '🎧',
      color: '#009688',
      onPress: () => router.push('/support'),
    },
  ];

  const recentActivities = [
    ...(notifications || []).slice(0, 3).map(notification => ({
      id: `notification-${notification.id}`,
      user: notification.created_by ? `${notification.created_by.first_name} ${notification.created_by.last_name}`.trim() : 'System',
      action: notification.notification_sub_type || 'created',
      target: notification.title,
      timestamp: formatDate(notification.created),
      icon: '🔔',
    })),
    ...(tasks || []).slice(0, 2).map(task => ({
      id: `task-${task.id}`,
      user: task.created_by ? `${task.created_by.first_name} ${task.created_by.last_name}`.trim() : 'System',
      action: 'assigned',
      target: task.title,
      timestamp: formatDate(task.created),
      icon: '📋',
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Dashboard"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />

      <GlobalFilters />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Greeting Section */}
        <View style={[styles.greetingContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.greetingText, { color: colors.textPrimary }]}>
            {getGreeting()}, {user?.first_name || user?.username || 'User'}! 👋
          </Text>
          <Text style={[styles.greetingSubtext, { color: colors.textSecondary }]}>
            Here's your daily overview
          </Text>
        </View>

        {/* Overview Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
          <View style={styles.overviewGrid}>
            {overviewCards.map((card, index) => (
              <View key={index} style={styles.overviewCardWrapper}>
                <OverviewCard {...card} />
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <View key={index} style={styles.quickActionWrapper}>
                <QuickActionButton {...action} />
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {eventsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : events && events.length > 0 ? (
            <View style={styles.eventsList}>
              {events.map((event, index) => (
                <EventItem key={event.id || index} event={event} />
              ))}
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                📅 No upcoming events
              </Text>
            </View>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {(notificationsLoading || tasksLoading) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : recentActivities.length > 0 ? (
            <View style={styles.activityList}>
              {recentActivities.slice(0, 5).map((activity, index) => (
                <RecentActivityItem key={activity.id || index} activity={activity} />
              ))}
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                🔔 No recent activity
              </Text>
            </View>
          )}
        </View>

        {/* Pending Items */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pending Items</Text>
          <View style={styles.pendingItemsContainer}>
            {tasks && tasks.length > 0 && (
              <TouchableOpacity
                style={[styles.pendingItem, { backgroundColor: colors.surface, borderLeftColor: '#FF9800' }]}
                onPress={() => router.push('/tasks/task-list')}
              >
                <View style={styles.pendingItemContent}>
                  <Text style={styles.pendingItemIcon}>📋</Text>
                  <View style={styles.pendingItemText}>
                    <Text style={[styles.pendingItemTitle, { color: colors.textPrimary }]}>
                      {tasks.length} Pending Tasks
                    </Text>
                    <Text style={[styles.pendingItemSubtitle, { color: colors.textSecondary }]}>
                      Latest: {tasks[0]?.title || 'No tasks'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            
            {leaveRequests && leaveRequests.length > 0 && (
              <TouchableOpacity
                style={[styles.pendingItem, { backgroundColor: colors.surface, borderLeftColor: '#E91E63' }]}
                onPress={() => router.push('/leave/leave-requests')}
              >
                <View style={styles.pendingItemContent}>
                  <Text style={styles.pendingItemIcon}>🏖️</Text>
                  <View style={styles.pendingItemText}>
                    <Text style={[styles.pendingItemTitle, { color: colors.textPrimary }]}>
                      {leaveRequests.length} Leave Requests
                    </Text>
                    <Text style={[styles.pendingItemSubtitle, { color: colors.textSecondary }]}>
                      Awaiting approval
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            
            {(!tasks || tasks.length === 0) && (!leaveRequests || leaveRequests.length === 0) && (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  ✅ All caught up! No pending items
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  greetingContainer: {
    padding: 20,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  overviewCardWrapper: {
    width: width / 2 - 22,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickActionWrapper: {
    width: width / 3 - 16,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  eventsList: {
    gap: 8,
  },
  activityList: {
    gap: 8,
  },
  pendingItemsContainer: {
    gap: 12,
  },
  pendingItem: {
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  pendingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  pendingItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  pendingItemText: {
    flex: 1,
  },
  pendingItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  pendingItemSubtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
