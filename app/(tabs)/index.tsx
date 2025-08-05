import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, fontSizes } from "@/contexts/ThemeContext";
import { TopBar } from "@/components/TopBar";
import { SideDrawer } from "@/components/SideDrawer";
import { OverviewCard } from "@/components/OverviewCard";
import { QuickActionButton } from "@/components/QuickActionButton";
import { RecentActivityItem } from "@/components/RecentActivityItem";
import { EventItem } from "@/components/EventItem";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiService } from "@/api/apiService";

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const { colors, fontSize } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    announcements: [],
    events: [],
    attendanceStats: null,
    leaveQuotas: [],
  });
  const [loadingData, setLoadingData] = useState(true);

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Redirect to splash if not authenticated
  if (!isAuthenticated) {
    router.replace("/splash");
    return null;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch multiple data sources in parallel
      const [announcementsRes, eventsRes, attendanceRes, leaveQuotasRes] = await Promise.allSettled([
        apiService.getAnnouncements({ limit: 5 }),
        apiService.getEvents({ limit: 5, ordering: '-start_date' }),
        apiService.getAttendanceDashboard(),
        apiService.getAnnualLeaveQuotas({ user: user?.id }),
      ]);

      const announcements = announcementsRes.status === 'fulfilled' 
        ? announcementsRes.value.results || []
        : [];
      
      const events = eventsRes.status === 'fulfilled' 
        ? eventsRes.value.results || []
        : [];
        
      const attendanceStats = attendanceRes.status === 'fulfilled' 
        ? attendanceRes.value
        : null;
        
      const leaveQuotas = leaveQuotasRes.status === 'fulfilled' 
        ? leaveQuotasRes.value.results || []
        : [];

      setDashboardData({
        announcements,
        events,
        attendanceStats,
        leaveQuotas,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const getOverviewData = () => {
    const todayEvents = dashboardData.events.filter(event => {
      const eventDate = new Date(event.start_date);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    });

    const totalLeaves = dashboardData.leaveQuotas.reduce((sum, quota) => 
      sum + (quota.allocated_days || 0), 0
    );
    const usedLeaves = dashboardData.leaveQuotas.reduce((sum, quota) => 
      sum + (quota.used_days || 0), 0
    );
    const remainingLeaves = totalLeaves - usedLeaves;

    return [
      { 
        title: "Attendance", 
        value: dashboardData.attendanceStats?.attendance_percentage 
          ? `${Math.round(dashboardData.attendanceStats.attendance_percentage)}%`
          : "N/A", 
        icon: "📅" 
      },
      { 
        title: "Events Today", 
        value: `${todayEvents.length} Events`, 
        icon: "📌" 
      },
      { 
        title: "Tasks Due", 
        value: "2 Pending", // This would need a tasks API
        icon: "📋" 
      },
      { 
        title: "Leaves Left", 
        value: `${remainingLeaves > 0 ? remainingLeaves : 0} Days`, 
        icon: "🏖" 
      },
      { 
        title: "Wallet Balance", 
        value: "₹1,250", // This would need a wallet/finance API
        icon: "💰" 
      },
    ];
  };

  const quickActions = [
    { title: "Apply Leave", icon: "📝" },
    { title: "View Timetable", icon: "🕒" },
    { title: "Mark Attendance", icon: "✅" },
    { title: "Chat", icon: "💬" },
    { title: "Online Class", icon: "🎥" },
    { title: "Raise Request", icon: "📢" },
  ];

  const recentActivities = [
    {
      icon: "✅",
      title: "Leave request approved",
      description: "Your leave for Dec 25-26 approved",
      time: "2h ago",
    },
    {
      icon: "📢",
      title: "Event added",
      description: "Science Fair on January 15th",
      time: "5h ago",
    },
    {
      icon: "🕒",
      title: "Timesheet filled",
      description: "Weekly timesheet submitted",
      time: "1d ago",
    },
  ];

  const getUpcomingEvents = () => {
    return dashboardData.events.slice(0, 3).map(event => ({
      title: event.name || 'Untitled Event',
      time: new Date(event.start_date).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      type: event.applies_to || 'General Event',
      onPress: () => {
        // Navigate to event details
        console.log('Navigate to event:', event.id);
      }
    }));
  };

  const getFormattedAnnouncements = () => {
    return dashboardData.announcements.slice(0, 3).map(announcement => 
      `📢 ${announcement.title || announcement.description || 'No title'}`
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <TopBar
        title="Home"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Greeting Header */}
        <View
          style={[styles.greetingSection, { backgroundColor: colors.surface }]}
        >
          <View style={styles.greetingContent}>
            <View style={styles.avatarContainer}>
              <View
                style={[styles.avatar, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.avatarText}>
                  {user?.username?.charAt(0).toUpperCase() ||
                    user?.email?.charAt(0).toUpperCase() ||
                    "U"}
                </Text>
              </View>
            </View>
            <View style={styles.greetingText}>
              <Text
                style={[
                  styles.greeting,
                  {
                    color: colors.textPrimary,
                    fontSize: fontSizes[fontSize] + 4,
                  },
                ]}
              >
                {getGreeting()},{" "}
                {user?.username || user?.email?.split("@")[0] || "User"}! 👋
              </Text>
              <Text
                style={[
                  styles.roleText,
                  {
                    color: colors.textSecondary,
                    fontSize: fontSizes[fontSize],
                  },
                ]}
              >
                Student • Visionaries International
              </Text>
            </View>
          </View>
        </View>

        {/* Overview Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Overview
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.overviewScroll}
          >
            {getOverviewData().map((item, index) => (
              <OverviewCard
                key={index}
                title={item.title}
                value={item.value}
                icon={item.icon}
                onPress={() => {}}
              />
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <QuickActionButton
                key={index}
                title={action.title}
                icon={action.icon}
                onPress={() => {}}
              />
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Recent Activity
            </Text>
            <TouchableOpacity>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.activityContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            {recentActivities.map((activity, index) => (
              <RecentActivityItem
                key={index}
                icon={activity.icon}
                title={activity.title}
                description={activity.description}
                time={activity.time}
              />
            ))}
          </View>
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Upcoming Events
          </Text>
          <View style={styles.eventsContainer}>
            {loadingData ? (
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading events...
              </Text>
            ) : getUpcomingEvents().length > 0 ? (
              getUpcomingEvents().map((event, index) => (
                <EventItem
                  key={index}
                  title={event.title}
                  time={event.time}
                  type={event.type}
                  onPress={event.onPress}
                />
              ))
            ) : (
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                No upcoming events
              </Text>
            )}
          </View>
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Announcements
          </Text>
          <View
            style={[
              styles.announcementsContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            {loadingData ? (
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading announcements...
              </Text>
            ) : getFormattedAnnouncements().length > 0 ? (
              getFormattedAnnouncements().map((announcement, index) => (
                <View
                  key={index}
                  style={[
                    styles.announcementItem,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.announcementText,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {announcement}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                No announcements available
              </Text>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  greetingSection: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  greetingContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  greetingText: {
    flex: 1,
  },
  greeting: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  roleText: {
    fontWeight: "500",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  overviewScroll: {
    marginTop: 12,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    marginHorizontal: -6,
    justifyContent: "space-between",
    height: "15%",
  },
  activityContainer: {
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  eventsContainer: {
    marginTop: 12,
  },
  announcementsContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  announcementItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  announcementText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
});
