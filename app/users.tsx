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
import { Picker } from "@react-native-picker/picker";

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
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);

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

  // Build user params based on selected filters
  const userParams = useMemo(() => {
    const params: any = { limit: 50 };
    if (selectedBranch) params.branch = selectedBranch;
    if (selectedGroup) params.group = selectedGroup;
    if (selectedAcademicYear) params.academic_year = selectedAcademicYear;
    return params;
  }, [selectedBranch, selectedGroup, selectedAcademicYear]);

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

  const renderFilterSection = () => (
    <View style={[styles.filterSection, { backgroundColor: colors.surface }]}>
      <Text style={[styles.filterTitle, { color: colors.textPrimary }]}>
        Filters
      </Text>

      {/* Branch Dropdown */}
      <View style={styles.filterRow}>
        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
          Branch:
        </Text>
        <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
          <Picker
            selectedValue={selectedBranch}
            onValueChange={setSelectedBranch}
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

      {/* Group Dropdown */}
      <View style={styles.filterRow}>
        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
          Group:
        </Text>
        <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
          <Picker
            selectedValue={selectedGroup}
            onValueChange={setSelectedGroup}
            style={[styles.picker, { color: colors.textPrimary }]}
            dropdownIconColor={colors.textSecondary}
          >
            <Picker.Item label="All Groups" value={null} />
            {groups?.map((group: Group) => (
              <Picker.Item 
                key={group.id} 
                label={group.name} 
                value={group.id} 
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
        <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
          <Picker
            selectedValue={selectedAcademicYear}
            onValueChange={setSelectedAcademicYear}
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
    </View>
  );

  const renderUserCard = (user: User) => (
    <TouchableOpacity
      key={user.id}
      style={[styles.userCard, { backgroundColor: colors.surface }]}
      onPress={() => {
        Alert.alert("User Details", `View details for ${user.first_name} ${user.last_name}`);
      }}
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
  filterSection: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    width: 80,
    fontWeight: "500",
  },
  pickerContainer: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  picker: {
    height: 40,
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
});