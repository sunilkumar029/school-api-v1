
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Classroom {
  id: string;
  name: string;
  grade: string;
  roomNo: string;
  teacher: string;
  studentCount: number;
  capacity: number;
  subjects: string[];
  status: 'active' | 'inactive';
}

export default function ClassroomScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'assignments' | 'timetable'>('list');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newClassroom, setNewClassroom] = useState({
    name: '',
    grade: '',
    roomNo: '',
    teacher: '',
    capacity: '',
  });

  const [classrooms, setClassrooms] = useState<Classroom[]>([
    {
      id: '1',
      name: 'Mathematics A',
      grade: 'Grade 10',
      roomNo: 'R-101',
      teacher: 'Ms. Sarah Johnson',
      studentCount: 28,
      capacity: 30,
      subjects: ['Algebra', 'Geometry', 'Statistics'],
      status: 'active',
    },
    {
      id: '2',
      name: 'Science Lab',
      grade: 'Grade 9',
      roomNo: 'L-201',
      teacher: 'Dr. Michael Chen',
      studentCount: 25,
      capacity: 30,
      subjects: ['Physics', 'Chemistry', 'Biology'],
      status: 'active',
    },
  ]);

  const handleAddClassroom = () => {
    if (!newClassroom.name || !newClassroom.grade || !newClassroom.roomNo) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const classroom: Classroom = {
      id: Date.now().toString(),
      name: newClassroom.name,
      grade: newClassroom.grade,
      roomNo: newClassroom.roomNo,
      teacher: newClassroom.teacher,
      studentCount: 0,
      capacity: parseInt(newClassroom.capacity) || 30,
      subjects: [],
      status: 'active',
    };

    setClassrooms([...classrooms, classroom]);
    setNewClassroom({ name: '', grade: '', roomNo: '', teacher: '', capacity: '' });
    setAddModalVisible(false);
    Alert.alert('Success', 'Classroom added successfully');
  };

  const renderClassroomCard = ({ item }: { item: Classroom }) => (
    <TouchableOpacity
      style={[styles.classroomCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => Alert.alert('Classroom Details', `View details for ${item.name}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.classroomInfo}>
          <Text style={[styles.classroomName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.classroomDetails, { color: colors.textSecondary }]}>
            {item.grade} • {item.roomNo}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'active' ? '#34C759' : '#8E8E93' }
        ]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={[styles.teacherName, { color: colors.textPrimary }]}>
        👨‍🏫 {item.teacher}
      </Text>

      <View style={styles.occupancyContainer}>
        <Text style={[styles.occupancyText, { color: colors.textSecondary }]}>
          Students: {item.studentCount}/{item.capacity}
        </Text>
        <View style={[styles.occupancyBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.occupancyFill,
              {
                backgroundColor: colors.primary,
                width: `${(item.studentCount / item.capacity) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {item.subjects.length > 0 && (
        <View style={styles.subjectsContainer}>
          <Text style={[styles.subjectsLabel, { color: colors.textSecondary }]}>Subjects:</Text>
          <View style={styles.subjectsList}>
            {item.subjects.slice(0, 3).map((subject, index) => (
              <View
                key={index}
                style={[styles.subjectBadge, { backgroundColor: colors.primary + '20' }]}
              >
                <Text style={[styles.subjectText, { color: colors.primary }]}>{subject}</Text>
              </View>
            ))}
            {item.subjects.length > 3 && (
              <Text style={[styles.moreSubjects, { color: colors.textSecondary }]}>
                +{item.subjects.length - 3} more
              </Text>
            )}
          </View>
        </View>
      )}

      {user?.is_staff && (
        <View style={styles.classroomActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => Alert.alert('Edit', `Edit ${item.name}`)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
            onPress={() => Alert.alert('Timetable', `View timetable for ${item.name}`)}
          >
            <Text style={styles.actionButtonText}>Schedule</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderListContent = () => (
    <FlatList
      data={classrooms}
      renderItem={renderClassroomCard}
      keyExtractor={(item) => item.id}
      style={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'list':
        return renderListContent();
      case 'assignments':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
              Assignments management will be implemented here
            </Text>
          </View>
        );
      case 'timetable':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
              Classroom timetable will be implemented here
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Classroom Management"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        {[
          { key: 'list', label: 'List View' },
          { key: 'assignments', label: 'Assignments' },
          { key: 'timetable', label: 'Timetable' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? colors.primary : colors.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{classrooms.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Classrooms</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {classrooms.filter(c => c.status === 'active').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {classrooms.reduce((sum, c) => sum + c.studentCount, 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Students</Text>
        </View>
      </View>

      {renderContent()}

      {/* Add Classroom Button */}
      {user?.is_staff && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Classroom Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add New Classroom</Text>

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Classroom Name"
              placeholderTextColor={colors.textSecondary}
              value={newClassroom.name}
              onChangeText={(text) => setNewClassroom(prev => ({ ...prev, name: text }))}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Grade"
              placeholderTextColor={colors.textSecondary}
              value={newClassroom.grade}
              onChangeText={(text) => setNewClassroom(prev => ({ ...prev, grade: text }))}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Room Number"
              placeholderTextColor={colors.textSecondary}
              value={newClassroom.roomNo}
              onChangeText={(text) => setNewClassroom(prev => ({ ...prev, roomNo: text }))}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Teacher Name"
              placeholderTextColor={colors.textSecondary}
              value={newClassroom.teacher}
              onChangeText={(text) => setNewClassroom(prev => ({ ...prev, teacher: text }))}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Capacity"
              placeholderTextColor={colors.textSecondary}
              value={newClassroom.capacity}
              onChangeText={(text) => setNewClassroom(prev => ({ ...prev, capacity: text }))}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleAddClassroom}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
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
  listContent: {
    padding: 16,
  },
  classroomCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  classroomInfo: {
    flex: 1,
  },
  classroomName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  classroomDetails: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  occupancyContainer: {
    marginBottom: 12,
  },
  occupancyText: {
    fontSize: 12,
    marginBottom: 4,
  },
  occupancyBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 2,
  },
  subjectsContainer: {
    marginBottom: 12,
  },
  subjectsLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  subjectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  subjectBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  subjectText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreSubjects: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  classroomActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  placeholder: {
    fontSize: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
