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
  useFeeDashboardAnalytics,
  useExpenditureSummary,
  useBranches,
  useAcademicYears
} from '@/hooks/useApi';
import { PieChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system'; // Assuming this is needed for image handling in inventory


const { width: screenWidth } = Dimensions.get('window');

// Placeholder for getRandomColor function, assuming it exists elsewhere or needs to be defined
const getRandomColor = (key: string | number): string => {
  // Simple hash function to generate color based on key
  let hash = 0;
  const strKey = String(key);
  for (let i = 0; i < strKey.length; i++) {
    hash = strKey.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = ((hash & 0x00FFFFFF) | 0x1000000).toString(16).substring(1);
  return `#${color}`;
};

// Placeholder for chartConfig, assuming it's defined elsewhere
const chartConfig = {
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: '#FFFFFF',
  backgroundGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Default color, will be overridden by PieChart's data
  strokeWidth: 2, // optional, default 3
  barPercentage: 0.5,
  useShadowColorFromDataset: false // Set to false for PieChart
};


export default function IncomeDashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [activeChart, setActiveChart] = useState<'monthly' | 'standards' | 'feeTypes'>('monthly');

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);

  // Fetch data
  const analyticsParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
  }), [selectedBranch, selectedAcademicYear]);

  const { data: feeAnalytics, loading: feeLoading, refetch: refetchFee } = useFeeDashboardAnalytics(analyticsParams);
  const { data: expenseSummary, loading: expenseLoading, refetch: refetchExpenses } = useExpenditureSummary(selectedBranch, selectedAcademicYear);
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears({ is_active: true });

  const loading = feeLoading || expenseLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGrowthColor = (percent: number) => {
    if (percent > 0) return '#10B981'; // Green for positive
    if (percent < 0) return '#EF4444'; // Red for negative
    return colors.textSecondary; // Neutral for no change
  };

  const getCollectionColor = (index: number) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    return colors[index % colors.length];
  };

  const calculateNetProfit = () => {
    if (!feeAnalytics || !expenseSummary) return 0;
    return feeAnalytics.total_payments - expenseSummary.total;
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

  const renderSummaryCards = () => {
    if (!feeAnalytics || !expenseSummary) return null;

    const netProfit = calculateNetProfit();
    const profitMargin = feeAnalytics.total_payments > 0 ? (netProfit / feeAnalytics.total_payments) * 100 : 0;

    const cards = [
      {
        title: 'Total Income',
        value: formatCurrency(feeAnalytics.total_payments),
        change: feeAnalytics.time_collections.growth.monthly,
        subtitle: 'Fee collections'
      },
      {
        title: 'Total Expenses',
        value: formatCurrency(expenseSummary.total),
        change: expenseSummary.monthly_comparison_percent,
        subtitle: 'All expenses'
      },
      {
        title: 'Net Profit',
        value: formatCurrency(netProfit),
        change: profitMargin,
        subtitle: `${profitMargin.toFixed(1)}% margin`
      },
      {
        title: 'Due Fees',
        value: formatCurrency(feeAnalytics.total_pending),
        change: 0,
        subtitle: 'Pending collections'
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
                {card.change > 0 ? '+' : ''}{card.change.toFixed(1)}%
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

  const renderChartSelector = () => (
    <View style={[styles.chartSelector, { backgroundColor: colors.surface }]}>
      {[
        { key: 'monthly', label: 'Monthly Collection' },
        { key: 'standards', label: 'By Standards' },
        { key: 'feeTypes', label: 'By Fee Types' }
      ].map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.chartSelectorButton,
            {
              backgroundColor: activeChart === option.key ? colors.primary : 'transparent',
              borderColor: colors.border,
            }
          ]}
          onPress={() => setActiveChart(option.key as any)}
        >
          <Text style={[
            styles.chartSelectorText,
            { color: activeChart === option.key ? '#FFFFFF' : colors.textPrimary }
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMonthlyChart = () => {
    if (!feeAnalytics?.monthly_collections) return null;

    const maxAmount = Math.max(...feeAnalytics.monthly_collections.map((item: any) => Math.max(item.collected, item.expected)));

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
          Monthly Fee Collection (Expected vs Collected)
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.barChart}>
            {feeAnalytics.monthly_collections.slice(-6).map((item: any, index: number) => {
              const expectedHeight = (item.expected / maxAmount) * 150;
              const collectedHeight = (item.collected / maxAmount) * 150;

              return (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        styles.expectedBar,
                        {
                          height: expectedHeight,
                          backgroundColor: colors.border,
                        }
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        styles.collectedBar,
                        {
                          height: collectedHeight,
                          backgroundColor: colors.primary,
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                    {item.month}
                  </Text>
                  <Text style={[styles.barValue, { color: colors.textPrimary }]}>
                    {formatCurrency(item.collected)}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.textPrimary }]}>Collected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.border }]} />
            <Text style={[styles.legendText, { color: colors.textPrimary }]}>Expected</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderStandardsChart = () => {
    if (!feeAnalytics?.standard_collections) return null;

    const validStandards = feeAnalytics.standard_collections.filter((item: any) => item.expected > 0);
    const maxAmount = Math.max(...validStandards.map((item: any) => item.expected));

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
          Fee Collection by Standards
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.barChart}>
            {validStandards.slice(0, 8).map((item: any, index: number) => {
              const expectedHeight = (item.expected / maxAmount) * 150;
              const collectedHeight = (item.collected / maxAmount) * 150;
              const collectionRate = item.expected > 0 ? (item.collected / item.expected) * 100 : 0;

              return (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        styles.expectedBar,
                        {
                          height: expectedHeight,
                          backgroundColor: colors.border,
                        }
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        styles.collectedBar,
                        {
                          height: collectedHeight,
                          backgroundColor: getCollectionColor(index),
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.standard}
                  </Text>
                  <Text style={[styles.barValue, { color: colors.textPrimary }]}>
                    {collectionRate.toFixed(0)}%
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderFeeTypesChart = () => {
    if (!feeAnalytics?.fee_type_analytics) return null;

    const topFeeTypes = feeAnalytics.fee_type_analytics
      .filter((item: any) => item.expected > 0)
      .sort((a: any, b: any) => b.expected - a.expected)
      .slice(0, 6);

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
          Fee Overview by Type
        </Text>

        <View style={styles.feeTypesList}>
          {topFeeTypes.map((item: any, index: number) => {
            const collectionRate = item.expected > 0 ? (item.collected / item.expected) * 100 : 0;
            const isOverCollected = item.collected > item.expected;

            return (
              <View key={index} style={styles.feeTypeItem}>
                <View style={styles.feeTypeHeader}>
                  <Text style={[styles.feeTypeName, { color: colors.textPrimary }]}>
                    {item.fee_type_name}
                  </Text>
                  <Text style={[
                    styles.feeTypeRate,
                    { color: isOverCollected ? '#10B981' : collectionRate > 75 ? '#F59E0B' : '#EF4444' }
                  ]}>
                    {collectionRate.toFixed(0)}%
                  </Text>
                </View>

                <View style={styles.feeTypeProgress}>
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(collectionRate, 100)}%`,
                          backgroundColor: isOverCollected ? '#10B981' : colors.primary,
                        }
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.feeTypeAmounts}>
                  <Text style={[styles.feeTypeAmount, { color: colors.textSecondary }]}>
                    Collected: {formatCurrency(item.collected)}
                  </Text>
                  <Text style={[styles.feeTypeAmount, { color: colors.textSecondary }]}>
                    Expected: {formatCurrency(item.expected)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTimeBasedSummary = () => {
    if (!feeAnalytics?.time_collections) return null;

    const timeData = feeAnalytics.time_collections;

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
          Time-based Collection Summary
        </Text>

        <View style={styles.timeGrid}>
          <View style={styles.timeCard}>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Today</Text>
            <Text style={[styles.timeValue, { color: colors.textPrimary }]}>
              {formatCurrency(timeData.today.collected)}
            </Text>
            <Text style={[styles.timeGrowth, { color: getGrowthColor(timeData.growth.daily) }]}>
              {timeData.growth.daily > 0 ? '+' : ''}{timeData.growth.daily}%
            </Text>
          </View>

          <View style={styles.timeCard}>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>This Week</Text>
            <Text style={[styles.timeValue, { color: colors.textPrimary }]}>
              {formatCurrency(timeData.this_week.collected)}
            </Text>
            <Text style={[styles.timeGrowth, { color: getGrowthColor(timeData.growth.weekly) }]}>
              {timeData.growth.weekly > 0 ? '+' : ''}{timeData.growth.weekly}%
            </Text>
          </View>

          <View style={styles.timeCard}>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>This Month</Text>
            <Text style={[styles.timeValue, { color: colors.textPrimary }]}>
              {formatCurrency(timeData.this_month.collected)}
            </Text>
            <Text style={[styles.timeGrowth, { color: getGrowthColor(timeData.growth.monthly) }]}>
              {timeData.growth.monthly > 0 ? '+' : ''}{timeData.growth.monthly}%
            </Text>
          </View>

          <View style={styles.timeCard}>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>This Year</Text>
            <Text style={[styles.timeValue, { color: colors.textPrimary }]}>
              {formatCurrency(timeData.this_year.collected)}
            </Text>
            <Text style={[styles.timeSubtext, { color: colors.textSecondary }]}>
              of {formatCurrency(timeData.this_year.expected)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // New function to render Pie Chart (corrected version)
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
      const value = item.collected || item.total || item.value || item.amount || 0;
      const name = item.name || item.category || `Item ${index + 1}`;

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

  if (loading && !feeAnalytics) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar
          title="Income Dashboard"
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationsPress={() => router.push('/(tabs)/notifications')}
          onSettingsPress={() => router.push('/(tabs)/settings')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading income data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="💵 Income Dashboard"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {renderFilters()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              refetchFee();
              refetchExpenses();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {renderSummaryCards()}
        {renderTimeBasedSummary()}
        {renderChartSelector()}
        {activeChart === 'monthly' && renderMonthlyChart()}
        {activeChart === 'standards' && renderStandardsChart()}
        {activeChart === 'feeTypes' && renderFeeTypesChart()}
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
  chartSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 8,
    borderRadius: 12,
    gap: 8,
  },
  chartSelectorButton: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  chartSelectorText: {
    fontSize: 12,
    fontWeight: '600',
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
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 200,
    paddingHorizontal: 8,
    gap: 8,
  },
  barContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  barWrapper: {
    height: 150,
    justifyContent: 'flex-end',
    marginBottom: 8,
    position: 'relative',
  },
  bar: {
    width: 25,
    borderRadius: 4,
    position: 'absolute',
    bottom: 0,
  },
  expectedBar: {
    opacity: 0.3,
  },
  collectedBar: {
    zIndex: 1,
  },
  barLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 4,
    width: 50,
  },
  barValue: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
  feeTypesList: {
    gap: 16,
  },
  feeTypeItem: {
    gap: 8,
  },
  feeTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeTypeName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  feeTypeRate: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  feeTypeProgress: {
    height: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  feeTypeAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feeTypeAmount: {
    fontSize: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeCard: {
    width: (screenWidth - 60) / 2,
    alignItems: 'center',
    padding: 12,
  },
  timeLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timeGrowth: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeSubtext: {
    fontSize: 10,
  },
  // Styles for Pie Chart
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Example border color
  },
  emptyChartText: {
    fontSize: 14,
    textAlign: 'center',
  },
  chartWrapper: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  // chartTitle is already defined above
  // chartContainer is already defined above
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
});