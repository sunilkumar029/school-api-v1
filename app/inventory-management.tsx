
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ModalDropdownFilter } from '@/components/ModalDropdownFilter';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInventory, useInventoryTypes } from '@/hooks/useApi';

interface InventoryItem {
  id: number;
  name: string;
  description?: string;
  category: {
    id: number;
    name: string;
  };
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  current_value?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  location?: string;
  assigned_to?: {
    id: number;
    name: string;
  };
  branch: {
    id: number;
    name: string;
  };
  last_updated: string;
}

export default function InventoryManagementScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);


  // Global filters
  const {
    branches,
    academicYears,
    branchesLoading,
    academicYearsLoading
  } = useGlobalFilters();

  // Fetch data
  const { data: categories = [], loading: categoriesLoading } = useInventoryTypes();

  const inventoryParams = useMemo(() => {
    const params: any = {};
    if (selectedBranch) params.branch = selectedBranch;
    if (selectedAcademicYear) params.academic_year = selectedAcademicYear;
    if (selectedCategory) params.category = selectedCategory;
    if (selectedCondition) params.condition = selectedCondition;
    if (selectedStatus) params.status = selectedStatus;
    return params;
  }, [selectedBranch, selectedAcademicYear, selectedCategory, selectedCondition, selectedStatus]);

  const {
    data: inventoryItems = [],
    loading: inventoryLoading,
    error: inventoryError,
    refetch: refetchInventory
  } = useInventory(inventoryParams);

  useEffect(() => {
    refetchInventory();
  }, [selectedBranch, selectedAcademicYear, selectedCategory, selectedCondition, selectedStatus]);


  // Filter options with proper structure for ModalDropdownFilter
  const branchOptions = useMemo(() => [
    { id: 0, name: 'All Branches' },
    ...(branches || []).map((branch: any) => ({ id: branch.id, name: branch.name })),
  ], [branches]);

  const academicYearOptions = useMemo(() => [
    { id: 0, name: 'All Years' },
    ...(academicYears || []).map((year: any) => ({ id: year.id, name: year.name })),
  ], [academicYears]);

  const categoryOptions = useMemo(() => [
    { id: 0, name: 'All Categories' },
    ...categories.map((category: any) => ({
      id: category.id,
      name: category.name || 'Unnamed Category'
    }))
  ], [categories]);

  const conditionOptions = useMemo(() => [
    { id: 0, name: 'All Conditions' },
    { id: 1, name: 'Excellent' },
    { id: 2, name: 'Good' },
    { id: 3, name: 'Fair' },
    { id: 4, name: 'Poor' },
    { id: 5, name: 'Damaged' },
  ], []);

  const conditionMapping: { [key: number]: string | null } = {
    0: null,
    1: 'excellent',
    2: 'good',
    3: 'fair',
    4: 'poor',
    5: 'damaged'
  };

  const statusOptions = useMemo(() => [
    { id: 0, name: 'All Status' },
    { id: 1, name: 'Available' },
    { id: 2, name: 'In Use' },
    { id: 3, name: 'Maintenance' },
    { id: 4, name: 'Retired' },
  ], []);

  const statusMapping: { [key: number]: string | null } = {
    0: null,
    1: 'available',
    2: 'in_use',
    3: 'maintenance',
    4: 'retired'
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return colors.success || '#10b981';
      case 'good': return colors.info || '#3b82f6';
      case 'fair': return colors.warning || '#f59e0b';
      case 'poor': return colors.error || '#ef4444';
      case 'damaged': return colors.error || '#ef4444';
      default: return colors.textSecondary || '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return colors.success || '#10b981';
      case 'in_use': return colors.info || '#3b82f6';
      case 'maintenance': return colors.warning || '#f59e0b';
      case 'retired': return colors.textSecondary || '#6b7280';
      default: return colors.textSecondary || '#6b7280';
    }
  };

  const getConditionLabel = (condition: string) => {
    return condition.charAt(0).toUpperCase() + condition.slice(1);
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return 'N/A';
    return `$${amount.toLocaleString()}`;
  };

  const handleRefresh = () => {
    refetchInventory();
  };

  const handleItemPress = (item: InventoryItem) => {
    setSelectedItem(item);
  };

  // Get selected values for dropdowns
  const getSelectedConditionValue = () => {
    if (!selectedCondition) return 0;
    const entry = Object.entries(conditionMapping).find(([_, value]) => value === selectedCondition);
    return entry ? parseInt(entry[0]) : 0;
  };

  const getSelectedStatusValue = () => {
    if (!selectedStatus) return 0;
    const entry = Object.entries(statusMapping).find(([_, value]) => value === selectedStatus);
    return entry ? parseInt(entry[0]) : 0;
  };

  const renderInventoryCard = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity
      style={[styles.inventoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.itemHeader}>
        <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.name || 'Unnamed Item'}
        </Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(item.condition) + '20' }]}>
            <Text style={[styles.conditionText, { color: getConditionColor(item.condition) }]}>
              {getConditionLabel(item.condition)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.category, { color: colors.primary }]}>
        {item.category?.name || 'Uncategorized'}
      </Text>

      {item.brand && (
        <Text style={[styles.brandModel, { color: colors.textSecondary }]}>
          {item.brand} {item.model && `- ${item.model}`}
        </Text>
      )}

      {item.serial_number && (
        <Text style={[styles.serialNumber, { color: colors.textSecondary }]}>
          Serial: {item.serial_number}
        </Text>
      )}

      <View style={styles.itemDetails}>
        {item.purchase_date && (
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Purchased: {formatDate(item.purchase_date)}
          </Text>
        )}

        {item.purchase_price && (
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Purchase Price: {formatCurrency(item.purchase_price)}
          </Text>
        )}

        {item.current_value && (
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Current Value: {formatCurrency(item.current_value)}
          </Text>
        )}

        {item.location && (
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Location: {item.location}
          </Text>
        )}

        {item.assigned_to && (
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Assigned to: {item.assigned_to.name}
          </Text>
        )}
      </View>

      {item.description && (
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
        Last Updated: {formatDate(item.last_updated)}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
        No Inventory Items Found
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        There are no inventory items matching your current filters.
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={[styles.errorTitle, { color: colors.error }]}>
        Unable to Load Inventory
      </Text>
      <Text style={[styles.errorText, { color: colors.textSecondary }]}>
        Please check your connection and try again.
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={handleRefresh}
      >
        <Text style={[styles.retryButtonText, { color: colors.surface }]}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (branchesLoading || academicYearsLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar
          title="Inventory Management"
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationsPress={() => router.push('/notifications')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading filters...
          </Text>
        </View>
        <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Inventory Management"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/notifications')}
      />

      {/* Global Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Text style={[styles.filtersLabel, { color: colors.textSecondary }]}>Filters:</Text>

            <ModalDropdownFilter
              label="Branch"
              items={branchOptions || []}
              selectedValue={selectedBranch || 0}
              onValueChange={(value) => setSelectedBranch(value === 0 ? 1 : value)}
              loading={branchesLoading}
              compact={true}
            />

            <ModalDropdownFilter
              label="Academic Year"
              items={academicYearOptions || []}
              selectedValue={selectedAcademicYear || 0}
              onValueChange={(value) => setSelectedAcademicYear(value === 0 ? 1 : value)}
              loading={academicYearsLoading}
              compact={true}
            />

            <ModalDropdownFilter
              label="Category"
              items={categoryOptions}
              selectedValue={selectedCategory || 0}
              onValueChange={(value) => setSelectedCategory(value === 0 ? null : value)}
              loading={categoriesLoading}
              compact={true}
            />

            <ModalDropdownFilter
              label="Condition"
              items={conditionOptions}
              selectedValue={getSelectedConditionValue()}
              onValueChange={(value) => setSelectedCondition(conditionMapping[value])}
              compact={true}
            />

            <ModalDropdownFilter
              label="Status"
              items={statusOptions}
              selectedValue={getSelectedStatusValue()}
              onValueChange={(value) => setSelectedStatus(statusMapping[value])}
              compact={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {inventoryLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading inventory...
            </Text>
          </View>
        ) : inventoryError ? (
          renderErrorState()
        ) : (
          <FlatList
            data={inventoryItems}
            renderItem={renderInventoryCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={inventoryLoading}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  inventoryCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 70,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 70,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  category: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  brandModel: {
    fontSize: 14,
    marginBottom: 4,
  },
  serialNumber: {
    fontSize: 12,
    marginBottom: 8,
  },
  itemDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  lastUpdated: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
