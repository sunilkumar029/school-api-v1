
import React, { useState, useEffect } from 'react';
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
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '@/api/apiService';

interface ClassData {
  id: number;
  name: string;
  section: string;
  subject: string;
  teacher: string;
  schedule: string;
  room: string;
  student_count: number;
  is_active: boolean;
}

interface TimetableEntry {
  id: number;
  subject: string;
  teacher: string;
  start_time: string;
  end_time: string;
  room: string;
  day: string;
}

export default function ClassesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'classes' | 'timetable'>('classes');

  const fetchClassesData = async () => {
    try {
      setError(null);
      
      // Since there's no direct classes endpoint, we'll use departments and branches
      const [departmentsResponse, branchesResponse] = await Promise.all([
        apiService.getDepartments(),
        apiService.getBranches()
      ]);

      // Transform departments into class-like data
      const transformedClasses: ClassData[] = departmentsResponse.results?.map((dept: any, index: number) => ({
        id: dept.id || index,
        name: dept.name || 'Unknown Class',
        section: dept.department_type || 'A',
        subject: dept.description || 'General Studies',
        teacher: dept.head_teacher || 'Staff Member',
        schedule: 'Mon-Fri 9:00-16:00',
        room: `Room ${100 + index}`,
        student_count: Math.floor(Math.random() * 40) + 15,
        is_active: dept.is_active !== false,
      })) || [];

      setClasses(transformedClasses);

    } catch (err) {
      console.error('Error fetching classes data:', err);
      setError('Failed to fetch classes data');
      
      // Fallback data
      setClasses([
        {
          id: 1,
          name: 'Computer Science',
          section: 'A',
          subject: 'Programming',
          teacher: 'Dr. Smith',
          schedule: 'Mon-Fri 9:00-11:00',
          room: 'Lab 101',
          student_count: 35,
          is_active: true,
        },
        {
          id: 2,
          name: 'Mathematics',
          section: 'B',
          subject: 'Calculus',
          teacher: 'Prof. Johnson',
          schedule: 'Mon-Wed-Fri 11:00-12:30',
          room: 'Room 205',
          student_count: 42,
          is_active: true,
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchClassesData();
  };

  useEffect(() => {
    fetchClassesData();
  }, []);

  const renderClassCard = (classItem: ClassData) => (
    <TouchableOpacity
      key={classItem.id}
      style={[styles.classCard, { backgroundColor: colors.surface }]}
      onPress={() => {
        // Navigate to class details
        Alert.alert('Class Details', `Navigate to ${classItem.name} details`);
      }}
    >
      <View style={styles.classHeader}>
        <View>
          <Text style={[styles.className, { color: colors.textPrimary }]}>
            {classItem.name}
          </Text>
          <Text style={[styles.classSection, { color: colors.textSecondary }]}>
            Section {classItem.section}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: classItem.is_active ? '#E8F5E8' : '#FFF3E0' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: classItem.is_active ? '#4CAF50' : '#FF9800' }
          ]}>
            {classItem.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.classDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Subject:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{classItem.subject}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Teacher:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{classItem.teacher}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Schedule:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{classItem.schedule}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Room:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{classItem.room}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Students:</Text>
          <Text style={[styles.detailValue, { color: colors.primary }]}>{classItem.student_count}</Text>
        </View>
      </View>

      <View style={styles.classActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => Alert.alert('Attendance', `Take attendance for ${classItem.name}`)}
        >
          <Text style={styles.actionButtonText}>Take Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.textSecondary }]}
          onPress={() => Alert.alert('Timetable', `View timetable for ${classItem.name}`)}
        >
          <Text style={styles.actionButtonText}>View Timetable</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderTimetableView = () => (
    <View style={styles.timetableContainer}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Weekly Timetable
      </Text>
      <Text style={[styles.comingSoon, { color: colors.textSecondary }]}>
        Timetable integration coming soon...
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar
          title="Classes"
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationsPress={() => router.push('/(tabs)/notifications')}
          onSettingsPress={() => router.push('/(tabs)/settings')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading classes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Classes"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: activeTab === 'classes' ? colors.primary : colors.surface }
          ]}
          onPress={() => setActiveTab('classes')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'classes' ? '#fff' : colors.textPrimary }
          ]}>
            Classes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: activeTab === 'timetable' ? colors.primary : colors.surface }
          ]}
          onPress={() => setActiveTab('timetable')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'timetable' ? '#fff' : colors.textPrimary }
          ]}>
            Timetable
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {error && (
          <View style={[styles.errorCard, { backgroundColor: '#FFEBEE', borderColor: '#F44336' }]}>
            <Text style={[styles.errorText, { color: '#C62828' }]}>{error}</Text>
            <TouchableOpacity onPress={refreshData} style={styles.retryButton}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'classes' ? (
          <View style={styles.classesContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Your Classes ({classes.length})
            </Text>
            {classes.map(renderClassCard)}
          </View>
        ) : (
          renderTimetableView()
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  classesContainer: {
    marginBottom: 20,
  },
  classCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  classSection: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  classDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
  },
  classActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 0.48,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  timetableContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  comingSoon: {
    fontSize: 16,
    textAlign: 'center',
  },
});
