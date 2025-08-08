
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ModalDropdownFilter } from '@/components/ModalDropdownFilter';
import { useFeeDashboardAnalytics, useStandards } from '@/hooks/useApi';

const { width } = Dimensions.get('window');

export default function StudentFeeAnalyticsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');

  const {
    selectedBranch,
    selectedAcademicYear,
    branches,
    academicYears,
    setSelectedBranch,
    setSelectedAcademicYear
  } = useGlobalFilters();

  // API parameters
  const apiParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    standard: selectedStandard,
    period: selectedPeriod,
  }), [selectedBranch, selectedAcademicYear, selectedStandard, selectedPeriod]);

  const { data: analyticsData, loading, error, refetch } = useFeeDashboardAnalytics(apiParams);
  const { data: standards } = useStandards({
    branch: selectedBranch,
    academic_year: selectedAcademicYear
  });

  const standardOptions = useMemo(() => {
    const options = [{ id: 0, name: 'All Standards' }];
    if (standards) {
      options.push(...standards.map(s => ({ id: s.id, name: s.name })));
    }
    return options;
  }, [standards]);

  const periodOptions = [
    { id: 'monthly', name: 'Monthly' },
    { id: 'quarterly', name: 'Quarterly' },
    { id: 'yearly', name: 'Yearly' },
  ];

  const handleRefresh = () => {
    refetch();
  };

  const renderMetricCard = (title: string, value: string | number, subtitle?: string, color?: string) => (
    <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.metricValue, { color: color || colors.primary }]}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      <Text style={[styles.metricTitle, { color: colors.textPrimary }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.metricSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar
          title="Fee Analytics"
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationsPress={() => router.push('/(tabs)/notifications')}
          onSettingsPress={() => router.push('/(tabs)/settings')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Fee Analytics"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Global Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContentContainer}
        >
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
              label="Standard"
              items={standardOptions}
              selectedValue={selectedStandard || 0}
              onValueChange={(value) => setSelectedStandard(value === 0 ? null : value)}
              compact={true}
            />

            <ModalDropdownFilter
              label="Period"
              items={periodOptions}
              selectedValue={selectedPeriod}
              onValueChange={setSelectedPeriod}
              compact={true}
            />
          </View>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.surface, borderColor: '#F44336' }]}>
            <Text style={[styles.errorText, { color: '#F44336' }]}>
              Error loading analytics: {error}
            </Text>
          </View>
        )}

        {/* Overview Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Fee Collection Overview
          </Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Total Collections',
              analyticsData?.total_collections ? `₹${analyticsData.total_collections}` : '₹0',
              'Current period',
              '#4CAF50'
            )}
            {renderMetricCard(
              'Pending Amount',
              analyticsData?.pending_amount ? `₹${analyticsData.pending_amount}` : '₹0',
              'Outstanding fees',
              '#F44336'
            )}
            {renderMetricCard(
              'Collection Rate',
              analyticsData?.collection_rate ? `${analyticsData.collection_rate}%` : '0%',
              'Success rate',
              '#2196F3'
            )}
            {renderMetricCard(
              'Total Students',
              analyticsData?.total_students || 0,
              'Enrolled',
              '#9C27B0'
            )}
          </View>
        </View>

        {/* Status Breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Payment Status Breakdown
          </Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statusIndicator, { backgroundColor: '#4CAF50' }]} />
              <View style={styles.statusContent}>
                <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>Fully Paid</Text>
                <Text style={[styles.statusValue, { color: colors.textSecondary }]}>
                  {analyticsData?.paid_students || 0} students
                </Text>
              </View>
            </View>

            <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statusIndicator, { backgroundColor: '#FF9800' }]} />
              <View style={styles.statusContent}>
                <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>Partial Payment</Text>
                <Text style={[styles.statusValue, { color: colors.textSecondary }]}>
                  {analyticsData?.partial_students || 0} students
                </Text>
              </View>
            </View>

            <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statusIndicator, { backgroundColor: '#F44336' }]} />
              <View style={styles.statusContent}>
                <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>Pending Payment</Text>
                <Text style={[styles.statusValue, { color: colors.textSecondary }]}>
                  {analyticsData?.pending_students || 0} students
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Monthly Trends */}
        {analyticsData?.monthly_trends && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Monthly Collection Trends
            </Text>
            <View style={[styles.trendsContainer, { backgroundColor: colors.surface }]}>
              {analyticsData.monthly_trends.map((trend: any, index: number) => (
                <View key={index} style={styles.trendItem}>
                  <Text style={[styles.trendMonth, { color: colors.textPrimary }]}>
                    {trend.month}
                  </Text>
                  <Text style={[styles.trendAmount, { color: colors.primary }]}>
                    ₹{trend.amount?.toLocaleString() || 0}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {!analyticsData && !loading && !error && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No analytics data available for the selected filters
            </Text>
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
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filtersContentContainer: {
    paddingRight: 32,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: '100%',
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
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
  errorCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    margin: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: -6,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  metricSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  statusContainer: {
    gap: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
  },
  trendsContainer: {
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  trendMonth: {
    fontSize: 16,
    fontWeight: '500',
  },
  trendAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
