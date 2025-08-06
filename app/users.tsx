
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUsers, useGroups, useBranches, useAcademicYears } from '@/hooks/useApi';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  group: number;
  group_name: string;
  is_active: boolean;
  profile_image?: string;
  address?: any;
  standard?: any;
  department?: any;
  admission_number?: number;
  employee_id?: string;
  student_details?: any;
  guardians?: any[];
  section_name?: string;
  section_details?: any;
}

interface Group {
  id: number;
  name: string;
  permissions: any[];
}

interface Branch {
  id: number;
  name: string;
  is_active: boolean;
  address?: any;
}

interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

export default function UsersScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showAcademicYearDropdown, setShowAcademicYearDropdown] = useState(false);

  // Fetch branches and academic years without branch filter
  const { 
    data: branches, 
    loading: branchesLoading, 
    error: branchesError 
  } = useBranches({ is_active: true });

  const { 
    data: academicYears, 
    loading: academicYearsLoading, 
    error: academicYearsError 
  } = useAcademicYears();

  const { 
    data: groups, 
    loading: groupsLoading, 
    error: groupsError 
  } = useGroups();

  // Build users API params based on selected filters
  const usersParams = useMemo(() => {
    const params: any = {};
    if (selectedBranch) params.branch = selectedBranch;
    if (selectedGroup) params.group = selectedGroup;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (selectedAcademicYear) params.academic_year = selectedAcademicYear;
    return params;
  }, [selectedBranch, selectedGroup, searchQuery, selectedAcademicYear]);

  const { 
    data: users, 
    loading: usersLoading, 
    error: usersError, 
    refetch: refetchUsers 
  } = useUsers(selectedBranch ? usersParams : null); // Only fetch if branch is selected

  // Set default branch and academic year on initial load
  useEffect(() => {
    if (branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches]);

  useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYear) {
      setSelectedAcademicYear(academicYears[0].id);
    }
  }, [academicYears]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchUsers();
    } catch (error) {
      console.error('Error refreshing users:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleUserPress = (selectedUser: User) => {
    Alert.alert(
      `${selectedUser.first_name} ${selectedUser.last_name}`,
      `Email: ${selectedUser.email}\n` +
      `Group: ${selectedUser.group_name}\n` +
      `Status: ${selectedUser.is_active ? 'Active' : 'Inactive'}\n` +
      `${selectedUser.phone ? `Phone: ${selectedUser.phone}\n` : ''}` +
      `${selectedUser.admission_number ? `Admission No: ${selectedUser.admission_number}\n` : ''}` +
      `${selectedUser.employee_id ? `Employee ID: ${selectedUser.employee_id}\n` : ''}`,
      [
        { text: 'OK', style: 'default' },
        {
          text: 'View Details',
          onPress: () => {
            console.log('Navigate to user details:', selectedUser);
          }
        }
      ]
    );
  };

  const getSelectedBranchName = () => {
    const branch = branches.find(b => b.id === selectedBranch);
    return branch ? branch.name : 'Select Branch';
  };

  const getSelectedGroupName = () => {
    const group = groups.find(g => g.id === selectedGroup);
    return group ? group.name : 'All Groups';
  };

  const getSelectedAcademicYearName = () => {
    const year = academicYears.find(ay => ay.id === selectedAcademicYear);
    return year ? year.name : 'Select Academic Year';
  };

  const renderUserCard = ({ item: userData }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleUserPress(userData)}
      activeOpacity={0.7}
    >
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {userData.first_name} {userData.last_name}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {userData.email}
          </Text>
          {userData.phone && (
            <Text style={[styles.userPhone, { color: colors.textSecondary }]}>
              📞 {userData.phone}
            </Text>
          )}
        </View>
        <View style={styles.userBadges}>
          <View style={[
            styles.groupBadge,
            { backgroundColor: colors.primary + '20' }
          ]}>
            <Text style={[styles.groupBadgeText, { color: colors.primary }]}>
              {userData.group_name}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: userData.is_active ? '#E8F5E8' : '#FFEBEE' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: userData.is_active ? '#2E7D32' : '#C62828' }
            ]}>
              {userData.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.userDetails}>
        {userData.admission_number && (
          <Text style={[styles.userDetail, { color: colors.textSecondary }]}>
            🎓 Admission: {userData.admission_number}
          </Text>
        )}
        {userData.employee_id && (
          <Text style={[styles.userDetail, { color: colors.textSecondary }]}>
            💼 Employee ID: {userData.employee_id}
          </Text>
        )}
        {userData.section_name && (
          <Text style={[styles.userDetail, { color: colors.textSecondary }]}>
            📚 Section: {userData.section_name}
          </Text>
        )}
        {userData.standard?.name && (
          <Text style={[styles.userDetail, { color: colors.textSecondary }]}>
            📖 Standard: {userData.standard.name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderDropdownItem = (item: any, onSelect: (id: number) => void, isSelected: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.dropdownItem,
        { backgroundColor: isSelected ? colors.primary + '20' : colors.surface }
      ]}
      onPress={() => onSelect(item.id)}
    >
      <Text style={[
        styles.dropdownItemText,
        { color: isSelected ? colors.primary : colors.textPrimary }
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const isLoading = usersLoading || branchesLoading || groupsLoading || academicYearsLoading;
  const hasError = usersError || branchesError || groupsError || academicYearsError;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Users Management"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Filters Section */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
        {/* Branch Dropdown */}
        <View style={styles.filterItem}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Branch *</Text>
          <TouchableOpacity
            style={[styles.dropdown, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              setShowBranchDropdown(!showBranchDropdown);
              setShowGroupDropdown(false);
              setShowAcademicYearDropdown(false);
            }}
          >
            <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
              {getSelectedBranchName()}
            </Text>
            <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>
              {showBranchDropdown ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          {showBranchDropdown && (
            <View style={[styles.dropdownList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {branches.map(branch => 
                  renderDropdownItem(
                    branch, 
                    (id) => {
                      setSelectedBranch(id);
                      setShowBranchDropdown(false);
                    },
                    selectedBranch === branch.id
                  )
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Academic Year Dropdown */}
        <View style={styles.filterItem}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Academic Year</Text>
          <TouchableOpacity
            style={[styles.dropdown, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              setShowAcademicYearDropdown(!showAcademicYearDropdown);
              setShowBranchDropdown(false);
              setShowGroupDropdown(false);
            }}
          >
            <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
              {getSelectedAcademicYearName()}
            </Text>
            <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>
              {showAcademicYearDropdown ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          {showAcademicYearDropdown && (
            <View style={[styles.dropdownList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {academicYears.map(year => 
                  renderDropdownItem(
                    year, 
                    (id) => {
                      setSelectedAcademicYear(id);
                      setShowAcademicYearDropdown(false);
                    },
                    selectedAcademicYear === year.id
                  )
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Group Filter Dropdown */}
        <View style={styles.filterItem}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Filter by Group</Text>
          <TouchableOpacity
            style={[styles.dropdown, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              setShowGroupDropdown(!showGroupDropdown);
              setShowBranchDropdown(false);
              setShowAcademicYearDropdown(false);
            }}
          >
            <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
              {getSelectedGroupName()}
            </Text>
            <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>
              {showGroupDropdown ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          {showGroupDropdown && (
            <View style={[styles.dropdownList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    { backgroundColor: !selectedGroup ? colors.primary + '20' : colors.surface }
                  ]}
                  onPress={() => {
                    setSelectedGroup(null);
                    setShowGroupDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    { color: !selectedGroup ? colors.primary : colors.textPrimary }
                  ]}>
                    All Groups
                  </Text>
                </TouchableOpacity>
                {groups.map(group => 
                  renderDropdownItem(
                    group, 
                    (id) => {
                      setSelectedGroup(id);
                      setShowGroupDropdown(false);
                    },
                    selectedGroup === group.id
                  )
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Search Input */}
        <View style={styles.filterItem}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Search Users</Text>
          <TextInput
            style={[styles.searchInput, { 
              backgroundColor: colors.background, 
              borderColor: colors.border,
              color: colors.textPrimary 
            }]}
            placeholder="Search by name, email, phone..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {!selectedBranch ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Please select a branch to view users
            </Text>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading users...
            </Text>
          </View>
        ) : hasError ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
              Failed to load users. Please check your connection and try again.
            </Text>
            <TouchableOpacity
              onPress={handleRefresh}
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserCard}
            keyExtractor={(item) => item.id.toString()}
            style={styles.usersList}
            contentContainerStyle={styles.usersListContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {searchQuery || selectedGroup 
                    ? "No users match your search criteria"
                    : "No users found in this branch"
                  }
                </Text>
              </View>
            )}
            ListHeaderComponent={() => users.length > 0 ? (
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsText, { color: colors.textPrimary }]}>
                  {users.length} user{users.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            ) : null}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterItem: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    marginLeft: 8,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownItemText: {
    fontSize: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 44,
  },
  content: {
    flex: 1,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  usersList: {
    flex: 1,
  },
  usersListContent: {
    padding: 16,
  },
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
  },
  userBadges: {
    alignItems: 'flex-end',
  },
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  groupBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userDetails: {
    marginTop: 8,
  },
  userDetail: {
    fontSize: 14,
    marginBottom: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
