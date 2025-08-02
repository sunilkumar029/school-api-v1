import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useTheme, fontSizes } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { SideDrawer } from "@/components/SideDrawer";
import { useRouter } from "expo-router";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "event" | "announcement" | "leave" | "general";
  read: boolean;
}

export default function NotificationsScreen() {
  const { colors, fontSize } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const notifications: Notification[] = [
    {
      id: "1",
      title: "Event Reminder",
      message: "Science Fair starts in 2 hours at the main auditorium",
      time: "2h ago",
      type: "event",
      read: false,
    },
    {
      id: "2",
      title: "Leave Approved",
      message: "Your leave request for Dec 25-26 has been approved",
      time: "1d ago",
      type: "leave",
      read: false,
    },
    {
      id: "3",
      title: "New Announcement",
      message: "Mid-term exams schedule has been updated",
      time: "2d ago",
      type: "announcement",
      read: true,
    },
    {
      id: "4",
      title: "Food Court Update",
      message: "New items added to the menu - check them out!",
      time: "3d ago",
      type: "general",
      read: true,
    },
  ];

  const filteredNotifications = notifications.filter(
    (n) => filter === "all" || !n.read,
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "event":
        return "📅";
      case "announcement":
        return "📢";
      case "leave":
        return "🏖️";
      default:
        return "📱";
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        !item.read && { backgroundColor: colors.primary + "10" },
      ]}
    >
      <View style={styles.notificationHeader}>
        <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
        <View style={styles.notificationContent}>
          <Text
            style={[styles.notificationTitle, { color: colors.textPrimary }]}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.notificationTime, { color: colors.textSecondary }]}
          >
            {item.time}
          </Text>
        </View>
        {!item.read && (
          <View
            style={[styles.unreadDot, { backgroundColor: colors.primary }]}
          />
        )}
      </View>
      <Text
        style={[styles.notificationMessage, { color: colors.textSecondary }]}
      >
        {item.message}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Notifications"
        onMenuPress={() => setDrawerVisible(true)}
        onSettingsPress={() => router.push("/(tabs)/settings")}
        showNotifications={false}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Filter Tabs */}
      <View
        style={[
          styles.filterContainer,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === "all" && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              {
                color: filter === "all" ? colors.primary : colors.textSecondary,
              },
            ]}
          >
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === "unread" && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setFilter("unread")}
        >
          <Text
            style={[
              styles.filterText,
              {
                color:
                  filter === "unread" ? colors.primary : colors.textSecondary,
              },
            ]}
          >
            Unread ({notifications.filter((n) => !n.read).length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        style={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  filterText: {
    fontSize: 16,
    fontWeight: "600",
  },
  notificationsList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
});
