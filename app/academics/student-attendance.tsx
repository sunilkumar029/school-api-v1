
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';

interface AttendanceRecord {
  id: string;
  studentName: string;
  rollNumber: string;
  status: 'present' | 'absent' | 'late';
  date: string;
}

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  attendancePercentage: number;
}

export default function StudentAttendanceScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'mark' | 'view' | 'reports'>('mark');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('12-A');

  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'John Smith', rollNumber: 'CS2024001', attendancePercentage: 95 },
    { id: '2', name: 'Emily Johnson', rollNumber: 'CS2024002', attendancePercentage: 98 },
    { id: '3', name: 'Michael Brown', rollNumber: 'CS2024003', attendancePercentage: 92 },
    { id: '4', name: 'Sarah Davis', rollNumber: 'CS2024004', attendancePercentage: 88 },
  ]);

  const [todayAttendance, setTodayAttendance] = useState<{[key: string]: 'present' | 'absent' | 'late'}>({
    '1': 'present',
    '2': 'present',
    '3': 'absent',
    '4': 'late',
  });

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setTodayAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = () => {
    Alert.alert('Success', 'Attendance saved successfully for ' + selectedDate);
  };

  const renderAttendanceMarkItem = ({ item }: { item: Student }) => (
    <View style={[styles.attendanceItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.studentInfo}>
        <Text style={[styles.studentName, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.rollNumber, { color: colors.textSecondary }]}>{item.rollNumber}</Text>
      </View>
      <View style={styles.attendanceButtons}>
        <TouchableOpacity
          style={[
            styles.attendanceButton,
            { backgroundColor: todayAttendance[item.id] === 'present' ? '#4CAF50' : colors.border }
          ]}
          onPress={() => handleAttendanceChange(item.id, 'present')}
        >
          <Text style={[
            styles.attendanceButtonText,
            { color: todayAttendance[item.id] === 'present' ? '#FFFFFF' : colors.textSecondary }
          ]}>P</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.attendanceButton,
            { backgroundColor: todayAttendance[item.id] === 'absent' ? '#F44336' : colors.border }
          ]}
          onPress={() => handleAttendanceChange(item.id, 'absent')}
        >
          <Text style={[
            styles.attendanceButtonText,
            { color: todayAttendance[item.id] === 'absent' ? '#FFFFFF' : colors.textSecondary }
          ]}>A</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.attendanceButton,
            { backgroundColor: todayAttendance[item.id] === 'late' ? '#FF9800' : colors.border }
          ]}
          onPress={() => handleAttendanceChange(item.id, 'late')}
        >
          <Text style={[
            styles.attendanceButtonText,
            { color: todayAttendance[item.id] === 'late' ? '#FFFFFF' : colors.textSecondary }
          ]}>L</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReportItem = ({ item }: { item: Student }) => (
    <View style={[styles.reportItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.studentInfo}>
        <Text style={[styles.studentName, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.rollNumber, { color: colors.textSecondary }]}>{item.rollNumber}</Text>
      </View>
      <View style={styles.attendanceStats}>
        <Text style={[styles.attendancePercentage, { color: colors.textPrimary }]}>
          {item.attendancePercentage}%
        </Text>
        <View style={[styles.attendanceBar, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.attendanceProgress,
              { 
                width: `${item.attendancePercentage}%`,
                backgroundColor: item.attendancePercentage >= 75 ? '#4CAF50' : '#F44336'
              }
            ]}
          />
        </View>
        <Text style={[
          styles.attendanceStatus,
          { color: item.attendancePercentage >= 75 ? '#4CAF50' : '#F44336' }
        ]}>
          {item.attendancePercentage >= 75 ? 'Good' : 'Poor'}
        </Text>
      </View>
    </View>
  );

  const renderMarkContent = () => (
    <View style={styles.content}>
      {/* Date and Class Selection */}
      <View style={[styles.controlsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.controlRow}>
          <Text style={[styles.controlLabel, { color: colors.textPrimary }]}>Date:</Text>
          <TouchableOpacity style={[styles.dateButton, { borderColor: colors.border }]}>
            <Text style={[styles.dateText, { color: colors.textPrimary }]}>{selectedDate}</Text>
            <Text style={[styles.calendarIcon, { color: colors.textSecondary }]}>📅</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <Text style={[styles.controlLabel, { color: colors.textPrimary }]}>Class:</Text>
          <TouchableOpacity style={[styles.dropdown, { borderColor: colors.border }]}>
            <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>{selectedClass}</Text>
            <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Legend */}
      <View style={[styles.legendContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Present</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Absent</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Late</Text>
        </View>
      </View>

      {/* Students List */}
      <FlatList
        data={students}
        renderItem={renderAttendanceMarkItem}
        keyExtractor={(item) => item.id}
        style={styles.studentsList}
        showsVerticalScrollIndicator={false}
      />

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={handleSaveAttendance}
      >
        <Text style={styles.saveButtonText}>Save Attendance</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReportsContent = () => (
    <View style={styles.content}>
      {/* Summary Stats */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>93.5%</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Class Average</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>32</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Present Today</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#F44336' }]}>3</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Below 75%</Text>
        </View>
      </View>

      {/* Students Report */}
      <FlatList
        data={students}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        style={styles.studentsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Student Attendance"
        onMenuPress={() => setDrawerVisible(true)}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'mark' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('mark')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'mark' ? colors.primary : colors.textSecondary }
          ]}>
            Mark Attendance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'reports' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'reports' ? colors.primary : colors.textSecondary }
          ]}>
            Reports
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'mark' ? renderMarkContent() : renderReportsContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  controlsContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 60,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginLeft: 12,
  },
  dateText: {
    fontSize: 14,
  },
  calendarIcon: {
    fontSize: 16,
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginLeft: 12,
  },
  dropdownText: {
    fontSize: 14,
  },
  dropdownArrow: {
    fontSize: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
  studentsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  attendanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rollNumber: {
    fontSize: 12,
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  attendanceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  attendanceStats: {
    alignItems: 'flex-end',
  },
  attendancePercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  attendanceBar: {
    width: 100,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  attendanceProgress: {
    height: 4,
    borderRadius: 2,
  },
  attendanceStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
});
