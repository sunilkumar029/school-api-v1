
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';

interface StudentPerformance {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  overallGrade: string;
  attendance: number;
  subjects: {
    name: string;
    marks: number;
    grade: string;
  }[];
}

export default function StudentPerformanceScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'subject' | 'individual'>('overview');

  const [students] = useState<StudentPerformance[]>([
    {
      id: '1',
      name: 'John Smith',
      rollNumber: 'CS2024001',
      class: '12-A',
      overallGrade: 'A',
      attendance: 94,
      subjects: [
        { name: 'Mathematics', marks: 92, grade: 'A+' },
        { name: 'Physics', marks: 88, grade: 'A' },
        { name: 'Chemistry', marks: 85, grade: 'A' },
        { name: 'English', marks: 91, grade: 'A+' },
      ]
    },
    {
      id: '2',
      name: 'Emily Johnson',
      rollNumber: 'CS2024002',
      class: '12-A',
      overallGrade: 'A+',
      attendance: 98,
      subjects: [
        { name: 'Mathematics', marks: 95, grade: 'A+' },
        { name: 'Physics', marks: 93, grade: 'A+' },
        { name: 'Chemistry', marks: 89, grade: 'A' },
        { name: 'English', marks: 94, grade: 'A+' },
      ]
    },
  ]);

  const renderStudentCard = ({ item }: { item: StudentPerformance }) => (
    <View style={[styles.studentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.studentHeader}>
        <View>
          <Text style={[styles.studentName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.studentInfo, { color: colors.textSecondary }]}>
            {item.rollNumber} • {item.class}
          </Text>
        </View>
        <View style={[styles.gradeBadge, { 
          backgroundColor: item.overallGrade === 'A+' ? '#4CAF50' : 
                          item.overallGrade === 'A' ? '#8BC34A' : '#FF9800' 
        }]}>
          <Text style={styles.gradeText}>{item.overallGrade}</Text>
        </View>
      </View>

      <View style={styles.performanceRow}>
        <View style={styles.performanceItem}>
          <Text style={[styles.performanceValue, { color: colors.textPrimary }]}>
            {Math.round(item.subjects.reduce((sum, subject) => sum + subject.marks, 0) / item.subjects.length)}%
          </Text>
          <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>Average</Text>
        </View>
        <View style={styles.performanceItem}>
          <Text style={[styles.performanceValue, { color: colors.textPrimary }]}>{item.attendance}%</Text>
          <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>Attendance</Text>
        </View>
      </View>

      <View style={styles.subjectsContainer}>
        <Text style={[styles.subjectsTitle, { color: colors.textPrimary }]}>Subject Performance</Text>
        <View style={styles.subjectsGrid}>
          {item.subjects.map((subject, index) => (
            <View key={index} style={[styles.subjectItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.subjectName, { color: colors.textSecondary }]}>{subject.name}</Text>
              <Text style={[styles.subjectMarks, { color: colors.textPrimary }]}>{subject.marks}%</Text>
              <Text style={[styles.subjectGrade, { color: colors.primary }]}>{subject.grade}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={[styles.detailsButton, { borderColor: colors.primary }]}>
        <Text style={[styles.detailsText, { color: colors.primary }]}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Student Performance"
        onMenuPress={() => setDrawerVisible(true)}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* View Filter */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        {['overview', 'subject', 'individual'].map((view) => (
          <TouchableOpacity
            key={view}
            style={[
              styles.filterTab,
              selectedView === view && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedView(view as any)}
          >
            <Text style={[
              styles.filterText,
              { color: selectedView === view ? '#FFFFFF' : colors.textPrimary }
            ]}>
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Class Statistics */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>89.5%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Class Average</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>42</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Students</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>95%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Attendance</Text>
        </View>
      </View>

      {/* Students List */}
      <FlatList
        data={students}
        renderItem={renderStudentCard}
        keyExtractor={(item) => item.id}
        style={styles.studentsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  studentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  studentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  studentInfo: {
    fontSize: 14,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gradeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  performanceRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  performanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
  },
  subjectsContainer: {
    marginBottom: 16,
  },
  subjectsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectItem: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  subjectName: {
    fontSize: 12,
    marginBottom: 4,
  },
  subjectMarks: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subjectGrade: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
