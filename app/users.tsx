
import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { SideDrawer } from "@/components/SideDrawer";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUsers, useBranches, useGroups, useAcademicYears } from "@/hooks/useApi";
import { useGlobalFilters } from "@/contexts/GlobalFiltersContext";
import { GlobalFilters } from "@/components/GlobalFilters";
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

interface Group {
  id: number;
  name: string;
}

export default function UsersScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailVisible, setUserDetailVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);

  const { selectedBranch, selectedAcademicYear } = useGlobalFilters();

  // Fetch data
  const {
    data: groups,
    loading: groupsLoading,
    error: groupsError,
    refetch: refetchGroups
  } = useGroups();

  // Build user params based on filters
  const userParams = useMemo(() => {
    const params: any = { limit: 100 };
    if (selectedBranch) params.branch = selectedBranch;
    if (selectedAcademicYear) params.academic_year = selectedAcademicYear;
    if (selectedGroup) params.group = selectedGroup;
    return params;
  }, [selectedBranch, selectedAcademicYear, selectedGroup]);

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
    refetchGroups();
    refetchUsers();
  }, [refetchGroups, refetchUsers]);

  const handleUserPress = useCallback((user: User) => {
    setSelectedUser(user);
    setUserDetailVisible(true);
  }, []);

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

  if (usersLoading && !users) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar
          title="Users"
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationsPress={() => router.push("/(tabs)/notifications")}
          onSettingsPress={() => router.push("/(tabs)/settings")}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading users...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Users"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <GlobalFilters />

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

      {/* Additional Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Text style={[styles.filtersLabel, { color: colors.textSecondary }]}>Filters:</Text>
            
            <ModalDropdownFilter
              label="Group"
              items={[{ id: null, name: 'All Groups' }, ...(groups?.map((group: Group) => ({ id: group.id, name: group.name })) || [])]}
              selectedValue={selectedGroup}
              onValueChange={setSelectedGroup}
              loading={groupsLoading}
              compact={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={usersLoading}
            onRefresh={handleRefreshAll}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {usersError && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: '#F44336' }]}>
              {usersError}
            </Text>
            <TouchableOpacity
              onPress={handleRefreshAll}
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!usersLoading && filteredUsers.length === 0 && !usersError && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? "No users match your search criteria" : "No users found"}
            </Text>
          </View>
        )}

        {!usersLoading && filteredUsers.length > 0 && (
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  filtersScroll: {
    flexDirection: 'row',
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
