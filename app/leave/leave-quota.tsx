
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
  useLeaveQuotasList,
  useBranches,
  useAcademicYears,
  useDepartments
} from '@/hooks/useApi';
import { apiService } from '@/api/apiService';

interface LeaveQuota {
  id: number;
  leave_type: string;
  total_quota: number;
  affects_salary: boolean;
  department?: {
    id: number;
    name: string;
  };
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
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuota, setEditingQuota] = useState<LeaveQuota | null>(null);

  // Form State
  const [quotaForm, setQuotaForm] = useState({
    leave_type: '',
    total_quota: '',
    affects_salary: false,
    department: null as number | null,
  });

  // Fetch data
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears();
  const { data: departments } = useDepartments({ branch: selectedBranch });

  const quotaParams = useMemo(() => {
    const params: any = {
      branch: selectedBranch,
      academic_year: selectedAcademicYear,
    };
    if (selectedDepartment) params.department = selectedDepartment;
    return params;
  }, [selectedBranch, selectedAcademicYear, selectedDepartment]);

  const { 
    data: quotas, 
    loading: quotasLoading, 
    error: quotasError, 
    refetch: refetchQuotas 
  } = useLeaveQuotasList(quotaParams);

  const handleCreateQuota = async () => {
    try {
      if (!quotaForm.leave_type || !quotaForm.total_quota) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const quotaData = {
        ...quotaForm,
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
      leave_type: quota.leave_type,
      total_quota: quota.total_quota.toString(),
      affects_salary: quota.affects_salary,
      department: quota.department?.id || null,
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
      leave_type: '',
      total_quota: '',
      affects_salary: false,
      department: null,
    });
    setEditingQuota(null);
  };

  const renderQuotaItem = ({ item }: { item: LeaveQuota }) => (
    <View style={[styles.quotaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.quotaHeader}>
        <View style={styles.quotaInfo}>
          <Text style={[styles.leaveType, { color: colors.textPrimary }]}>
            {item.leave_type}
          </Text>
          {item.department && (
            <Text style={[styles.department, { color: colors.textSecondary }]}>
              {item.department.name}
            </Text>
          )}
        </View>
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
      </View>

      <View style={styles.quotaDetails}>
        <View style={styles.quotaItem}>
          <Text style={[styles.quotaLabel, { color: colors.textSecondary }]}>Total Quota:</Text>
          <Text style={[styles.quotaValue, { color: colors.textPrimary }]}>
            {item.total_quota} days
          </Text>
        </View>
        <View style={styles.quotaItem}>
          <Text style={[styles.quotaLabel, { color: colors.textSecondary }]}>Affects Salary:</Text>
          <View style={[
            styles.salaryBadge,
            { backgroundColor: item.affects_salary ? '#FF9800' : '#4CAF50' }
          ]}>
            <Text style={styles.salaryBadgeText}>
              {item.affects_salary ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
      </View>
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
              {editingQuota ? 'Edit Leave Quota' : 'Create Leave Quota'}
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
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Leave Type *</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter leave type (e.g., Casual, Sick, Annual)"
                placeholderTextColor={colors.textSecondary}
                value={quotaForm.leave_type}
                onChangeText={(text) => setQuotaForm(prev => ({...prev, leave_type: text}))}
              />
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
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Department (Optional)</Text>
              <TouchableOpacity style={[styles.formInput, { borderColor: colors.border }]}>
                <Text style={[styles.formInputText, { color: colors.textPrimary }]}>
                  {quotaForm.department ? 
                    departments?.find(d => d.id === quotaForm.department)?.name : 
                    'Select Department (All if none selected)'
                  }
                </Text>
              </TouchableOpacity>
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
                  Affects Salary (deduct pay for exceeding quota)
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateQuota}
            >
              <Text style={styles.submitButtonText}>
                {editingQuota ? 'Update Quota' : 'Create Quota'}
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

          <TouchableOpacity style={[styles.compactFilterButton, { borderColor: colors.border }]}>
            <Text style={[styles.compactFilterText, { color: colors.textPrimary }]}>
              {selectedDepartment ? departments?.find(d => d.id === selectedDepartment)?.name : 'All Dept'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {user?.is_staff && (
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.createButtonText}>+ Create</Text>
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
  createButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createButtonText: {
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
  leaveType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  department: {
    fontSize: 14,
  },
  quotaActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
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
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  quotaDetails: {
    gap: 8,
  },
  quotaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  quotaValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  salaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  salaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
    justifyContent: 'center',
  },
  formInputText: {
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    flex: 1,
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
