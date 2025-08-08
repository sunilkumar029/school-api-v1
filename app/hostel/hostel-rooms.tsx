
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ModalDropdownFilter } from '@/components/ModalDropdownFilter';
import { useRooms, useInventoryTypes } from '@/hooks/useApi';

interface HostelRoom {
  id: number;
  room_number: string;
  floor: number;
  capacity: number;
  occupied: number;
  available: number;
  room_type: string;
  amenities: string[];
  status: 'Available' | 'Full' | 'Maintenance' | 'Reserved';
  branch: {
    id: number;
    name: string;
  };
}

export default function HostelRoomsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  const {
    selectedBranch,
    selectedAcademicYear,
    branches,
    academicYears,
    setSelectedBranch,
    setSelectedAcademicYear
  } = useGlobalFilters();

  // Fetch rooms with filters
  const roomsParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    ...(selectedRoomType && { room_type: selectedRoomType }),
    ...(selectedStatus && { status: selectedStatus }),
    ...(selectedFloor && { floor: selectedFloor }),
  }), [selectedBranch, selectedAcademicYear, selectedRoomType, selectedStatus, selectedFloor]);

  const {
    data: rooms = [],
    loading: roomsLoading,
    error: roomsError,
    refetch: refetchRooms
  } = useRooms(roomsParams);

  const { data: roomTypes = [] } = useInventoryTypes({ type: 'room_type' });

  // Derived data
  const roomTypeOptions = [
    { id: null, name: 'All Room Types' },
    ...roomTypes.map((type: any) => ({ id: type.name, name: type.name }))
  ];

  const statusOptions = [
    { id: null, name: 'All Statuses' },
    { id: 'Available', name: 'Available' },
    { id: 'Full', name: 'Full' },
    { id: 'Maintenance', name: 'Maintenance' },
    { id: 'Reserved', name: 'Reserved' }
  ];

  const floorOptions = useMemo(() => {
    const floors = [...new Set(rooms.map((room: any) => room.floor).filter(Boolean))];
    return [
      { id: null, name: 'All Floors' },
      ...floors.map(floor => ({ id: floor, name: `Floor ${floor}` }))
    ];
  }, [rooms]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return '#10B981';
      case 'full': return '#EF4444';
      case 'maintenance': return '#F59E0B';
      case 'reserved': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const renderRoomCard = (room: any) => (
    <View
      key={room.id}
      style={[
        styles.roomCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderLeftColor: getStatusColor(room.status)
        }
      ]}
    >
      <View style={styles.roomHeader}>
        <Text style={[styles.roomNumber, { color: colors.textPrimary }]}>
          Room {room.room_number}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(room.status) }]}>
          <Text style={styles.statusText}>{room.status}</Text>
        </View>
      </View>

      <View style={styles.roomDetails}>
        <Text style={[styles.roomType, { color: colors.textSecondary }]}>
          {typeof room?.room_type === 'object' ? room?.room_type?.name || 'Standard' : room?.room_type || 'Standard'} • Floor {room?.floor || 'N/A'}
        </Text>
        
        <View style={styles.capacityInfo}>
          <Text style={[styles.capacityText, { color: colors.textPrimary }]}>
            Capacity: {room?.capacity || 0}
          </Text>
          <Text style={[styles.occupancyText, { color: colors.textSecondary }]}>
            Occupied: {room?.occupied || 0} | Available: {room?.available || 0}
          </Text>
        </View>

        {room?.amenities && Array.isArray(room.amenities) && room.amenities.length > 0 && (
          <View style={styles.amenitiesContainer}>
            <Text style={[styles.amenitiesLabel, { color: colors.textSecondary }]}>
              Amenities:
            </Text>
            <View style={styles.amenitiesList}>
              {room.amenities.slice(0, 3).map((amenity: any, index: number) => (
                <View key={index} style={[styles.amenityTag, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.amenityText, { color: colors.primary }]}>
                    {typeof amenity === 'object' ? amenity.name || amenity.title || 'Amenity' : amenity}
                  </Text>
                </View>
              ))}
              {room.amenities.length > 3 && (
                <Text style={[styles.moreAmenities, { color: colors.textSecondary }]}>
                  +{room.amenities.length - 3} more
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.primary }]}
        onPress={() => handleRoomAction(room)}
      >
        <Text style={styles.actionButtonText}>
          {room.status === 'Available' ? 'Allocate' : 'View Details'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const handleRoomAction = (room: any) => {
    if (room.status === 'Available') {
      Alert.alert(
        'Room Allocation',
        `Allocate Room ${room.room_number}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Allocate', onPress: () => console.log('Allocate room:', room.id) }
        ]
      );
    } else {
      // Navigate to room details
      console.log('View room details:', room.id);
    }
  };

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

      {/* Global Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Text style={[styles.filtersLabel, { color: colors.textSecondary }]}>Filters:</Text>
            
            <ModalDropdownFilter
              label="Branch"
              items={branches || []}
              selectedValue={selectedBranch}
              onValueChange={setSelectedBranch}
              compact={true}
            />
            
            <ModalDropdownFilter
              label="Academic Year"
              items={academicYears || []}
              selectedValue={selectedAcademicYear}
              onValueChange={setSelectedAcademicYear}
              compact={true}
            />
            
            <ModalDropdownFilter
              label="Room Type"
              items={roomTypeOptions}
              selectedValue={selectedRoomType}
              onValueChange={setSelectedRoomType}
              compact={true}
            />
            
            <ModalDropdownFilter
              label="Status"
              items={statusOptions}
              selectedValue={selectedStatus}
              onValueChange={setSelectedStatus}
              compact={true}
            />
            
            <ModalDropdownFilter
              label="Floor"
              items={floorOptions}
              selectedValue={selectedFloor}
              onValueChange={setSelectedFloor}
              compact={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      {roomsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading rooms...
          </Text>
        </View>
      ) : roomsError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Failed to load rooms. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetchRooms}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={roomsLoading}
              onRefresh={refetchRooms}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {rooms.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No rooms found for the selected criteria
              </Text>
            </View>
          ) : (
            <View style={styles.roomsList}>
              {rooms.map(renderRoomCard)}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  roomsList: {
    padding: 16,
  },
  roomCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roomDetails: {
    marginBottom: 16,
  },
  roomType: {
    fontSize: 14,
    marginBottom: 8,
  },
  capacityInfo: {
    marginBottom: 8,
  },
  capacityText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  occupancyText: {
    fontSize: 12,
  },
  amenitiesContainer: {
    marginTop: 8,
  },
  amenitiesLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  amenityTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amenityText: {
    fontSize: 10,
    fontWeight: '500',
  },
  moreAmenities: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
