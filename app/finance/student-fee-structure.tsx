
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { Picker } from '@react-native-picker/picker';
import { useFees, useFeeTypes, useStandards, useAcademicYears, useBranches } from '@/hooks/useApi';
import { apiService } from '@/api/apiService';

interface FeeStructure {
  id: number;
  standard: {
    id: number;
    name: string;
  };
  fee_type: {
    id: number;
    name: string;
    description: string;
  };
  academic_year: {
    id: number;
    name: string;
  };
  amount: number;
  min_amount: number;
  due_date: string;
  is_active: boolean;
}

interface FeeType {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  branch: any;
  academic_year: any;
}

export default function StudentFeeStructureScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'fees' | 'feeTypes'>('fees');
  
  // Modal states
  const [feeModalVisible, setFeeModalVisible] = useState(false);
  const [feeTypeModalVisible, setFeeTypeModalVisible] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [editingFeeType, setEditingFeeType] = useState<FeeType | null>(null);
  
  // Form states
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [feeForm, setFeeForm] = useState({
    standard_id: '',
    fee_type_id: '',
    amount: '',
    min_amount: '',
    due_date: '',
  });
  const [feeTypeForm, setFeeTypeForm] = useState({
    name: '',
    description: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  const feeParams = useMemo(() => ({
    branch: selectedBranch,
    is_active: true,
    academic_year: selectedAcademicYear,
  }), [selectedBranch, selectedAcademicYear]);

  const { data: fees, loading: feesLoading, refetch: refetchFees } = useFees(feeParams);
  
  const feeTypeParams = useMemo(() => ({
    branch: selectedBranch,
    is_active: true,
    omit: 'created_by,modified_by',
  }), [selectedBranch]);

  const { data: feeTypes, loading: feeTypesLoading, refetch: refetchFeeTypes } = useFeeTypes(feeTypeParams);
  
  const standardParams = useMemo(() => ({
    branch: selectedBranch,
    is_active: true,
    academic_year: selectedAcademicYear,
  }), [selectedBranch, selectedAcademicYear]);

  const { data: standards } = useStandards(standardParams);
  const { data: academicYears } = useAcademicYears();
  const { data: branches } = useBranches({ is_active: true });

  // Filter fees based on search
  const filteredFees = useMemo(() => {
    if (!searchQuery) return fees;
    return fees.filter((fee: FeeStructure) =>
      fee.standard?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fee.fee_type?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [fees, searchQuery]);

  // Filter fee types based on search
  const filteredFeeTypes = useMemo(() => {
    if (!searchQuery) return feeTypes;
    return feeTypes.filter((feeType: FeeType) =>
      feeType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feeType.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [feeTypes, searchQuery]);

  const showSuccessMessage = (message: string) => {
    Alert.alert('Success', message);
  };

  const showErrorMessage = (message: string) => {
    Alert.alert('Error', message);
  };

  // Fee CRUD operations
  const handleCreateFee = async () => {
    if (!feeForm.standard_id || !feeForm.fee_type_id || !feeForm.amount || !feeForm.min_amount || !feeForm.due_date) {
      showErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await apiService.createFee({
        ...feeForm,
        academic_year_id: selectedAcademicYear.toString(),
      });
      showSuccessMessage('Fee structure created successfully');
      setFeeModalVisible(false);
      resetFeeForm();
      refetchFees();
    } catch (error: any) {
      if (error.response?.data?.__all__?.[0]) {
        showErrorMessage(error.response.data.__all__[0]);
      } else {
        showErrorMessage('Failed to create fee structure');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFee = async () => {
    if (!editingFee || !feeForm.standard_id || !feeForm.fee_type_id || !feeForm.amount || !feeForm.min_amount || !feeForm.due_date) {
      showErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await apiService.updateFee(editingFee.id, {
        ...feeForm,
        academic_year_id: selectedAcademicYear.toString(),
      });
      showSuccessMessage('Fee structure updated successfully');
      setFeeModalVisible(false);
      setEditingFee(null);
      resetFeeForm();
      refetchFees();
    } catch (error) {
      showErrorMessage('Failed to update fee structure');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFee = (fee: FeeStructure) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete the ${fee.fee_type?.name} for ${fee.standard?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await apiService.deleteFee(fee.id);
              showSuccessMessage('Fee structure deleted successfully');
              refetchFees();
            } catch (error) {
              showErrorMessage('Failed to delete fee structure');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Fee Type CRUD operations
  const handleCreateFeeType = async () => {
    if (!feeTypeForm.name || !feeTypeForm.description) {
      showErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await apiService.createFeeType({
        ...feeTypeForm,
        branch_id: selectedBranch.toString(),
        academic_year_id: selectedAcademicYear.toString(),
      });
      showSuccessMessage('Fee type created successfully');
      setFeeTypeModalVisible(false);
      resetFeeTypeForm();
      refetchFeeTypes();
    } catch (error: any) {
      if (error.response?.data?.Error?.[0]) {
        showErrorMessage(error.response.data.Error[0]);
      } else {
        showErrorMessage('Failed to create fee type');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeeType = async () => {
    if (!editingFeeType || !feeTypeForm.name || !feeTypeForm.description) {
      showErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await apiService.updateFeeType(editingFeeType.id, {
        ...feeTypeForm,
        is_active: true,
      });
      showSuccessMessage('Fee type updated successfully');
      setFeeTypeModalVisible(false);
      setEditingFeeType(null);
      resetFeeTypeForm();
      refetchFeeTypes();
    } catch (error) {
      showErrorMessage('Failed to update fee type');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeeType = (feeType: FeeType) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete the fee type "${feeType.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await apiService.deleteFeeType(feeType.id);
              showSuccessMessage('Fee type deleted successfully');
              refetchFeeTypes();
            } catch (error) {
              showErrorMessage('Failed to delete fee type');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetFeeForm = () => {
    setFeeForm({
      standard_id: '',
      fee_type_id: '',
      amount: '',
      min_amount: '',
      due_date: '',
    });
  };

  const resetFeeTypeForm = () => {
    setFeeTypeForm({
      name: '',
      description: '',
    });
  };

  const openEditFee = (fee: FeeStructure) => {
    setEditingFee(fee);
    setFeeForm({
      standard_id: fee.standard?.id.toString() || '',
      fee_type_id: fee.fee_type?.id.toString() || '',
      amount: fee.amount.toString(),
      min_amount: fee.min_amount.toString(),
      due_date: fee.due_date,
    });
    setFeeModalVisible(true);
  };

  const openEditFeeType = (feeType: FeeType) => {
    setEditingFeeType(feeType);
    setFeeTypeForm({
      name: feeType.name,
      description: feeType.description,
    });
    setFeeTypeModalVisible(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const renderFeeCard = (fee: FeeStructure) => (
    <View key={fee.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{fee.standard?.name}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{fee.fee_type?.name}</Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{fee.fee_type?.description}</Text>
        </View>
      </View>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Amount:</Text>
          <Text style={[styles.detailValue, { color: colors.primary }]}>{formatCurrency(fee.amount)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Min Amount:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{formatCurrency(fee.min_amount)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Due Date:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{fee.due_date}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.primary }]}
          onPress={() => openEditFee(fee)}
        >
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: '#EF4444' }]}
          onPress={() => handleDeleteFee(fee)}
        >
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFeeTypeCard = (feeType: FeeType) => (
    <View key={feeType.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{feeType.name}</Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{feeType.description}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.primary }]}
          onPress={() => openEditFeeType(feeType)}
        >
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: '#EF4444' }]}
          onPress={() => handleDeleteFeeType(feeType)}
        >
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFeeModal = () => (
    <Modal
      visible={feeModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFeeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingFee ? 'Edit Fee Structure' : 'Add Fee Structure'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setFeeModalVisible(false);
                setEditingFee(null);
                resetFeeForm();
              }}
            >
              <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Standard *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Picker
                  selectedValue={feeForm.standard_id}
                  onValueChange={(value) => setFeeForm({ ...feeForm, standard_id: value })}
                  style={[styles.picker, { color: colors.textPrimary }]}
                >
                  <Picker.Item label="Select Standard" value="" />
                  {standards?.map((standard: any) => (
                    <Picker.Item key={standard.id} label={standard.name} value={standard.id.toString()} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Fee Type *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Picker
                  selectedValue={feeForm.fee_type_id}
                  onValueChange={(value) => setFeeForm({ ...feeForm, fee_type_id: value })}
                  style={[styles.picker, { color: colors.textPrimary }]}
                >
                  <Picker.Item label="Select Fee Type" value="" />
                  {feeTypes?.map((feeType: any) => (
                    <Picker.Item key={feeType.id} label={feeType.name} value={feeType.id.toString()} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Amount *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter amount"
                placeholderTextColor={colors.textSecondary}
                value={feeForm.amount}
                onChangeText={(value) => setFeeForm({ ...feeForm, amount: value })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Minimum Amount *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter minimum amount"
                placeholderTextColor={colors.textSecondary}
                value={feeForm.min_amount}
                onChangeText={(value) => setFeeForm({ ...feeForm, min_amount: value })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Due Date *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                value={feeForm.due_date}
                onChangeText={(value) => setFeeForm({ ...feeForm, due_date: value })}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={editingFee ? handleUpdateFee : handleCreateFee}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingFee ? 'Update Fee Structure' : 'Create Fee Structure'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderFeeTypeModal = () => (
    <Modal
      visible={feeTypeModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFeeTypeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingFeeType ? 'Edit Fee Type' : 'Add Fee Type'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setFeeTypeModalVisible(false);
                setEditingFeeType(null);
                resetFeeTypeForm();
              }}
            >
              <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter fee type name"
                placeholderTextColor={colors.textSecondary}
                value={feeTypeForm.name}
                onChangeText={(value) => setFeeTypeForm({ ...feeTypeForm, name: value })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Description *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter fee type description"
                placeholderTextColor={colors.textSecondary}
                value={feeTypeForm.description}
                onChangeText={(value) => setFeeTypeForm({ ...feeTypeForm, description: value })}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={editingFeeType ? handleUpdateFeeType : handleCreateFeeType}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingFeeType ? 'Update Fee Type' : 'Create Fee Type'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const isLoading = feesLoading || feeTypesLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Fee Structure"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Filter Container */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.filtersRow}>
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Branch:</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Picker
                selectedValue={selectedBranch}
                onValueChange={setSelectedBranch}
                style={[styles.picker, { color: colors.textPrimary }]}
              >
                {branches?.map((branch: any) => (
                  <Picker.Item key={branch.id} label={branch.name} value={branch.id} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Academic Year:</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Picker
                selectedValue={selectedAcademicYear}
                onValueChange={setSelectedAcademicYear}
                style={[styles.picker, { color: colors.textPrimary }]}
              >
                {academicYears?.map((year: any) => (
                  <Picker.Item key={year.id} label={year.name} value={year.id} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Search..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'fees' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('fees')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'fees' ? colors.primary : colors.textSecondary },
            ]}
          >
            Fee Structures
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'feeTypes' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('feeTypes')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'feeTypes' ? colors.primary : colors.textSecondary },
            ]}
          >
            Fee Types
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (activeTab === 'fees') {
              resetFeeForm();
              setFeeModalVisible(true);
            } else {
              resetFeeTypeForm();
              setFeeTypeModalVisible(true);
            }
          }}
        >
          <Text style={styles.addButtonText}>
            + Add {activeTab === 'fees' ? 'Fee Structure' : 'Fee Type'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              refetchFees();
              refetchFeeTypes();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading {activeTab === 'fees' ? 'fee structures' : 'fee types'}...
            </Text>
          </View>
        ) : (
          <View style={styles.listContent}>
            {activeTab === 'fees' ? (
              filteredFees.length > 0 ? (
                filteredFees.map(renderFeeCard)
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No fee structures found
                  </Text>
                </View>
              )
            ) : (
              filteredFeeTypes.length > 0 ? (
                filteredFeeTypes.map(renderFeeTypeCard)
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No fee types found
                  </Text>
                </View>
              )
            )}
          </View>
        )}
      </ScrollView>

      {renderFeeModal()}
      {renderFeeTypeModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonContainer: {
    padding: 16,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
  },
  cardDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
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
