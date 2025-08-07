
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { apiService } from '@/api/apiService';
import { useBranches, useAcademicYears } from '@/hooks/useApi';

interface Room {
  id: number;
  name: string;
  number: string;
  floor: {
    id: number;
    name: string;
  };
  block_number: number;
  block_name: string;
  room_type: string;
  total_beds: number;
  available_beds: number;
  beds_count: number;
  is_occupied: boolean;
}

interface Bed {
  id: number;
  room_name: string;
  name: string;
  is_occupied: boolean;
  room: number;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  employee_id: string;
}

export default function HostelRoomsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [bedModalVisible, setBedModalVisible] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  const { data: branches } = useBranches();
  const { data: academicYears } = useAcademicYears();

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await apiService.api.get('/api/hostel-rooms/');
      setRooms(response.data.results || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      Alert.alert('Error', 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchBeds = async (roomId: number) => {
    try {
      const response = await apiService.api.get(`/api/hostel-beds/?room=${roomId}`);
      setBeds(response.data.results || []);
    } catch (error) {
      console.error('Error fetching beds:', error);
      Alert.alert('Error', 'Failed to fetch beds');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await apiService.api.get(`/api/users/?branch=${selectedBranch}&student_type=Hostel`);
      setStudents(response.data.results || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const assignBed = async (bedId: number, studentId: number) => {
    try {
      await apiService.api.post(`/api/hostel-beds/${bedId}/assign_student/`, {
        student_id: studentId
      });
      Alert.alert('Success', 'Bed assigned successfully');
      setBedModalVisible(false);
      if (selectedRoom) {
        fetchBeds(selectedRoom.id);
      }
      fetchRooms();
    } catch (error) {
      console.error('Error assigning bed:', error);
      Alert.alert('Error', 'Failed to assign bed');
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchStudents();
  }, [selectedBranch, selectedAcademicYear]);

  const handleRoomPress = (room: Room) => {
    setSelectedRoom(room);
    fetchBeds(room.id);
    setRoomModalVisible(true);
  };

  const handleBedPress = (bed: Bed) => {
    if (!bed.is_occupied) {
      setSelectedBed(bed);
      setBedModalVisible(true);
    }
  };

  const getStatusColor = (room: Room) => {
    if (room.available_beds === 0) return '#EF4444';
    if (room.available_beds <= room.total_beds * 0.3) return '#F59E0B';
    return '#10B981';
  };

  const renderRoom = (room: Room) => (
    <TouchableOpacity
      key={room.id}
      style={[styles.roomCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleRoomPress(room)}
    >
      <View style={styles.roomHeader}>
        <View>
          <Text style={[styles.roomNumber, { color: colors.textPrimary }]}>
            Room {room.number}
          </Text>
          <Text style={[styles.roomName, { color: colors.textSecondary }]}>
            {room.name}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(room) }]}>
          <Text style={styles.statusText}>
            {room.available_beds}/{room.total_beds}
          </Text>
        </View>
      </View>
      
      <View style={styles.roomDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Block:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
            {room.block_name} - {room.block_number}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Floor:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
            {room.floor.name}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
            {room.room_type}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status:</Text>
          <Text style={[styles.detailValue, { color: getStatusColor(room) }]}>
            {room.available_beds === 0 ? 'Full' : room.available_beds === room.total_beds ? 'Available' : 'Partially Occupied'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Hostel Rooms"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Branch</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {branches?.map((branch: any) => (
                <TouchableOpacity
                  key={branch.id}
                  style={[
                    styles.filterButton,
                    { borderColor: colors.border },
                    selectedBranch === branch.id && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setSelectedBranch(branch.id)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    { color: selectedBranch === branch.id ? '#FFFFFF' : colors.textPrimary }
                  ]}>
                    {branch.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Academic Year</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {academicYears?.map((year: any) => (
                <TouchableOpacity
                  key={year.id}
                  style={[
                    styles.filterButton,
                    { borderColor: colors.border },
                    selectedAcademicYear === year.id && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setSelectedAcademicYear(year.id)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    { color: selectedAcademicYear === year.id ? '#FFFFFF' : colors.textPrimary }
                  ]}>
                    {year.year_range}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Rooms List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchRooms} />
        }
      >
        {rooms.map(renderRoom)}
      </ScrollView>

      {/* Room Details Modal */}
      <Modal
        visible={roomModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRoomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Room {selectedRoom?.number} - {selectedRoom?.name}
              </Text>
              <TouchableOpacity
                onPress={() => setRoomModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bedsContainer}>
              <Text style={[styles.bedsTitle, { color: colors.textPrimary }]}>Beds ({beds.length})</Text>
              {beds.map((bed) => (
                <TouchableOpacity
                  key={bed.id}
                  style={[
                    styles.bedCard,
                    { 
                      backgroundColor: colors.background, 
                      borderColor: bed.is_occupied ? '#EF4444' : '#10B981' 
                    }
                  ]}
                  onPress={() => handleBedPress(bed)}
                  disabled={bed.is_occupied}
                >
                  <Text style={[styles.bedName, { color: colors.textPrimary }]}>
                    Bed {bed.name}
                  </Text>
                  <Text style={[
                    styles.bedStatus,
                    { color: bed.is_occupied ? '#EF4444' : '#10B981' }
                  ]}>
                    {bed.is_occupied ? 'Occupied' : 'Available'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bed Assignment Modal */}
      <Modal
        visible={bedModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setBedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Assign Bed {selectedBed?.name}
              </Text>
              <TouchableOpacity
                onPress={() => setBedModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.studentsContainer}>
              <Text style={[styles.studentsTitle, { color: colors.textPrimary }]}>
                Select Student
              </Text>
              {students.map((student) => (
                <TouchableOpacity
                  key={student.id}
                  style={[styles.studentCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => selectedBed && assignBed(selectedBed.id, student.id)}
                >
                  <Text style={[styles.studentName, { color: colors.textPrimary }]}>
                    {student.first_name} {student.last_name}
                  </Text>
                  <Text style={[styles.studentEmail, { color: colors.textSecondary }]}>
                    {student.email}
                  </Text>
                  <Text style={[styles.studentId, { color: colors.textSecondary }]}>
                    ID: {student.employee_id}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  filtersContainer: {
    padding: 12,
    borderBottomWidth: 1,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  roomCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  roomName: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  roomDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bedsContainer: {
    maxHeight: 400,
  },
  bedsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bedCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bedName: {
    fontSize: 14,
    fontWeight: '600',
  },
  bedStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  studentsContainer: {
    maxHeight: 400,
  },
  studentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  studentCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  studentId: {
    fontSize: 12,
    marginTop: 2,
  },
});
