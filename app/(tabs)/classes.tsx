
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Class {
  id: string;
  name: string;
  section: string;
  teacher: string;
  capacity: number;
  enrolled: number;
  status: 'active' | 'archived';
  subjects: string[];
  room: string;
}

export default function ClassesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'archived'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [addClassModal, setAddClassModal] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    section: '',
    teacher: '',
    capacity: '',
    room: '',
  });

  const [classes, setClasses] = useState<Class[]>([
    {
      id: '1',
      name: 'Grade 1',
      section: 'A',
      teacher: 'Ms. Sarah Johnson',
      capacity: 30,
      enrolled: 28,
      status: 'active',
      subjects: ['English', 'Math', 'Science'],
      room: 'Room 101',
    },
    {
      id: '2',
      name: 'Grade 1',
      section: 'B',
      teacher: 'Mr. Michael Chen',
      capacity: 30,
      enrolled: 25,
      status: 'active',
      subjects: ['English', 'Math', 'Science'],
      room: 'Room 102',
    },
    {
      id: '3',
      name: 'Grade 2',
      section: 'A',
      teacher: 'Ms. Jennifer Wilson',
      capacity: 28,
      enrolled: 27,
      status: 'active',
      subjects: ['English', 'Math', 'Science', 'Social Studies'],
      room: 'Room 201',
    },
    {
      id: '4',
      name: 'Grade 2',
      section: 'B',
      teacher: 'Mr. David Brown',
      capacity: 28,
      enrolled: 20,
      status: 'archived',
      subjects: ['English', 'Math', 'Science', 'Social Studies'],
      room: 'Room 202',
    },
  ]);

  const filteredClasses = classes.filter(cls => {
    if (activeTab === 'all') return true;
    return cls.status === activeTab;
  });

  const addNewClass = () => {
    if (!newClass.name || !newClass.section || !newClass.teacher || !newClass.capacity) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const classItem: Class = {
      id: (classes.length + 1).toString(),
      name: newClass.name,
      section: newClass.section,
      teacher: newClass.teacher,
      capacity: parseInt(newClass.capacity),
      enrolled: 0,
      status: 'active',
      subjects: [],
      room: newClass.room,
    };

    setClasses(prev => [...prev, classItem]);
    setNewClass({ name: '', section: '', teacher: '', capacity: '', room: '' });
    setAddClassModal(false);
    Alert.alert('Success', 'Class added successfully!');
  };

  const toggleClassStatus = (id: string) => {
    setClasses(prev => prev.map(cls =>
      cls.id === id
        ? { ...cls, status: cls.status === 'active' ? 'archived' : 'active' }
        : cls
    ));
  };

  const getOccupancyColor = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 90) return '#FF3B30';
    if (percentage >= 75) return '#FF9500';
    return '#34C759';
  };

  const renderClassCard = ({ item }: { item: Class }) => (
    <TouchableOpacity
      style={[
        styles.classCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        viewMode === 'list' && styles.listCard
      ]}
      onPress={() => Alert.alert('Class Details', `View details for ${item.name}${item.section}`)}
    >
      <View style={styles.classHeader}>
        <View style={styles.classInfo}>
          <Text style={[styles.className, { color: colors.textPrimary }]}>
            {item.name}{item.section}
          </Text>
          <Text style={[styles.classRoom, { color: colors.textSecondary }]}>
            {item.room}
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
        <View style={styles.occupancyInfo}>
          <Text style={[styles.occupancyText, { color: colors.textSecondary }]}>
            Students: {item.enrolled}/{item.capacity}
          </Text>
          <View style={[styles.occupancyBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.occupancyFill,
                {
                  width: `${(item.enrolled / item.capacity) * 100}%`,
                  backgroundColor: getOccupancyColor(item.enrolled, item.capacity),
                }
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.subjectsContainer}>
        <Text style={[styles.subjectsLabel, { color: colors.textSecondary }]}>Subjects:</Text>
        <View style={styles.subjectsList}>
          {item.subjects.slice(0, 3).map((subject, index) => (
            <View key={index} style={[styles.subjectBadge, { backgroundColor: colors.primary + '20' }]}>
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

      {user?.is_staff && (
        <View style={styles.classActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => Alert.alert('Edit', `Edit ${item.name}${item.section}`)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
            onPress={() => Alert.alert('Timetable', `View timetable for ${item.name}${item.section}`)}
          >
            <Text style={styles.actionButtonText}>Timetable</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: item.status === 'active' ? '#FF3B30' : '#34C759' }]}
            onPress={() => toggleClassStatus(item.id)}
          >
            <Text style={styles.actionButtonText}>
              {item.status === 'active' ? 'Archive' : 'Restore'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

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

      {/* Header Controls */}
      <View style={[styles.headerControls, { backgroundColor: colors.surface }]}>
        <View style={styles.tabContainer}>
          {['all', 'active', 'archived'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { backgroundColor: colors.primary }
              ]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab ? '#FFFFFF' : colors.textPrimary }
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.viewControls}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              { backgroundColor: viewMode === 'grid' ? colors.primary : colors.border }
            ]}
            onPress={() => setViewMode('grid')}
          >
            <Text style={[
              styles.viewButtonText,
              { color: viewMode === 'grid' ? '#FFFFFF' : colors.textPrimary }
            ]}>
              Grid
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewButton,
              { backgroundColor: viewMode === 'list' ? colors.primary : colors.border }
            ]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[
              styles.viewButtonText,
              { color: viewMode === 'list' ? '#FFFFFF' : colors.textPrimary }
            ]}>
              List
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {classes.filter(c => c.status === 'active').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Classes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {classes.reduce((sum, c) => sum + c.enrolled, 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Students</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {Math.round((classes.reduce((sum, c) => sum + c.enrolled, 0) /
              classes.reduce((sum, c) => sum + c.capacity, 0)) * 100)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Occupancy</Text>
        </View>
      </View>

      {/* Classes List */}
      <FlatList
        data={filteredClasses}
        renderItem={renderClassCard}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Quick Add Button */}
      {user?.is_staff && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setAddClassModal(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Class Modal */}
      <Modal
        visible={addClassModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddClassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add New Class</Text>

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Class Name (e.g., Grade 1)"
              placeholderTextColor={colors.textSecondary}
              value={newClass.name}
              onChangeText={(text) => setNewClass(prev => ({ ...prev, name: text }))}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Section (e.g., A, B, C)"
              placeholderTextColor={colors.textSecondary}
              value={newClass.section}
              onChangeText={(text) => setNewClass(prev => ({ ...prev, section: text }))}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Class Teacher"
              placeholderTextColor={colors.textSecondary}
              value={newClass.teacher}
              onChangeText={(text) => setNewClass(prev => ({ ...prev, teacher: text }))}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Capacity"
              placeholderTextColor={colors.textSecondary}
              value={newClass.capacity}
              onChangeText={(text) => setNewClass(prev => ({ ...prev, capacity: text }))}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Room (Optional)"
              placeholderTextColor={colors.textSecondary}
              value={newClass.room}
              onChangeText={(text) => setNewClass(prev => ({ ...prev, room: text }))}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setAddClassModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={addNewClass}
              >
                <Text style={styles.modalButtonText}>Add Class</Text>
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
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewControls: {
    flexDirection: 'row',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 4,
  },
  viewButtonText: {
    fontSize: 12,
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
  classCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    margin: 4,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  listCard: {
    flex: 1,
    margin: 0,
    marginBottom: 8,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  classRoom: {
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
  occupancyInfo: {
    flex: 1,
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
  classActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
