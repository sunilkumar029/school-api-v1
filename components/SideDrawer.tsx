import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface DrawerItem {
  title: string;
  icon: string;
  route: string;
  roles?: string[];
}

interface DrawerSection {
  title: string;
  items: DrawerItem[];
}

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const drawerSections: DrawerSection[] = [
    {
      title: 'Core Modules',
      items: [
        { title: 'Events', icon: '📅', route: '/(tabs)/events' },
        { title: 'Wallet', icon: '💳', route: '/(tabs)/wallet' },
        { title: 'Analytics', icon: '📊', route: '/(tabs)/analytics' },
        { title: 'Chat', icon: '💬', route: '/chat' },
        { title: 'File Management', icon: '📁', route: '/file-management' },
      ]
    },
    {
      title: 'Academic Modules',
      items: [
        { title: 'Department', icon: '🏢', route: '/(tabs)/department' },
        { title: 'Classes', icon: '📚', route: '/(tabs)/classes' },
        { title: 'Teacher Performance', icon: '👨‍🏫', route: '/academics/teacher-performance' },
        { title: 'Student Performance', icon: '📈', route: '/academics/student-performance' },
        { title: 'Classroom', icon: '🏫', route: '/academics/classroom' },
        { title: 'Online Class', icon: '💻', route: '/academics/online-class' },
        { title: 'Staff Timetable', icon: '📅', route: '/academics/staff-timetable' },
        { title: 'Class Timetable', icon: '⏰', route: '/academics/class-timetable' },
        { title: 'Student Marks', icon: '📝', route: '/academics/student-marks' },
        { title: 'Student Attendance', icon: '✅', route: '/academics/student-attendance' },
      ]
    },
    {
      title: 'Exams',
      items: [
        { title: 'Create Question', icon: '❓', route: '/exams/create-question' },
        { title: 'Schedule Exam', icon: '📋', route: '/exams/schedule-exam' },
      ]
    },
    {
      title: 'My Performance',
      items: [
        { title: 'Employee Performance', icon: '👤', route: '/my-performance/employee' },
        { title: 'Task Performance', icon: '📋', route: '/my-performance/task' },
      ]
    },
    {
      title: 'Finance',
      items: [
        { title: 'Money Request', icon: '💰', route: '/finance/money-request' },
        { title: 'Student Fee', icon: '💳', route: '/finance/student-fee-list' },
        { title: 'Staff Payroll', icon: '💼', route: '/finance/staff-payroll' },
      ]
    },
    {
      title: 'Library',
      items: [
        { title: 'Resources', icon: '📚', route: '/library/resources' },
        { title: 'Add Resource', icon: '➕', route: '/library/add-resource', roles: ['admin', 'staff'] },
        { title: 'E-Course', icon: '💻', route: '/library/ecourse' },
      ]
    },
    {
      title: 'Hostel',
      items: [
        { title: 'Booking List', icon: '🏠', route: '/hostel/booking-list' },
        { title: 'Room List', icon: '🚪', route: '/hostel/room-list' },
        { title: 'Visitor List', icon: '👥', route: '/hostel/visitor-list' },
        { title: 'Add Visitor', icon: '👤', route: '/hostel/add-visitor' },
      ]
    },
    {
      title: 'Operations',
      items: [
        { title: 'Food Court', icon: '🍽️', route: '/(tabs)/foodcourt' },
        { title: 'Timesheet', icon: '⏱️', route: '/timesheet' },
        { title: 'Users', icon: '👥', route: '/users' },
        { title: 'Weather', icon: '🌤️', route: '/weather' },
        { title: 'Transport', icon: '🚌', route: '/transport' },
      ]
    },
    {
      title: 'Personal',
      items: [
        { title: 'Expense Claims', icon: '💰', route: '/expense-claims' },
        { title: 'My Requests', icon: '📋', route: '/my-requests' },
        { title: 'My Rewards', icon: '🏆', route: '/my-rewards' },
        { title: 'My Tasks', icon: '📝', route: '/my-tasks' },
      ]
    },
    {
      title: 'Management',
      items: [
        { title: 'Inventory', icon: '📦', route: '/inventory', roles: ['admin', 'staff'] },
        { title: 'Stationery', icon: '📝', route: '/inventory/stationery', roles: ['admin', 'staff'] },
        { title: 'Invoice', icon: '📄', route: '/invoice' },
        { title: 'Sports', icon: '⚽', route: '/sports' },
      ]
    }
  ];

  const handleItemPress = (route: string) => {
    router.push(route as any);
    onClose();
  };

  const renderSection = (section: DrawerSection, sectionIndex: number) => (
    <View key={sectionIndex} style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        {section.title}
      </Text>
      {section.items.map((item, index) => {
        // Role-based visibility
        if (item.roles && !item.roles.includes(user?.role || 'student')) {
          return null;
        }

        return (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => handleItemPress(item.route)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
              {item.title}
            </Text>
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView
          style={[styles.drawer, { backgroundColor: colors.surface }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {user?.username?.charAt(0).toUpperCase() || 
                   user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: colors.textPrimary }]}>
                  {user?.username || user?.email?.split('@')[0] || 'User'}
                </Text>
                <Text style={[styles.userRole, { color: colors.textSecondary }]}>
                  {user?.role || 'Student'} • Visionaries International
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeIcon, { color: colors.textPrimary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Menu Sections */}
          <ScrollView style={styles.menuContainer}>
            {drawerSections.map((section, index) => {
              if (section.title === 'Finance') {
                return (
                  <View key={index} style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                      {section.title}
                    </Text>
                    {section.items.map((item, itemIndex) => {
                      if (item.roles && !item.roles.includes(user?.role || 'student')) {
                        return null;
                      }
                      // Special handling for Student Fee and Fee Analytics
                      if (item.route === '/finance/student-fee-list') {
                        return (
                          <TouchableOpacity
                            key={itemIndex}
                            style={[styles.menuItem, { borderBottomColor: colors.border }]}
                            onPress={() => handleItemPress(item.route)}
                          >
                            <MaterialIcons name="account-balance-wallet" size={24} color={colors.textSecondary} />
                            <Text style={[styles.menuItemText, { color: colors.textSecondary }]}>Student Fees</Text>
                          </TouchableOpacity>
                        );
                      } else if (item.route === '/finance/student-fee-analytics') {
                        return (
                          <TouchableOpacity
                            key={itemIndex}
                            style={[styles.menuItem, { borderBottomColor: colors.border }]}
                            onPress={() => handleItemPress(item.route)}
                          >
                            <MaterialIcons name="analytics" size={24} color={colors.textSecondary} />
                            <View style={styles.menuItemWithBadge}>
                              <Text style={[styles.menuItemText, { color: colors.textSecondary }]}>Fee Analytics</Text>
                              <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>NEW</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      }
                      return (
                        <TouchableOpacity
                          key={itemIndex}
                          style={[styles.menuItem, { borderBottomColor: colors.border }]}
                          onPress={() => handleItemPress(item.route)}
                        >
                          <Text style={styles.menuIcon}>{item.icon}</Text>
                          <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
                            {item.title}
                          </Text>
                          <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              }
              return renderSection(section, index);
            })}
          </ScrollView>
        </SafeAreaView>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: 300,
    height: '100%',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  menuTitle: {
    fontSize: 15,
    flex: 1,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  backdrop: {
    flex: 1,
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
  },
  menuItemWithBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 16,
  },
  newBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});