
import React, { useState, useMemo } from 'react';
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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-area';
import { 
  useHolidays,
  useBranches,
  useAcademicYears
} from '@/hooks/useApi';
import { apiService } from '@/api/apiService';

interface Holiday {
  id: number;
  name: string;
  date: string;
  reason?: string;
  branch: {
    id: number;
    name: string;
  };
  academic_year: {
    id: number;
    name: string;
  };
}

export default function HolidayCalendarScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  // Form State
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: '',
    reason: '',
  });

  // Fetch data
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears();

  const holidayParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
  }), [selectedBranch, selectedAcademicYear]);

  const { 
    data: holidays, 
    loading: holidaysLoading, 
    error: holidaysError, 
    refetch: refetchHolidays 
  } = useHolidays(holidayParams);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCreateHoliday = async () => {
    try {
      if (!holidayForm.name || !holidayForm.date) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const holidayData = {
        ...holidayForm,
        branch: selectedBranch,
        academic_year: selectedAcademicYear,
      };

      if (editingHoliday) {
        await apiService.updateHoliday(editingHoliday.id, holidayData);
        Alert.alert('Success', 'Holiday updated successfully');
      } else {
        await apiService.createHoliday(holidayData);
        Alert.alert('Success', 'Holiday created successfully');
      }

      setModalVisible(false);
      resetForm();
      refetchHolidays();
    } catch (error) {
      Alert.alert('Error', 'Failed to save holiday');
    }
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setHolidayForm({
      name: holiday.name,
      date: holiday.date,
      reason: holiday.reason || '',
    });
    setModalVisible(true);
  };

  const handleDeleteHoliday = (holidayId: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this holiday?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteHoliday(holidayId);
              Alert.alert('Success', 'Holiday deleted successfully');
              refetchHolidays();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete holiday');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setHolidayForm({
      name: '',
      date: '',
      reason: '',
    });
    setEditingHoliday(null);
  };

  const isUpcoming = (dateString: string) => {
    const holidayDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidayDate >= today;
  };

  const sortedHolidays = useMemo(() => {
    if (!holidays) return [];
    
    return [...holidays].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [holidays]);

  const renderHolidayItem = ({ item }: { item: Holiday }) => (
    <View style={[
      styles.holidayCard, 
      { 
        backgroundColor: colors.surface, 
        borderColor: colors.border,
        borderLeftWidth: 4,
        borderLeftColor: isUpcoming(item.date) ? colors.primary : colors.textSecondary
      }
    ]}>
      <View style={styles.holidayHeader}>
        <View style={styles.holidayInfo}>
          <Text style={[styles.holidayName, { color: colors.textPrimary }]}>
            {item.name}
          </Text>
          <Text style={[styles.holidayDate, { color: colors.textSecondary }]}>
            {formatDate(item.date)}
          </Text>
          {item.reason && (
            <Text style={[styles.holidayReason, { color: colors.textSecondary }]}>
              {item.reason}
            </Text>
          )}
        </View>
        
        <View style={styles.holidayActions}>
          <View style={[
            styles.dateCircle,
            { backgroundColor: isUpcoming(item.date) ? colors.primary : colors.textSecondary }
          ]}>
            <Text style={styles.dateText}>
              {new Date(item.date).getDate()}
            </Text>
            <Text style={styles.monthText}>
              {new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}
            </Text>
          </View>
          
          {user?.is_staff && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: colors.primary }]}
                onPress={() => handleEditHoliday(item)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: '#F44336' }]}
                onPress={() => handleDeleteHoliday(item.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderCreateHolidayModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                resetForm();
              }}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Holiday Name *</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter holiday name"
                placeholderTextColor={colors.textSecondary}
                value={holidayForm.name}
                onChangeText={(text) => setHolidayForm(prev => ({...prev, name: text}))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Date *</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                value={holidayForm.date}
                onChangeText={(text) => setHolidayForm(prev => ({...prev, date: text}))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Reason (Optional)</Text>
              <TextInput
                style={[styles.formTextArea, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter reason for holiday"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                value={holidayForm.reason}
                onChangeText={(text) => setHolidayForm(prev => ({...prev, reason: text}))}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateHoliday}
            >
              <Text style={styles.submitButtonText}>
                {editingHoliday ? 'Update Holiday' : 'Add Holiday'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Holiday Calendar"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Compact Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          <TouchableOpacity style={[styles.compactFilterButton, { borderColor: colors.border }]}>
            <Text style={[styles.compactFilterText, { color: colors.textPrimary }]}>
              {branches?.find(b => b.id === selectedBranch)?.name || 'Branch'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.compactFilterButton, { borderColor: colors.border }]}>
            <Text style={[styles.compactFilterText, { color: colors.textPrimary }]}>
              {academicYears?.find(ay => ay.id === selectedAcademicYear)?.name || 'Year'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {user?.is_staff && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ Add Holiday</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {holidaysLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading holidays...
          </Text>
        </View>
      ) : holidaysError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Failed to load holidays. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetchHolidays}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedHolidays}
          renderItem={renderHolidayItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.holidaysList}
          contentContainerStyle={styles.holidaysListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={holidaysLoading}
              onRefresh={refetchHolidays}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No holidays found for the selected criteria
              </Text>
            </View>
          }
        />
      )}

      {renderCreateHolidayModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    maxHeight: 50,
  },
  filtersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactFilterButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 70,
  },
  compactFilterText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
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
  holidaysList: {
    flex: 1,
  },
  holidaysListContent: {
    padding: 16,
  },
  holidayCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  holidayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  holidayInfo: {
    flex: 1,
    marginRight: 16,
  },
  holidayName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  holidayDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  holidayReason: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  holidayActions: {
    alignItems: 'center',
    gap: 12,
  },
  dateCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
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
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  formTextArea: {
    height: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
