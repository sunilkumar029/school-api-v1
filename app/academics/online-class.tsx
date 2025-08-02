
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
  Linking,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';

interface OnlineClass {
  id: string;
  subject: string;
  teacher: string;
  date: string;
  time: string;
  duration: number;
  meetingLink: string;
  status: 'upcoming' | 'live' | 'completed';
  recordingLink?: string;
}

export default function OnlineClassScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newClass, setNewClass] = useState({
    subject: '',
    teacher: '',
    date: '',
    time: '',
    duration: '60',
    meetingLink: '',
  });

  const [classes, setClasses] = useState<OnlineClass[]>([
    {
      id: '1',
      subject: 'Mathematics',
      teacher: 'Ms. Sarah Johnson',
      date: '2024-01-15',
      time: '10:00',
      duration: 60,
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      status: 'upcoming',
    },
    {
      id: '2',
      subject: 'Physics',
      teacher: 'Dr. Michael Chen',
      date: '2024-01-15',
      time: '14:00',
      duration: 90,
      meetingLink: 'https://zoom.us/j/123456789',
      status: 'upcoming',
    },
    {
      id: '3',
      subject: 'Chemistry',
      teacher: 'Dr. Emily Wilson',
      date: '2024-01-10',
      time: '11:00',
      duration: 60,
      meetingLink: 'https://meet.google.com/xyz-123-abc',
      status: 'completed',
      recordingLink: 'https://drive.google.com/recording/123',
    },
  ]);

  const handleJoinClass = (meetingLink: string) => {
    Linking.openURL(meetingLink).catch(() => {
      Alert.alert('Error', 'Could not open meeting link');
    });
  };

  const handleAddClass = () => {
    if (!newClass.subject || !newClass.teacher || !newClass.date || !newClass.time) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const onlineClass: OnlineClass = {
      id: Date.now().toString(),
      subject: newClass.subject,
      teacher: newClass.teacher,
      date: newClass.date,
      time: newClass.time,
      duration: parseInt(newClass.duration) || 60,
      meetingLink: newClass.meetingLink,
      status: 'upcoming',
    };

    setClasses([...classes, onlineClass]);
    setNewClass({ subject: '', teacher: '', date: '', time: '', duration: '60', meetingLink: '' });
    setAddModalVisible(false);
    Alert.alert('Success', 'Online class scheduled successfully');
  };

  const renderClassCard = ({ item }: { item: OnlineClass }) => (
    <View style={[styles.classCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.classInfo}>
          <Text style={[styles.subject, { color: colors.textPrimary }]}>{item.subject}</Text>
          <Text style={[styles.teacher, { color: colors.textSecondary }]}>👨‍🏫 {item.teacher}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'upcoming' ? '#007AFF' : item.status === 'live' ? '#34C759' : '#8E8E93' }
        ]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.timeInfo}>
        <Text style={[styles.dateTime, { color: colors.textPrimary }]}>
          📅 {item.date} at {item.time}
        </Text>
        <Text style={[styles.duration, { color: colors.textSecondary }]}>
          ⏱️ {item.duration} minutes
        </Text>
      </View>

      <View style={styles.classActions}>
        {item.status === 'upcoming' && (
          <TouchableOpacity
            style={[styles.joinButton, { backgroundColor: '#34C759' }]}
            onPress={() => handleJoinClass(item.meetingLink)}
          >
            <Text style={styles.joinButtonText}>Join Class</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'completed' && item.recordingLink && (
          <TouchableOpacity
            style={[styles.recordingButton, { backgroundColor: colors.primary }]}
            onPress={() => handleJoinClass(item.recordingLink!)}
          >
            <Text style={styles.joinButtonText}>View Recording</Text>
          </TouchableOpacity>
        )}

        {user?.is_staff && (
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.border }]}
            onPress={() => Alert.alert('Edit', `Edit ${item.subject} class`)}
          >
            <Text style={[styles.editButtonText, { color: colors.textPrimary }]}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const filteredClasses = classes.filter(cls => {
    if (activeTab === 'upcoming') {
      return cls.status === 'upcoming' || cls.status === 'live';
    }
    return cls.status === 'completed';
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Online Classes"
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
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'history', label: 'History' },
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
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {classes.filter(c => c.status === 'upcoming').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Upcoming</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {classes.filter(c => c.status === 'completed').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {classes.filter(c => c.recordingLink).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recordings</Text>
        </View>
      </View>

      {/* Classes List */}
      <FlatList
        data={filteredClasses}
        renderItem={renderClassCard}
        keyExtractor={(item) => item.id}
        style={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === 'upcoming' ? 'No upcoming classes' : 'No completed classes'}
            </Text>
          </View>
        }
      />

      {/* Add Class Button */}
      {user?.is_staff && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Class Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Schedule Online Class</Text>

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Subject"
              placeholderTextColor={colors.textSecondary}
              value={newClass.subject}
              onChangeText={(text) => setNewClass(prev => ({ ...prev, subject: text }))}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Teacher Name"
              placeholderTextColor={colors.textSecondary}
              value={newClass.teacher}
              onChangeText={(text) => setNewClass(prev => ({ ...prev, teacher: text }))}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={colors.textSecondary}
              value={newClass.date}
              onChangeText={(text) => setNewClass(prev => ({ ...prev, date: text }))}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Time (HH:MM)"
              placeholderTextColor={colors.textSecondary}
              value={newClass.time}
              onChangeText={(text) => setNewClass(prev => ({ ...prev, time: text }))}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Duration (minutes)"
              placeholderTextColor={colors.textSecondary}
              value={newClass.duration}
              onChangeText={(text) => setNewClass(prev => ({ ...prev, duration: text }))}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Meeting Link"
              placeholderTextColor={colors.textSecondary}
              value={newClass.meetingLink}
              onChangeText={(text) => setNewClass(prev => ({ ...prev, meetingLink: text }))}
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
                onPress={handleAddClass}
              >
                <Text style={styles.modalButtonText}>Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  classInfo: {
    flex: 1,
  },
  subject: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  teacher: {
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
  timeInfo: {
    marginBottom: 12,
  },
  dateTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  duration: {
    fontSize: 12,
  },
  classActions: {
    flexDirection: 'row',
    gap: 8,
  },
  joinButton: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  recordingButton: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editButtonText: {
    fontSize: 14,
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
