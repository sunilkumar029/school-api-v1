
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { GlobalFilters } from '@/components/GlobalFilters';
import { useNotifications, useNotificationTypes } from '@/hooks/useApi';

interface NotificationItem {
  id: number;
  title: string;
  description: string;
  notification_type: string;
  notification_sub_type: string;
  created: string;
  modified: string;
  created_by: {
    first_name: string;
    last_name: string;
    email: string;
  };
  meta_data: any;
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'activities'>('notifications');
  const [notificationTypeFilter, setNotificationTypeFilter] = useState<string>('all');
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { selectedBranch, selectedAcademicYear } = useGlobalFilters();

  // Build API parameters with filters
  const notificationParams = useMemo(() => {
    const params: any = {
      ordering: '-created',
      limit: 50,
    };

    if (selectedBranch) params.branch = selectedBranch;
    if (selectedAcademicYear) params.academic_year = selectedAcademicYear;
    if (notificationTypeFilter && notificationTypeFilter !== 'all') {
      params.notification_type = notificationTypeFilter;
    }

    return params;
  }, [selectedBranch, selectedAcademicYear, notificationTypeFilter]);

  const { data: notifications, loading, error, refetch } = useNotifications(notificationParams);
  const { data: notificationTypes } = useNotificationTypes();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      'Academics': '📚',
      'Event': '📅',
      'Fee': '💰',
      'Attendance': '✅',
      'Leave': '🏖️',
      'Exam': '📝',
      'Transport': '🚌',
      'Hostel': '🏠',
      'Inventory': '📦',
      'Document': '📄',
      'Schedule': '⏰',
    };
    return iconMap[type] || '🔔';
  };

  const getNotificationColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      'Academics': '#4CAF50',
      'Event': '#2196F3',
      'Fee': '#FF9800',
      'Attendance': '#8BC34A',
      'Leave': '#9C27B0',
      'Exam': '#F44336',
      'Transport': '#607D8B',
      'Hostel': '#795548',
      'Inventory': '#3F51B5',
      'Document': '#009688',
      'Schedule': '#E91E63',
    };
    return colorMap[type] || colors.primary;
  };

  const renderNotificationCard = (notification: NotificationItem) => (
    <View
      key={notification.id}
      style={[
        styles.notificationCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderLeftColor: getNotificationColor(notification.notification_type),
        },
      ]}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIconContainer}>
          <Text style={styles.notificationIcon}>
            {getNotificationIcon(notification.notification_type)}
          </Text>
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationTitleRow}>
            <Text
              style={[styles.notificationTitle, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {notification.title || 'Untitled'}
            </Text>
            <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
              {formatDate(notification.created)}
            </Text>
          </View>
          <Text
            style={[styles.notificationMessage, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {notification.description || 'No description available'}
          </Text>
          <View style={styles.notificationMeta}>
            <Text style={[styles.notificationMetaText, { color: colors.textSecondary }]}>
              {notification.notification_type}
              {notification.notification_sub_type && ` • ${notification.notification_sub_type}`}
            </Text>
            {notification.created_by && (
              <Text style={[styles.notificationMetaText, { color: colors.textSecondary }]}>
                By: {`${notification.created_by.first_name || ''} ${notification.created_by.last_name || ''}`.trim() || notification.created_by.email}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  const renderTypeModal = () => (
    <Modal
      visible={typeModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setTypeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Filter by Type
            </Text>
            <TouchableOpacity
              onPress={() => setTypeModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <TouchableOpacity
              style={[
                styles.modalItem,
                {
                  backgroundColor: notificationTypeFilter === 'all' ? colors.primary + '20' : 'transparent',
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={() => {
                setNotificationTypeFilter('all');
                setTypeModalVisible(false);
              }}
            >
              <Text
                style={[
                  styles.modalItemText,
                  {
                    color: notificationTypeFilter === 'all' ? colors.primary : colors.textPrimary,
                    fontWeight: notificationTypeFilter === 'all' ? 'bold' : 'normal',
                  },
                ]}
              >
                All Types
              </Text>
              {notificationTypeFilter === 'all' && (
                <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
              )}
            </TouchableOpacity>
            {Object.entries(notificationTypes).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.modalItem,
                  {
                    backgroundColor: notificationTypeFilter === key ? colors.primary + '20' : 'transparent',
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setNotificationTypeFilter(key);
                  setTypeModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    {
                      color: notificationTypeFilter === key ? colors.primary : colors.textPrimary,
                      fontWeight: notificationTypeFilter === key ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {getNotificationIcon(key)} {value as string}
                </Text>
                {notificationTypeFilter === key && (
                  <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Notifications"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />

      {/* Global Filters */}
      <GlobalFilters />

      {/* Local Filters */}
      <View style={[styles.localFilters, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.filterButton, { borderColor: colors.border, backgroundColor: colors.background }]}
          onPress={() => setTypeModalVisible(true)}
        >
          <Text style={[styles.filterButtonText, { color: colors.textPrimary }]}>
            {notificationTypeFilter === 'all' 
              ? 'All Types' 
              : `${getNotificationIcon(notificationTypeFilter)} ${notificationTypes[notificationTypeFilter] || notificationTypeFilter}`}
          </Text>
          <Text style={[styles.dropdownIcon, { color: colors.textSecondary }]}>▼</Text>
        </TouchableOpacity>
      </View>

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
        {loading && (!notifications || notifications.length === 0) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading notifications...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={refetch}
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : notifications && notifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {notifications.map(renderNotificationCard)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Notifications
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              No notifications found for the selected filters
            </Text>
          </View>
        )}
      </ScrollView>

      {renderTypeModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  localFilters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 120,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 10,
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  notificationsList: {
    padding: 16,
  },
  notificationCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  notificationIconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 12,
    flexShrink: 0,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationMeta: {
    flexDirection: 'column',
    gap: 2,
  },
  notificationMetaText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    borderRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
    flex: 1,
  },
  checkmark: {
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
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
