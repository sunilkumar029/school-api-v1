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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ModalDropdownFilter } from '@/components/ModalDropdownFilter';
import { useUsers, useRooms, useStandards } from '@/hooks/useApi';

interface HostelStudent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  room?: {
    room_number: string;
    floor: number;
  };
  standard: {
    name: string;
  };
  allocation_date?: string;
  is_active: boolean;
}

export default function HostelStudentsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedStandard, setSelectedStandard] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const {
    selectedBranch,
    selectedAcademicYear,
    branches,
    academicYears,
    setSelectedBranch,
    setSelectedAcademicYear
  } = useGlobalFilters();

  // Fetch students with filters
  const studentsParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    role: 'student',
    is_hostel_student: true,
    ...(selectedStandard && { standard: selectedStandard }),
    ...(searchQuery && { search: searchQuery }),
  }), [selectedBranch, selectedAcademicYear, selectedStandard, searchQuery]);

  const {
    data: students = [],
    loading: studentsLoading,
    error: studentsError,
    refetch: refetchStudents
  } = useUsers(studentsParams);

  const { data: rooms = [] } = useRooms({ branch: selectedBranch });
  const { data: standards = [] } = useStandards({
    branch: selectedBranch,
    academic_year: selectedAcademicYear
  });


  // Filter options
  const roomOptions = [
    { id: null, name: 'All Rooms' },
    ...rooms.map((room: any) => ({ id: room.room_number, name: `Room ${room.room_number}` }))
  ];

  const standardOptions = [
    { id: null, name: 'All Standards' },
    ...standards.map((standard: any) => ({ id: standard.id, name: standard.name }))
  ];

  const statusOptions = [
    { id: null, name: 'All Statuses' },
    { id: 'Allocated', name: 'Allocated' },
    { id: 'Pending', name: 'Pending Allocation' },
    { id: 'Checked Out', name: 'Checked Out' }
  ];

  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (selectedRoom) {
      filtered = filtered.filter((student: any) =>
        student.room?.room_number === selectedRoom
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter((student: any) => student.status === selectedStatus);
    }

    return filtered;
  }, [students, selectedRoom, selectedStatus]);



  const getStatusColor = (status: any) => {
    switch (status?.toLowerCase()) {
      case true: return '#10B981';
      case false: return '#F59E0B';
      case 'checked out': return '#6B7280';
      default: return '#8B5CF6';
    }
  };

  const handleStudentAction = (student: any) => {
    const firstName = student?.user?.first_name || student?.first_name || '';
    const lastName = student?.user?.last_name || student?.last_name || '';

    if (student.status === 'Pending') {
      Alert.alert(
        'Room Allocation',
        `Allocate a room for ${firstName} ${lastName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Allocate', onPress: () => console.log('Allocate room for:', student.id) }
        ]
      );
    } else {
      // Show student details in alert
      const studentDetails = `
Name: ${firstName} ${lastName}
Email: ${student.user?.email || 'N/A'}
Class: ${student.standard?.name || 'N/A'}
Room: ${student.room ? `${student.room.room_number} (Floor ${student.room.floor})` : 'Not Allocated'}
Status: ${student.status}
${student.allocation_date ? `Allocated Date: ${new Date(student.allocation_date).toLocaleDateString()}` : ''}
      `.trim();

      Alert.alert(
        'Student Details',
        studentDetails,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const renderStudentCard = (student: any) => (
    <View
      key={student.id}
      style={[
        styles.studentCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderLeftColor: getStatusColor(student.status)
        }
      ]}
    >
      <View style={styles.studentHeader}>
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: colors.textPrimary }]}>
            {student.first_name} {student.last_name}
          </Text>
          <Text style={[styles.studentEmail, { color: colors.textSecondary }]}>
            {student.email}
          </Text>
          {student.standard && (
            <Text style={[styles.studentClass, { color: colors.textSecondary }]}>
              Class: {student.standard.name}
            </Text>
          )}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(student.status) }]}>
          <Text style={styles.statusText}>{student.is_active ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      {student.room && (
        <View style={styles.roomInfo}>
          <Text style={[styles.roomText, { color: colors.textPrimary }]}>
            🏠 Room {student.room.room_number} • Floor {student.room.floor}
          </Text>
          {student.allocation_date && (
            <Text style={[styles.allocationDate, { color: colors.textSecondary }]}>
              Allocated: {new Date(student.allocation_date).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.primary }]}
        onPress={() => handleStudentAction(student)}
      >
        <Text style={styles.actionButtonText}>
          {student.status === 'Pending' ? 'Allocate Room' : 'View Details'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Hostel Students"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          placeholder="Search students..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

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
              label="Standard"
              items={standardOptions}
              selectedValue={selectedStandard}
              onValueChange={setSelectedStandard}
              compact={true}
            />

            <ModalDropdownFilter
              label="Room"
              items={roomOptions}
              selectedValue={selectedRoom}
              onValueChange={setSelectedRoom}
              compact={true}
            />

            <ModalDropdownFilter
              label="Status"
              items={statusOptions}
              selectedValue={selectedStatus}
              onValueChange={setSelectedStatus}
              compact={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      {studentsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading students...
          </Text>
        </View>
      ) : studentsError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Failed to load students. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetchStudents}
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
              refreshing={studentsLoading}
              onRefresh={refetchStudents}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {filteredStudents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No students found for the selected criteria
              </Text>
            </View>
          ) : (
            <View style={styles.studentsList}>
              {filteredStudents.map(renderStudentCard)}
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
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
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
  studentsList: {
    padding: 16,
  },
  studentCard: {
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
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  studentClass: {
    fontSize: 12,
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
  roomInfo: {
    marginBottom: 16,
  },
  roomText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  allocationDate: {
    fontSize: 12,
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