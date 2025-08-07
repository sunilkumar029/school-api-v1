
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
  useLeaveRequests,
  useBranches,
  useAcademicYears,
  useAllUsersExceptStudents
} from '@/hooks/useApi';
import { apiService } from '@/api/apiService';

interface LeaveRequest {
  id: number;
  leave_type: string;
  leave_duration: string;
  from_date: string;
  to_date?: string;
  reason: string;
  status: string;
  l1_approved: boolean;
  l2_approved: boolean;
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  user: {
    id: number;
    first_name: string;
    last_name: string;
    designation?: {
      name: string;
    };
    department?: {
      name: string;
    };
  };
}

export default function LeaveRequestsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [applyLeaveModalVisible, setApplyLeaveModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Apply Leave Form State
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'Casual',
    from_date: '',
    to_date: '',
    leave_duration: 'Full Day',
    reason: '',
    l1_approver: '',
    l2_approver: '',
  });

  // Fetch data
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears();
  const { data: approvers } = useAllUsersExceptStudents();

  const leaveParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
  }), [selectedBranch, selectedAcademicYear]);

  const { 
    data: leaves, 
    loading: leavesLoading, 
    error: leavesError, 
    refetch: refetchLeaves 
  } = useLeaveRequests(leaveParams);

  const filteredLeaves = useMemo(() => {
    if (!leaves) return [];
    
    return leaves.filter((leave: LeaveRequest) => {
      const matchesSearch = 
        leave.user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.leave_type.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [leaves, searchQuery]);

  const getStatusColor = (leave: LeaveRequest) => {
    if (leave.l1_approved && leave.l2_approved) return '#4CAF50';
    if (!leave.l1_approved && !leave.l2_approved) return '#FF9800';
    if (leave.l1_approved && !leave.l2_approved) return '#2196F3';
    return '#F44336';
  };

  const getStatusText = (leave: LeaveRequest) => {
    if (leave.l1_approved && leave.l2_approved) return 'Approved';
    if (!leave.l1_approved && !leave.l2_approved) return 'Pending';
    if (leave.l1_approved && !leave.l2_approved) return 'L1 Approved';
    return 'Rejected';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleApproveReject = async (leaveId: number, action: 'approve' | 'reject', level: 'l1' | 'l2') => {
    try {
      const approvalData = {
        [`${level}_approved`]: action === 'approve',
        [`${level}_approved_by`]: user?.id,
      };

      await apiService.updateLeaveRequest(leaveId, approvalData);
      Alert.alert('Success', `Leave ${action}d successfully`);
      refetchLeaves();
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} leave`);
    }
  };

  const handleApplyLeave = async () => {
    try {
      if (!leaveForm.from_date || !leaveForm.reason) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const leaveData = {
        ...leaveForm,
        user: user?.id,
        created_by: user?.id,
      };

      await apiService.createLeaveRequest(leaveData);
      Alert.alert('Success', 'Leave application submitted successfully');
      setApplyLeaveModalVisible(false);
      setLeaveForm({
        leave_type: 'Casual',
        from_date: '',
        to_date: '',
        leave_duration: 'Full Day',
        reason: '',
        l1_approver: '',
        l2_approver: '',
      });
      refetchLeaves();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit leave application');
    }
  };

  const renderLeaveItem = ({ item }: { item: LeaveRequest }) => (
    <TouchableOpacity
      style={[styles.leaveCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => {
        setSelectedLeave(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.leaveHeader}>
        <View style={styles.employeeInfo}>
          <Text style={[styles.employeeName, { color: colors.textPrimary }]}>
            {item.user.first_name} {item.user.last_name}
          </Text>
          {item.user.designation && (
            <Text style={[styles.designation, { color: colors.textSecondary }]}>
              {item.user.designation.name}
            </Text>
          )}
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item) }
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(item)}
          </Text>
        </View>
      </View>

      <View style={styles.leaveDetails}>
        <Text style={[styles.leaveType, { color: colors.textPrimary }]}>
          {item.leave_type} - {item.leave_duration}
        </Text>
        <Text style={[styles.leaveDates, { color: colors.textSecondary }]}>
          📅 {formatDate(item.from_date)}
          {item.to_date && ` to ${formatDate(item.to_date)}`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderLeaveDetailModal = () => (
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
              Leave Details
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedLeave && (
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Employee:</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {selectedLeave.user.first_name} {selectedLeave.user.last_name}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Leave Type:</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {selectedLeave.leave_type}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Duration:</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {selectedLeave.leave_duration}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>From Date:</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {formatDate(selectedLeave.from_date)}
                </Text>
              </View>

              {selectedLeave.to_date && (
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>To Date:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {formatDate(selectedLeave.to_date)}
                  </Text>
                </View>
              )}

              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reason:</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {selectedLeave.reason}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status:</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {getStatusText(selectedLeave)}
                </Text>
              </View>

              {user?.is_staff && !selectedLeave.l1_approved && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.approveButton, { backgroundColor: '#4CAF50' }]}
                    onPress={() => handleApproveReject(selectedLeave.id, 'approve', 'l1')}
                  >
                    <Text style={styles.buttonText}>L1 Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectButton, { backgroundColor: '#F44336' }]}
                    onPress={() => handleApproveReject(selectedLeave.id, 'reject', 'l1')}
                  >
                    <Text style={styles.buttonText}>L1 Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {user?.is_staff && selectedLeave.l1_approved && !selectedLeave.l2_approved && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.approveButton, { backgroundColor: '#4CAF50' }]}
                    onPress={() => handleApproveReject(selectedLeave.id, 'approve', 'l2')}
                  >
                    <Text style={styles.buttonText}>L2 Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectButton, { backgroundColor: '#F44336' }]}
                    onPress={() => handleApproveReject(selectedLeave.id, 'reject', 'l2')}
                  >
                    <Text style={styles.buttonText}>L2 Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderApplyLeaveModal = () => (
    <Modal
      visible={applyLeaveModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setApplyLeaveModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Apply Leave
            </Text>
            <TouchableOpacity
              onPress={() => setApplyLeaveModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Leave Type *</Text>
              <TouchableOpacity style={[styles.formInput, { borderColor: colors.border }]}>
                <Text style={[styles.formInputText, { color: colors.textPrimary }]}>
                  {leaveForm.leave_type}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Duration *</Text>
              <TouchableOpacity style={[styles.formInput, { borderColor: colors.border }]}>
                <Text style={[styles.formInputText, { color: colors.textPrimary }]}>
                  {leaveForm.leave_duration}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>From Date *</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                value={leaveForm.from_date}
                onChangeText={(text) => setLeaveForm(prev => ({...prev, from_date: text}))}
              />
            </View>

            {leaveForm.leave_duration === 'Multiple Days' && (
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>To Date</Text>
                <TextInput
                  style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  value={leaveForm.to_date}
                  onChangeText={(text) => setLeaveForm(prev => ({...prev, to_date: text}))}
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Reason *</Text>
              <TextInput
                style={[styles.formTextArea, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter reason for leave"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                value={leaveForm.reason}
                onChangeText={(text) => setLeaveForm(prev => ({...prev, reason: text}))}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleApplyLeave}
            >
              <Text style={styles.submitButtonText}>Submit Leave Application</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Leave Requests"
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

        <TouchableOpacity
          style={[styles.applyLeaveButton, { backgroundColor: colors.primary }]}
          onPress={() => setApplyLeaveModalVisible(true)}
        >
          <Text style={styles.applyLeaveButtonText}>+ Apply Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Search employees or leave type..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Content */}
      {leavesLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading leave requests...
          </Text>
        </View>
      ) : leavesError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Failed to load leave requests. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetchLeaves}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredLeaves}
          renderItem={renderLeaveItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.leavesList}
          contentContainerStyle={styles.leavesListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={leavesLoading}
              onRefresh={refetchLeaves}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No leave requests found
              </Text>
            </View>
          }
        />
      )}

      {renderLeaveDetailModal()}
      {renderApplyLeaveModal()}
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
  applyLeaveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  applyLeaveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  leavesList: {
    flex: 1,
  },
  leavesListContent: {
    padding: 16,
  },
  leaveCard: {
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
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  designation: {
    fontSize: 14,
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
  leaveDetails: {
    gap: 4,
  },
  leaveType: {
    fontSize: 14,
    fontWeight: '600',
  },
  leaveDates: {
    fontSize: 14,
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
  detailItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  approveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    justifyContent: 'center',
  },
  formInputText: {
    fontSize: 16,
  },
  formTextArea: {
    height: 100,
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
