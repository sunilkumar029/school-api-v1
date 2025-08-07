
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { Picker } from '@react-native-picker/picker';
import { 
  useInventoryList, 
  useInventoryTypes, 
  useBranches, 
  useAcademicYears,
  useRooms,
  useInventoryTracking
} from '@/hooks/useApi';
import { apiService } from '@/api/apiService';

interface InventoryItem {
  id: number;
  name: string;
  description: string;
  quantity: number;
  price: number;
  status: string;
  is_stationary: boolean;
  product_image?: string;
  bill_image?: string;
  remarks?: string;
  inventory_type: {
    id: number;
    name: string;
    type: string;
    branch: any;
    academic_year: any;
  };
  inventory_tracking: any[];
}

export default function InventoryScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [selectedInventoryType, setSelectedInventoryType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    price: '',
    inventory_type_id: '',
    is_stationary: false,
    status: 'Available',
    remarks: '',
  });

  // Assignment form
  const [assignmentData, setAssignmentData] = useState({
    room_id: '',
    quantity: '',
    status: 'Issued',
    remarks: '',
  });

  // Fetch data with memoized parameters
  const inventoryParams = useMemo(() => ({
    branch: selectedBranch,
    omit: 'created_by,modified_by,branch',
  }), [selectedBranch]);

  const typesParams = useMemo(() => ({
    is_active: true,
    branch: selectedBranch,
  }), [selectedBranch]);

  const { data: inventoryItems, loading: itemsLoading, refetch: refetchItems } = useInventoryList(inventoryParams);
  const { data: inventoryTypes, loading: typesLoading, refetch: refetchTypes } = useInventoryTypes(typesParams);
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears({ is_active: true });
  const { data: rooms } = useRooms({ is_active: true });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return '#10B981';
      case 'issued': return '#3B82F6';
      case 'damaged': return '#EF4444';
      case 'not-available': return '#6B7280';
      case 'assigned': return '#8B5CF6';
      default: return colors.textSecondary;
    }
  };

  const getAvailableQuantity = (item: InventoryItem) => {
    const issuedQuantity = item.inventory_tracking?.reduce((sum, track) => {
      return track.status === 'Issued' ? sum + track.quantity : sum;
    }, 0) || 0;
    return item.quantity - issuedQuantity;
  };

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item: InventoryItem) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedInventoryType === 'all' ||
                         (selectedInventoryType === 'stationary' && item.is_stationary) ||
                         (selectedInventoryType === 'inventory' && !item.is_stationary);
      
      return matchesSearch && matchesType;
    });
  }, [inventoryItems, searchQuery, selectedInventoryType]);

  const handleAdd = useCallback(async () => {
    try {
      if (!formData.name || !formData.quantity || !formData.inventory_type_id) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price) || 0,
        inventory_type_id: parseInt(formData.inventory_type_id),
        is_stationary: formData.is_stationary,
        status: formData.status,
        remarks: formData.remarks,
        branch_id: selectedBranch,
      };

      await apiService.createInventory(payload);
      setAddModalVisible(false);
      setFormData({
        name: '',
        description: '',
        quantity: '',
        price: '',
        inventory_type_id: '',
        is_stationary: false,
        status: 'Available',
        remarks: '',
      });
      refetchItems();
      Alert.alert('Success', 'Inventory item added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add inventory item');
    }
  }, [formData, selectedBranch, refetchItems]);

  const handleEdit = useCallback(async () => {
    if (!selectedItem) return;
    
    try {
      const payload = {
        id: selectedItem.id,
        name: formData.name,
        description: formData.description,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price) || 0,
        inventory_type_id: formData.inventory_type_id,
        is_stationary: formData.is_stationary,
        status: formData.status,
        remarks: formData.remarks,
        branch_id: selectedBranch,
      };

      await apiService.updateInventory(selectedItem.id, payload);
      setEditModalVisible(false);
      setSelectedItem(null);
      setFormData({
        name: '',
        description: '',
        quantity: '',
        price: '',
        inventory_type_id: '',
        is_stationary: false,
        status: 'Available',
        remarks: '',
      });
      refetchItems();
      Alert.alert('Success', 'Inventory item updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update inventory item');
    }
  }, [selectedItem, formData, selectedBranch, refetchItems]);

  const handleAssign = useCallback(async () => {
    if (!selectedItem) return;
    
    try {
      const availableQty = getAvailableQuantity(selectedItem);
      const requestedQty = parseInt(assignmentData.quantity);
      
      if (requestedQty > availableQty) {
        Alert.alert('Error', `Only ${availableQty} items available for assignment`);
        return;
      }

      const payload = {
        inventory: selectedItem.id,
        room: assignmentData.room_id ? parseInt(assignmentData.room_id) : null,
        quantity: requestedQty,
        status: assignmentData.status,
        remarks: assignmentData.remarks,
        created_at: new Date().toISOString(),
        return_date: null,
      };

      await apiService.createInventoryTracking(payload);
      setAssignModalVisible(false);
      setSelectedItem(null);
      setAssignmentData({
        room_id: '',
        quantity: '',
        status: 'Issued',
        remarks: '',
      });
      refetchItems();
      Alert.alert('Success', 'Inventory item assigned successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to assign inventory item');
    }
  }, [selectedItem, assignmentData, refetchItems]);

  const handleDelete = useCallback((item: InventoryItem) => {
    Alert.alert(
      'Delete Inventory Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteInventory(item.id);
              refetchItems();
              Alert.alert('Success', 'Inventory item deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete inventory item');
            }
          }
        }
      ]
    );
  }, [refetchItems]);

  const renderInventoryCard = (item: InventoryItem) => {
    const availableQty = getAvailableQuantity(item);
    
    return (
      <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleContainer}>
            <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
            <Text style={[styles.itemType, { color: colors.textSecondary }]}>
              {item.inventory_type?.name} • {item.is_stationary ? 'Stationary' : 'Inventory'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        {item.product_image && (
          <Image source={{ uri: item.product_image }} style={styles.productImage} />
        )}
        
        <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
        
        <View style={styles.itemDetails}>
          <View style={styles.quantityContainer}>
            <Text style={[styles.quantityLabel, { color: colors.textSecondary }]}>Total Quantity:</Text>
            <Text style={[styles.quantityValue, { color: colors.textPrimary }]}>{item.quantity}</Text>
          </View>
          <View style={styles.quantityContainer}>
            <Text style={[styles.quantityLabel, { color: colors.textSecondary }]}>Available:</Text>
            <Text style={[styles.quantityValue, { color: availableQty > 0 ? '#10B981' : '#EF4444' }]}>
              {availableQty}
            </Text>
          </View>
          <Text style={[styles.itemPrice, { color: colors.primary }]}>
            {formatCurrency(item.price)}
          </Text>
        </View>

        {item.inventory_tracking && item.inventory_tracking.length > 0 && (
          <View style={styles.trackingInfo}>
            <Text style={[styles.trackingTitle, { color: colors.textPrimary }]}>Assignments:</Text>
            {item.inventory_tracking.map((track, index) => (
              <View key={index} style={styles.trackingItem}>
                <Text style={[styles.trackingText, { color: colors.textSecondary }]}>
                  {track.room?.name || 'Unassigned'} - Qty: {track.quantity} - {track.status}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.primary }]}
            onPress={() => {
              setSelectedItem(item);
              setFormData({
                name: item.name,
                description: item.description,
                quantity: item.quantity.toString(),
                price: item.price.toString(),
                inventory_type_id: item.inventory_type?.id.toString() || '',
                is_stationary: item.is_stationary,
                status: item.status,
                remarks: item.remarks || '',
              });
              setEditModalVisible(true);
            }}
          >
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          
          {availableQty > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: '#8B5CF6' }]}
              onPress={() => {
                setSelectedItem(item);
                setAssignModalVisible(true);
              }}
            >
              <Text style={[styles.actionButtonText, { color: '#8B5CF6' }]}>Assign</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: '#EF4444' }]}
            onPress={() => handleDelete(item)}
          >
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFiltersModal = () => (
    <Modal
      visible={filtersVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFiltersVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.filtersModal, { backgroundColor: colors.surface }]}>
          <View style={styles.filtersHeader}>
            <Text style={[styles.filtersTitle, { color: colors.textPrimary }]}>Filters</Text>
            <TouchableOpacity onPress={() => setFiltersVisible(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filtersContent}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Branch</Text>
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

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Academic Year</Text>
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

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Inventory Type</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Picker
                  selectedValue={selectedInventoryType}
                  onValueChange={setSelectedInventoryType}
                  style={[styles.picker, { color: colors.textPrimary }]}
                >
                  <Picker.Item label="All Types" value="all" />
                  <Picker.Item label="Stationary" value="stationary" />
                  <Picker.Item label="Inventory" value="inventory" />
                </Picker>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={() => setFiltersVisible(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderAddModal = () => (
    <Modal
      visible={addModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setAddModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.formModal, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Inventory Item</Text>
            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Name *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter item name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Inventory Type *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Picker
                  selectedValue={formData.inventory_type_id}
                  onValueChange={(value) => setFormData({ ...formData, inventory_type_id: value })}
                  style={[styles.picker, { color: colors.textPrimary }]}
                >
                  <Picker.Item label="Select Type" value="" />
                  {inventoryTypes?.map((type: any) => (
                    <Picker.Item key={type.id} label={type.name} value={type.id.toString()} />
                  ))}
                </Picker>
              </View>
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
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Quantity *</Text>
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

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Status</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  style={[styles.picker, { color: colors.textPrimary }]}
                >
                  <Picker.Item label="Available" value="Available" />
                  <Picker.Item label="Not Available" value="Not-Available" />
                  <Picker.Item label="Damaged" value="Damaged" />
                </Picker>
              </View>
            </View>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[styles.checkbox, formData.is_stationary && { backgroundColor: colors.primary }]}
                onPress={() => setFormData({ ...formData, is_stationary: !formData.is_stationary })}
              >
                {formData.is_stationary && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>Is Stationary</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Remarks</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.remarks}
                onChangeText={(text) => setFormData({ ...formData, remarks: text })}
                placeholder="Enter remarks"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleAdd}
            >
              <Text style={styles.submitButtonText}>Add Item</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderAssignModal = () => (
    <Modal
      visible={assignModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setAssignModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.formModal, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Assign {selectedItem?.name}
            </Text>
            <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent}>
            <Text style={[styles.availableInfo, { color: colors.textSecondary }]}>
              Available Quantity: {selectedItem ? getAvailableQuantity(selectedItem) : 0}
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Assign to Room</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Picker
                  selectedValue={assignmentData.room_id}
                  onValueChange={(value) => setAssignmentData({ ...assignmentData, room_id: value })}
                  style={[styles.picker, { color: colors.textPrimary }]}
                >
                  <Picker.Item label="Select Room" value="" />
                  {rooms?.map((room: any) => (
                    <Picker.Item key={room.id} label={room.name} value={room.id.toString()} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Quantity *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                value={assignmentData.quantity}
                onChangeText={(text) => setAssignmentData({ ...assignmentData, quantity: text })}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Status</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Picker
                  selectedValue={assignmentData.status}
                  onValueChange={(value) => setAssignmentData({ ...assignmentData, status: value })}
                  style={[styles.picker, { color: colors.textPrimary }]}
                >
                  <Picker.Item label="Issued" value="Issued" />
                  <Picker.Item label="Assigned" value="Assigned" />
                  <Picker.Item label="Damaged" value="Damaged" />
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Remarks</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                value={assignmentData.remarks}
                onChangeText={(text) => setAssignmentData({ ...assignmentData, remarks: text })}
                placeholder="Enter remarks"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleAssign}
            >
              <Text style={styles.submitButtonText}>Assign Item</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const isLoading = itemsLoading || typesLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Inventory Management"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Header Controls */}
      <View style={[styles.headerControls, { backgroundColor: colors.surface }]}>
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Search inventory items..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.primary }]}
            onPress={() => setFiltersVisible(true)}
          >
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: '#10B981' }]}
            onPress={() => setAddModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              refetchItems();
              refetchTypes();
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
              Loading inventory items...
            </Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No inventory items match your search' : 'No inventory items found'}
            </Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {filteredItems.map(renderInventoryCard)}
          </View>
        )}
      </ScrollView>

      {renderFiltersModal()}
      {renderAddModal()}
      {renderAssignModal()}
      {editModalVisible && renderAddModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemType: {
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
    fontWeight: '600',
  },
  productImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  trackingInfo: {
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  trackingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackingItem: {
    marginBottom: 2,
  },
  trackingText: {
    fontSize: 12,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 70,
  },
  actionButtonText: {
    fontSize: 12,
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
  filtersModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  formModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
  filtersContent: {
    padding: 20,
  },
  formContent: {
    padding: 20,
  },
  filterGroup: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 8,
    borderColor: '#D1D5DB',
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
  },
  availableInfo: {
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  applyButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
