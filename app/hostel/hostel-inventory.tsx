
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ModalDropdownFilter } from '@/components/ModalDropdownFilter';
import { useHostelProducts, useInventoryTypes } from '@/hooks/useApi';

export default function HostelInventoryScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const {
    selectedBranch,
    selectedAcademicYear,
    branches,
    academicYears,
    setSelectedBranch,
    setSelectedAcademicYear
  } = useGlobalFilters();

  // Fetch inventory with filters
  const inventoryParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    ...(selectedCategory && { category: selectedCategory }),
    ...(selectedStatus && { status: selectedStatus }),
  }), [selectedBranch, selectedAcademicYear, selectedCategory, selectedStatus]);

  const {
    data: inventory = [],
    loading: inventoryLoading,
    error: inventoryError,
    refetch: refetchInventory
  } = useHostelProducts(inventoryParams);

  const { data: categories = [] } = useInventoryTypes({ type: 'hostel_category' });

  const categoryOptions = [
    { id: null, name: 'All Categories' },
    ...categories.map((cat: any) => ({ id: cat.name, name: cat.name }))
  ];

  const statusOptions = [
    { id: null, name: 'All Status' },
    { id: 'available', name: 'Available' },
    { id: 'low_stock', name: 'Low Stock' },
    { id: 'out_of_stock', name: 'Out of Stock' },
    { id: 'maintenance', name: 'Under Maintenance' }
  ];

  const getStatusColor = (status: string, quantity: number, minQuantity: number) => {
    if (status === 'maintenance') return '#F59E0B';
    if (quantity === 0) return '#EF4444';
    if (quantity <= minQuantity) return '#F59E0B';
    return '#10B981';
  };

  const getStatusText = (item: any) => {
    if (item.status === 'maintenance') return 'Maintenance';
    if (item.quantity === 0) return 'Out of Stock';
    if (item.quantity <= item.min_quantity) return 'Low Stock';
    return 'Available';
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'furniture': return '🪑';
      case 'bedding': return '🛏️';
      case 'electronics': return '⚡';
      case 'cleaning': return '🧹';
      case 'kitchen': return '🍽️';
      case 'sports': return '⚽';
      default: return '📦';
    }
  };

  const renderInventoryCard = (item: any) => (
    <View
      key={item.id}
      style={[
        styles.inventoryCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderLeftColor: getStatusColor(item.status, item.quantity, item.min_quantity)
        }
      ]}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.categoryIcon}>
            {getCategoryIcon(item.category)}
          </Text>
          <View style={styles.itemDetails}>
            <Text style={[styles.itemName, { color: colors.textPrimary }]}>
              {item.name}
            </Text>
            <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
              {item.category} • SKU: {item.sku}
            </Text>
          </View>
        </View>
        
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColor(item.status, item.quantity, item.min_quantity) }
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(item)}
          </Text>
        </View>
      </View>

      <View style={styles.quantityInfo}>
        <View style={styles.quantityRow}>
          <Text style={[styles.quantityLabel, { color: colors.textSecondary }]}>
            Current Stock:
          </Text>
          <Text style={[styles.quantityValue, { color: colors.textPrimary }]}>
            {item.quantity} {item.unit}
          </Text>
        </View>
        
        <View style={styles.quantityRow}>
          <Text style={[styles.quantityLabel, { color: colors.textSecondary }]}>
            Min Required:
          </Text>
          <Text style={[styles.quantityValue, { color: colors.textSecondary }]}>
            {item.min_quantity} {item.unit}
          </Text>
        </View>

        {item.price && (
          <View style={styles.quantityRow}>
            <Text style={[styles.quantityLabel, { color: colors.textSecondary }]}>
              Unit Price:
            </Text>
            <Text style={[styles.quantityValue, { color: colors.primary }]}>
              ₹{item.price}
            </Text>
          </View>
        )}
      </View>

      {item.location && (
        <View style={styles.locationInfo}>
          <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>
            Location:
          </Text>
          <Text style={[styles.locationValue, { color: colors.textPrimary }]}>
            📍 {item.location}
          </Text>
        </View>
      )}

      {item.description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton, { backgroundColor: colors.primary }]}
          onPress={() => console.log('Edit item:', item.id)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.trackButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
          onPress={() => console.log('Track item:', item.id)}
        >
          <Text style={[styles.trackButtonText, { color: colors.primary }]}>Track Usage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Hostel Inventory"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
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
              label="Category"
              items={categoryOptions}
              selectedValue={selectedCategory}
              onValueChange={setSelectedCategory}
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
      {inventoryLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading inventory...
          </Text>
        </View>
      ) : inventoryError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Failed to load inventory. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetchInventory}
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
              refreshing={inventoryLoading}
              onRefresh={refetchInventory}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {inventory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No inventory items found for the selected criteria
              </Text>
            </View>
          ) : (
            <View style={styles.inventoryList}>
              {inventory.map(renderInventoryCard)}
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
  inventoryList: {
    padding: 16,
  },
  inventoryCard: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quantityInfo: {
    marginBottom: 12,
    gap: 4,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 14,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  locationLabel: {
    fontSize: 12,
  },
  locationValue: {
    fontSize: 12,
    flex: 1,
  },
  description: {
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {},
  trackButton: {
    borderWidth: 1,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  trackButtonText: {
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
