
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';

interface Room {
  id: string;
  roomNumber: string;
  block: string;
  floor: string;
  type: 'AC' | 'Non-AC';
  gender: 'Boys' | 'Girls';
  totalCapacity: number;
  occupied: number;
  assignedStudents: string[];
}

export default function RoomListScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBlock, setFilterBlock] = useState('All');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const rooms: Room[] = [
    {
      id: '1',
      roomNumber: 'H101',
      block: 'Block A',
      floor: '1st Floor',
      type: 'AC',
      gender: 'Boys',
      totalCapacity: 4,
      occupied: 3,
      assignedStudents: ['John Smith', 'Mike Johnson', 'David Brown']
    },
    {
      id: '2',
      roomNumber: 'H205',
      block: 'Block B',
      floor: '2nd Floor',
      type: 'Non-AC',
      gender: 'Girls',
      totalCapacity: 4,
      occupied: 4,
      assignedStudents: ['Emily Davis', 'Sarah Wilson', 'Lisa Anderson', 'Maria Garcia']
    },
    {
      id: '3',
      roomNumber: 'H303',
      block: 'Block C',
      floor: '3rd Floor',
      type: 'AC',
      gender: 'Boys',
      totalCapacity: 2,
      occupied: 1,
      assignedStudents: ['Alex Thompson']
    }
  ];

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBlock = filterBlock === 'All' || room.block === filterBlock;
    return matchesSearch && matchesBlock;
  });

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setEditModalVisible(true);
  };

  const getAvailabilityColor = (room: Room) => {
    if (room.occupied >= room.totalCapacity) return '#EF4444'; // Red for full
    if (room.occupied / room.totalCapacity > 0.7) return '#F59E0B'; // Orange for almost full
    return '#10B981'; // Green for available
  };

  const renderRoomCard = (room: Room) => (
    <View key={room.id} style={[styles.roomCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.roomHeader}>
        <View>
          <Text style={[styles.roomNumber, { color: colors.textPrimary }]}>{room.roomNumber}</Text>
          <Text style={[styles.roomDetails, { color: colors.textSecondary }]}>
            {room.block} • {room.floor}
          </Text>
        </View>
        <View style={[
          styles.availabilityIndicator,
          { backgroundColor: getAvailabilityColor(room) }
        ]}>
          <Text style={styles.capacityText}>
            {room.occupied}/{room.totalCapacity}
          </Text>
        </View>
      </View>
      
      <View style={styles.roomInfo}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Type:</Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{room.type}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Gender:</Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{room.gender}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Students:</Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{room.occupied}</Text>
        </View>
      </View>

      {room.assignedStudents.length > 0 && (
        <View style={styles.studentsList}>
          <Text style={[styles.studentsTitle, { color: colors.textPrimary }]}>Assigned Students:</Text>
          {room.assignedStudents.map((student, index) => (
            <Text key={index} style={[styles.studentName, { color: colors.textSecondary }]}>
              • {student}
            </Text>
          ))}
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: colors.primary }]}
        onPress={() => handleEditRoom(room)}
      >
        <Text style={styles.editButtonText}>Edit Room Info</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Room Management"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Search and Filter */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Search by room number..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
          {['All', 'Block A', 'Block B', 'Block C'].map((block) => (
            <TouchableOpacity
              key={block}
              style={[
                styles.filterButton,
                { borderColor: colors.border },
                filterBlock === block && { backgroundColor: colors.primary }
              ]}
              onPress={() => setFilterBlock(block)}
            >
              <Text style={[
                styles.filterButtonText,
                { color: filterBlock === block ? '#FFFFFF' : colors.textPrimary }
              ]}>
                {block}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Rooms List */}
      <ScrollView style={styles.roomsList}>
        {filteredRooms.length > 0 ? (
          filteredRooms.map(renderRoomCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No rooms found
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Room Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Room Info</Text>
            {selectedRoom && (
              <View>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Room: {selectedRoom.roomNumber}
                </Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Current Capacity: {selectedRoom.totalCapacity}
                </Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Type: {selectedRoom.type}
                </Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Gender: {selectedRoom.gender}
                </Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Save Changes</Text>
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
  filterContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  filterScrollView: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  roomsList: {
    flex: 1,
    padding: 16,
  },
  roomCard: {
    borderRadius: 12,
    padding: 16,
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
  roomDetails: {
    fontSize: 14,
  },
  availabilityIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  capacityText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  roomInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentsList: {
    marginBottom: 12,
  },
  studentsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 12,
    marginBottom: 2,
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
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
