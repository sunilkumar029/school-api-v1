
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';

interface TimetableSlot {
  subject?: string;
  teacher?: string;
  venue?: string;
}

interface ClassTimetable {
  [day: string]: TimetableSlot[];
}

export default function ClassTimetableScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState('10-A');
  const [editMode, setEditMode] = useState(false);

  const periods = ['Period 1', 'Period 2', 'Period 3', 'Break', 'Period 4', 'Period 5', 'Period 6'];
  const timeSlots = ['9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const classes = ['10-A', '10-B', '11-A', '11-B', '12-A', '12-B'];

  const [classTimetables, setClassTimetables] = useState<{ [className: string]: ClassTimetable }>({
    '10-A': {
      Monday: [
        { subject: 'Mathematics', teacher: 'Ms. Sarah Johnson', venue: 'R-101' },
        { subject: 'Physics', teacher: 'Dr. Michael Chen', venue: 'L-201' },
        { subject: 'English', teacher: 'Ms. Emily Wilson', venue: 'R-102' },
        {}, // Break
        { subject: 'Chemistry', teacher: 'Dr. David Brown', venue: 'L-202' },
        { subject: 'Biology', teacher: 'Ms. Jennifer Lee', venue: 'L-203' },
        { subject: 'History', teacher: 'Mr. Robert Taylor', venue: 'R-103' },
      ],
      Tuesday: [
        { subject: 'English', teacher: 'Ms. Emily Wilson', venue: 'R-102' },
        { subject: 'Mathematics', teacher: 'Ms. Sarah Johnson', venue: 'R-101' },
        { subject: 'Chemistry', teacher: 'Dr. David Brown', venue: 'L-202' },
        {}, // Break
        { subject: 'Physics', teacher: 'Dr. Michael Chen', venue: 'L-201' },
        { subject: 'Geography', teacher: 'Ms. Lisa Anderson', venue: 'R-104' },
        { subject: 'Biology', teacher: 'Ms. Jennifer Lee', venue: 'L-203' },
      ],
      Wednesday: [
        { subject: 'Biology', teacher: 'Ms. Jennifer Lee', venue: 'L-203' },
        { subject: 'English', teacher: 'Ms. Emily Wilson', venue: 'R-102' },
        { subject: 'Mathematics', teacher: 'Ms. Sarah Johnson', venue: 'R-101' },
        {}, // Break
        { subject: 'History', teacher: 'Mr. Robert Taylor', venue: 'R-103' },
        { subject: 'Physics', teacher: 'Dr. Michael Chen', venue: 'L-201' },
        { subject: 'Chemistry', teacher: 'Dr. David Brown', venue: 'L-202' },
      ],
      Thursday: [
        { subject: 'Geography', teacher: 'Ms. Lisa Anderson', venue: 'R-104' },
        { subject: 'Biology', teacher: 'Ms. Jennifer Lee', venue: 'L-203' },
        { subject: 'Physics', teacher: 'Dr. Michael Chen', venue: 'L-201' },
        {}, // Break
        { subject: 'Mathematics', teacher: 'Ms. Sarah Johnson', venue: 'R-101' },
        { subject: 'English', teacher: 'Ms. Emily Wilson', venue: 'R-102' },
        { subject: 'Chemistry', teacher: 'Dr. David Brown', venue: 'L-202' },
      ],
      Friday: [
        { subject: 'History', teacher: 'Mr. Robert Taylor', venue: 'R-103' },
        { subject: 'Chemistry', teacher: 'Dr. David Brown', venue: 'L-202' },
        { subject: 'Geography', teacher: 'Ms. Lisa Anderson', venue: 'R-104' },
        {}, // Break
        { subject: 'Biology', teacher: 'Ms. Jennifer Lee', venue: 'L-203' },
        { subject: 'Mathematics', teacher: 'Ms. Sarah Johnson', venue: 'R-101' },
        { subject: 'Physics', teacher: 'Dr. Michael Chen', venue: 'L-201' },
      ],
    },
  });

  const handleSlotPress = (day: string, periodIndex: number) => {
    if (!editMode) return;
    if (periods[periodIndex] === 'Break') return;

    Alert.alert(
      'Edit Slot',
      `Edit ${periods[periodIndex]} on ${day}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear Slot', onPress: () => clearSlot(day, periodIndex) },
        { text: 'Edit', onPress: () => editSlot(day, periodIndex) },
      ]
    );
  };

  const clearSlot = (day: string, periodIndex: number) => {
    const updatedTimetables = { ...classTimetables };
    if (!updatedTimetables[selectedClass]) {
      updatedTimetables[selectedClass] = {};
    }
    if (!updatedTimetables[selectedClass][day]) {
      updatedTimetables[selectedClass][day] = new Array(periods.length).fill({});
    }
    updatedTimetables[selectedClass][day][periodIndex] = {};
    setClassTimetables(updatedTimetables);
  };

  const editSlot = (day: string, periodIndex: number) => {
    // In a real app, this would open a modal for editing
    Alert.alert('Edit Slot', 'Slot editing modal would open here');
  };

  const renderTimetableSlot = (slot: TimetableSlot, day: string, periodIndex: number) => {
    const isBreak = periods[periodIndex] === 'Break';
    
    return (
      <TouchableOpacity
        key={`${day}-${periodIndex}`}
        style={[
          styles.slot,
          {
            backgroundColor: isBreak 
              ? colors.border + '50' 
              : slot.subject 
                ? colors.primary + '20' 
                : colors.surface,
            borderColor: colors.border
          }
        ]}
        onPress={() => handleSlotPress(day, periodIndex)}
        disabled={isBreak}
      >
        {isBreak ? (
          <Text style={[styles.breakText, { color: colors.textSecondary }]}>BREAK</Text>
        ) : slot.subject ? (
          <View style={styles.slotContent}>
            <Text style={[styles.subjectText, { color: colors.textPrimary }]} numberOfLines={1}>
              {slot.subject}
            </Text>
            <Text style={[styles.teacherText, { color: colors.textSecondary }]} numberOfLines={1}>
              {slot.teacher}
            </Text>
            <Text style={[styles.venueText, { color: colors.textSecondary }]} numberOfLines={1}>
              {slot.venue}
            </Text>
          </View>
        ) : (
          <Text style={[styles.emptySlot, { color: colors.textSecondary }]}>Free</Text>
        )}
      </TouchableOpacity>
    );
  };

  const currentTimetable = classTimetables[selectedClass] || {};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Class Timetable"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Controls */}
      <View style={[styles.controlsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.classSelector}>
          <Text style={[styles.selectorLabel, { color: colors.textPrimary }]}>Select Class:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classButtons}>
            {classes.map(className => (
              <TouchableOpacity
                key={className}
                style={[
                  styles.classButton,
                  {
                    backgroundColor: selectedClass === className ? colors.primary : colors.background,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setSelectedClass(className)}
              >
                <Text style={[
                  styles.classButtonText,
                  { color: selectedClass === className ? '#FFFFFF' : colors.textPrimary }
                ]}>
                  {className}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {user?.is_staff && (
          <TouchableOpacity
            style={[
              styles.editButton,
              { backgroundColor: editMode ? '#FF3B30' : colors.primary }
            ]}
            onPress={() => setEditMode(!editMode)}
          >
            <Text style={styles.editButtonText}>
              {editMode ? 'Exit Edit' : 'Edit Mode'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Timetable */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.timetableSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.timetableTitle, { color: colors.textPrimary }]}>
            Class {selectedClass} Timetable
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.timetableContainer}>
              {/* Header Row */}
              <View style={styles.headerRow}>
                <View style={[styles.timeHeader, { backgroundColor: colors.background }]}>
                  <Text style={[styles.headerText, { color: colors.textPrimary }]}>Time</Text>
                </View>
                {days.map(day => (
                  <View key={day} style={[styles.dayHeader, { backgroundColor: colors.background }]}>
                    <Text style={[styles.headerText, { color: colors.textPrimary }]}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Period Rows */}
              {periods.map((period, periodIndex) => (
                <View key={period} style={styles.periodRow}>
                  <View style={[styles.timeCell, { backgroundColor: colors.background }]}>
                    <Text style={[styles.periodText, { color: colors.textSecondary }]}>{period}</Text>
                    <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                      {timeSlots[periodIndex]}
                    </Text>
                  </View>
                  {days.map(day => {
                    const daySchedule = currentTimetable[day] || [];
                    const slot = daySchedule[periodIndex] || {};
                    return renderTimetableSlot(slot, day, periodIndex);
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {editMode && (
        <View style={[styles.editHelp, { backgroundColor: colors.primary }]}>
          <Text style={styles.editHelpText}>Tap on any slot to edit or clear it</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlsContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  classSelector: {
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  classButtons: {
    flexDirection: 'row',
  },
  classButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  classButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  timetableSection: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  timetableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  timetableContainer: {
    minWidth: 800,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  timeHeader: {
    width: 100,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 2,
  },
  dayHeader: {
    width: 140,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 2,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  periodRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  timeCell: {
    width: 100,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 2,
    padding: 4,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeText: {
    fontSize: 10,
    textAlign: 'center',
  },
  slot: {
    width: 140,
    height: 80,
    borderRadius: 4,
    marginRight: 2,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  slotContent: {
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  teacherText: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 2,
  },
  venueText: {
    fontSize: 9,
    textAlign: 'center',
  },
  emptySlot: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  breakText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editHelp: {
    padding: 12,
    alignItems: 'center',
  },
  editHelpText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
