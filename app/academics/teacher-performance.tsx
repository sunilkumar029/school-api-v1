
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

interface TeacherData {
  id: string;
  name: string;
  subject: string;
  department: string;
  rating: number;
  studentsCount: number;
  classesCount: number;
  attendance: number;
  feedback: string[];
}

export default function TeacherPerformanceScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'semester' | 'year'>('month');

  const [teachers] = useState<TeacherData[]>([
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      subject: 'Mathematics',
      department: 'Science',
      rating: 4.8,
      studentsCount: 85,
      classesCount: 12,
      attendance: 96,
      feedback: ['Excellent teaching methodology', 'Very supportive', 'Clear explanations']
    },
    {
      id: '2',
      name: 'Prof. Michael Brown',
      subject: 'Physics',
      department: 'Science',
      rating: 4.6,
      studentsCount: 72,
      classesCount: 10,
      attendance: 94,
      feedback: ['Good practical sessions', 'Needs improvement in communication']
    },
  ]);

  const renderTeacherCard = ({ item }: { item: TeacherData }) => (
    <View style={[styles.teacherCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.teacherHeader}>
        <View>
          <Text style={[styles.teacherName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.teacherSubject, { color: colors.textSecondary }]}>
            {item.subject} • {item.department}
          </Text>
        </View>
        <View style={[styles.ratingBadge, { backgroundColor: item.rating >= 4.5 ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.ratingText}>⭐ {item.rating}</Text>
        </View>
      </View>
      
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{item.studentsCount}</Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Students</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{item.classesCount}</Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Classes</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{item.attendance}%</Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Attendance</Text>
        </View>
      </View>

      <View style={styles.feedbackSection}>
        <Text style={[styles.feedbackTitle, { color: colors.textPrimary }]}>Recent Feedback</Text>
        {item.feedback.slice(0, 2).map((feedback, index) => (
          <Text key={index} style={[styles.feedbackText, { color: colors.textSecondary }]}>
            • {feedback}
          </Text>
        ))}
      </View>

      <TouchableOpacity style={[styles.viewDetailsButton, { borderColor: colors.primary }]}>
        <Text style={[styles.viewDetailsText, { color: colors.primary }]}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Teacher Performance"
        onMenuPress={() => setDrawerVisible(true)}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Period Filter */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        {['month', 'semester', 'year'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.filterTab,
              selectedPeriod === period && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedPeriod(period as any)}
          >
            <Text style={[
              styles.filterText,
              { color: selectedPeriod === period ? '#FFFFFF' : colors.textPrimary }
            ]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Stats */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>4.7</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Avg Rating</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>24</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Teachers</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>95%</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Avg Attendance</Text>
        </View>
      </View>

      {/* Teachers List */}
      <FlatList
        data={teachers}
        renderItem={renderTeacherCard}
        keyExtractor={(item) => item.id}
        style={styles.teachersList}
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
  },
  teachersList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  teacherCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  teacherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  teacherSubject: {
    fontSize: 14,
  },
  ratingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
  },
  feedbackSection: {
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 12,
    marginBottom: 4,
  },
  viewDetailsButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
