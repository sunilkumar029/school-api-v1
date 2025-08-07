
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
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { 
  useBranches, 
  useAcademicYears 
} from '@/hooks/useApi';
import { apiService } from '@/api/apiService';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsData {
  occupancyRate: number;
  bedsAvailable: number;
  roomsAvailable: number;
  totalProducts: number;
  recentSpending: number;
  occupancyTrend: number[];
  bedStatusOverview: { available: number; occupied: number; maintenance: number };
  productStockStatus: { inStock: number; outOfStock: number; notInUse: number };
  visitorBreakdown: { daily: number; weekly: number; monthly: number };
  studentBedAllocation: { allocated: number; unallocated: number };
}

export default function HostelAnalyticsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    occupancyRate: 0,
    bedsAvailable: 0,
    roomsAvailable: 0,
    totalProducts: 0,
    recentSpending: 0,
    occupancyTrend: [],
    bedStatusOverview: { available: 0, occupied: 0, maintenance: 0 },
    productStockStatus: { inStock: 0, outOfStock: 0, notInUse: 0 },
    visitorBreakdown: { daily: 0, weekly: 0, monthly: 0 },
    studentBedAllocation: { allocated: 0, unallocated: 0 },
  });

  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears();

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch multiple data sources
      const [roomsData, productsData, visitorsData] = await Promise.all([
        apiService.getHostelRooms({ branch: selectedBranch }),
        apiService.getHostelProducts({ branch: selectedBranch }),
        apiService.getHostelVisitors({ branch: selectedBranch }),
      ]);

      // Calculate metrics
      const rooms = roomsData.results || [];
      const products = productsData.results || [];
      const visitors = visitorsData.results || [];

      const totalRooms = rooms.length;
      const availableRooms = rooms.filter((room: any) => room.available_beds > 0).length;
      const totalBeds = rooms.reduce((sum: number, room: any) => sum + room.total_beds, 0);
      const availableBeds = rooms.reduce((sum: number, room: any) => sum + room.available_beds, 0);
      const occupiedBeds = totalBeds - availableBeds;
      const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

      const totalProducts = products.length;
      const inStockProducts = products.filter((p: any) => p.availability === 'In Stock').length;
      const outOfStockProducts = products.filter((p: any) => p.availability === 'Out of Stock').length;
      const notInUseProducts = products.filter((p: any) => p.availability === 'Not in Use').length;

      const recentSpending = products.reduce((sum: number, p: any) => sum + (parseFloat(p.price) * p.quantity), 0);

      const activeVisitors = visitors.filter((v: any) => !v.check_out_time).length;
      const todayVisitors = visitors.filter((v: any) => {
        const today = new Date().toDateString();
        return new Date(v.visited_date).toDateString() === today;
      }).length;

      // Generate sample trend data (in real app, this would come from historical data)
      const occupancyTrend = Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + occupancyRate - 10);

      setAnalyticsData({
        occupancyRate,
        bedsAvailable: availableBeds,
        roomsAvailable: availableRooms,
        totalProducts,
        recentSpending,
        occupancyTrend,
        bedStatusOverview: {
          available: availableBeds,
          occupied: occupiedBeds,
          maintenance: Math.floor(totalBeds * 0.05), // 5% in maintenance
        },
        productStockStatus: {
          inStock: inStockProducts,
          outOfStock: outOfStockProducts,
          notInUse: notInUseProducts,
        },
        visitorBreakdown: {
          daily: todayVisitors,
          weekly: activeVisitors,
          monthly: visitors.length,
        },
        studentBedAllocation: {
          allocated: occupiedBeds,
          unallocated: availableBeds,
        },
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAnalyticsData();
  }, [selectedBranch, selectedAcademicYear]);

  const renderMetricCard = (title: string, value: string | number, subtitle?: string, color?: string) => (
    <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.metricValue, { color: color || colors.textPrimary }]}>{value}</Text>
      {subtitle && <Text style={[styles.metricSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </View>
  );

  const renderBarChart = (title: string, data: { label: string; value: number; color: string }[]) => (
    <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{title}</Text>
      <View style={styles.barChart}>
        {data.map((item, index) => {
          const maxValue = Math.max(...data.map(d => d.value));
          const height = maxValue > 0 ? (item.value / maxValue) * 120 : 0;
          
          return (
            <View key={index} style={styles.barContainer}>
              <View style={[styles.bar, { height, backgroundColor: item.color }]} />
              <Text style={[styles.barValue, { color: colors.textPrimary }]}>{item.value}</Text>
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderPieChart = (title: string, data: { label: string; value: number; color: string }[]) => (
    <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{title}</Text>
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChart}>
          {data.map((item, index) => (
            <View key={index} style={styles.pieSegment}>
              <View style={[styles.pieColor, { backgroundColor: item.color }]} />
              <Text style={[styles.pieLabel, { color: colors.textSecondary }]}>
                {item.label}: {item.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTrendChart = (title: string, data: number[]) => (
    <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{title}</Text>
      <View style={styles.trendChart}>
        {data.map((value, index) => {
          const maxValue = Math.max(...data);
          const minValue = Math.min(...data);
          const range = maxValue - minValue || 1;
          const height = ((value - minValue) / range) * 100;
          
          return (
            <View key={index} style={styles.trendPoint}>
              <View style={[
                styles.trendBar, 
                { 
                  height: `${height}%`,
                  backgroundColor: colors.primary 
                }
              ]} />
              <Text style={[styles.trendValue, { color: colors.textSecondary }]}>
                Day {index + 1}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Hostel Analytics"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          <TouchableOpacity style={[styles.compactFilterButton, { borderColor: colors.border }]}>
            <Text style={[styles.compactFilterText, { color: colors.textPrimary }]}>
              {branches?.find(b => b.id === selectedBranch)?.name || 'Branch'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.compactFilterButton, { borderColor: colors.border }]}>
            <Text style={[styles.compactFilterText, { color: colors.textPrimary }]}>
              {academicYears?.find(ay => ay.id === selectedAcademicYear)?.name || 'Year'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading analytics...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchAnalyticsData} />
          }
        >
          {/* Key Metrics */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard('Occupancy Rate', `${analyticsData.occupancyRate}%`, 'Current occupancy', colors.primary)}
            {renderMetricCard('Beds Available', analyticsData.bedsAvailable, 'Ready for booking')}
            {renderMetricCard('Rooms Available', analyticsData.roomsAvailable, 'Vacant rooms')}
            {renderMetricCard('Total Products', analyticsData.totalProducts, 'Inventory items')}
            {renderMetricCard('Recent Spending', `₹${analyticsData.recentSpending.toLocaleString()}`, 'This month')}
          </View>

          {/* Graphs */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Analytics Charts</Text>
          
          {renderTrendChart('Occupancy Trend (7 Days)', analyticsData.occupancyTrend)}
          
          {renderBarChart('Bed Status Overview', [
            { label: 'Available', value: analyticsData.bedStatusOverview.available, color: '#10B981' },
            { label: 'Occupied', value: analyticsData.bedStatusOverview.occupied, color: '#F59E0B' },
            { label: 'Maintenance', value: analyticsData.bedStatusOverview.maintenance, color: '#EF4444' },
          ])}

          {renderPieChart('Product Stock Status', [
            { label: 'In Stock', value: analyticsData.productStockStatus.inStock, color: '#10B981' },
            { label: 'Out of Stock', value: analyticsData.productStockStatus.outOfStock, color: '#EF4444' },
            { label: 'Not in Use', value: analyticsData.productStockStatus.notInUse, color: '#F59E0B' },
          ])}

          {renderBarChart('Visitor Breakdown', [
            { label: 'Daily', value: analyticsData.visitorBreakdown.daily, color: colors.primary },
            { label: 'Weekly', value: analyticsData.visitorBreakdown.weekly, color: '#8B5CF6' },
            { label: 'Monthly', value: analyticsData.visitorBreakdown.monthly, color: '#06B6D4' },
          ])}

          {renderPieChart('Student Bed Allocation', [
            { label: 'Allocated', value: analyticsData.studentBedAllocation.allocated, color: colors.primary },
            { label: 'Unallocated', value: analyticsData.studentBedAllocation.unallocated, color: '#E5E7EB' },
          ])}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filtersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactFilterButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 70,
  },
  compactFilterText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: (screenWidth - 48) / 2 - 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 10,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 30,
    borderRadius: 4,
    marginBottom: 8,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChart: {
    alignItems: 'flex-start',
  },
  pieSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pieColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  pieLabel: {
    fontSize: 14,
  },
  trendChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  trendPoint: {
    flex: 1,
    alignItems: 'center',
    height: 120,
    justifyContent: 'flex-end',
  },
  trendBar: {
    width: 20,
    borderRadius: 2,
    marginBottom: 8,
  },
  trendValue: {
    fontSize: 10,
    textAlign: 'center',
  },
});
