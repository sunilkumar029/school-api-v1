
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme, fontSizes } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';

const { width } = Dimensions.get('window');

interface ChartData {
  label: string;
  value: number;
  color: string;
}

export default function AnalyticsScreen() {
  const { colors, fontSize } = useTheme();
  const { user } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'week' | 'month' | 'year'>('month');

  // Mock data
  const attendanceData: ChartData[] = [
    { label: 'Present', value: 85, color: '#4CAF50' },
    { label: 'Absent', value: 10, color: '#F44336' },
    { label: 'Late', value: 5, color: '#FF9800' },
  ];

  const performanceData: ChartData[] = [
    { label: 'Mathematics', value: 92, color: '#2196F3' },
    { label: 'Science', value: 88, color: '#9C27B0' },
    { label: 'English', value: 95, color: '#00BCD4' },
    { label: 'History', value: 78, color: '#FF5722' },
    { label: 'Geography', value: 82, color: '#795548' },
  ];

  const kpiData = [
    { title: 'Overall Attendance', value: '94.2%', change: '+2.1%', isPositive: true },
    { title: 'Average Score', value: '87.4', change: '+5.2', isPositive: true },
    { title: 'Assignments Submitted', value: '23/25', change: '+2', isPositive: true },
    { title: 'Pending Tasks', value: '3', change: '-2', isPositive: true },
  ];

  const renderBarChart = (data: ChartData[], title: string) => {
    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{title}</Text>
        <View style={styles.chartContent}>
          {data.map((item, index) => (
            <View key={index} style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    height: (item.value / maxValue) * 120,
                    backgroundColor: item.color,
                    width: (width - 80) / data.length - 8,
                  },
                ]}
              />
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
              <Text style={[styles.barValue, { color: colors.textPrimary }]}>
                {item.value}{title.includes('Attendance') ? '%' : ''}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPieChart = (data: ChartData[], title: string) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{title}</Text>
        <View style={styles.pieChartContainer}>
          <View style={styles.pieChart}>
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              return (
                <View key={index} style={[styles.pieSlice, { backgroundColor: item.color }]} />
              );
            })}
          </View>
          <View style={styles.pieLegend}>
            {data.map((item, index) => {
              const percentage = ((item.value / total) * 100).toFixed(1);
              return (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: colors.textPrimary }]}>
                    {item.label}: {percentage}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Analytics"
        onMenuPress={() => setDrawerVisible(true)}
        showSettings={false}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {['week', 'month', 'year'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveFilter(filter as any)}
          >
            <Text
              style={[
                styles.filterText,
                { color: activeFilter === filter ? colors.primary : colors.textSecondary },
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* KPI Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Key Metrics</Text>
          <View style={styles.kpiGrid}>
            {kpiData.map((kpi, index) => (
              <View key={index} style={[styles.kpiCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.kpiTitle, { color: colors.textSecondary }]}>{kpi.title}</Text>
                <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{kpi.value}</Text>
                <View style={styles.kpiChange}>
                  <Text
                    style={[
                      styles.kpiChangeText,
                      { color: kpi.isPositive ? '#4CAF50' : '#F44336' },
                    ]}
                  >
                    {kpi.change}
                  </Text>
                  <Text style={[styles.kpiChangeLabel, { color: colors.textSecondary }]}>
                    vs last {activeFilter}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Charts */}
        <View style={styles.section}>
          {renderPieChart(attendanceData, 'Attendance Distribution')}
        </View>

        <View style={styles.section}>
          {renderBarChart(performanceData, 'Subject Performance')}
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Export & Share</Text>
          <View style={styles.exportOptions}>
            <TouchableOpacity style={[styles.exportButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.exportIcon}>📄</Text>
              <Text style={styles.exportText}>Export PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.exportButton, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.exportIcon}>📊</Text>
              <Text style={styles.exportText}>Export Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.exportButton, { backgroundColor: '#FF9800' }]}>
              <Text style={styles.exportIcon}>📧</Text>
              <Text style={styles.exportText}>Email Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
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
  filterContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  kpiCard: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  kpiTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  kpiChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiChangeText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  kpiChangeLabel: {
    fontSize: 12,
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
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
    textAlign: 'center',
  },
  chartContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
  },
  barContainer: {
    alignItems: 'center',
  },
  bar: {
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  pieSlice: {
    flex: 1,
  },
  pieLegend: {
    flex: 1,
    marginLeft: 20,
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
    fontSize: 14,
  },
  exportOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exportButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  exportIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  exportText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});
