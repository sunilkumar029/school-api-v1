import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ModalDropdownFilter } from '@/components/ModalDropdownFilter';
import { 
  useStationaryTypes, 
  useStationary, 
  useInventoryTracking,
  useStandards 
} from '@/hooks/useApi';

interface StationaryItem {
  id: number;
  name: string;
  description: string;
  branch: any;
  academic_year: any;
  is_active: boolean;
}

export default function StationeryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Global filters
  const {
    selectedBranch,
    selectedAcademicYear,
    branches,
    academicYears,
    branchesLoading,
    academicYearsLoading
  } = useGlobalFilters();

  // Local filter states
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    price: '',
  });

  // Fetch data with memoized parameters
  const stationaryParams = useMemo(() => ({
    branch: selectedBranch || 1,
    academic_year: selectedAcademicYear || 1,
    is_active: true,
  }), [selectedBranch, selectedAcademicYear]);

  const { data: stationaryTypes = [], loading: typesLoading, refetch: refetchTypes, error: typesError } = useStationaryTypes(stationaryParams);
  const { data: stationaryItems = [], loading: itemsLoading, refetch: refetchItems, error: itemsError } = useStationary(stationaryParams);
  const { data: inventoryTracking = [], loading: trackingLoading, refetch: refetchTracking, error: trackingError } = useInventoryTracking(stationaryParams);
  const { data: standards = [] } = useStandards({ is_active: true });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const filteredItems = useMemo(() => {
    if (!stationaryTypes || !Array.isArray(stationaryTypes)) return [];
    
    return stationaryTypes.filter((item: StationaryItem) => {
      if (!item || typeof item !== 'object') return false;
      if (!searchQuery) return true;
      
      const matchesSearch = (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [stationaryTypes, searchQuery]);

  const handleAdd = useCallback(async () => {
    try {
      setAddModalVisible(false);
      setFormData({ name: '', description: '', quantity: '', price: '' });
      refetchTypes();
      Alert.alert('Success', 'Stationery item added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add stationery item');
    }
  }, [formData, refetchTypes]);

  const handleEdit = useCallback(async () => {
    try {
      setEditModalVisible(false);
      setSelectedItem(null);
      setFormData({ name: '', description: '', quantity: '', price: '' });
      refetchTypes();
      Alert.alert('Success', 'Stationery item updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update stationery item');
    }
  }, [formData, refetchTypes]);

  const handleDelete = useCallback((item: StationaryItem) => {
    Alert.alert(
      'Delete Stationery Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              refetchTypes();
              Alert.alert('Success', 'Stationery item deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete stationery item');
            }
          }
        }
      ]
    );
  }, [refetchTypes]);

  const renderStationeryCard = (item: StationaryItem) => (
    <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.itemHeader}>
        <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name || 'Unnamed Item'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.statusText}>{item.is_active ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
        {item.description || 'No description available'}
      </Text>

      <View style={styles.itemDetails}>
        <Text style={[styles.itemBranch, { color: colors.textSecondary }]}>
          Branch: {item.branch?.name || 'N/A'}
        </Text>
        <Text style={[styles.itemYear, { color: colors.textSecondary }]}>
          Academic Year: {item.academic_year?.name || 'N/A'}
        </Text>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.primary }]}
          onPress={() => {
            setSelectedItem(item);
            setFormData({
              name: item.name || '',
              description: item.description || '',
              quantity: '',
              price: '',
            });
            setEditModalVisible(true);
          }}
        >
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { borderColor: '#EF4444' }]}
          onPress={() => handleDelete(item)}
        >
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFormModal = (isEdit = false) => (
    <Modal
      visible={isEdit ? editModalVisible : addModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => isEdit ? setEditModalVisible(false) : setAddModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.formModal, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {isEdit ? 'Edit Stationery Item' : 'Add Stationery Item'}
            </Text>
            <TouchableOpacity onPress={() => isEdit ? setEditModalVisible(false) : setAddModalVisible(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Name</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter item name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Description</Text>
              <TextInput
                style={[styles.formTextArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter description"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Quantity</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Price</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={isEdit ? handleEdit : handleAdd}
            >
              <Text style={styles.submitButtonText}>{isEdit ? 'Update Item' : 'Add Item'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const isLoading = typesLoading || itemsLoading || trackingLoading || branchesLoading || academicYearsLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Stationery Management"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Text style={[styles.filtersLabel, { color: colors.textSecondary }]}>Filters:</Text>

            <ModalDropdownFilter
              label="Branch"
              selectedValue={selectedBranch}
              onValueChange={() => {}} // Read-only from global filters
              options={(branches || []).map((branch: any) => ({ 
                label: branch.name || 'Unnamed Branch', 
                value: branch.id 
              }))}
              disabled={true}
            />

            <ModalDropdownFilter
              label="Academic Year"
              selectedValue={selectedAcademicYear}
              onValueChange={() => {}} // Read-only from global filters
              options={(academicYears || []).map((year: any) => ({ 
                label: year.name || 'Unnamed Year', 
                value: year.id 
              }))}
              disabled={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* Header Controls */}
      <View style={[styles.headerControls, { backgroundColor: colors.surface }]}>
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Search stationery items..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: '#10B981' }]}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              refetchTypes();
              refetchItems();
              refetchTracking();
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
              Loading stationery items...
            </Text>
          </View>
        ) : (typesError || itemsError || trackingError) ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Error loading data: {typesError || itemsError || trackingError}
            </Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No stationery items match your search' : 'No stationery items found'}
            </Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {filteredItems.map(renderStationeryCard)}
          </View>
        )}
      </ScrollView>

      {renderFormModal(false)}
      {renderFormModal(true)}
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
  headerControls: {
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  addButton: {
    paddingVertical: 12,
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
  itemsList: {
    padding: 16,
  },
  itemCard: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  itemDetails: {
    marginBottom: 16,
  },
  itemBranch: {
    fontSize: 12,
    marginBottom: 4,
  },
  itemYear: {
    fontSize: 12,
  },
  itemActions: {
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
    justifyContent: 'flex-end',
  },
  formModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
    fontSize: 18,
    fontWeight: 'bold',
    padding: 8,
  },
  formContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
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
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  submitButton: {
    paddingVertical: 12,
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