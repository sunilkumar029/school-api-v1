import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import {
  useExpenditureSummary,
  useBranches,
  useAcademicYears
} from '@/hooks/useApi';

// Assuming these are defined elsewhere or need to be imported/defined
// For the sake of this example, let's define them here.
const screenWidth = Dimensions.get('window').width;
const chartConfig = {
  // Define your chart configurations here
  // Example:
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2, // optional, default 3
  barPercentage: 0.5,
  useShadowColorFromDataset: false // optional
};

const getRandomColor = (key: string | number) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];
  if (typeof key === 'string') {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
  return colors[key % colors.length];
};

import { PieChart } from "react-native-chart-kit";


interface ExpenditureSummary {
  total: number;
  current_month: number;
  previous_month: number;
  monthly_comparison_percent: number;
  pending_vendors_count: number;
  category_distribution: Array<{
    category: string;
    total: number;
    percentage: number;
  }>;
  salary_by_month: Array<{
    month: string;
    total: number;
  }>;
  salary_by_month_department: Record<string, Array<{
    department: string;
    total: number;
  }>>;
  time_based_overview: {
    today: number;
    yesterday: number;
    this_week: number;
    last_week: number;
    this_month: number;
    previous_month: number;
    this_year: number;
    previous_year: number;
  };
}

export default function ExpensesDashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [activeTimeFilter, setActiveTimeFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);

  // Fetch data
  const { data: expenseSummary, loading: expenseLoading, refetch: refetchExpenses } = useExpenditureSummary(selectedBranch, selectedAcademicYear);
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears({ is_active: true });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGrowthColor = (percent: number) => {
    if (percent > 0) return '#10B981'; // Green for increase
    if (percent < 0) return '#EF4444'; // Red for decrease
    return colors.textSecondary; // Neutral for no change
  };

  const getCategoryColor = (index: number) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];
    return colors[index % colors.length];
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

  const renderTimeFilters = () => (
    <View style={[styles.timeFiltersContainer, { backgroundColor: colors.surface }]}>
      {['today', 'week', 'month', 'year'].map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.timeFilterChip,
            {
              backgroundColor: activeTimeFilter === filter ? colors.primary : 'transparent',
              borderColor: colors.border,
            }
          ]}
          onPress={() => setActiveTimeFilter(filter as any)}
        >
          <Text style={[
            styles.timeFilterText,
            { color: activeTimeFilter === filter ? '#FFFFFF' : colors.textPrimary }
          ]}>
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSummaryCards = () => {
    if (!expenseSummary) return null;

    const cards = [
      {
        title: 'Total Expenses',
        value: formatCurrency(expenseSummary.total),
        change: expenseSummary.monthly_comparison_percent,
        subtitle: 'All time expenses'
      },
      {
        title: 'Current Month',
        value: formatCurrency(expenseSummary.current_month),
        change: expenseSummary.monthly_comparison_percent,
        subtitle: 'This month expenses'
      },
      {
        title: 'Previous Month',
        value: formatCurrency(expenseSummary.previous_month),
        change: 0,
        subtitle: 'Last month expenses'
      },
      {
        title: 'Pending Payments',
        value: expenseSummary.pending_vendors_count.toString(),
        change: 0,
        subtitle: 'Vendors awaiting payment'
      },
    ];

    return (
      <View style={styles.summaryCardsContainer}>
        {cards.map((card, index) => (
          <View
            key={index}
            style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
              {card.title}
            </Text>
            <Text style={[styles.cardValue, { color: colors.textPrimary }]}>
              {card.value}
            </Text>
            {card.change !== 0 && (
              <Text style={[styles.cardChange, { color: getGrowthColor(card.change) }]}>
                {card.change > 0 ? '+' : ''}{card.change}%
              </Text>
            )}
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              {card.subtitle}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPieChart = (data: any[], title: string) => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
            No data available for {title}
          </Text>
        </View>
      );
    }

    const chartData = data.map((item, index) => {
      const value = item.total || item.value || item.amount || 0;
      const name = item.category || item.name || `Item ${index + 1}`;

      return {
        name: name,
        population: Math.max(value, 0), // Ensure non-negative values
        color: getRandomColor(name),
        legendFontColor: colors.textPrimary,
        legendFontSize: 12,
      };
    }).filter(item => item.population > 0); // Filter out zero values

    if (chartData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
            No data available for {title}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.chartWrapper}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{title}</Text>
        <View style={styles.chartContainer}>
          <PieChart
            data={chartData}
            width={screenWidth - 80}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            center={[10, 10]}
            absolute
          />
        </View>
        {/* Legend */}
        <View style={styles.legendContainer}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary }]}>
                {item.name}: {formatCurrency(item.population)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };


  const renderBarChart = () => {
    if (!expenseSummary?.salary_by_month) return null;

    const maxAmount = Math.max(...expenseSummary.salary_by_month.map(item => item.total));

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
          Salary Expenses by Month
        </Text>

        <View style={styles.barChart}>
          {expenseSummary.salary_by_month.map((item, index) => {
            const barHeight = (item.total / maxAmount) * 150;

            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: colors.primary,
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                  {item.month}
                </Text>
                <Text style={[styles.barValue, { color: colors.textPrimary }]}>
                  {formatCurrency(item.total)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTimeBasedOverview = () => {
    if (!expenseSummary?.time_based_overview) return null;

    const timeData = expenseSummary.time_based_overview;
    const currentPeriodData = {
      today: timeData.today,
      week: timeData.this_week,
      month: timeData.this_month,
      year: timeData.this_year,
    };

    const previousPeriodData = {
      today: timeData.yesterday,
      week: timeData.last_week,
      month: timeData.previous_month,
      year: timeData.previous_year,
    };

    const current = currentPeriodData[activeTimeFilter];
    const previous = previousPeriodData[activeTimeFilter];
    const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
          {activeTimeFilter.charAt(0).toUpperCase() + activeTimeFilter.slice(1)} Overview
        </Text>

        <View style={styles.overviewContent}>
          <View style={styles.overviewCard}>
            <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
              Current {activeTimeFilter}
            </Text>
            <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>
              {formatCurrency(current)}
            </Text>
          </View>

          <View style={styles.overviewCard}>
            <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
              Previous {activeTimeFilter}
            </Text>
            <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>
              {formatCurrency(previous)}
            </Text>
          </View>

          <View style={styles.overviewCard}>
            <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
              Growth
            </Text>
            <Text style={[styles.overviewValue, { color: getGrowthColor(growth) }]}>
              {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (expenseLoading && !expenseSummary) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar
          title="Expenses Dashboard"
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationsPress={() => router.push('/(tabs)/notifications')}
          onSettingsPress={() => router.push('/(tabs)/settings')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading expenses data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="💸 Expenses Dashboard"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {renderFilters()}
      {renderTimeFilters()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={expenseLoading}
            onRefresh={refetchExpenses}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {renderSummaryCards()}
        {renderTimeBasedOverview()}
        {renderPieChart(expenseSummary?.category_distribution || [], 'Expense Distribution by Category')}
        {renderBarChart()}
      </ScrollView>
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
  timeFiltersContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 8,
    borderRadius: 12,
    gap: 8,
  },
  timeFilterChip: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryCard: {
    width: (screenWidth - 44) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardChange: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 10,
  },
  chartContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChart: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
    position: 'relative',
  },
  pieSlice: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  pieChartLegend: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
  },
  legendAmount: {
    fontSize: 12,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 150,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 30,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  overviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewCard: {
    alignItems: 'center',
    flex: 1,
  },
  overviewLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Styles added/modified for pie chart and legend
  chartWrapper: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  legendContainer: {
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    flex: 1,
  },
  // Added for empty chart state
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  emptyChartText: {
    fontSize: 14,
    textAlign: 'center',
  },
});