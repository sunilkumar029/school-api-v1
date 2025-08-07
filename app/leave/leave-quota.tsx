
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
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useLeaveQuotas,
  useBranches,
  useAcademicYears,
  useDepartments
} from '@/hooks/useApi';
import { apiService } from '@/api/apiService';

interface LeaveQuota {
  id: number;
  department: {
    id: number;
    name: string;
  };
  leave_type: string;
  total_quota: number;
  affects_salary: boolean;
  branch: {
    id: number;
    name: string;
  };
  academic_year: {
    id: number;
    name: string;
  };
}

export default function LeaveQuotaScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuota, setEditingQuota] = useState<LeaveQuota | null>(null);

  // Form State
  const [quotaForm, setQuotaForm] = useState({
    department: '',
    leave_type: 'Sick Leave',
    total_quota: '',
    affects_salary: false,
  });

  // Fetch data
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears();
  const { data: departments } = useDepartments({ 
    branch: selectedBranch,
    is_active: true 
  });

  const quotaParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    ...(selectedDepartment && { department: selectedDepartment }),
    ...(selectedLeaveType && { leave_type: selectedLeaveType }),
  }), [selectedBranch, selectedAcademicYear, selectedDepartment, selectedLeaveType]);

  const {
    data: quotas,
    loading: quotasLoading,
    error: quotasError,
    refetch: refetchQuotas
  } = useLeaveQuotas(quotaParams);

  const leaveTypes = [
    'Sick Leave',
    'Casual Leave',
    'Annual Leave',
    'Maternity Leave',
    'Paternity Leave',
    'Emergency Leave',
    'Study Leave',
    'Sabbatical Leave'
  ];

  const handleCreateQuota = async () => {
    try {
      if (!quotaForm.department || !quotaForm.total_quota) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const quotaData = {
        ...quotaForm,
        department: parseInt(quotaForm.department),
        total_quota: parseInt(quotaForm.total_quota),
        branch: selectedBranch,
        academic_year: selectedAcademicYear,
      };

      if (editingQuota) {
        await apiService.updateLeaveQuota(editingQuota.id, quotaData);
        Alert.alert('Success', 'Leave quota updated successfully');
      } else {
        await apiService.createLeaveQuota(quotaData);
        Alert.alert('Success', 'Leave quota created successfully');
      }

      setModalVisible(false);
      resetForm();
      refetchQuotas();
    } catch (error) {
      Alert.alert('Error', 'Failed to save leave quota');
    }
  };

  const handleEditQuota = (quota: LeaveQuota) => {
    setEditingQuota(quota);
    setQuotaForm({
      department: quota.department.id.toString(),
      leave_type: quota.leave_type,
      total_quota: quota.total_quota.toString(),
      affects_salary: quota.affects_salary,
    });
    setModalVisible(true);
  };

  const handleDeleteQuota = (quotaId: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this leave quota?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteLeaveQuota(quotaId);
              Alert.alert('Success', 'Leave quota deleted successfully');
              refetchQuotas();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete leave quota');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setQuotaForm({
      department: '',
      leave_type: 'Sick Leave',
      total_quota: '',
      affects_salary: false,
    });
    setEditingQuota(null);
  };

  const renderQuotaItem = ({ item }: { item: LeaveQuota }) => (
    <View style={[
      styles.quotaCard,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }
    ]}>
      <View style={styles.quotaHeader}>
        <View style={styles.quotaInfo}>
          <Text style={[styles.quotaType, { color: colors.textPrimary }]}>
            {item.leave_type}
          </Text>
          <Text style={[styles.quotaDepartment, { color: colors.textSecondary }]}>
            {item.department.name}
          </Text>
        </View>

        <View style={styles.quotaDetails}>
          <Text style={[styles.quotaAmount, { color: colors.primary }]}>
            {item.total_quota} days
          </Text>
          <View style={[
            styles.salaryBadge,
            { backgroundColor: item.affects_salary ? '#FF6B6B20' : '#4CAF5020' }
          ]}>
            <Text style={[
              styles.salaryText,
              { color: item.affects_salary ? '#FF6B6B' : '#4CAF50' }
            ]}>
              {item.affects_salary ? 'Affects Salary' : 'No Salary Impact'}
            </Text>
          </View>
        </View>
      </View>

      {user?.is_staff && (
        <View style={styles.quotaActions}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => handleEditQuota(item)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: '#F44336' }]}
            onPress={() => handleDeleteQuota(item.id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderCreateQuotaModal = () => (
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
              {editingQuota ? 'Edit Leave Quota' : 'Add Leave Quota'}
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
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Department *</Text>
              <View style={styles.dropdownContainer}>
                {departments?.map((dept) => (
                  <TouchableOpacity
                    key={dept.id}
                    style={[
                      styles.dropdownItem,
                      {
                        backgroundColor: quotaForm.department === dept.id.toString() ? colors.primary + '20' : colors.background,
                        borderColor: colors.border
                      }
                    ]}
                    onPress={() => setQuotaForm(prev => ({ ...prev, department: dept.id.toString() }))}
                  >
                    <Text style={[
                      styles.dropdownText,
                      { 
                        color: quotaForm.department === dept.id.toString() ? colors.primary : colors.textPrimary 
                      }
                    ]}>
                      {dept.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Leave Type *</Text>
              <View style={styles.dropdownContainer}>
                {leaveTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.dropdownItem,
                      {
                        backgroundColor: quotaForm.leave_type === type ? colors.primary + '20' : colors.background,
                        borderColor: colors.border
                      }
                    ]}
                    onPress={() => setQuotaForm(prev => ({ ...prev, leave_type: type }))}
                  >
                    <Text style={[
                      styles.dropdownText,
                      { 
                        color: quotaForm.leave_type === type ? colors.primary : colors.textPrimary 
                      }
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Total Quota (Days) *</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter number of days"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={quotaForm.total_quota}
                onChangeText={(text) => setQuotaForm(prev => ({...prev, total_quota: text}))}
              />
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setQuotaForm(prev => ({...prev, affects_salary: !prev.affects_salary}))}
              >
                <View style={[
                  styles.checkbox,
                  {
                    backgroundColor: quotaForm.affects_salary ? colors.primary : 'transparent',
                    borderColor: colors.border
                  }
                ]}>
                  {quotaForm.affects_salary && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>
                  Affects Salary
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateQuota}
            >
              <Text style={styles.submitButtonText}>
                {editingQuota ? 'Update Quota' : 'Add Quota'}
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
        title="Leave Quota"
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          <TouchableOpacity style={[styles.filterButton, { borderColor: colors.border }]}>
            <Text style={[styles.filterText, { color: colors.textPrimary }]}>
              {branches?.find(b => b.id === selectedBranch)?.name || 'Branch'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.filterButton, { borderColor: colors.border }]}>
            <Text style={[styles.filterText, { color: colors.textPrimary }]}>
              {academicYears?.find(ay => ay.id === selectedAcademicYear)?.name || 'Year'}
            </Text>
          </TouchableOpacity>

          {departments && departments.length > 0 && (
            <TouchableOpacity style={[styles.filterButton, { borderColor: colors.border }]}>
              <Text style={[styles.filterText, { color: colors.textPrimary }]}>
                {selectedDepartment ? departments.find(d => d.id === selectedDepartment)?.name : 'All Departments'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {user?.is_staff && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ Add Quota</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {quotasLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading leave quotas...
          </Text>
        </View>
      ) : quotasError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Failed to load leave quotas. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetchQuotas}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={quotas || []}
          renderItem={renderQuotaItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.quotasList}
          contentContainerStyle={styles.quotasListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={quotasLoading}
              onRefresh={refetchQuotas}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No leave quotas found for the selected criteria
              </Text>
            </View>
          }
        />
      )}

      {renderCreateQuotaModal()}
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
  },
  filtersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 70,
  },
  filterText: {
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
  quotasList: {
    flex: 1,
  },
  quotasListContent: {
    padding: 16,
  },
  quotaCard: {
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
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  quotaInfo: {
    flex: 1,
  },
  quotaType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quotaDepartment: {
    fontSize: 14,
  },
  quotaDetails: {
    alignItems: 'flex-end',
  },
  quotaAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  salaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  salaryText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  quotaActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
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
    maxHeight: 400,
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
  dropdownContainer: {
    maxHeight: 120,
  },
  dropdownItem: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 4,
  },
  dropdownText: {
    fontSize: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
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
