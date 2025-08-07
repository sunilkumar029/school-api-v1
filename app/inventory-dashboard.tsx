
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { Picker } from '@react-native-picker/picker';
import { 
  useInventoryDashboard,
  useInventoryList,
  useInventoryTypes,
  useBranches,
  useAcademicYears
} from '@/hooks/useApi';

const { width: screenWidth } = Dimensions.get('window');

// Utility function for random colors - moved before usage
const getRandomColor = (str?: string): string => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
  if (str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
  return colors[Math.floor(Math.random() * colors.length)];
};

interface DashboardCard {
  title: string;
  value: string;
  subtitle?: string;
  color: string;
  icon: string;
}

export default function InventoryDashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Fetch data
  const dashboardParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
  }), [selectedBranch, selectedAcademicYear]);

  const inventoryParams = useMemo(() => ({
    branch: selectedBranch,
    omit: 'created_by,modified_by,branch',
  }), [selectedBranch]);

  const { data: dashboardData, loading: dashboardLoading, refetch: refetchDashboard } = useInventoryDashboard(dashboardParams);
  const { data: inventoryItems, loading: itemsLoading, refetch: refetchItems } = useInventoryList(inventoryParams);
  const { data: inventoryTypes } = useInventoryTypes({ is_active: true, branch: selectedBranch });
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears({ is_active: true });

  // Calculate dashboard metrics from inventory data
  const dashboardMetrics = useMemo(() => {
    if (!inventoryItems || inventoryItems.length === 0) {
      return {
        quantityInHand: 0,
        toBeReceived: 0,
        totalSuppliers: 0,
        totalCategories: 0,
        categoryDistribution: [],
        statusDistribution: [],
        monthlyTracking: [],
        recentActivity: []
      };
    }

    const totalQuantity = inventoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const availableQuantity = inventoryItems.reduce((sum, item) => {
      const issuedQuantity = item.inventory_tracking?.reduce((trackSum, track) => {
        return track.status === 'Issued' ? trackSum + track.quantity : trackSum;
      }, 0) || 0;
      return sum + (item.quantity - issuedQuantity);
    }, 0);
    
    const toBeReceived = inventoryItems.filter(item => item.status === 'Not-Available').length;
    
    const suppliers = new Set(inventoryItems.map(item => item.inventory_type?.name).filter(Boolean));
    const categories = new Set(inventoryItems.map(item => item.inventory_type?.type).filter(Boolean));

    // Category distribution
    const categoryMap = {};
    inventoryItems.forEach(item => {
      const category = item.inventory_type?.type || 'Others';
      categoryMap[category] = (categoryMap[category] || 0) + item.quantity;
    });

    const categoryDistribution = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: value as number,
      percentage: ((value as number / totalQuantity) * 100).toFixed(1),
      color: getRandomColor(name),
    }));

    // Status distribution
    const statusMap = {};
    inventoryItems.forEach(item => {
      const status = item.status || 'Unknown';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });

    const statusDistribution = Object.entries(statusMap).map(([name, value]) => ({
      name,
      value: value as number,
      percentage: ((value as number / inventoryItems.length) * 100).toFixed(1),
      color: getStatusColor(name),
    }));

    // Recent activity (from inventory tracking)
    const recentActivity = [];
    inventoryItems.forEach(item => {
      if (item.inventory_tracking && item.inventory_tracking.length > 0) {
        item.inventory_tracking.forEach(track => {
          recentActivity.push({
            id: `${item.id}-${track.id}`,
            item: item.name,
            action: `${track.status} to ${track.room?.name || 'Unassigned'}`,
            quantity: track.quantity,
            date: track.created || track.created_at,
            status: track.status,
          });
        });
      }
    });

    // Sort by date (most recent first)
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      quantityInHand: availableQuantity,
      toBeReceived,
      totalSuppliers: suppliers.size,
      totalCategories: categories.size,
      categoryDistribution,
      statusDistribution,
      recentActivity: recentActivity.slice(0, 10), // Top 10 recent activities
    };
  }, [inventoryItems]);

  

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return '#10B981';
      case 'issued': return '#3B82F6';
      case 'damaged': return '#EF4444';
      case 'not-available': return '#6B7280';
      case 'assigned': return '#8B5CF6';
      default: return '#9CA3AF';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const dashboardCards: DashboardCard[] = [
    {
      title: 'Quantity in Hand',
      value: dashboardMetrics.quantityInHand.toString(),
      subtitle: 'Available items',
      color: '#10B981',
      icon: '📦',
    },
    {
      title: 'To Be Received',
      value: dashboardMetrics.toBeReceived.toString(),
      subtitle: 'Pending items',
      color: '#F59E0B',
      icon: '⏳',
    },
    {
      title: 'Total Suppliers',
      value: dashboardMetrics.totalSuppliers.toString(),
      subtitle: 'Active suppliers',
      color: '#3B82F6',
      icon: '🏢',
    },
    {
      title: 'Total Categories',
      value: dashboardMetrics.totalCategories.toString(),
      subtitle: 'Item categories',
      color: '#8B5CF6',
      icon: '📂',
    },
  ];

  const renderDashboardCard = (card: DashboardCard, index: number) => (
    <View
      key={index}
      style={[
        styles.dashboardCard,
        { backgroundColor: colors.surface, borderLeftColor: card.color }
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{card.icon}</Text>
        <View style={styles.cardContent}>
          <Text style={[styles.cardValue, { color: colors.textPrimary }]}>
            {card.value}
          </Text>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {card.title}
          </Text>
          {card.subtitle && (
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              {card.subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderCategoryChart = () => (
    <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
      <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
        Category Distribution
      </Text>
      <View style={styles.pieChartContainer}>
        {dashboardMetrics.categoryDistribution.map((item, index) => (
          <View key={index} style={styles.chartLegendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <View style={styles.legendContent}>
              <Text style={[styles.legendLabel, { color: colors.textPrimary }]}>
                {item.name}
              </Text>
              <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                {item.value} items ({item.percentage}%)
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStatusChart = () => (
    <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
      <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
        Status Distribution
      </Text>
      <View style={styles.pieChartContainer}>
        {dashboardMetrics.statusDistribution.map((item, index) => (
          <View key={index} style={styles.chartLegendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <View style={styles.legendContent}>
              <Text style={[styles.legendLabel, { color: colors.textPrimary }]}>
                {item.name}
              </Text>
              <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                {item.value} items ({item.percentage}%)
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={[styles.activityContainer, { backgroundColor: colors.surface }]}>
      <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
        Recent Activity
      </Text>
      {dashboardMetrics.recentActivity.length === 0 ? (
        <Text style={[styles.noActivityText, { color: colors.textSecondary }]}>
          No recent activity
        </Text>
      ) : (
        dashboardMetrics.recentActivity.map((activity, index) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: getStatusColor(activity.status) }]} />
            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>
                {activity.item}
              </Text>
              <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
                {activity.action} • Qty: {activity.quantity}
              </Text>
              <Text style={[styles.activityDate, { color: colors.textSecondary }]}>
                {formatDate(activity.date)}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.filterRow}>
        <View style={styles.filterItem}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Branch</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={selectedBranch}
              onValueChange={setSelectedBranch}
              style={[styles.picker, { color: colors.textPrimary }]}
            >
              {branches?.map((branch: any) => (
                <Picker.Item key={branch.id} label={branch.name} value={branch.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.filterItem}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Academic Year</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={selectedAcademicYear}
              onValueChange={setSelectedAcademicYear}
              style={[styles.picker, { color: colors.textPrimary }]}
            >
              {academicYears?.map((year: any) => (
                <Picker.Item key={year.id} label={year.name} value={year.id} />
              ))}
            </Picker>
          </View>
        </View>
      </View>
    </View>
  );

  const isLoading = dashboardLoading || itemsLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Inventory Dashboard"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              refetchDashboard();
              refetchItems();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Filters */}
        {renderFilters()}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading dashboard data...
            </Text>
          </View>
        ) : (
          <>
            {/* Dashboard Cards */}
            <View style={styles.cardsContainer}>
              {dashboardCards.map(renderDashboardCard)}
            </View>

            {/* Charts */}
            <View style={styles.chartsContainer}>
              {renderCategoryChart()}
              {renderStatusChart()}
            </View>

            {/* Recent Activity */}
            {renderRecentActivity()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  filtersContainer: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
  },
  cardsContainer: {
    padding: 16,
    gap: 12,
  },
  dashboardCard: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
  },
  chartsContainer: {
    padding: 16,
    gap: 16,
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pieChartContainer: {
    gap: 12,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendContent: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  legendValue: {
    fontSize: 12,
  },
  activityContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  noActivityText: {
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});
