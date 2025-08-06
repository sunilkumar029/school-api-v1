
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDepartments, useBranches, useAcademicYears } from '@/hooks/useApi';
import { Picker } from '@react-native-picker/picker';
import Modal from 'react-native-modal';

interface Department {
  id: number;
  name: string;
  department_type: 'Teaching' | 'Non-Teaching' | 'Both';
  is_active: boolean;
  staff_count: number;
  head_of_the_department?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    designation: string;
    department: string;
    branch: string;
    group: string;
  };
  branch: {
    id: number;
    name: string;
    address: any;
    is_active: boolean;
  };
  created: string;
  modified: string;
  access_to_all_users: boolean;
}

interface Branch {
  id: number;
  name: string;
  address: any;
  is_active: boolean;
}

interface AcademicYear {
  id: number;
  year: string;
  is_active: boolean;
}

export default function DepartmentScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [departmentDetailVisible, setDepartmentDetailVisible] = useState(false);

  // Filter states (temporary until applied)
  const [tempSelectedBranch, setTempSelectedBranch] = useState<number | null>(null);
  const [tempSelectedAcademicYear, setTempSelectedAcademicYear] = useState<number | null>(null);
  const [tempSelectedType, setTempSelectedType] = useState<string | null>(null);

  // Applied filter states
  const [appliedBranch, setAppliedBranch] = useState<number | null>(null);
  const [appliedAcademicYear, setAppliedAcademicYear] = useState<number | null>(null);
  const [appliedType, setAppliedType] = useState<string | null>(null);

  // Fetch data with proper error handling
  const { 
    data: branches, 
    loading: branchesLoading, 
    error: branchesError,
    refetch: refetchBranches 
  } = useBranches({ is_active: true });

  const { 
    data: academicYears, 
    loading: academicYearsLoading, 
    error: academicYearsError,
    refetch: refetchAcademicYears 
  } = useAcademicYears();

  // Build department params based on applied filters
  const departmentParams = useMemo(() => {
    const params: any = { limit: 50 };
    if (appliedBranch) params.branch = appliedBranch;
    if (appliedAcademicYear) params.academic_year = appliedAcademicYear;
    if (appliedType && appliedType !== 'All') params.department_type = appliedType;
    return params;
  }, [appliedBranch, appliedAcademicYear, appliedType]);

  const { 
    data: departments, 
    loading: departmentsLoading, 
    error: departmentsError,
    refetch: refetchDepartments 
  } = useDepartments(departmentParams);

  // Filter departments based on search query
  const filteredDepartments = useMemo(() => {
    if (!departments || !Array.isArray(departments)) return [];

    return departments.filter((dept: Department) => {
      const searchTerm = searchQuery.toLowerCase();
      const name = dept.name?.toLowerCase() || '';
      const type = dept.department_type?.toLowerCase() || '';
      const hodName = dept.head_of_the_department 
        ? `${dept.head_of_the_department.first_name} ${dept.head_of_the_department.last_name}`.toLowerCase()
        : '';

      return name.includes(searchTerm) || 
             type.includes(searchTerm) || 
             hodName.includes(searchTerm);
    });
  }, [departments, searchQuery]);

  const handleRefreshAll = useCallback(() => {
    refetchBranches();
    refetchAcademicYears();
    refetchDepartments();
  }, [refetchBranches, refetchAcademicYears, refetchDepartments]);

  const handleApplyFilters = useCallback(() => {
    setAppliedBranch(tempSelectedBranch);
    setAppliedAcademicYear(tempSelectedAcademicYear);
    setAppliedType(tempSelectedType);
  }, [tempSelectedBranch, tempSelectedAcademicYear, tempSelectedType]);

  const handleClearFilters = useCallback(() => {
    setTempSelectedBranch(null);
    setTempSelectedAcademicYear(null);
    setTempSelectedType(null);
    setAppliedBranch(null);
    setAppliedAcademicYear(null);
    setAppliedType(null);
  }, []);

  const hasFiltersChanged = useMemo(() => {
    return tempSelectedBranch !== appliedBranch ||
           tempSelectedAcademicYear !== appliedAcademicYear ||
           tempSelectedType !== appliedType;
  }, [tempSelectedBranch, appliedBranch, tempSelectedAcademicYear, appliedAcademicYear, tempSelectedType, appliedType]);

  const handleDepartmentPress = useCallback((department: Department) => {
    setSelectedDepartment(department);
    setDepartmentDetailVisible(true);
  }, []);

  const renderFilterSection = () => (
    <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={styles.filterHeader}
        onPress={() => setFiltersExpanded(!filtersExpanded)}
      >
        <Text style={[styles.filterTitle, { color: colors.textPrimary }]}>
          Filters
        </Text>
        <Text style={[styles.filterToggle, { color: colors.primary }]}>
          {filtersExpanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {filtersExpanded && (
        <View style={styles.filterContent}>
          {/* Branch Dropdown */}
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
              Branch:
            </Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Picker
                selectedValue={tempSelectedBranch}
                onValueChange={setTempSelectedBranch}
                style={[styles.picker, { color: colors.textPrimary }]}
                dropdownIconColor={colors.textSecondary}
              >
                <Picker.Item label="All Branches" value={null} />
                {branches?.map((branch: Branch) => (
                  <Picker.Item 
                    key={branch.id} 
                    label={branch.name} 
                    value={branch.id} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Academic Year Dropdown */}
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
              Academic Year:
            </Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Picker
                selectedValue={tempSelectedAcademicYear}
                onValueChange={setTempSelectedAcademicYear}
                style={[styles.picker, { color: colors.textPrimary }]}
                dropdownIconColor={colors.textSecondary}
              >
                <Picker.Item label="All Years" value={null} />
                {academicYears?.map((year: AcademicYear) => (
                  <Picker.Item 
                    key={year.id} 
                    label={year.year} 
                    value={year.id} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Department Type Dropdown */}
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
              Type:
            </Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Picker
                selectedValue={tempSelectedType}
                onValueChange={setTempSelectedType}
                style={[styles.picker, { color: colors.textPrimary }]}
                dropdownIconColor={colors.textSecondary}
              >
                <Picker.Item label="All Types" value={null} />
                <Picker.Item label="Teaching" value="Teaching" />
                <Picker.Item label="Non-Teaching" value="Non-Teaching" />
                <Picker.Item label="Both" value="Both" />
              </Picker>
            </View>
          </View>

          {/* Filter Action Buttons */}
          <View style={styles.filterActions}>
            <TouchableOpacity
              style={[styles.filterButton, styles.clearButton, { borderColor: colors.border }]}
              onPress={handleClearFilters}
            >
              <Text style={[styles.filterButtonText, { color: colors.textSecondary }]}>
                Clear
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton, 
                styles.applyButton, 
                { backgroundColor: hasFiltersChanged ? colors.primary : colors.border }
              ]}
              onPress={handleApplyFilters}
              disabled={!hasFiltersChanged}
            >
              <Text style={[styles.filterButtonText, { color: hasFiltersChanged ? '#FFFFFF' : colors.textSecondary }]}>
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderDepartmentCard = (department: Department) => (
    <TouchableOpacity
      key={department.id}
      style={[styles.departmentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleDepartmentPress(department)}
    >
      <View style={styles.departmentHeader}>
        <View style={styles.departmentInfo}>
          <Text style={[styles.departmentName, { color: colors.textPrimary }]}>
            {department.name}
          </Text>
          <Text style={[styles.departmentType, { color: colors.textSecondary }]}>
            📚 {department.department_type}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: department.is_active ? '#E8F5E8' : '#FFEBEE' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: department.is_active ? '#4CAF50' : '#F44336' }
          ]}>
            {department.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.departmentDetails}>
        <Text style={[styles.staffCount, { color: colors.textSecondary }]}>
          👥 {department.staff_count} Staff Members
        </Text>
        {department.branch && (
          <Text style={[styles.branchName, { color: colors.textSecondary }]}>
            🏢 {department.branch.name}
          </Text>
        )}
        {department.head_of_the_department && (
          <Text style={[styles.hodName, { color: colors.textSecondary }]}>
            👤 HOD: {department.head_of_the_department.first_name} {department.head_of_the_department.last_name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderDepartmentDetailModal = () => (
    <Modal
      isVisible={departmentDetailVisible}
      onBackdropPress={() => setDepartmentDetailVisible(false)}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.5}
    >
      <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            Department Details
          </Text>
          <TouchableOpacity
            onPress={() => setDepartmentDetailVisible(false)}
            style={styles.closeButton}
          >
            <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>
              ✕
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          {selectedDepartment && (
            <View style={styles.departmentDetailContent}>
              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                  Department Information
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Name:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {selectedDepartment.name}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Type:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {selectedDepartment.department_type}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Staff Count:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {selectedDepartment.staff_count}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Status:
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: selectedDepartment.is_active ? '#E8F5E8' : '#FFEBEE' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: selectedDepartment.is_active ? '#4CAF50' : '#F44336' }
                    ]}>
                      {selectedDepartment.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </View>

              {selectedDepartment.head_of_the_department && (
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                    Head of Department
                  </Text>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Name:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                      {selectedDepartment.head_of_the_department.first_name} {selectedDepartment.head_of_the_department.last_name}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Email:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                      {selectedDepartment.head_of_the_department.email}
                    </Text>
                  </View>
                  {selectedDepartment.head_of_the_department.phone && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                        Phone:
                      </Text>
                      <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                        {selectedDepartment.head_of_the_department.phone}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Designation:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                      {selectedDepartment.head_of_the_department.designation}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                  Branch Information
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Branch:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {selectedDepartment.branch.name}
                  </Text>
                </View>
                {selectedDepartment.branch.address && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Address:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                      {selectedDepartment.branch.address.street}, {selectedDepartment.branch.address.city}, {selectedDepartment.branch.address.state} - {selectedDepartment.branch.address.zip_code}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                  System Information
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Created:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {selectedDepartment.created ? new Date(selectedDepartment.created).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Last Modified:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {selectedDepartment.modified ? new Date(selectedDepartment.modified).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Access to All Users:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {selectedDepartment.access_to_all_users ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  const renderErrorState = () => {
    const hasAnyError = branchesError || academicYearsError || departmentsError;
    if (!hasAnyError) return null;

    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: '#F44336' }]}>
          {departmentsError || "Some data failed to load"}
        </Text>
        <TouchableOpacity
          onPress={handleRefreshAll}
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const isLoading = branchesLoading || academicYearsLoading || departmentsLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Departments"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          placeholder="Search departments by name, type, or HOD..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      {renderFilterSection()}

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefreshAll}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Error State */}
        {renderErrorState()}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading departments...
            </Text>
          </View>
        )}

        {/* Departments List */}
        {!isLoading && filteredDepartments.length === 0 && !departmentsError && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? "No departments match your search criteria" : "No departments found"}
            </Text>
          </View>
        )}

        {!isLoading && filteredDepartments.length > 0 && (
          <View style={styles.departmentsList}>
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              {filteredDepartments.length} department{filteredDepartments.length !== 1 ? 's' : ''} found
            </Text>
            {filteredDepartments.map(renderDepartmentCard)}
          </View>
        )}
      </ScrollView>

      {/* Department Detail Modal */}
      {renderDepartmentDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  filterContainer: {
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  filterToggle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    width: 100,
    fontWeight: "500",
  },
  pickerContainer: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  picker: {
    height: 44,
  },
  filterActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  filterButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButton: {
    borderWidth: 1,
  },
  applyButton: {
    // backgroundColor handled dynamically
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    margin: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  departmentsList: {
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "500",
  },
  departmentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  departmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  departmentInfo: {
    flex: 1,
  },
  departmentName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  departmentType: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  departmentDetails: {
    gap: 4,
  },
  staffCount: {
    fontSize: 14,
  },
  branchName: {
    fontSize: 14,
  },
  hodName: {
    fontSize: 14,
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalBody: {
    flex: 1,
  },
  departmentDetailContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    flex: 2,
    textAlign: "right",
  },
});
