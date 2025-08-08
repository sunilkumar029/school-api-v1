
import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { SideDrawer } from "@/components/SideDrawer";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUsers, useBranches, useGroups, useAcademicYears } from "@/hooks/useApi";
import { useGlobalFilters } from "@/contexts/GlobalFiltersContext";
import { ModalDropdownFilter } from "@/components/ModalDropdownFilter";
import Modal from "react-native-modal";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  group: {
    id: number;
    name: string;
  };
  branch?: {
    id: number;
    name: string;
  };
  created: string;
  is_staff: boolean;
  phone?: string;
  date_joined?: string;
  last_login?: string;
}

interface Branch {
  id: number;
  name: string;
  address: any;
}

interface Group {
  id: number;
  name: string;
}

interface AcademicYear {
  id: number;
  year: string;
  is_active: boolean;
}

export default function UsersScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailVisible, setUserDetailVisible] = useState(false);

  // Filter states (temporary until applied)
  const [tempSelectedBranch, setTempSelectedBranch] = useState<number | null>(null);
  const [tempSelectedGroup, setTempSelectedGroup] = useState<number | null>(null);
  const [tempSelectedAcademicYear, setTempSelectedAcademicYear] = useState<number | null>(null);

  // Applied filter states
  const [appliedBranch, setAppliedBranch] = useState<number | null>(null);
  const [appliedGroup, setAppliedGroup] = useState<number | null>(null);
  const [appliedAcademicYear, setAppliedAcademicYear] = useState<number | null>(null);

  // Fetch data with proper error handling
  const {
    data: branches,
    loading: branchesLoading,
    error: branchesError,
    refetch: refetchBranches
  } = useBranches();

  const {
    data: groups,
    loading: groupsLoading,
    error: groupsError,
    refetch: refetchGroups
  } = useGroups();

  const {
    data: academicYears,
    loading: academicYearsLoading,
    error: academicYearsError,
    refetch: refetchAcademicYears
  } = useAcademicYears();

  // Build user params based on applied filters
  const userParams = useMemo(() => {
    const params: any = { limit: 50 };
    if (appliedBranch) params.branch = appliedBranch;
    if (appliedGroup) params.group = appliedGroup;
    if (appliedAcademicYear) params.academic_year = appliedAcademicYear;
    return params;
  }, [appliedBranch, appliedGroup, appliedAcademicYear]);

  const {
    data: users,
    loading: usersLoading,
    error: usersError,
    refetch: refetchUsers
  } = useUsers(userParams);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];

    return users.filter((user: User) => {
      const searchTerm = searchQuery.toLowerCase();
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const email = user.email?.toLowerCase() || '';
      const groupName = user.group?.name?.toLowerCase() || '';

      return fullName.includes(searchTerm) || 
             email.includes(searchTerm) || 
             groupName.includes(searchTerm);
    });
  }, [users, searchQuery]);

  const handleRefreshAll = useCallback(() => {
    refetchBranches();
    refetchGroups();
    refetchAcademicYears();
    refetchUsers();
  }, [refetchBranches, refetchGroups, refetchAcademicYears, refetchUsers]);

  const handleApplyFilters = useCallback(() => {
    setAppliedBranch(tempSelectedBranch);
    setAppliedGroup(tempSelectedGroup);
    setAppliedAcademicYear(tempSelectedAcademicYear);
  }, [tempSelectedBranch, tempSelectedGroup, tempSelectedAcademicYear]);

  const handleClearFilters = useCallback(() => {
    setTempSelectedBranch(null);
    setTempSelectedGroup(null);
    setTempSelectedAcademicYear(null);
    setAppliedBranch(null);
    setAppliedGroup(null);
    setAppliedAcademicYear(null);
  }, []);

  const hasFiltersChanged = useMemo(() => {
    return tempSelectedBranch !== appliedBranch ||
      tempSelectedGroup !== appliedGroup ||
      tempSelectedAcademicYear !== appliedAcademicYear;
  }, [tempSelectedBranch, appliedBranch, tempSelectedGroup, appliedGroup, tempSelectedAcademicYear, appliedAcademicYear]);

  const handleUserPress = useCallback((user: User) => {
    setSelectedUser(user);
    setUserDetailVisible(true);
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
          {/* Branch Filter */}
          <View style={styles.filterRow}>
            <ModalDropdownFilter
              label="Branch"
              items={[{ id: null, name: 'All Branches' }, ...(branches?.map((branch: Branch) => ({ id: branch.id, name: branch.name })) || [])]}
              selectedValue={tempSelectedBranch}
              onValueChange={setTempSelectedBranch}
              compact={false}
            />
          </View>

          {/* Group Filter */}
          <View style={styles.filterRow}>
            <ModalDropdownFilter
              label="Group"
              items={[{ id: null, name: 'All Groups' }, ...(groups?.map((group: Group) => ({ id: group.id, name: group.name })) || [])]}
              selectedValue={tempSelectedGroup}
              onValueChange={setTempSelectedGroup}
              compact={false}
            />
          </View>

          {/* Academic Year Filter */}
          <View style={styles.filterRow}>
            <ModalDropdownFilter
              label="Academic Year"
              items={[{ id: null, name: 'All Years' }, ...(academicYears?.map((year: AcademicYear) => ({ id: year.id, name: year.year })) || [])]}
              selectedValue={tempSelectedAcademicYear}
              onValueChange={setTempSelectedAcademicYear}
              compact={false}
            />
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

  const renderUserCard = (user: User) => (
    <TouchableOpacity
      key={user.id}
      style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleUserPress(user)}
    >
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {user.first_name} {user.last_name}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user.email}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: user.is_active ? '#E8F5E8' : '#FFEBEE' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: user.is_active ? '#4CAF50' : '#F44336' }
          ]}>
            {user.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.userDetails}>
        <Text style={[styles.userGroup, { color: colors.textSecondary }]}>
          👥 {user.group?.name || 'No Group'}
        </Text>
        {user.branch && (
          <Text style={[styles.userBranch, { color: colors.textSecondary }]}>
            🏢 {user.branch.name}
          </Text>
        )}
        <Text style={[styles.userRole, { color: colors.textSecondary }]}>
          👤 {user.is_staff ? 'Staff' : 'Student'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderUserDetailModal = () => (
    <Modal
      isVisible={userDetailVisible}
      onBackdropPress={() => setUserDetailVisible(false)}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.5}
    >
      <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            User Details
          </Text>
          <TouchableOpacity
            onPress={() => setUserDetailVisible(false)}
            style={styles.closeButton}
          >
            <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>
              ✕
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          {selectedUser && (
            <View style={styles.userDetailContent}>
              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                  Personal Information
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Name:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {selectedUser.first_name} {selectedUser.last_name}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Email:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {selectedUser.email}
                  </Text>
                </View>
                {selectedUser.phone && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Phone:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                      {selectedUser.phone}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                  Organization Details
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Role:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {selectedUser.is_staff ? 'Staff' : 'Student'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Group:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {selectedUser.group?.name || 'No Group'}
                  </Text>
                </View>
                {selectedUser.branch && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Branch:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                      {selectedUser.branch.name}
                    </Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Status:
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: selectedUser.is_active ? '#E8F5E8' : '#FFEBEE' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: selectedUser.is_active ? '#4CAF50' : '#F44336' }
                    ]}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                  Account Information
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Member Since:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {selectedUser.created ? new Date(selectedUser.created).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
                {selectedUser.last_login && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Last Login:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                      {new Date(selectedUser.last_login).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  const renderErrorState = () => {
    const hasAnyError = branchesError || groupsError || academicYearsError || usersError;
    if (!hasAnyError) return null;

    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: '#F44336' }]}>
          {usersError || "Some data failed to load"}
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

  const isLoading = branchesLoading || groupsLoading || academicYearsLoading || usersLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Users"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <ScrollView>
        <TouchableOpacity onPress={() => setFiltersExpanded(!filtersExpanded)}>
          <Text style={{ color: colors.textPrimary }}>Filters</Text>
        </TouchableOpacity>
        {filtersExpanded && (
          <View>
            {/* Branch Filter */}
            <Text>Branches</Text>
            <ScrollView horizontal>
              {branches?.map(branch => (
                <TouchableOpacity
                  key={branch.id}
                  onPress={() => setTempSelectedBranch(branch.id)}
                >
                  <Text style={{ color: colors.textPrimary }}>{branch.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Group Filter */}
            <Text>Groups</Text>
            <ScrollView horizontal>
              {groups?.map(group => (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => setTempSelectedGroup(group.id)}
                >
                  <Text style={{ color: colors.textPrimary }}>{group.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Academic Year Filter */}
            <Text>Academic Years</Text>
            <ScrollView horizontal>
              {academicYears?.map(year => (
                <TouchableOpacity
                  key={year.id}
                  onPress={() => setTempSelectedAcademicYear(year.id)}
                >
                  <Text style={{ color: colors.textPrimary }}>{year.year}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={handleApplyFilters}>
              <Text style={{ color: colors.primary }}>Apply Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearFilters}>
              <Text style={{ color: colors.primary }}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}
        {usersLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <View>
            {users?.map(user => (
              <Text key={user.id}>{`${user.first_name} ${user.last_name}`}</Text>
            ))}
          </View>
        )}
      </ScrollView>


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
          placeholder="Search users by name, email, or group..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      {renderFilterSection()}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Error State */}
        {renderErrorState()}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading users...
            </Text>
          </View>
        )}

        {/* Users List */}
        {!isLoading && filteredUsers.length === 0 && !usersError && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? "No users match your search criteria" : "No users found"}
            </Text>
          </View>
        )}

        {!isLoading && filteredUsers.length > 0 && (
          <View style={styles.usersList}>
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
            </Text>
            {filteredUsers.map(renderUserCard)}
          </View>
        )}
      </ScrollView>

      {/* User Detail Modal */}
      {renderUserDetailModal()}
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
  usersList: {
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "500",
  },
  userCard: {
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
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
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
  userDetails: {
    gap: 4,
  },
  userGroup: {
    fontSize: 14,
  },
  userBranch: {
    fontSize: 14,
  },
  userRole: {
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
  userDetailContent: {
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
