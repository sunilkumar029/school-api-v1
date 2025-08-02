
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image
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

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { colors, fontSize } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const overviewData = [
    { title: "Attendance", value: "96%", icon: "📅" },
    { title: "Events Today", value: "3 Events", icon: "📌" },
    { title: "Tasks Due", value: "2 Pending", icon: "📋" },
    { title: "Leaves Left", value: "4 Days", icon: "🏖" },
    { title: "Wallet Balance", value: "₹1,250", icon: "💰" },
  ];

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

  const upcomingEvents = [
    { title: "Science Fair", time: "10 AM", type: "Campus Event" },
    { title: "Online Class", time: "2 PM", type: "Zoom Meeting" },
    { title: "Parent Meeting", time: "4 PM", type: "Conference" },
  ];

  const announcements = [
    "🎓 Mid-term exams starting from January 20th",
    "📢 New circular regarding holiday schedule",
    "📅 Republic Day celebration on 26th January",
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Home"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting Header */}
        <View style={[styles.greetingSection, { backgroundColor: colors.surface }]}>
          <View style={styles.greetingContent}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            </View>
            <View style={styles.greetingText}>
              <Text style={[styles.greeting, { color: colors.textPrimary, fontSize: fontSizes[fontSize] + 4 }]}>
                {getGreeting()}, {user?.username || user?.email?.split('@')[0] || 'User'}! 👋
              </Text>
              <Text style={[styles.roleText, { color: colors.textSecondary, fontSize: fontSizes[fontSize] }]}>
                Student • Visionaries International
              </Text>
            </View>
          </View>
        </View>

        {/* Overview Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.overviewScroll}>
            {overviewData.map((item, index) => (
              <OverviewCard
                key={index}
                title={item.title}
                value={item.value}
                icon={item.icon}
                onPress={() => { }}
              />
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <QuickActionButton
                key={index}
                title={action.title}
                icon={action.icon}
                onPress={() => { }}
              />
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.activityContainer, { backgroundColor: colors.surface }]}>
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
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming Events</Text>
          <View style={styles.eventsContainer}>
            {upcomingEvents.map((event, index) => (
              <EventItem
                key={index}
                title={event.title}
                time={event.time}
                type={event.type}
                onPress={() => { }}
              />
            ))}
          </View>
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Announcements</Text>
          <View style={[styles.announcementsContainer, { backgroundColor: colors.surface }]}>
            {announcements.map((announcement, index) => (
              <View key={index} style={[styles.announcementItem, { borderBottomColor: colors.border }]}>
                <Text style={[styles.announcementText, { color: colors.textPrimary }]}>
                  {announcement}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  greetingSection: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  greetingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  greetingText: {
    flex: 1,
  },
  greeting: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleText: {
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
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
  overviewScroll: {
    marginTop: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginHorizontal: -6,
  },
  activityContainer: {
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
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
    shadowColor: '#000',
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
});
