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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface QuickActionButtonProps {
  title?: string;
  icon?: string;
  color?: string;
  key?: string;
  onPress: () => void;
}


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

  // console.log(events);

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
      icon: '📚',
      onPress: () => router.push('/attendance-dashboard'),
    },
    {
      title: 'Events',
      value: eventsLoading ? '...' : (events?.length?.toString() || '0'),
      subtitle: eventsLoading ? 'Loading...' : 'Upcoming events',
      color: '#2196F3',
      icon: '📅',
      onPress: () => router.push('/(tabs)/events'),
    },
    {
      title: 'Tasks',
      value: tasksLoading ? '...' : (tasks?.length?.toString() || '0'),
      subtitle: tasksLoading ? 'Loading...' : 'Pending tasks',
      color: '#FF9800',
      icon: '📝',
      onPress: () => router.push('/tasks/task-list'),
    },
    {
      title: 'Notifications',
      value: notificationsLoading ? '...' : (notifications?.length?.toString() || '0'),
      subtitle: notificationsLoading ? 'Loading...' : 'Recent updates',
      color: '#9C27B0',
      icon: '🔔',
      onPress: () => router.push('/(tabs)/notifications'),
    },
    {
      title: 'Fee Status',
      value: feeLoading ? '...' : (feeDashboard?.total_fees ? `₹${feeDashboard.total_fees}` : '₹0'),
      subtitle: feeLoading ? 'Loading...' : (feeDashboard?.paid_amount ? `₹${feeDashboard.paid_amount} paid` : 'No payments'),
      color: '#F44336',
      icon: '💸',
      onPress: () => router.push('/finance/student-fee-analytics'),
    },
    {
      title: 'Inventory',
      value: inventoryLoading ? '...' : (inventoryDashboard?.total_items?.toString() || '0'),
      subtitle: inventoryLoading ? 'Loading...' : (inventoryDashboard?.low_stock_count ? `${inventoryDashboard.low_stock_count} low stock` : 'All good'),
      color: '#607D8B',
      icon: '📦',
      onPress: () => router.push('/inventory-dashboard'),
    },
  ];

  const quickActions = [
    {
      title: 'Apply Leave',
      icon: 'flight-takeoff',
      color: '#E91E63',
      key: 'apply-leave',
      onPress: () => router.push('/leave/leave-requests'),
    },
    {
      title: 'View Timetable',
      icon: 'event-note',
      color: '#3F51B5',
      key: 'view-timetable',
      onPress: () => router.push('/academics/staff-timetable'),
    },
    {
      title: 'Mark Attendance',
      icon: 'check-box',
      color: '#4CAF50',
      key: 'mark-attendance',
      onPress: () => router.push('/academics/student-attendance'),
    },
    {
      title: 'tasks',
      icon: 'chat',
      color: '#FF5722',
      key: 'tasks',
      onPress: () => router.push('/tasks/task-list'),
    },
    {
      title: 'Student Fees',
      icon: 'attach-money',
      color: '#795548',
      key: 'student-fees',
      onPress: () => router.push('/finance/student-fee-list'),
    },
    {
      title: 'Support',
      icon: 'headset-mic',
      color: '#009688',
      key: 'support',
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

  // console.log('recentActivities', recentActivities);




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
            {getGreeting()}, {user?.email?.split('@')[0] || 'User'}! 👋
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
            {quickActions.map(({ title, icon, color, onPress }, index) => (
              <View key={`${title}-${index}`} style={styles.quickActionWrapper}>
                <TouchableOpacity
                  style={[
                    styles.quickActionContainer,
                    { backgroundColor: colors.card, borderColor: colors.border }
                  ]}
                  onPress={onPress}
                  activeOpacity={0.7}
                >
                  {/* get material icon here */}
                  <MaterialIcons name={icon} size={24} color={colors.primary} />
                  <Text style={[styles.quickActionButtontitle, { color: colors.textPrimary }]}>{title}</Text>
                </TouchableOpacity>
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
              {events.slice(0, 3).map((event, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.eventContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Event: ${event.name}, starting at ${event.created}, ending at ${event.end_date}`}
                >

                  <View style={styles.content}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                      {event.name}
                    </Text>
                    <Text style={[styles.type, { color: colors.textSecondary }]}>
                      Ends: {formatDate(event.end_date)}
                    </Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={[styles.time, { color: colors.primary }]}>
                      📅 {formatDate(event.created)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              {events.length > 7 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
                </TouchableOpacity>
              )}
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
              {recentActivities.slice(0, 3).map((activity, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.eventContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Activity: ${activity.target}, performed by ${activity.user} at ${activity.timestamp}`}
                >
                  <View style={styles.content}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                      {activity.target}
                    </Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                      {activity.timestamp}
                    </Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={[styles.time, { color: colors.primary }]}>
                      {activity.icon}
                    </Text>
                  </View>
                </TouchableOpacity>
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
  eventContainer: {
    flexDirection: 'row',
    padding: 12,
    // width: '48%',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    justifyContent: 'space-between',
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
    width: "28%",
    marginHorizontal: 6,
    marginBottom: 12,
  },
  quickActionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    margin: 6,
    minHeight: 80,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    minWidth: "25%",
    width: "100%",
    // paddingHorizontal: 6,
    // paddingVertical: 12,
  },
  QuickActionButtonicon: {
    fontSize: 24,
    marginBottom: 6,
  },
  quickActionButtontitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  timeContainer: {
    marginRight: 12,
    // alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  type: {
    fontSize: 12,
  },
  eventdate: {
    fontSize: 12,
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
  activitycontainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  icon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  description: {
    fontSize: 12,
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