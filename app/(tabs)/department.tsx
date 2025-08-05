
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDepartments, useBranches } from '@/hooks/useApi';
import { apiService } from '@/api/apiService';

interface Department {
  id: number;
  name: string;
  department_type: string;
  description?: string;
  head_of_department?: string;
  is_active: boolean;
  branch?: any;
  created: string;
  modified: string;
}

interface Branch {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  address?: string;
}

export default function DepartmentScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'departments' | 'branches'>('departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { 
    data: departments, 
    loading: departmentsLoading, 
    error: departmentsError, 
    refetch: refetchDepartments 
  } = useDepartments({ 
    search: searchQuery,
    is_active: true,
    ordering: 'name'
  });

  const { 
    data: branches, 
    loading: branchesLoading, 
    error: branchesError, 
    refetch: refetchBranches 
  } = useBranches({ 
    search: searchQuery,
    is_active: true,
    ordering: 'name'
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (selectedTab === 'departments') {
        await refetchDepartments();
      } else {
        await refetchBranches();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDepartmentPress = async (department: Department) => {
    try {
      const departmentDetails = await apiService.getDepartment(department.id);
      Alert.alert(
        department.name,
        `Type: ${department.department_type}\n` +
        `Status: ${department.is_active ? 'Active' : 'Inactive'}\n` +
        `${department.description || 'No description available'}`,
        [
          { text: 'OK', style: 'default' },
          {
            text: 'View Details',
            onPress: () => {
              // Navigate to department details screen if it exists
              console.log('Navigate to department details:', department);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error fetching department details:', error);
      Alert.alert('Error', 'Failed to load department details');
    }
  };

  const handleBranchPress = async (branch: Branch) => {
    try {
      const branchDetails = await apiService.getBranch(branch.id);
      Alert.alert(
        branch.name,
        `Code: ${branch.code}\n` +
        `Status: ${branch.is_active ? 'Active' : 'Inactive'}\n` +
        `${branch.address || 'No address available'}`,
        [
          { text: 'OK', style: 'default' },
          {
            text: 'View Details',
            onPress: () => {
              console.log('Navigate to branch details:', branch);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error fetching branch details:', error);
      Alert.alert('Error', 'Failed to load branch details');
    }
  };

  const renderDepartmentCard = (department: Department) => (
    <TouchableOpacity
      key={department.id}
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => handleDepartmentPress(department)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          {department.name}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: department.is_active ? '#E8F5E8' : '#FFEBEE' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: department.is_active ? '#2E7D32' : '#C62828' }
          ]}>
            {department.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
        {department.department_type}
      </Text>

      {department.description && (
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
          {department.description}
        </Text>
      )}

      {department.head_of_department && (
        <View style={styles.cardInfo}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            Head of Department:
          </Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
            {department.head_of_department}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
          Created: {new Date(department.created).toLocaleDateString()}
        </Text>
        <TouchableOpacity style={styles.arrowButton}>
          <Text style={[styles.arrow, { color: colors.primary }]}>→</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderBranchCard = (branch: Branch) => (
    <TouchableOpacity
      key={branch.id}
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => handleBranchPress(branch)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          {branch.name}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: branch.is_active ? '#E8F5E8' : '#FFEBEE' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: branch.is_active ? '#2E7D32' : '#C62828' }
          ]}>
            {branch.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
        Code: {branch.code}
      </Text>

      {branch.address && (
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
          {branch.address}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
          Branch ID: {branch.id}
        </Text>
        <TouchableOpacity style={styles.arrowButton}>
          <Text style={[styles.arrow, { color: colors.primary }]}>→</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const isLoading = departmentsLoading || branchesLoading;
  const error = departmentsError || branchesError;
  const data = selectedTab === 'departments' ? departments : branches;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Departments & Branches"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <View style={styles.content}>
        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'departments' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedTab('departments')}
          >
            <Text style={[
              styles.tabText,
              { color: selectedTab === 'departments' ? '#FFFFFF' : colors.textSecondary }
            ]}>
              Departments ({departments.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'branches' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedTab('branches')}
          >
            <Text style={[
              styles.tabText,
              { color: selectedTab === 'branches' ? '#FFFFFF' : colors.textSecondary }
            ]}>
              Branches ({branches.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error State */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: '#FFEBEE' }]}>
            <Text style={[styles.errorText, { color: '#C62828' }]}>
              {error}
            </Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading {selectedTab}...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {data.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No {selectedTab} found
                </Text>
                <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                  <Text style={[styles.refreshText, { color: colors.primary }]}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cardContainer}>
                {selectedTab === 'departments'
                  ? data.map((dept: Department) => renderDepartmentCard(dept))
                  : data.map((branch: Branch) => renderBranchCard(branch))
                }
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  cardContainer: {
    paddingBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
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
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardInfo: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 12,
  },
  arrowButton: {
    padding: 4,
  },
  arrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
