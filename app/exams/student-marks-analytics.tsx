
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
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { 
  useStudentExamMarksAnalytics,
  useBranches, 
  useAcademicYears
} from '@/hooks/useApi';

const screenWidth = Dimensions.get('window').width;

interface AnalyticsData {
  overall_summary: {
    total_students: number;
    average_marks: number;
    pass_percentage: number;
    fail_percentage: number;
  };
  standards: Array<{
    id: number;
    name: string;
    total_students: number;
    average_marks: number;
    top_performer: {
      id: number | null;
      name: string;
      percentage: number | null;
    };
    low_performer: {
      id: number | null;
      name: string;
      percentage: number | null;
    };
    sections: Array<{
      id: number;
      name: string;
      average_marks: number;
      pass_rate: number;
    }>;
  }>;
  departments: Array<{
    id: number;
    name: string;
    total_students: number;
    average_marks: number;
    pass_rate: number;
  }>;
}

export default function StudentMarksAnalyticsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);

  // Fetch data
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears();

  const analyticsParams = useMemo(() => ({
    branch_id: selectedBranch,
    academic_year_id: selectedAcademicYear,
  }), [selectedBranch, selectedAcademicYear]);

  const { 
    data: analytics, 
    loading: analyticsLoading, 
    error: analyticsError, 
    refetch: refetchAnalytics 
  } = useStudentExamMarksAnalytics(analyticsParams);

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => colors.primary + Math.floor(opacity * 255).toString(16),
    labelColor: (opacity = 1) => colors.textPrimary + Math.floor(opacity * 255).toString(16),
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
  };

  const passFailData = useMemo(() => {
    if (!analytics?.overall_summary) return [];
    
    return [
      {
        name: 'Pass',
        population: analytics.overall_summary.pass_percentage,
        color: '#4CAF50',
        legendFontColor: colors.textPrimary,
        legendFontSize: 12,
      },
      {
        name: 'Fail',
        population: analytics.overall_summary.fail_percentage,
        color: '#F44336',
        legendFontColor: colors.textPrimary,
        legendFontSize: 12,
      },
    ];
  }, [analytics, colors.textPrimary]);

  const standardsBarData = useMemo(() => {
    if (!analytics?.standards) return { labels: [], datasets: [{ data: [] }] };
    
    const standardsWithStudents = analytics.standards.filter(s => s.total_students > 0);
    
    return {
      labels: standardsWithStudents.slice(0, 8).map(s => s.name.substring(0, 8)),
      datasets: [
        {
          data: standardsWithStudents.slice(0, 8).map(s => s.average_marks),
        },
      ],
    };
  }, [analytics]);

  const departmentsBarData = useMemo(() => {
    if (!analytics?.departments) return { labels: [], datasets: [{ data: [] }] };
    
    return {
      labels: analytics.departments.slice(0, 6).map(d => d.name.substring(0, 8)),
      datasets: [
        {
          data: analytics.departments.slice(0, 6).map(d => d.average_marks),
        },
      ],
    };
  }, [analytics]);

  const sectionsBarData = useMemo(() => {
    if (!analytics?.standards) return { labels: [], datasets: [{ data: [] }] };
    
    const allSections = analytics.standards
      .flatMap(s => s.sections)
      .filter(section => section.pass_rate > 0)
      .slice(0, 8);
    
    return {
      labels: allSections.map(s => `${s.name}`),
      datasets: [
        {
          data: allSections.map(s => s.pass_rate),
        },
      ],
    };
  }, [analytics]);

  const renderOverviewCards = () => {
    if (!analytics?.overall_summary) return null;

    const { overall_summary } = analytics;

    return (
      <View style={styles.overviewContainer}>
        <View style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardValue, { color: colors.primary }]}>
            {overall_summary.total_students}
          </Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            Total Students
          </Text>
        </View>
        
        <View style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardValue, { color: colors.primary }]}>
            {overall_summary.average_marks.toFixed(1)}%
          </Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            Average Marks
          </Text>
        </View>
        
        <View style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardValue, { color: '#4CAF50' }]}>
            {overall_summary.pass_percentage.toFixed(1)}%
          </Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            Pass %
          </Text>
        </View>
        
        <View style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardValue, { color: '#F44336' }]}>
            {overall_summary.fail_percentage.toFixed(1)}%
          </Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            Fail %
          </Text>
        </View>
      </View>
    );
  };

  const renderStandardsBreakdown = () => {
    if (!analytics?.standards) return null;

    const standardsWithStudents = analytics.standards.filter(s => s.total_students > 0);

    return (
      <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Standard-wise Breakdown
        </Text>
        
        {standardsWithStudents.slice(0, 5).map((standard, index) => (
          <View key={index} style={[styles.standardCard, { backgroundColor: colors.background }]}>
            <View style={styles.standardHeader}>
              <Text style={[styles.standardName, { color: colors.textPrimary }]}>
                {standard.name}
              </Text>
              <Text style={[styles.studentCount, { color: colors.textSecondary }]}>
                {standard.total_students} students
              </Text>
            </View>
            
            <View style={styles.standardStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {standard.average_marks.toFixed(1)}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Avg Marks
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                  {standard.top_performer.name !== '--' ? standard.top_performer.name : 'N/A'}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Top Performer
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#F44336' }]}>
                  {standard.low_performer.name !== '--' ? standard.low_performer.name : 'N/A'}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Low Performer
                </Text>
              </View>
            </View>
            
            {standard.sections.length > 0 && (
              <View style={styles.sectionsContainer}>
                <Text style={[styles.sectionsTitle, { color: colors.textSecondary }]}>
                  Sections:
                </Text>
                <View style={styles.sectionsList}>
                  {standard.sections.filter(s => s.pass_rate > 0).map((section, sIndex) => (
                    <View key={sIndex} style={[styles.sectionChip, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.sectionChipText, { color: colors.textPrimary }]}>
                        {section.name}: {section.pass_rate.toFixed(0)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Marks Analytics"
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
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Branch</Text>
          <TouchableOpacity style={[styles.filterButton, { borderColor: colors.border }]}>
            <Text style={[styles.filterButtonText, { color: colors.textPrimary }]}>
              {branches?.find(b => b.id === selectedBranch)?.name || 'Select Branch'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Academic Year</Text>
          <TouchableOpacity style={[styles.filterButton, { borderColor: colors.border }]}>
            <Text style={[styles.filterButtonText, { color: colors.textPrimary }]}>
              {academicYears?.find(ay => ay.id === selectedAcademicYear)?.name || 'Select Year'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {analyticsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading analytics...
          </Text>
        </View>
      ) : analyticsError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Failed to load analytics. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetchAnalytics}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={analyticsLoading}
              onRefresh={refetchAnalytics}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {renderOverviewCards()}

          {/* Pass vs Fail Pie Chart */}
          {passFailData.length > 0 && (
            <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
                Pass vs Fail Distribution
              </Text>
              <PieChart
                data={passFailData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 0]}
              />
            </View>
          )}

          {/* Standards Bar Chart */}
          {standardsBarData.labels.length > 0 && (
            <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
                Average Marks by Standard
              </Text>
              <BarChart
                data={standardsBarData}
                width={screenWidth - 64}
                height={220}
                yAxisLabel=""
                yAxisSuffix="%"
                chartConfig={chartConfig}
                verticalLabelRotation={30}
              />
            </View>
          )}

          {/* Departments Bar Chart */}
          {departmentsBarData.labels.length > 0 && (
            <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
                Subject-wise Average Marks
              </Text>
              <BarChart
                data={departmentsBarData}
                width={screenWidth - 64}
                height={220}
                yAxisLabel=""
                yAxisSuffix="%"
                chartConfig={chartConfig}
                verticalLabelRotation={30}
              />
            </View>
          )}

          {/* Section Performance Bar Chart */}
          {sectionsBarData.labels.length > 0 && (
            <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
                Section-wise Pass Rate
              </Text>
              <BarChart
                data={sectionsBarData}
                width={screenWidth - 64}
                height={220}
                yAxisLabel=""
                yAxisSuffix="%"
                chartConfig={chartConfig}
                verticalLabelRotation={30}
              />
            </View>
          )}

          {renderStandardsBreakdown()}
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
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButtonText: {
    fontSize: 14,
    textAlign: 'center',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
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
  content: {
    flex: 1,
    padding: 16,
  },
  overviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  overviewCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  chartContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  standardCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  standardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  standardName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentCount: {
    fontSize: 12,
  },
  standardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  sectionsContainer: {
    marginTop: 8,
  },
  sectionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  sectionChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionChipText: {
    fontSize: 10,
  },
});
