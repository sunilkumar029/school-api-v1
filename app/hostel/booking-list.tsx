
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';

interface Booking {
  id: string;
  studentName: string;
  studentPhoto: string;
  class: string;
  roomNumber: string;
  fromDate: string;
  toDate: string;
  status: 'Active' | 'Expired';
}

export default function BookingListScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Expired'>('All');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const bookings: Booking[] = [
    {
      id: '1',
      studentName: 'John Smith',
      studentPhoto: '👤',
      class: '10-A',
      roomNumber: 'H101',
      fromDate: '2024-01-15',
      toDate: '2024-06-15',
      status: 'Active'
    },
    {
      id: '2',
      studentName: 'Emily Johnson',
      studentPhoto: '👤',
      class: '11-B',
      roomNumber: 'H205',
      fromDate: '2023-08-01',
      toDate: '2023-12-31',
      status: 'Expired'
    },
    {
      id: '3',
      studentName: 'Michael Brown',
      studentPhoto: '👤',
      class: '12-A',
      roomNumber: 'H303',
      fromDate: '2024-01-10',
      toDate: '2024-07-10',
      status: 'Active'
    }
  ];

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.class.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || booking.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelModalVisible(true);
  };

  const confirmCancelBooking = () => {
    Alert.alert('Success', 'Booking cancelled successfully');
    setCancelModalVisible(false);
    setSelectedBooking(null);
  };

  const renderBookingCard = (booking: Booking) => (
    <View key={booking.id} style={[styles.bookingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.bookingHeader}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentPhoto}>{booking.studentPhoto}</Text>
          <View>
            <Text style={[styles.studentName, { color: colors.textPrimary }]}>{booking.studentName}</Text>
            <Text style={[styles.studentClass, { color: colors.textSecondary }]}>Class: {booking.class}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: booking.status === 'Active' ? '#10B981' : '#EF4444' }
        ]}>
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>
      </View>
      
      <View style={styles.bookingDetails}>
        <Text style={[styles.roomNumber, { color: colors.textPrimary }]}>Room: {booking.roomNumber}</Text>
        <Text style={[styles.dateRange, { color: colors.textSecondary }]}>
          {booking.fromDate} to {booking.toDate}
        </Text>
      </View>
      
      {booking.status === 'Active' && (
        <TouchableOpacity 
          style={[styles.cancelButton, { borderColor: '#EF4444' }]}
          onPress={() => handleCancelBooking(booking)}
        >
          <Text style={[styles.cancelButtonText, { color: '#EF4444' }]}>❌ Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Hostel Bookings"
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
          placeholder="Search by student name or class..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.filterButtons}>
          {['All', 'Active', 'Expired'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                { borderColor: colors.border },
                filterStatus === status && { backgroundColor: colors.primary }
              ]}
              onPress={() => setFilterStatus(status as any)}
            >
              <Text style={[
                styles.filterButtonText,
                { color: filterStatus === status ? '#FFFFFF' : colors.textPrimary }
              ]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bookings List */}
      <ScrollView style={styles.bookingsList}>
        {filteredBookings.length > 0 ? (
          filteredBookings.map(renderBookingCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No bookings found
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Cancel Booking Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Cancel Booking</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Are you sure you want to cancel the booking for {selectedBooking?.studentName}?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#EF4444' }]}
                onPress={confirmCancelBooking}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
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
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bookingsList: {
    flex: 1,
    padding: 16,
  },
  bookingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentPhoto: {
    fontSize: 40,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentClass: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetails: {
    marginBottom: 12,
  },
  roomNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 14,
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
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
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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
