
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { 
  useExpenditure,
  useBranches,
  useAcademicYears 
} from '@/hooks/useApi';
import { apiService } from '@/api/apiService';

interface ExpenditureItem {
  id: number;
  category: string;
  expence_title: string;
  description: string;
  amount: string;
  date: string;
  paid_to: string;
  payment_mode: string;
  status: string;
  bill_image?: string;
  created_at: string;
  branch: number;
  academic_year: number;
}

const categories = [
  'stationery',
  'transport',
  'utilities',
  'maintenance',
  'salary',
  'equipment',
  'food',
  'supplies',
  'other'
];

const paymentModes = [
  'cash',
  'bank_transfer',
  'cheque',
  'upi',
  'card',
  'other'
];

const statusOptions = [
  'pending',
  'paid',
  'cancelled'
];

export default function SchoolExpenditureScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [expenditureModalVisible, setExpenditureModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedExpenditure, setSelectedExpenditure] = useState<ExpenditureItem | null>(null);
  const [editingExpenditure, setEditingExpenditure] = useState<ExpenditureItem | null>(null);

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Form state
  const [expenditureForm, setExpenditureForm] = useState({
    expence_title: '',
    category: '',
    description: '',
    amount: '',
    date: '',
    paid_to: '',
    payment_mode: '',
    status: 'pending',
    bill_image: '',
  });

  // Fetch data with filters
  const expenditureParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    ...(selectedCategory !== 'all' && { category: selectedCategory }),
    ...(selectedStatus !== 'all' && { status: selectedStatus }),
    ...(dateFilter && { date: dateFilter }),
  }), [selectedBranch, selectedAcademicYear, selectedCategory, selectedStatus, dateFilter]);

  const { data: expenditures, loading: expendituresLoading, error: expendituresError, refetch: refetchExpenditures } = useExpenditure(expenditureParams);
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears();

  // Filter expenditures based on search
  const filteredExpenditures = useMemo(() => {
    if (!expenditures) return [];
    
    return expenditures.filter((expenditure: ExpenditureItem) =>
      expenditure.expence_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expenditure.paid_to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expenditure.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [expenditures, searchQuery]);

  const handleViewDetails = (expenditure: ExpenditureItem) => {
    setSelectedExpenditure(expenditure);
    setDetailsModalVisible(true);
  };

  const handleAddExpenditure = () => {
    setEditingExpenditure(null);
    setExpenditureForm({
      expence_title: '',
      category: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paid_to: '',
      payment_mode: '',
      status: 'pending',
      bill_image: '',
    });
    setExpenditureModalVisible(true);
  };

  const handleEditExpenditure = (expenditure: ExpenditureItem) => {
    setEditingExpenditure(expenditure);
    setExpenditureForm({
      expence_title: expenditure.expence_title,
      category: expenditure.category,
      description: expenditure.description,
      amount: expenditure.amount,
      date: expenditure.date,
      paid_to: expenditure.paid_to,
      payment_mode: expenditure.payment_mode,
      status: expenditure.status,
      bill_image: expenditure.bill_image || '',
    });
    setExpenditureModalVisible(true);
  };

  const handleSaveExpenditure = async () => {
    try {
      if (!expenditureForm.expence_title || !expenditureForm.category || !expenditureForm.amount) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const formData = {
        ...expenditureForm,
        amount: parseFloat(expenditureForm.amount),
        branch: selectedBranch,
        academic_year: selectedAcademicYear,
      };

      if (editingExpenditure) {
        await apiService.updateExpenditure(editingExpenditure.id, formData);
      } else {
        await apiService.createExpenditure(formData);
      }

      setExpenditureModalVisible(false);
      refetchExpenditures();
      Alert.alert('Success', `Expenditure ${editingExpenditure ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error('Error saving expenditure:', error);
      Alert.alert('Error', `Failed to ${editingExpenditure ? 'update' : 'add'} expenditure`);
    }
  };

  const handleDeleteExpenditure = async (expenditure: ExpenditureItem) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${expenditure.expence_title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteExpenditure(expenditure.id);
              refetchExpenditures();
              Alert.alert('Success', 'Expenditure deleted successfully');
            } catch (error) {
              console.error('Error deleting expenditure:', error);
              Alert.alert('Error', 'Failed to delete expenditure');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      default: return colors.textSecondary;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'stationery': return '📚';
      case 'transport': return '🚌';
      case 'utilities': return '💡';
      case 'maintenance': return '🔧';
      case 'salary': return '💰';
      case 'equipment': return '🖥️';
      case 'food': return '🍽️';
      case 'supplies': return '📦';
      default: return '📋';
    }
  };

  const renderFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={styles.filtersHeader}
        onPress={() => setFiltersVisible(!filtersVisible)}
      >
        <Text style={[styles.filtersTitle, { color: colors.textPrimary }]}>
          Filters
        </Text>
        <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
          {filtersVisible ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {filtersVisible && (
        <View style={styles.filtersContent}>
          <TextInput
            style={[styles.searchInput, { 
              backgroundColor: colors.background, 
              borderColor: colors.border,
              color: colors.textPrimary 
            }]}
            placeholder="Search by title, vendor, or category..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Branch</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {branches?.map((branch: any) => (
                  <TouchableOpacity
                    key={branch.id}
                    style={[
                      styles.filterChip,
                      { 
                        borderColor: colors.border,
                        backgroundColor: selectedBranch === branch.id ? colors.primary : 'transparent'
                      }
                    ]}
                    onPress={() => setSelectedBranch(branch.id)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: selectedBranch === branch.id ? '#FFFFFF' : colors.textPrimary }
                    ]}>
                      {branch.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Academic Year</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {academicYears?.map((year: any) => (
                  <TouchableOpacity
                    key={year.id}
                    style={[
                      styles.filterChip,
                      { 
                        borderColor: colors.border,
                        backgroundColor: selectedAcademicYear === year.id ? colors.primary : 'transparent'
                      }
                    ]}
                    onPress={() => setSelectedAcademicYear(year.id)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: selectedAcademicYear === year.id ? '#FFFFFF' : colors.textPrimary }
                    ]}>
                      {year.year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    { 
                      borderColor: colors.border,
                      backgroundColor: selectedCategory === 'all' ? colors.primary : 'transparent'
                    }
                  ]}
                  onPress={() => setSelectedCategory('all')}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: selectedCategory === 'all' ? '#FFFFFF' : colors.textPrimary }
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterChip,
                      { 
                        borderColor: colors.border,
                        backgroundColor: selectedCategory === category ? colors.primary : 'transparent'
                      }
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: selectedCategory === category ? '#FFFFFF' : colors.textPrimary }
                    ]}>
                      {getCategoryIcon(category)} {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    { 
                      borderColor: colors.border,
                      backgroundColor: selectedStatus === 'all' ? colors.primary : 'transparent'
                    }
                  ]}
                  onPress={() => setSelectedStatus('all')}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: selectedStatus === 'all' ? '#FFFFFF' : colors.textPrimary }
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                {statusOptions.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      { 
                        borderColor: colors.border,
                        backgroundColor: selectedStatus === status ? colors.primary : 'transparent'
                      }
                    ]}
                    onPress={() => setSelectedStatus(status)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: selectedStatus === status ? '#FFFFFF' : colors.textPrimary }
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Date</Text>
              <TextInput
                style={[styles.dateInput, { 
                  backgroundColor: colors.background, 
                  borderColor: colors.border,
                  color: colors.textPrimary 
                }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                value={dateFilter}
                onChangeText={setDateFilter}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderExpenditureCard = (expenditure: ExpenditureItem) => (
    <TouchableOpacity
      key={expenditure.id}
      style={[styles.expenditureCard, { 
        backgroundColor: colors.surface,
        borderColor: colors.border 
      }]}
      onPress={() => handleViewDetails(expenditure)}
    >
      <View style={styles.expenditureHeader}>
        <View style={styles.expenditureInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.categoryIcon}>
              {getCategoryIcon(expenditure.category)}
            </Text>
            <Text style={[styles.expenditureTitle, { color: colors.textPrimary }]}>
              {expenditure.expence_title}
            </Text>
          </View>
          <Text style={[styles.expenditureVendor, { color: colors.textSecondary }]}>
            Paid to: {expenditure.paid_to}
          </Text>
          <Text style={[styles.expenditureDate, { color: colors.textSecondary }]}>
            {formatDate(expenditure.date)}
          </Text>
        </View>
        <View style={styles.expenditureAmount}>
          <Text style={[styles.amountText, { color: colors.textPrimary }]}>
            {formatCurrency(expenditure.amount)}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(expenditure.status) }
          ]}>
            <Text style={styles.statusText}>{expenditure.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.expenditureDetails}>
        <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
          Category: {expenditure.category}
        </Text>
        <Text style={[styles.paymentModeText, { color: colors.textSecondary }]}>
          Payment: {expenditure.payment_mode}
        </Text>
      </View>

      {expenditure.description && (
        <Text style={[styles.descriptionText, { color: colors.textSecondary }]} numberOfLines={2}>
          {expenditure.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (expendituresLoading && !expenditures) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar
          title="School Expenditure"
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationsPress={() => router.push('/(tabs)/notifications')}
          onSettingsPress={() => router.push('/(tabs)/settings')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading expenditures...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="School Expenditure"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {renderFilters()}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddExpenditure}
        >
          <Text style={styles.addButtonText}>+ Add Expenditure</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={expendituresLoading}
            onRefresh={refetchExpenditures}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {expendituresError ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
              Error loading expenditures: {expendituresError}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={refetchExpenditures}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredExpenditures.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No expenditures match your search' : 'No expenditures found'}
            </Text>
          </View>
        ) : (
          <View style={styles.expendituresList}>
            {filteredExpenditures.map(renderExpenditureCard)}
          </View>
        )}
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Expenditure Details
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedExpenditure && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>
                    {selectedExpenditure.expence_title}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(selectedExpenditure.status) }
                  ]}>
                    <Text style={styles.statusText}>{selectedExpenditure.status}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Amount:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {formatCurrency(selectedExpenditure.amount)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Category:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {getCategoryIcon(selectedExpenditure.category)} {selectedExpenditure.category}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {formatDate(selectedExpenditure.date)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Paid to:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {selectedExpenditure.paid_to}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Payment Mode:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {selectedExpenditure.payment_mode}
                  </Text>
                </View>

                {selectedExpenditure.description && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Description:</Text>
                    <Text style={[styles.descriptionDetail, { color: colors.textPrimary }]}>
                      {selectedExpenditure.description}
                    </Text>
                  </View>
                )}

                {selectedExpenditure.bill_image && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Bill Image:</Text>
                    <Image
                      source={{ uri: selectedExpenditure.bill_image }}
                      style={styles.billImage}
                      resizeMode="contain"
                    />
                  </View>
                )}

                <View style={styles.actionButtonsModal}>
                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      setDetailsModalVisible(false);
                      handleEditExpenditure(selectedExpenditure);
                    }}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: '#FF6B6B' }]}
                    onPress={() => {
                      setDetailsModalVisible(false);
                      handleDeleteExpenditure(selectedExpenditure);
                    }}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Add/Edit Expenditure Modal */}
      <Modal
        visible={expenditureModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setExpenditureModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {editingExpenditure ? 'Edit' : 'Add'} Expenditure
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setExpenditureModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Title *</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary 
                  }]}
                  placeholder="Enter expenditure title"
                  placeholderTextColor={colors.textSecondary}
                  value={expenditureForm.expence_title}
                  onChangeText={(text) => setExpenditureForm({ ...expenditureForm, expence_title: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Category *</Text>
                <View style={[styles.dropdown, { 
                  backgroundColor: colors.background,
                  borderColor: colors.border 
                }]}>
                  <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
                    {expenditureForm.category || 'Select Category'}
                  </Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Amount *</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary 
                  }]}
                  placeholder="Enter amount"
                  placeholderTextColor={colors.textSecondary}
                  value={expenditureForm.amount}
                  onChangeText={(text) => setExpenditureForm({ ...expenditureForm, amount: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Date *</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary 
                  }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  value={expenditureForm.date}
                  onChangeText={(text) => setExpenditureForm({ ...expenditureForm, date: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Paid To</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary 
                  }]}
                  placeholder="Enter vendor/recipient name"
                  placeholderTextColor={colors.textSecondary}
                  value={expenditureForm.paid_to}
                  onChangeText={(text) => setExpenditureForm({ ...expenditureForm, paid_to: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Payment Mode</Text>
                <View style={[styles.dropdown, { 
                  backgroundColor: colors.background,
                  borderColor: colors.border 
                }]}>
                  <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
                    {expenditureForm.payment_mode || 'Select Payment Mode'}
                  </Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Status</Text>
                <View style={[styles.dropdown, { 
                  backgroundColor: colors.background,
                  borderColor: colors.border 
                }]}>
                  <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
                    {expenditureForm.status}
                  </Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Description</Text>
                <TextInput
                  style={[styles.textArea, { 
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary 
                  }]}
                  placeholder="Enter description (optional)"
                  placeholderTextColor={colors.textSecondary}
                  value={expenditureForm.description}
                  onChangeText={(text) => setExpenditureForm({ ...expenditureForm, description: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveExpenditure}
              >
                <Text style={styles.saveButtonText}>
                  {editingExpenditure ? 'Update' : 'Save'} Expenditure
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  filtersContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 12,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  filterRow: {
    gap: 12,
  },
  filterGroup: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    width: 150,
  },
  actionButtons: {
    paddingHorizontal: 16,
    marginTop: 12,
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
    marginTop: 16,
  },
  expendituresList: {
    paddingHorizontal: 16,
  },
  expenditureCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  expenditureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  expenditureInfo: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  expenditureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  expenditureVendor: {
    fontSize: 14,
    marginBottom: 2,
  },
  expenditureDate: {
    fontSize: 12,
  },
  expenditureAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  expenditureDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  paymentModeText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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
  detailSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
  },
  descriptionDetail: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  billImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtonsModal: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    fontSize: 16,
  },
  dropdown: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  dropdownText: {
    fontSize: 16,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ModalDropdownFilter } from '@/components/ModalDropdownFilter';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSchoolExpenditure, useExpenseCategories } from '@/hooks/useApi';

interface Expenditure {
  id: number;
  category: {
    id: number;
    name: string;
  };
  description: string;
  amount: number;
  expense_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approved_by?: {
    id: number;
    name: string;
  };
  approved_date?: string;
  payment_method?: string;
  reference_number?: string;
  receipts: string[];
  branch: {
    id: number;
    name: string;
  };
  created_date: string;
}

export default function SchoolExpenditureScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Global filters
  const {
    selectedBranch,
    selectedAcademicYear,
    branches,
    academicYears,
    branchesLoading,
    academicYearsLoading
  } = useGlobalFilters();

  // Fetch data
  const { data: categories = [], loading: categoriesLoading } = useExpenseCategories();

  const expenditureParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    category: selectedCategory,
    status: selectedStatus,
    month: selectedMonth,
    year: selectedYear,
  }), [selectedBranch, selectedAcademicYear, selectedCategory, selectedStatus, selectedMonth, selectedYear]);

  const { 
    data: expenditures = [], 
    loading: expenditureLoading, 
    error: expenditureError,
    refetch: refetchExpenditure
  } = useSchoolExpenditure(expenditureParams);

  // Filter options
  const categoryOptions = useMemo(() => [
    { id: 0, name: 'All Categories' },
    ...categories.map((category: any) => ({
      id: category.id,
      name: category.name || 'Unnamed Category'
    }))
  ], [categories]);

  const statusOptions = useMemo(() => [
    { id: 0, name: 'All Status' },
    { id: 1, name: 'Pending' },
    { id: 2, name: 'Approved' },
    { id: 3, name: 'Rejected' },
    { id: 4, name: 'Paid' },
  ], []);

  const statusMapping = {
    0: null,
    1: 'pending',
    2: 'approved',
    3: 'rejected',
    4: 'paid'
  };

  const monthOptions = useMemo(() => [
    { id: 0, name: 'All Months' },
    { id: 1, name: 'January' },
    { id: 2, name: 'February' },
    { id: 3, name: 'March' },
    { id: 4, name: 'April' },
    { id: 5, name: 'May' },
    { id: 6, name: 'June' },
    { id: 7, name: 'July' },
    { id: 8, name: 'August' },
    { id: 9, name: 'September' },
    { id: 10, name: 'October' },
    { id: 11, name: 'November' },
    { id: 12, name: 'December' },
  ], []);

  // Generate year options (current year ± 5 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
      years.push({ id: year, name: year.toString() });
    }
    return years;
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning || '#f59e0b';
      case 'approved': return colors.info || '#3b82f6';
      case 'rejected': return colors.error || '#ef4444';
      case 'paid': return colors.success || '#10b981';
      default: return colors.textSecondary || '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '$0';
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getTotalExpenditure = () => {
    return expenditures.reduce((sum: number, exp: Expenditure) => sum + (exp.amount || 0), 0);
  };

  const handleRefresh = () => {
    refetchExpenditure();
  };

  const renderSummaryCard = () => {
    const totalAmount = getTotalExpenditure();
    const pendingCount = expenditures.filter((exp: Expenditure) => exp.status === 'pending').length;
    const approvedCount = expenditures.filter((exp: Expenditure) => exp.status === 'approved').length;
    const paidCount = expenditures.filter((exp: Expenditure) => exp.status === 'paid').length;

    return (
      <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Expenditure Summary</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {formatCurrency(totalAmount)}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Amount</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.warning }]}>
              {pendingCount}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pending</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.info }]}>
              {approvedCount}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Approved</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {paidCount}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Paid</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderExpenditureCard = ({ item }: { item: Expenditure }) => (
    <View style={[styles.expenditureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.expenditureHeader}>
        <View style={styles.expenditureInfo}>
          <Text style={[styles.categoryName, { color: colors.primary }]}>
            {item.category?.name || 'Uncategorized'}
          </Text>
          <Text style={[styles.amount, { color: colors.textPrimary }]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
        {item.description || 'No description'}
      </Text>

      <View style={styles.expenditureDetails}>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          Date: {formatDate(item.expense_date)}
        </Text>
        
        {item.payment_method && (
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Payment: {item.payment_method}
          </Text>
        )}
        
        {item.reference_number && (
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Ref: {item.reference_number}
          </Text>
        )}
        
        {item.approved_by && (
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Approved by: {item.approved_by.name} on {formatDate(item.approved_date || '')}
          </Text>
        )}
      </View>

      {item.receipts && item.receipts.length > 0 && (
        <Text style={[styles.receiptsText, { color: colors.info }]}>
          📎 {item.receipts.length} receipt(s) attached
        </Text>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
        No Expenditures Found
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        There are no school expenditures matching your current filters.
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={[styles.errorTitle, { color: colors.error }]}>
        Unable to Load Expenditures
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
          title="School Expenditure"
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationPress={() => router.push('/notifications')}
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
        title="School Expenditure"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationPress={() => router.push('/notifications')}
      />

      {/* Global Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Text style={[styles.filtersLabel, { color: colors.textSecondary }]}>Filters:</Text>
            
            <ModalDropdownFilter
              label="Branch"
              items={branches || []}
              selectedValue={selectedBranch}
              onValueChange={() => {}} // Read-only from global filters
              compact={true}
            />
            
            <ModalDropdownFilter
              label="Academic Year"
              items={academicYears || []}
              selectedValue={selectedAcademicYear}
              onValueChange={() => {}} // Read-only from global filters
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
              label="Status"
              items={statusOptions}
              selectedValue={selectedStatus ? Object.keys(statusMapping).find(key => statusMapping[key] === selectedStatus) || 0 : 0}
              onValueChange={(value) => setSelectedStatus(statusMapping[value])}
              compact={true}
            />
            
            <ModalDropdownFilter
              label="Year"
              items={yearOptions}
              selectedValue={selectedYear}
              onValueChange={(value) => setSelectedYear(value)}
              compact={true}
            />
            
            <ModalDropdownFilter
              label="Month"
              items={monthOptions}
              selectedValue={selectedMonth || 0}
              onValueChange={(value) => setSelectedMonth(value === 0 ? null : value)}
              compact={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {expenditureLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading expenditures...
            </Text>
          </View>
        ) : expenditureError ? (
          renderErrorState()
        ) : (
          <FlatList
            data={expenditures}
            renderItem={renderExpenditureCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={expenditureLoading}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
            ListHeaderComponent={expenditures.length > 0 ? renderSummaryCard : null}
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
  summaryCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    minWidth: '22%',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  expenditureCard: {
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
  expenditureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  expenditureInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  expenditureDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    marginBottom: 2,
  },
  receiptsText: {
    fontSize: 12,
    fontWeight: '500',
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
