import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useAnnouncements } from '@/hooks/useApi';

interface NotificationItem {
  id: string;
  type: 'event' | 'task' | 'payment' | 'alert' | 'general';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  icon: string;
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'activities'>('notifications');
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'events' | 'tasks' | 'payments' | 'alerts'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: announcements, loading, error, refetch } = useAnnouncements({
    ordering: '-created',
    limit: 50
  });

  // Mock data for activities, as it's not being replaced in this change.
  const activities: ActivityItem[] = [
    {
      id: '1',
      user: 'John Doe',
      action: 'completed task',
      target: 'Mathematics Assignment',
      timestamp: '2024-01-15 11:30',
      icon: '✅',
    },
    {
      id: '2',
      user: 'Jane Smith',
      action: 'updated profile',
      target: 'Personal Information',
      timestamp: '2024-01-15 10:15',
      icon: '👤',
    },
    {
      id: '3',
      user: 'Mike Wilson',
      action: 'joined event',
      target: 'Science Exhibition',
      timestamp: '2024-01-15 09:45',
      icon: '📅',
    },
    {
      id: '4',
      user: 'Sarah Johnson',
      action: 'made payment',
      target: 'Semester Fee',
      timestamp: '2024-01-14 18:30',
      icon: '💳',
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event': return '#4CAF50';
      case 'task': return '#2196F3';
      case 'payment': return '#FF9800';
      case 'alert': return '#F44336';
      default: return colors.primary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return colors.textSecondary;
    }
  };

  const markAsRead = (id: string) => {
    // In a real scenario, this would call an API to mark as read.
    // For now, we'll simulate it locally if needed, but API integration is preferred.
    console.log('Marking as read:', id);
  };

  const deleteNotification = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In a real scenario, this would call an API to delete the notification.
            console.log('Deleting notification:', id);
          },
        },
      ]
    );
  };

  const filteredNotifications = (announcements || []).filter(notif => {
    if (notificationFilter === 'all') return true;
    if (notificationFilter === 'events') return notif.type === 'event';
    if (notificationFilter === 'tasks') return notif.type === 'task';
    if (notificationFilter === 'payments') return notif.type === 'payment';
    if (notificationFilter === 'alerts') return notif.type === 'alert';
    return true;
  });

  const unreadCount = (announcements || []).filter(n => !n.isRead).length;

  const FilterTab = ({ label, value, count }: { label: string; value: string; count?: number }) => (
    <TouchableOpacity
      style={[
        styles.filterTab,
        {
          backgroundColor: notificationFilter === value ? colors.primary : 'transparent',
          borderColor: colors.border,
        }
      ]}
      onPress={() => setNotificationFilter(value as any)}
    >
      <Text
        style={[
          styles.filterTabText,
          {
            color: notificationFilter === value ? '#FFFFFF' : colors.textPrimary,
          }
        ]}
      >
        {label}
        {count !== undefined && count > 0 && (
          <Text style={styles.badge}> {count}</Text>
        )}
      </Text>
    </TouchableOpacity>
  );

  const NotificationCard = ({ item }: { item: any }) => ( // Changed type to 'any' to accommodate API response structure
    <TouchableOpacity
      style={[
        styles.notificationCard,
        {
          backgroundColor: item.isRead ? colors.surface : colors.background,
          borderLeftColor: getTypeColor(item.type),
          borderColor: colors.border,
        }
      ]}
      onPress={() => markAsRead(item.id)}
      onLongPress={() => deleteNotification(item.id)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationTitle}>
          <Text
            style={[
              styles.notificationTitleText,
              {
                color: colors.textPrimary,
                fontWeight: item.isRead ? 'normal' : 'bold',
              }
            ]}
          >
            {item.title}
          </Text>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
        </View>
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          {item.timestamp}
        </Text>
      </View>
      <Text
        style={[
          styles.notificationMessage,
          {
            color: colors.textSecondary,
            fontWeight: item.isRead ? 'normal' : '500',
          }
        ]}
      >
        {item.message}
      </Text>
      <View style={styles.notificationFooter}>
        <Text style={[styles.typeTag, { color: getTypeColor(item.type) }]}>
          {item.type.toUpperCase()}
        </Text>
        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </View>
    </TouchableOpacity>
  );

  const ActivityCard = ({ item }: { item: ActivityItem }) => (
    <View style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.activityIcon}>{item.icon}</Text>
      <View style={styles.activityContent}>
        <Text style={[styles.activityText, { color: colors.textPrimary }]}>
          <Text style={{ fontWeight: 'bold' }}>{item.user}</Text> {item.action}{' '}
          <Text style={{ fontWeight: '600' }}>{item.target}</Text>
        </Text>
        <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
          {item.timestamp}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title={`Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}`}
        onMenuPress={() => setDrawerVisible(true)}
        onSettingsPress={() => router.push('/(tabs)/settings')}
        showNotifications={false}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Main Tabs */}
      <View style={[styles.mainTabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.mainTab,
            activeTab === 'notifications' && { borderBottomColor: colors.primary }
          ]}
          onPress={() => setActiveTab('notifications')}
        >
          <Text
            style={[
              styles.mainTabText,
              {
                color: activeTab === 'notifications' ? colors.primary : colors.textSecondary,
                fontWeight: activeTab === 'notifications' ? 'bold' : 'normal',
              }
            ]}
          >
            Notifications
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.mainTab,
            activeTab === 'activities' && { borderBottomColor: colors.primary }
          ]}
          onPress={() => setActiveTab('activities')}
        >
          <Text
            style={[
              styles.mainTabText,
              {
                color: activeTab === 'activities' ? colors.primary : colors.textSecondary,
                fontWeight: activeTab === 'activities' ? 'bold' : 'normal',
              }
            ]}
          >
            Activities
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'notifications' ? (
        <View style={styles.content}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                Error loading notifications
              </Text>
              <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Filter Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterTabs}
              >
                <FilterTab label="All" value="all" count={(announcements || []).length} />
                <FilterTab label="Events" value="events" count={(announcements || []).filter(n => n.type === 'event').length} />
                <FilterTab label="Tasks" value="tasks" count={(announcements || []).filter(n => n.type === 'task').length} />
                <FilterTab label="Payments" value="payments" count={(announcements || []).filter(n => n.type === 'payment').length} />
                <FilterTab label="Alerts" value="alerts" count={(announcements || []).filter(n => n.type === 'alert').length} />
              </ScrollView>

              {/* Notifications List */}
              <ScrollView
                style={styles.list}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              >
                {filteredNotifications.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🔔</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      No notifications found
                    </Text>
                  </View>
                ) : (
                  filteredNotifications.map((item) => (
                    <NotificationCard key={item.id} item={item} />
                  ))
                )}
              </ScrollView>
            </>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {activities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No recent activities
              </Text>
            </View>
          ) : (
            activities.map((item) => (
              <ActivityCard key={item.id} item={item} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  mainTabText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  filterTabs: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 62,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  notificationCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTitleText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeTag: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    padding: 16,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#6200EE', // Example primary color
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});