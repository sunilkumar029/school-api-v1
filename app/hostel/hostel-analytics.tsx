
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
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ModalDropdownFilter } from '@/components/ModalDropdownFilter';
import { useRooms, useUsers, useHostelVisitors } from '@/hooks/useApi';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsCard {
  title: string;
  value: string;
  subtitle: string;
  color: string;
  icon: string;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
}

export default function HostelAnalyticsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this_month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const {
    selectedBranch,
    selectedAcademicYear,
    branches,
    academicYears,
    setSelectedBranch,
    setSelectedAcademicYear
  } = useGlobalFilters();

  // Fetch analytics data
  const analyticsParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    period: selectedPeriod,
  }), [selectedBranch, selectedAcademicYear, selectedPeriod]);

  const { data: rooms = [], loading: roomsLoading } = useRooms(analyticsParams);
  const { 
    data: students = [], 
    loading: studentsLoading 
  } = useUsers({ 
    ...analyticsParams, 
    role: 'student', 
    is_hostel_student: true 
  });
  const { data: visitors = [], loading: visitorsLoading } = useHostelVisitors(analyticsParams);

  const periodOptions = [
    { id: 'today', name: 'Today' },
    { id: 'this_week', name: 'This Week' },
    { id: 'this_month', name: 'This Month' },
    { id: 'this_year', name: 'This Year' }
  ];

  const categoryOptions = [
    { id: 'all', name: 'All Categories' },
    { id: 'occupancy', name: 'Occupancy' },
    { id: 'visitors', name: 'Visitors' },
    { id: 'maintenance', name: 'Maintenance' }
  ];

  // Calculate analytics metrics
  const analytics = useMemo(() => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((room: any) => room.occupied > 0).length;
    const totalCapacity = rooms.reduce((sum: number, room: any) => sum + room.capacity, 0);
    const totalOccupied = rooms.reduce((sum: number, room: any) => sum + room.occupied, 0);
    const occupancyRate = totalCapacity > 0 ? (totalOccupied / totalCapacity * 100) : 0;

    const totalStudents = students.length;
    const activeVisitors = visitors.filter((v: any) => v.status === 'checked_in').length;
    const totalVisitors = visitors.length;

    const availableRooms = totalRooms - occupiedRooms;
    const availableBeds = totalCapacity - totalOccupied;

    return {
      totalRooms,
      occupiedRooms,
      availableRooms,
      totalCapacity,
      totalOccupied,
      availableBeds,
      occupancyRate,
      totalStudents,
      activeVisitors,
      totalVisitors,
    };
  }, [rooms, students, visitors]);

  const analyticsCards: AnalyticsCard[] = [
    {
      title: 'Total Rooms',
      value: analytics.totalRooms.toString(),
      subtitle: `${analytics.occupiedRooms} occupied, ${analytics.availableRooms} available`,
      color: '#3B82F6',
      icon: '🏠',
    },
    {
      title: 'Occupancy Rate',
      value: `${analytics.occupancyRate.toFixed(1)}%`,
      subtitle: `${analytics.totalOccupied}/${analytics.totalCapacity} beds`,
      color: '#10B981',
      icon: '📊',
      change: '+5.2%',
      changeType: 'increase',
    },
    {
      title: 'Total Students',
      value: analytics.totalStudents.toString(),
      subtitle: 'Hostel residents',
      color: '#8B5CF6',
      icon: '👥',
    },
    {
      title: 'Active Visitors',
      value: analytics.activeVisitors.toString(),
      subtitle: `${analytics.totalVisitors} total visits`,
      color: '#F59E0B',
      icon: '🚪',
      change: '-2.1%',
      changeType: 'decrease',
    },
  ];

  const filteredCards = useMemo(() => {
    if (selectedCategory === 'all') return analyticsCards;
    
    switch (selectedCategory) {
      case 'occupancy':
        return analyticsCards.filter(card => 
          ['Total Rooms', 'Occupancy Rate'].includes(card.title)
        );
      case 'visitors':
        return analyticsCards.filter(card => 
          card.title === 'Active Visitors'
        );
      default:
        return analyticsCards;
    }
  }, [analyticsCards, selectedCategory]);

  const renderAnalyticsCard = (card: AnalyticsCard, index: number) => (
    <View
      key={index}
      style={[
        styles.analyticsCard,
        {
          backgroundColor: colors.surface,
          borderLeftColor: card.color,
        },
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
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {card.subtitle}
          </Text>
          {card.change && (
            <View style={styles.changeContainer}>
              <Text
                style={[
                  styles.changeText,
                  {
                    color: card.changeType === 'increase' 
                      ? '#10B981' 
                      : card.changeType === 'decrease' 
                      ? '#EF4444' 
                      : colors.textSecondary
                  },
                ]}
              >
                {card.changeType === 'increase' ? '↗' : '↘'} {card.change}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderOccupancyChart = () => {
    const data = rooms.slice(0, 10).map((room: any, index: number) => ({
      name: `Room ${room.room_number}`,
      occupancy: room.capacity > 0 ? (room.occupied / room.capacity * 100) : 0,
      color: room.occupied === room.capacity 
        ? '#EF4444' 
        : room.occupied > room.capacity * 0.8 
        ? '#F59E0B' 
        : '#10B981',
    }));

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
          Room Occupancy Status
        </Text>
        <View style={styles.chartContent}>
          {data.map((item, index) => (
            <View key={index} style={styles.chartItem}>
              <Text style={[styles.chartLabel, { color: colors.textPrimary }]}>
                {item.name}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${item.occupancy}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.percentageText, { color: colors.textSecondary }]}>
                {item.occupancy.toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderVisitorsTrend = () => (
    <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
      <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
        Recent Visitor Activity
      </Text>
      <View style={styles.trendContainer}>
        {visitors.slice(0, 5).map((visitor: any, index: number) => (
          <View key={index} style={styles.trendItem}>
            <View
              style={[
                styles.trendDot,
                {
                  backgroundColor: visitor.status === 'checked_in' 
                    ? '#10B981' 
                    : '#6B7280'
                },
              ]}
            />
            <View style={styles.trendContent}>
              <Text style={[styles.trendName, { color: colors.textPrimary }]}>
                {visitor.name}
              </Text>
              <Text style={[styles.trendDetails, { color: colors.textSecondary }]}>
                {visitor.visitor_type} • {visitor.status}
              </Text>
              <Text style={[styles.trendTime, { color: colors.textSecondary }]}>
                {new Date(visitor.check_in_time).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const isLoading = roomsLoading || studentsLoading || visitorsLoading;

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
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Text style={[styles.filtersLabel, { color: colors.textSecondary }]}>Filters:</Text>
            
            <ModalDropdownFilter
              label="Branch"
              items={branches || []}
              selectedValue={selectedBranch}
              onValueChange={setSelectedBranch}
              compact={true}
            />
            
            <ModalDropdownFilter
              label="Academic Year"
              items={academicYears || []}
              selectedValue={selectedAcademicYear}
              onValueChange={setSelectedAcademicYear}
              compact={true}
            />
            
            <ModalDropdownFilter
              label="Period"
              items={periodOptions}
              selectedValue={selectedPeriod}
              onValueChange={setSelectedPeriod}
              compact={true}
            />
            
            <ModalDropdownFilter
              label="Category"
              items={categoryOptions}
              selectedValue={selectedCategory}
              onValueChange={setSelectedCategory}
              compact={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              // Trigger refetch of all data
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading analytics...
            </Text>
          </View>
        ) : (
          <>
            {/* Analytics Cards */}
            <View style={styles.cardsContainer}>
              {filteredCards.map(renderAnalyticsCard)}
            </View>

            {/* Charts */}
            {selectedCategory === 'all' || selectedCategory === 'occupancy' ? (
              renderOccupancyChart()
            ) : null}

            {selectedCategory === 'all' || selectedCategory === 'visitors' ? (
              renderVisitorsTrend()
            ) : null}
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
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filtersScroll: {
    paddingHorizontal: 16,
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
  cardsContainer: {
    padding: 16,
    gap: 16,
  },
  analyticsCard: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
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
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
  },
  changeContainer: {
    marginTop: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContent: {
    gap: 12,
  },
  chartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chartLabel: {
    fontSize: 14,
    width: 80,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  percentageText: {
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  trendContainer: {
    gap: 16,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  trendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  trendContent: {
    flex: 1,
  },
  trendName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  trendDetails: {
    fontSize: 12,
    marginBottom: 2,
  },
  trendTime: {
    fontSize: 10,
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
});
