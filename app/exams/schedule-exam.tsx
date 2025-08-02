import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';

interface Exam {
  id: string;
  title: string;
  subject: string;
  class: string;
  date: string;
  time: string;
  duration: number;
  venue: string;
  maxMarks: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  teacher: string;
}

export default function ScheduleExamScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newExam, setNewExam] = useState({
    title: '',
    subject: '',
    class: '',
    date: '',
    time: '',
    duration: '120',
    venue: '',
    maxMarks: '100',
    teacher: '',
  });

  const [exams, setExams] = useState<Exam[]>([
    {
      id: '1',
      title: 'Mathematics Final',
      subject: 'Mathematics',
      class: '12-A',
      date: '2024-02-15',
      time: '09:00',
      duration: 180,
      venue: 'Room 101',
      maxMarks: 100,
      status: 'upcoming',
      teacher: 'Dr. Smith',
    },
    {
      id: '2',
      title: 'Physics Midterm',
      subject: 'Physics',
      class: '11-B',
      date: '2024-02-10',
      time: '14:00',
      duration: 120,
      venue: 'Lab 201',
      maxMarks: 75,
      status: 'completed',
      teacher: 'Prof. Johnson',
    },
  ]);

  const handleAddExam = () => {
    if (!newExam.title || !newExam.subject || !newExam.class || !newExam.date || !newExam.time) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    // Check for conflicts
    const conflictingExam = exams.find(exam => 
      exam.class === newExam.class && 
      exam.date === newExam.date && 
      exam.time === newExam.time
    );

    if (conflictingExam) {
      Alert.alert('Conflict Detected', `Class ${newExam.class} already has an exam scheduled at this time: ${conflictingExam.title}`);
      return;
    }

    const exam: Exam = {
      id: Date.now().toString(),
      title: newExam.title,
      subject: newExam.subject,
      class: newExam.class,
      date: newExam.date,
      time: newExam.time,
      duration: parseInt(newExam.duration) || 120,
      venue: newExam.venue,
      maxMarks: parseInt(newExam.maxMarks) || 100,
      status: 'upcoming',
      teacher: newExam.teacher,
    };

    setExams(prev => [...prev, exam]);
    setAddModalVisible(false);
    setNewExam({
      title: '',
      subject: '',
      class: '',
      date: '',
      time: '',
      duration: '120',
      venue: '',
      maxMarks: '100',
      teacher: '',
    });
    Alert.alert('Success', 'Exam scheduled successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#007AFF';
      case 'ongoing': return '#FF9500';
      case 'completed': return '#34C759';
      default: return colors.textSecondary;
    }
  };

  const renderExamCard = ({ item }: { item: Exam }) => (
    <View style={[styles.examCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.examInfo}>
          <Text style={[styles.examTitle, { color: colors.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.examDetails, { color: colors.textSecondary }]}>
            {item.subject} • {item.class}
          </Text>
          <Text style={[styles.examDetails, { color: colors.textSecondary }]}>
            {item.date} at {item.time} • {item.duration} min
          </Text>
          <Text style={[styles.examDetails, { color: colors.textSecondary }]}>
            {item.venue} • Max: {item.maxMarks} marks
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      {user?.is_staff && (
        <View style={styles.examActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => Alert.alert('Edit', `Edit ${item.title}`)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
            onPress={() => Alert.alert('View Details', `View details for ${item.title}`)}
          >
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
          {item.status === 'upcoming' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
              onPress={() => Alert.alert('Cancel', `Cancel ${item.title}?`)}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const filteredExams = exams.filter(exam => {
    if (filterStatus === 'all') return true;
    return exam.status === filterStatus;
  });

  const renderListContent = () => (
    <FlatList
      data={filteredExams}
      renderItem={renderExamCard}
      keyExtractor={(item) => item.id}
      style={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No exams found for the selected filter
          </Text>
        </View>
      }
    />
  );

  const renderCalendarContent = () => (
    <View style={styles.placeholderContainer}>
      <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
        Calendar view will be implemented here
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Exam Schedule"
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
          { key: 'list', label: 'List' },
          { key: 'calendar', label: 'Calendar' },
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

      {/* Filter Bar */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'All' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'ongoing', label: 'Ongoing' },
            { key: 'completed', label: 'Completed' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                { 
                  backgroundColor: filterStatus === filter.key ? colors.primary : colors.background,
                  borderColor: colors.border
                }
              ]}
              onPress={() => setFilterStatus(filter.key as any)}
            >
              <Text style={[
                styles.filterButtonText,
                { color: filterStatus === filter.key ? '#FFFFFF' : colors.textPrimary }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {exams.filter(e => e.status === 'upcoming').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Upcoming</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {exams.filter(e => e.status === 'ongoing').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ongoing</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {exams.filter(e => e.status === 'completed').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'list' ? renderListContent() : renderCalendarContent()}

      {/* Add Exam Button */}
      {user?.is_staff && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Exam Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContainer}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Schedule New Exam</Text>

              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Exam Title"
                placeholderTextColor={colors.textSecondary}
                value={newExam.title}
                onChangeText={(text) => setNewExam(prev => ({ ...prev, title: text }))}
              />

              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Subject"
                placeholderTextColor={colors.textSecondary}
                value={newExam.subject}
                onChangeText={(text) => setNewExam(prev => ({ ...prev, subject: text }))}
              />

              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Class (e.g., 10-A)"
                placeholderTextColor={colors.textSecondary}
                value={newExam.class}
                onChangeText={(text) => setNewExam(prev => ({ ...prev, class: text }))}
              />

              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor={colors.textSecondary}
                value={newExam.date}
                onChangeText={(text) => setNewExam(prev => ({ ...prev, date: text }))}
              />

              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Time (HH:MM)"
                placeholderTextColor={colors.textSecondary}
                value={newExam.time}
                onChangeText={(text) => setNewExam(prev => ({ ...prev, time: text }))}
              />

              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Duration (minutes)"
                placeholderTextColor={colors.textSecondary}
                value={newExam.duration}
                onChangeText={(text) => setNewExam(prev => ({ ...prev, duration: text }))}
                keyboardType="numeric"
              />

              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Venue"
                placeholderTextColor={colors.textSecondary}
                value={newExam.venue}
                onChangeText={(text) => setNewExam(prev => ({ ...prev, venue: text }))}
              />

              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Maximum Marks"
                placeholderTextColor={colors.textSecondary}
                value={newExam.maxMarks}
                onChangeText={(text) => setNewExam(prev => ({ ...prev, maxMarks: text }))}
                keyboardType="numeric"
              />

              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Teacher Name"
                placeholderTextColor={colors.textSecondary}
                value={newExam.teacher}
                onChangeText={(text) => setNewExam(prev => ({ ...prev, teacher: text }))}
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
                  onPress={handleAddExam}
                >
                  <Text style={styles.modalButtonText}>Schedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
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
  filterContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  filterButtonText: {
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
  examCard: {
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
    marginBottom: 12,
  },
  examInfo: {
    flex: 1,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  examDetails: {
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
    fontWeight: 'bold',
  },
  examActions: {
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
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
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
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    padding: 20,
    borderRadius: 12,
    maxHeight: '90%',
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