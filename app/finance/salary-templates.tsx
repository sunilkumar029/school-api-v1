
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { 
  useSalaryTemplatesGrouped, 
  useSalaryCategories, 
  useAllUsersExceptStudents,
  useBranches,
  useAcademicYears 
} from '@/hooks/useApi';
import { apiService } from '@/api/apiService';

interface SalaryTemplate {
  category: string;
  amount: number;
}

interface Employee {
  user: number;
  full_name: string;
  department: string | null;
  templates: SalaryTemplate[];
}

interface SalaryCategory {
  id: number;
  name: string;
  is_deductible: boolean;
}

export default function SalaryTemplatesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [employeeDetailsModalVisible, setEmployeeDetailsModalVisible] = useState(false);
  const [salaryTemplateModalVisible, setSalaryTemplateModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<SalaryCategory | null>(null);

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [templateForm, setTemplateForm] = useState({
    user_id: '',
    category_id: '',
    amount: '',
    applicable: true,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    is_deductible: false,
  });

  // Fetch data
  const { data: employees, loading: employeesLoading, error: employeesError, refetch: refetchEmployees } = useSalaryTemplatesGrouped();
  const { data: categories, loading: categoriesLoading, refetch: refetchCategories } = useSalaryCategories();
  const { data: users, loading: usersLoading } = useAllUsersExceptStudents({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    limit: 200,
    is_active: true
  });
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears();

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    
    return employees.filter((employee: Employee) =>
      employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.department && employee.department.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [employees, searchQuery]);

  const handleViewEmployeeDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeDetailsModalVisible(true);
  };

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      user_id: '',
      category_id: '',
      amount: '',
      applicable: true,
    });
    setSalaryTemplateModalVisible(true);
  };

  const handleEditTemplate = (employee: Employee, template: SalaryTemplate) => {
    setEditingTemplate({ employee, template });
    setTemplateForm({
      user_id: employee.user.toString(),
      category_id: categories.find((cat: SalaryCategory) => cat.name === template.category)?.id.toString() || '',
      amount: template.amount.toString(),
      applicable: true,
    });
    setSalaryTemplateModalVisible(true);
  };

  const handleSaveTemplate = async () => {
    try {
      if (!templateForm.user_id || !templateForm.category_id || !templateForm.amount) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      await apiService.createSalaryTemplate({
        user_id: parseInt(templateForm.user_id),
        category_id: templateForm.category_id,
        amount: templateForm.amount,
        applicable: templateForm.applicable,
      });

      setSalaryTemplateModalVisible(false);
      refetchEmployees();
      Alert.alert('Success', 'Salary template saved successfully');
    } catch (error) {
      console.error('Error saving template:', error);
      Alert.alert('Error', 'Failed to save salary template');
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      is_deductible: false,
    });
    setCategoryModalVisible(true);
  };

  const handleEditCategory = (category: SalaryCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      is_deductible: category.is_deductible,
    });
    setCategoryModalVisible(true);
  };

  const handleSaveCategory = async () => {
    try {
      if (!categoryForm.name.trim()) {
        Alert.alert('Error', 'Please enter a category name');
        return;
      }

      if (editingCategory) {
        await apiService.updateSalaryCategory(editingCategory.id, categoryForm);
      } else {
        await apiService.createSalaryCategory(categoryForm);
      }

      setCategoryModalVisible(false);
      refetchCategories();
      Alert.alert('Success', `Category ${editingCategory ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', `Failed to ${editingCategory ? 'update' : 'create'} category`);
    }
  };

  const handleDeleteCategory = async (category: SalaryCategory) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete the category "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteSalaryCategory(category.id);
              refetchCategories();
              Alert.alert('Success', 'Category deleted successfully');
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
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
            placeholder="Search by name or department..."
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
          </View>
        </View>
      )}
    </View>
  );

  const renderEmployeeCard = (employee: Employee) => (
    <TouchableOpacity
      key={employee.user}
      style={[styles.employeeCard, { 
        backgroundColor: colors.surface,
        borderColor: colors.border 
      }]}
      onPress={() => handleViewEmployeeDetails(employee)}
    >
      <View style={styles.employeeHeader}>
        <View style={styles.employeeInfo}>
          <Text style={[styles.employeeName, { color: colors.textPrimary }]}>
            {employee.full_name}
          </Text>
          <Text style={[styles.employeeDepartment, { color: colors.textSecondary }]}>
            {employee.department || 'No Department'}
          </Text>
        </View>
        <View style={styles.templateCount}>
          <Text style={[styles.templateCountText, { color: colors.primary }]}>
            {employee.templates.length} templates
          </Text>
        </View>
      </View>

      <View style={styles.templatesPreview}>
        {employee.templates.slice(0, 3).map((template, index) => (
          <View key={index} style={styles.templatePreview}>
            <Text style={[styles.templateCategory, { color: colors.textSecondary }]}>
              {template.category}:
            </Text>
            <Text style={[styles.templateAmount, { color: colors.textPrimary }]}>
              {formatCurrency(template.amount)}
            </Text>
          </View>
        ))}
        {employee.templates.length > 3 && (
          <Text style={[styles.moreTemplates, { color: colors.textSecondary }]}>
            +{employee.templates.length - 3} more
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (employeesLoading && !employees) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar
          title="Salary Templates"
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationsPress={() => router.push('/(tabs)/notifications')}
          onSettingsPress={() => router.push('/(tabs)/settings')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading salary templates...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Salary Templates"
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
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleAddTemplate}
        >
          <Text style={styles.actionButtonText}>Add Template</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.secondary || colors.primary }]}
          onPress={handleAddCategory}
        >
          <Text style={styles.actionButtonText}>Manage Categories</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={employeesLoading}
            onRefresh={refetchEmployees}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {employeesError ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
              Error loading salary templates: {employeesError}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={refetchEmployees}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredEmployees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No employees match your search' : 'No salary templates found'}
            </Text>
          </View>
        ) : (
          <View style={styles.employeesList}>
            {filteredEmployees.map(renderEmployeeCard)}
          </View>
        )}
      </ScrollView>

      {/* Employee Details Modal */}
      <Modal
        visible={employeeDetailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEmployeeDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {selectedEmployee?.full_name}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEmployeeDetailsModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedEmployee && (
              <ScrollView style={styles.modalBody}>
                <Text style={[styles.departmentText, { color: colors.textSecondary }]}>
                  Department: {selectedEmployee.department || 'Not Assigned'}
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Salary Components
                </Text>

                {selectedEmployee.templates.map((template, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.templateDetailCard, { 
                      backgroundColor: colors.background,
                      borderColor: colors.border 
                    }]}
                    onPress={() => handleEditTemplate(selectedEmployee, template)}
                  >
                    <View style={styles.templateDetailRow}>
                      <Text style={[styles.templateDetailCategory, { color: colors.textPrimary }]}>
                        {template.category}
                      </Text>
                      <Text style={[styles.templateDetailAmount, { color: colors.textPrimary }]}>
                        {formatCurrency(template.amount)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {selectedEmployee.templates.length === 0 && (
                  <Text style={[styles.noTemplatesText, { color: colors.textSecondary }]}>
                    No salary templates configured
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Salary Template Modal */}
      <Modal
        visible={salaryTemplateModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSalaryTemplateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {editingTemplate ? 'Edit' : 'Add'} Salary Template
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSalaryTemplateModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Employee</Text>
                <View style={[styles.dropdown, { 
                  backgroundColor: colors.background,
                  borderColor: colors.border 
                }]}>
                  <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
                    {users?.find((user: any) => user.id.toString() === templateForm.user_id)?.first_name + ' ' + 
                     users?.find((user: any) => user.id.toString() === templateForm.user_id)?.last_name || 'Select Employee'}
                  </Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Category</Text>
                <View style={[styles.dropdown, { 
                  backgroundColor: colors.background,
                  borderColor: colors.border 
                }]}>
                  <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
                    {categories?.find((cat: SalaryCategory) => cat.id.toString() === templateForm.category_id)?.name || 'Select Category'}
                  </Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Amount</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary 
                  }]}
                  placeholder="Enter amount"
                  placeholderTextColor={colors.textSecondary}
                  value={templateForm.amount}
                  onChangeText={(text) => setTemplateForm({ ...templateForm, amount: text })}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveTemplate}
              >
                <Text style={styles.saveButtonText}>
                  {editingTemplate ? 'Update' : 'Save'} Template
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Salary Categories
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setCategoryModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Category Name</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary 
                  }]}
                  placeholder="Enter category name"
                  placeholderTextColor={colors.textSecondary}
                  value={categoryForm.name}
                  onChangeText={(text) => setCategoryForm({ ...categoryForm, name: text })}
                />
              </View>

              <TouchableOpacity
                style={[styles.checkboxContainer, { borderColor: colors.border }]}
                onPress={() => setCategoryForm({ 
                  ...categoryForm, 
                  is_deductible: !categoryForm.is_deductible 
                })}
              >
                <View style={[
                  styles.checkbox,
                  { 
                    backgroundColor: categoryForm.is_deductible ? colors.primary : 'transparent',
                    borderColor: colors.border 
                  }
                ]}>
                  {categoryForm.is_deductible && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>
                  Is Deductible
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveCategory}
              >
                <Text style={styles.saveButtonText}>
                  {editingCategory ? 'Update' : 'Add'} Category
                </Text>
              </TouchableOpacity>

              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>
                Existing Categories
              </Text>

              {categories?.map((category: SalaryCategory) => (
                <View
                  key={category.id}
                  style={[styles.categoryItem, { 
                    backgroundColor: colors.background,
                    borderColor: colors.border 
                  }]}
                >
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, { color: colors.textPrimary }]}>
                      {category.name}
                    </Text>
                    <Text style={[styles.categoryType, { color: colors.textSecondary }]}>
                      {category.is_deductible ? 'Deductible' : 'Non-deductible'}
                    </Text>
                  </View>
                  <View style={styles.categoryActions}>
                    <TouchableOpacity
                      style={[styles.editButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleEditCategory(category)}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.deleteButton, { backgroundColor: '#FF6B6B' }]}
                      onPress={() => handleDeleteCategory(category)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  employeesList: {
    paddingHorizontal: 16,
  },
  employeeCard: {
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
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  employeeDepartment: {
    fontSize: 14,
    marginTop: 2,
  },
  templateCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  templateCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  templatesPreview: {
    gap: 8,
  },
  templatePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateCategory: {
    fontSize: 14,
  },
  templateAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  moreTemplates: {
    fontSize: 12,
    fontStyle: 'italic',
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
  departmentText: {
    fontSize: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  templateDetailCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  templateDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateDetailCategory: {
    fontSize: 16,
    fontWeight: '600',
  },
  templateDetailAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noTemplatesText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 8,
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
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryType: {
    fontSize: 14,
    marginTop: 2,
  },
  categoryActions: {
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
import { useSalaryTemplates, useDepartments } from '@/hooks/useApi';

interface SalaryTemplate {
  id: number;
  name: string;
  description?: string;
  department: {
    id: number;
    name: string;
  };
  base_salary: number;
  allowances: {
    id: number;
    name: string;
    amount: number;
    type: 'fixed' | 'percentage';
  }[];
  deductions: {
    id: number;
    name: string;
    amount: number;
    type: 'fixed' | 'percentage';
  }[];
  is_active: boolean;
  created_date: string;
  modified_date: string;
}

export default function SalaryTemplatesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<boolean | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SalaryTemplate | null>(null);

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
  const { data: departments = [], loading: departmentsLoading } = useDepartments();

  const templatesParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    department: selectedDepartment,
    is_active: selectedStatus,
  }), [selectedBranch, selectedAcademicYear, selectedDepartment, selectedStatus]);

  const { 
    data: salaryTemplates = [], 
    loading: templatesLoading, 
    error: templatesError,
    refetch: refetchTemplates
  } = useSalaryTemplates(templatesParams);

  // Filter options
  const departmentOptions = useMemo(() => [
    { id: 0, name: 'All Departments' },
    ...departments.map((dept: any) => ({
      id: dept.id,
      name: dept.name || 'Unnamed Department'
    }))
  ], [departments]);

  const statusOptions = useMemo(() => [
    { id: 0, name: 'All Status' },
    { id: 1, name: 'Active' },
    { id: 2, name: 'Inactive' },
  ], []);

  const statusMapping = {
    0: null,
    1: true,
    2: false
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

  const calculateTotalSalary = (template: SalaryTemplate) => {
    const allowancesTotal = template.allowances?.reduce((sum, allowance) => {
      if (allowance.type === 'percentage') {
        return sum + (template.base_salary * allowance.amount / 100);
      }
      return sum + allowance.amount;
    }, 0) || 0;

    const deductionsTotal = template.deductions?.reduce((sum, deduction) => {
      if (deduction.type === 'percentage') {
        return sum + (template.base_salary * deduction.amount / 100);
      }
      return sum + deduction.amount;
    }, 0) || 0;

    return template.base_salary + allowancesTotal - deductionsTotal;
  };

  const handleRefresh = () => {
    refetchTemplates();
  };

  const handleTemplatePress = (template: SalaryTemplate) => {
    setSelectedTemplate(template);
  };

  const handleCreateTemplate = () => {
    router.push('/finance/add-salary-template');
  };

  const handleEditTemplate = (template: SalaryTemplate) => {
    router.push(`/finance/edit-salary-template?templateId=${template.id}`);
  };

  const renderTemplateCard = ({ item }: { item: SalaryTemplate }) => (
    <TouchableOpacity 
      style={[styles.templateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleTemplatePress(item)}
    >
      <View style={styles.templateHeader}>
        <Text style={[styles.templateName, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.name || 'Unnamed Template'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: item.is_active ? colors.success + '20' : colors.textSecondary + '20' }]}>
          <Text style={[styles.statusText, { color: item.is_active ? colors.success : colors.textSecondary }]}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <Text style={[styles.department, { color: colors.primary }]}>
        {item.department?.name || 'No Department'}
      </Text>

      {item.description && (
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.salaryDetails}>
        <View style={styles.salaryRow}>
          <Text style={[styles.salaryLabel, { color: colors.textSecondary }]}>Base Salary:</Text>
          <Text style={[styles.salaryValue, { color: colors.textPrimary }]}>
            {formatCurrency(item.base_salary)}
          </Text>
        </View>

        {item.allowances && item.allowances.length > 0 && (
          <View style={styles.salaryRow}>
            <Text style={[styles.salaryLabel, { color: colors.textSecondary }]}>Allowances:</Text>
            <Text style={[styles.salaryValue, { color: colors.success }]}>
              +{item.allowances.length} items
            </Text>
          </View>
        )}

        {item.deductions && item.deductions.length > 0 && (
          <View style={styles.salaryRow}>
            <Text style={[styles.salaryLabel, { color: colors.textSecondary }]}>Deductions:</Text>
            <Text style={[styles.salaryValue, { color: colors.error }]}>
              -{item.deductions.length} items
            </Text>
          </View>
        )}

        <View style={[styles.salaryRow, styles.totalRow]}>
          <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Net Salary:</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>
            {formatCurrency(calculateTotalSalary(item))}
          </Text>
        </View>
      </View>

      <View style={styles.templateFooter}>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
          Modified: {formatDate(item.modified_date)}
        </Text>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.primary }]}
          onPress={() => handleEditTemplate(item)}
        >
          <Text style={[styles.editButtonText, { color: colors.surface }]}>Edit</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
        No Salary Templates Found
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        Create salary templates to standardize compensation structures across departments.
      </Text>
      <TouchableOpacity 
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={handleCreateTemplate}
      >
        <Text style={[styles.createButtonText, { color: colors.surface }]}>
          Create Template
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={[styles.errorTitle, { color: colors.error }]}>
        Unable to Load Salary Templates
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
          title="Salary Templates"
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
        title="Salary Templates"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationPress={() => router.push('/notifications')}
        rightAction={{
          icon: 'plus',
          onPress: handleCreateTemplate
        }}
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
              label="Department"
              items={departmentOptions}
              selectedValue={selectedDepartment || 0}
              onValueChange={(value) => setSelectedDepartment(value === 0 ? null : value)}
              loading={departmentsLoading}
              compact={true}
            />
            
            <ModalDropdownFilter
              label="Status"
              items={statusOptions}
              selectedValue={selectedStatus !== null ? Object.keys(statusMapping).find(key => statusMapping[key] === selectedStatus) || 0 : 0}
              onValueChange={(value) => setSelectedStatus(statusMapping[value])}
              compact={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {templatesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading salary templates...
            </Text>
          </View>
        ) : templatesError ? (
          renderErrorState()
        ) : (
          <FlatList
            data={salaryTemplates}
            renderItem={renderTemplateCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={templatesLoading}
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
  templateCard: {
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
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
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
  department: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  salaryDetails: {
    marginBottom: 12,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  salaryLabel: {
    fontSize: 14,
  },
  salaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
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
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
