
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
  time: string;
  subject?: string;
  class?: string;
  venue?: string;
}

interface StaffTimetable {
  staffName: string;
  department: string;
  schedule: { [day: string]: TimetableSlot[] };
}

export default function StaffTimetableScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const timeSlots = ['9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '14:00-15:00', '15:00-16:00'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const [staffTimetables, setStaffTimetables] = useState<StaffTimetable[]>([
    {
      staffName: 'Ms. Sarah Johnson',
      department: 'Mathematics',
      schedule: {
        Monday: [
          { time: '9:00-10:00', subject: 'Algebra', class: '10-A', venue: 'R-101' },
          { time: '10:00-11:00', subject: 'Geometry', class: '10-B', venue: 'R-102' },
          { time: '11:00-12:00' },
          { time: '12:00-13:00', subject: 'Statistics', class: '11-A', venue: 'R-101' },
          { time: '14:00-15:00', subject: 'Calculus', class: '12-A', venue: 'R-103' },
          { time: '15:00-16:00' },
        ],
        Tuesday: [
          { time: '9:00-10:00', subject: 'Algebra', class: '10-B', venue: 'R-102' },
          { time: '10:00-11:00' },
          { time: '11:00-12:00', subject: 'Geometry', class: '10-A', venue: 'R-101' },
          { time: '12:00-13:00' },
          { time: '14:00-15:00', subject: 'Statistics', class: '11-B', venue: 'R-104' },
          { time: '15:00-16:00', subject: 'Calculus', class: '12-B', venue: 'R-103' },
        ],
        Wednesday: [
          { time: '9:00-10:00' },
          { time: '10:00-11:00', subject: 'Algebra', class: '10-A', venue: 'R-101' },
          { time: '11:00-12:00', subject: 'Geometry', class: '10-B', venue: 'R-102' },
          { time: '12:00-13:00', subject: 'Statistics', class: '11-A', venue: 'R-101' },
          { time: '14:00-15:00' },
          { time: '15:00-16:00', subject: 'Calculus', class: '12-A', venue: 'R-103' },
        ],
        Thursday: [
          { time: '9:00-10:00', subject: 'Algebra', class: '10-B', venue: 'R-102' },
          { time: '10:00-11:00', subject: 'Geometry', class: '10-A', venue: 'R-101' },
          { time: '11:00-12:00' },
          { time: '12:00-13:00', subject: 'Statistics', class: '11-B', venue: 'R-104' },
          { time: '14:00-15:00', subject: 'Calculus', class: '12-B', venue: 'R-103' },
          { time: '15:00-16:00' },
        ],
        Friday: [
          { time: '9:00-10:00' },
          { time: '10:00-11:00' },
          { time: '11:00-12:00', subject: 'Algebra', class: '10-A', venue: 'R-101' },
          { time: '12:00-13:00', subject: 'Geometry', class: '10-B', venue: 'R-102' },
          { time: '14:00-15:00', subject: 'Statistics', class: '11-A', venue: 'R-101' },
          { time: '15:00-16:00', subject: 'Calculus', class: '12-A', venue: 'R-103' },
        ],
      },
    },
    {
      staffName: 'Dr. Michael Chen',
      department: 'Physics',
      schedule: {
        Monday: [
          { time: '9:00-10:00', subject: 'Mechanics', class: '11-A', venue: 'L-201' },
          { time: '10:00-11:00' },
          { time: '11:00-12:00', subject: 'Optics', class: '12-A', venue: 'L-202' },
          { time: '12:00-13:00' },
          { time: '14:00-15:00', subject: 'Waves', class: '11-B', venue: 'L-201' },
          { time: '15:00-16:00', subject: 'Electricity', class: '12-B', venue: 'L-203' },
        ],
        Tuesday: [
          { time: '9:00-10:00' },
          { time: '10:00-11:00', subject: 'Mechanics', class: '11-B', venue: 'L-201' },
          { time: '11:00-12:00', subject: 'Optics', class: '12-B', venue: 'L-202' },
          { time: '12:00-13:00', subject: 'Waves', class: '11-A', venue: 'L-201' },
          { time: '14:00-15:00' },
          { time: '15:00-16:00', subject: 'Electricity', class: '12-A', venue: 'L-203' },
        ],
        Wednesday: [
          { time: '9:00-10:00', subject: 'Mechanics', class: '11-A', venue: 'L-201' },
          { time: '10:00-11:00', subject: 'Optics', class: '12-A', venue: 'L-202' },
          { time: '11:00-12:00' },
          { time: '12:00-13:00', subject: 'Waves', class: '11-B', venue: 'L-201' },
          { time: '14:00-15:00', subject: 'Electricity', class: '12-B', venue: 'L-203' },
          { time: '15:00-16:00' },
        ],
        Thursday: [
          { time: '9:00-10:00' },
          { time: '10:00-11:00' },
          { time: '11:00-12:00', subject: 'Mechanics', class: '11-B', venue: 'L-201' },
          { time: '12:00-13:00', subject: 'Optics', class: '12-B', venue: 'L-202' },
          { time: '14:00-15:00', subject: 'Waves', class: '11-A', venue: 'L-201' },
          { time: '15:00-16:00', subject: 'Electricity', class: '12-A', venue: 'L-203' },
        ],
        Friday: [
          { time: '9:00-10:00', subject: 'Mechanics', class: '11-A', venue: 'L-201' },
          { time: '10:00-11:00', subject: 'Optics', class: '12-A', venue: 'L-202' },
          { time: '11:00-12:00', subject: 'Waves', class: '11-B', venue: 'L-201' },
          { time: '12:00-13:00' },
          { time: '14:00-15:00' },
          { time: '15:00-16:00', subject: 'Electricity', class: '12-B', venue: 'L-203' },
        ],
      },
    },
  ]);

  const handleSlotPress = (staffIndex: number, day: string, timeIndex: number) => {
    if (!editMode) return;

    Alert.alert(
      'Edit Slot',
      `Edit ${timeSlots[timeIndex]} on ${day} for ${staffTimetables[staffIndex].staffName}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear Slot', onPress: () => clearSlot(staffIndex, day, timeIndex) },
        { text: 'Edit', onPress: () => editSlot(staffIndex, day, timeIndex) },
      ]
    );
  };

  const clearSlot = (staffIndex: number, day: string, timeIndex: number) => {
    const updatedTimetables = [...staffTimetables];
    updatedTimetables[staffIndex].schedule[day][timeIndex] = { time: timeSlots[timeIndex] };
    setStaffTimetables(updatedTimetables);
  };

  const editSlot = (staffIndex: number, day: string, timeIndex: number) => {
    // In a real app, this would open a modal for editing
    Alert.alert('Edit Slot', 'Slot editing modal would open here');
  };

  const renderTimetableSlot = (slot: TimetableSlot, staffIndex: number, day: string, timeIndex: number) => (
    <TouchableOpacity
      key={`${day}-${timeIndex}`}
      style={[
        styles.slot,
        { 
          backgroundColor: slot.subject ? colors.primary + '20' : colors.surface,
          borderColor: colors.border 
        }
      ]}
      onPress={() => handleSlotPress(staffIndex, day, timeIndex)}
    >
      {slot.subject ? (
        <View style={styles.slotContent}>
          <Text style={[styles.subjectText, { color: colors.textPrimary }]} numberOfLines={1}>
            {slot.subject}
          </Text>
          <Text style={[styles.classText, { color: colors.textSecondary }]} numberOfLines={1}>
            {slot.class}
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

  const renderStaffTimetable = (staff: StaffTimetable, staffIndex: number) => (
    <View key={staffIndex} style={[styles.staffSection, { backgroundColor: colors.surface }]}>
      <View style={styles.staffHeader}>
        <View>
          <Text style={[styles.staffName, { color: colors.textPrimary }]}>{staff.staffName}</Text>
          <Text style={[styles.department, { color: colors.textSecondary }]}>{staff.department}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.timetableContainer}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={[styles.timeHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.headerText, { color: colors.textPrimary }]}>Time</Text>
            </View>
            {days.map(day => (
              <View key={day} style={[styles.dayHeader, { backgroundColor: colors.background }]}>
                <Text style={[styles.headerText, { color: colors.textPrimary }]}>{day.slice(0, 3)}</Text>
              </View>
            ))}
          </View>

          {/* Time Rows */}
          {timeSlots.map((time, timeIndex) => (
            <View key={time} style={styles.timeRow}>
              <View style={[styles.timeCell, { backgroundColor: colors.background }]}>
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>{time}</Text>
              </View>
              {days.map(day => 
                renderTimetableSlot(staff.schedule[day][timeIndex], staffIndex, day, timeIndex)
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Staff Timetable"
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
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{staffTimetables.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Staff Members</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {staffTimetables.reduce((total, staff) => 
                total + Object.values(staff.schedule).flat().filter(slot => slot.subject).length, 0
              )}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Classes</Text>
          </View>
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

      {/* Timetables */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {staffTimetables.map((staff, index) => renderStaffTimetable(staff, index))}
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
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
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
  staffSection: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  staffName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  department: {
    fontSize: 14,
  },
  timetableContainer: {
    minWidth: 600,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  timeHeader: {
    width: 80,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 2,
  },
  dayHeader: {
    width: 100,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 2,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  timeCell: {
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 2,
  },
  timeText: {
    fontSize: 10,
    textAlign: 'center',
  },
  slot: {
    width: 100,
    height: 60,
    borderRadius: 4,
    marginRight: 2,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  slotContent: {
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  classText: {
    fontSize: 9,
    textAlign: 'center',
  },
  venueText: {
    fontSize: 8,
    textAlign: 'center',
  },
  emptySlot: {
    fontSize: 10,
    fontStyle: 'italic',
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
