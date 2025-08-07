
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { ModalDropdownFilter } from '@/components/ModalDropdownFilter';
import { useHostelMealPlans } from '@/hooks/useApi';

export default function HostelCanteenScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('today');

  const {
    selectedBranch,
    selectedAcademicYear,
    branches,
    academicYears,
    setSelectedBranch,
    setSelectedAcademicYear
  } = useGlobalFilters();

  // Fetch meal plans with filters
  const mealPlansParams = useMemo(() => ({
    branch: selectedBranch,
    academic_year: selectedAcademicYear,
    ...(selectedMealType && { meal_type: selectedMealType }),
    ...(selectedDate !== 'all' && { date: selectedDate }),
  }), [selectedBranch, selectedAcademicYear, selectedMealType, selectedDate]);

  const {
    data: mealPlans = [],
    loading: mealPlansLoading,
    error: mealPlansError,
    refetch: refetchMealPlans
  } = useHostelMealPlans(mealPlansParams);

  const mealTypeOptions = [
    { id: null, name: 'All Meals' },
    { id: 'breakfast', name: 'Breakfast' },
    { id: 'lunch', name: 'Lunch' },
    { id: 'snacks', name: 'Snacks' },
    { id: 'dinner', name: 'Dinner' }
  ];

  const dateOptions = [
    { id: 'today', name: 'Today' },
    { id: 'tomorrow', name: 'Tomorrow' },
    { id: 'this_week', name: 'This Week' },
    { id: 'all', name: 'All' }
  ];

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType?.toLowerCase()) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🌞';
      case 'snacks': return '🍪';
      case 'dinner': return '🌙';
      default: return '🍽️';
    }
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType?.toLowerCase()) {
      case 'breakfast': return '#F59E0B';
      case 'lunch': return '#10B981';
      case 'snacks': return '#8B5CF6';
      case 'dinner': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const renderMealPlanCard = (mealPlan: any) => (
    <View
      key={mealPlan.id}
      style={[
        styles.mealCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderLeftColor: getMealTypeColor(mealPlan.meal_type)
        }
      ]}
    >
      <View style={styles.mealHeader}>
        <View style={styles.mealInfo}>
          <Text style={styles.mealIcon}>
            {getMealTypeIcon(mealPlan.meal_type)}
          </Text>
          <View style={styles.mealDetails}>
            <Text style={[styles.mealType, { color: colors.textPrimary }]}>
              {mealPlan.meal_type?.toUpperCase()}
            </Text>
            <Text style={[styles.mealDate, { color: colors.textSecondary }]}>
              {new Date(mealPlan.date).toLocaleDateString()}
            </Text>
            <Text style={[styles.mealTime, { color: colors.textSecondary }]}>
              {mealPlan.start_time} - {mealPlan.end_time}
            </Text>
          </View>
        </View>
        
        {mealPlan.price && (
          <View style={[styles.priceBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.priceText, { color: colors.primary }]}>
              ₹{mealPlan.price}
            </Text>
          </View>
        )}
      </View>

      {mealPlan.menu_items && mealPlan.menu_items.length > 0 && (
        <View style={styles.menuSection}>
          <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
            Menu Items:
          </Text>
          <View style={styles.menuItems}>
            {mealPlan.menu_items.map((item: any, index: number) => (
              <View
                key={index}
                style={[styles.menuItem, { backgroundColor: colors.background }]}
              >
                <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                  {item.name}
                </Text>
                {item.description && (
                  <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                )}
                {item.dietary_info && (
                  <View style={styles.dietaryTags}>
                    {item.dietary_info.map((tag: string, tagIndex: number) => (
                      <View
                        key={tagIndex}
                        style={[styles.dietaryTag, { backgroundColor: colors.primary + '20' }]}
                      >
                        <Text style={[styles.dietaryText, { color: colors.primary }]}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {mealPlan.special_notes && (
        <View style={styles.notesSection}>
          <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>
            Special Notes:
          </Text>
          <Text style={[styles.notesText, { color: colors.textPrimary }]}>
            {mealPlan.special_notes}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Hostel Canteen"
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
              label="Meal Type"
              items={mealTypeOptions}
              selectedValue={selectedMealType}
              onValueChange={setSelectedMealType}
              compact={true}
            />
            
            <ModalDropdownFilter
              label="Date"
              items={dateOptions}
              selectedValue={selectedDate}
              onValueChange={setSelectedDate}
              compact={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      {mealPlansLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading meal plans...
          </Text>
        </View>
      ) : mealPlansError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Failed to load meal plans. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetchMealPlans}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={mealPlansLoading}
              onRefresh={refetchMealPlans}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {mealPlans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No meal plans found for the selected criteria
              </Text>
            </View>
          ) : (
            <View style={styles.mealsList}>
              {mealPlans.map(renderMealPlanCard)}
            </View>
          )}
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
  mealsList: {
    padding: 16,
  },
  mealCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  mealDetails: {
    flex: 1,
  },
  mealType: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mealDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  mealTime: {
    fontSize: 12,
  },
  priceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuSection: {
    marginBottom: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  menuItems: {
    gap: 8,
  },
  menuItem: {
    padding: 12,
    borderRadius: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    marginBottom: 6,
  },
  dietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dietaryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dietaryText: {
    fontSize: 10,
    fontWeight: '500',
  },
  notesSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  notesLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    fontStyle: 'italic',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
