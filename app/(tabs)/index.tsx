
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
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import {
  useAttendanceDashboard,
  useBranches,
  useAcademicYears,
  useFeeDashboardAnalytics,
  useEvents,
  useAnnouncements,
} from '@/hooks/useApi';

const { width: screenWidth } = Dimensions.get('window');

interface QuickAction {
  title: string;
  icon: string;
  route: string;
  color: string;
  roles?: string[];
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears();
  const { data: attendanceData, loading: attendanceLoading } = useAttendanceDashboard();
  const { data: feeAnalytics, loading: feeLoading } = useFeeDashboardAnalytics({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
  });
  const { data: events } = useEvents({ is_active: true, limit: 5 });
  const { data: announcements } = useAnnouncements({ is_active: true, limit: 3 });

  const quickActions: QuickAction[] = [
    { title: 'Attendance', icon: '📊', route: '/attendance-dashboard', color: '#4CAF50' },
    { title: 'Events', icon: '📅', route: '/(tabs)/events', color: '#2196F3' },
    { title: 'Finance', icon: '💰', route: '/finance/student-fee-list', color: '#FF9800' },
    { title: 'Transport', icon: '🚌', route: '/transport', color: '#9C27B0' },
    { title: 'Chat', icon: '💬', route: '/chat', color: '#E91E63' },
    { title: 'Tasks', icon: '✅', route: '/tasks/task-list', color: '#00BCD4' },
    { title: 'Leave', icon: '🏖️', route: '/leave/leave-requests', color: '#FF5722' },
    { title: 'Hostel', icon: '🏨', route: '/hostel/hostel-rooms', color: '#795548' },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Trigger refetch of all data
      await Promise.all([
        // Add refetch calls here when available
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const renderStatCard = (title: string, value: string | number, subtitle: string, color: string) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
    </View>
  );

  const renderQuickAction = (action: QuickAction) => {
    if (action.roles && !action.roles.includes(user?.role || 'student')) {
      return null;
    }

    return (
      <TouchableOpacity
        key={action.title}
        style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
        onPress={() => router.push(action.route as any)}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
          <Text style={[styles.quickActionEmoji, { color: action.color }]}>{action.icon}</Text>
        </View>
        <Text style={[styles.quickActionTitle, { color: colors.textPrimary }]}>{action.title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Dashboard"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

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
        {/* Welcome Section */}
        <View style={[styles.welcomeSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
            Welcome back, {user?.username || user?.email?.split('@')[0] || 'User'}!
          </Text>
          <Text style={[styles.welcomeSubtext, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Students',
              attendanceData?.total_students || '0',
              'Total enrolled',
              '#4CAF50'
            )}
            {renderStatCard(
              'Attendance',
              attendanceData?.attendance_percentage ? `${attendanceData.attendance_percentage.toFixed(1)}%` : '0%',
              'Today',
              '#2196F3'
            )}
            {renderStatCard(
              'Fees Collected',
              feeAnalytics?.total_collected ? `₹${(feeAnalytics.total_collected / 100000).toFixed(1)}L` : '₹0',
              'This month',
              '#FF9800'
            )}
            {renderStatCard(
              'Events',
              events?.results?.length || 0,
              'Upcoming',
              '#9C27B0'
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
          
          {/* Recent Events */}
          {events?.results && events.results.length > 0 && (
            <View style={[styles.activityCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.activityCardTitle, { color: colors.textPrimary }]}>Upcoming Events</Text>
              {events.results.slice(0, 3).map((event: any) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.activityItem}
                  onPress={() => router.push('/(tabs)/events')}
                >
                  <Text style={[styles.activityItemTitle, { color: colors.textPrimary }]}>
                    {event.name}
                  </Text>
                  <Text style={[styles.activityItemDate, { color: colors.textSecondary }]}>
                    {new Date(event.start_date).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent Announcements */}
          {announcements?.results && announcements.results.length > 0 && (
            <View style={[styles.activityCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.activityCardTitle, { color: colors.textPrimary }]}>Latest Announcements</Text>
              {announcements.results.slice(0, 3).map((announcement: any) => (
                <TouchableOpacity
                  key={announcement.id}
                  style={styles.activityItem}
                  onPress={() => router.push('/(tabs)/notifications')}
                >
                  <Text style={[styles.activityItemTitle, { color: colors.textPrimary }]}>
                    {announcement.title}
                  </Text>
                  <Text style={[styles.activityItemContent, { color: colors.textSecondary }]} numberOfLines={2}>
                    {announcement.content}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {(attendanceLoading || feeLoading) && (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading dashboard data...
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
  content: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
  },
  statsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
  },
  quickActionsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '23%',
    aspectRatio: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 20,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  activitySection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  activityCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  activityCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  activityItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  activityItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityItemDate: {
    fontSize: 12,
  },
  activityItemContent: {
    fontSize: 12,
    lineHeight: 16,
  },
  loadingSection: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
});
