import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Calendar,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { SideDrawer } from "@/components/SideDrawer";
import { useGlobalFilters } from "@/contexts/GlobalFiltersContext";
import { ModalDropdownFilter } from "@/components/ModalDropdownFilter";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHolidays } from "@/hooks/useApi";

interface Holiday {
  id: number;
  name: string;
  date: string;
  type: "public" | "optional" | "restricted";
  description?: string;
  branch?: {
    id: number;
    name: string;
  };
  is_active: boolean;
}

export default function HolidayCalendarScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");

  // Global filters
  const {
    selectedBranch,
    selectedAcademicYear,
    branches,
    academicYears,
    branchesLoading,
    academicYearsLoading,
  } = useGlobalFilters();

  const holidaysParams = useMemo(
    () => ({
      branch: selectedBranch,
      academic_year: selectedAcademicYear,
      year: selectedYear,
      month: selectedMonth,
      type: selectedType,
      is_active: true,
    }),
    [
      selectedBranch,
      selectedAcademicYear,
      selectedYear,
      selectedMonth,
      selectedType,
    ],
  );

  const {
    data: holidays = [],
    loading: holidaysLoading,
    error: holidaysError,
    refetch: refetchHolidays,
  } = useHolidays(holidaysParams);

  // Generate year options (current year ± 5 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      years.push({ id: year, name: year.toString() });
    }
    return years;
  }, []);

  // Month options
  const monthOptions = useMemo(
    () => [
      { id: 0, name: "All Months" },
      { id: 1, name: "January" },
      { id: 2, name: "February" },
      { id: 3, name: "March" },
      { id: 4, name: "April" },
      { id: 5, name: "May" },
      { id: 6, name: "June" },
      { id: 7, name: "July" },
      { id: 8, name: "August" },
      { id: 9, name: "September" },
      { id: 10, name: "October" },
      { id: 11, name: "November" },
      { id: 12, name: "December" },
    ],
    [],
  );

  // Holiday type options
  const typeOptions = useMemo(
    () => [
      { id: 0, name: "All Types" },
      { id: 1, name: "Public Holiday" },
      { id: 2, name: "Optional Holiday" },
      { id: 3, name: "Restricted Holiday" },
    ],
    [],
  );

  const typeMapping = {
    0: null,
    1: "public",
    2: "optional",
    3: "restricted",
  };

  const getHolidayTypeColor = (type: string) => {
    switch (type) {
      case "public":
        return colors.error || "#ef4444";
      case "optional":
        return colors.warning || "#f59e0b";
      case "restricted":
        return colors.info || "#3b82f6";
      default:
        return colors.textSecondary || "#6b7280";
    }
  };

  const getHolidayTypeLabel = (type: string) => {
    switch (type) {
      case "public":
        return "Public Holiday";
      case "optional":
        return "Optional Holiday";
      case "restricted":
        return "Restricted Holiday";
      default:
        return "Unknown Type";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatShortDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  const groupHolidaysByMonth = (holidays: Holiday[]) => {
    const grouped = new Map();
    holidays.forEach((holiday) => {
      if (holiday.date) {
        const month = new Date(holiday.date).getMonth();
        const monthName = monthOptions[month + 1]?.name || "Unknown";
        if (!grouped.has(monthName)) {
          grouped.set(monthName, []);
        }
        grouped.get(monthName).push(holiday);
      }
    });
    return grouped;
  };

  const handleRefresh = () => {
    refetchHolidays();
  };

  const renderHolidayCard = ({ item }: { item: Holiday }) => (
    <View
      style={[
        styles.holidayCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.holidayHeader}>
        <Text
          style={[styles.holidayName, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {item.name || "Unnamed Holiday"}
        </Text>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: getHolidayTypeColor(item.type) + "20" },
          ]}
        >
          <Text
            style={[styles.typeText, { color: getHolidayTypeColor(item.type) }]}
          >
            {getHolidayTypeLabel(item.type)}
          </Text>
        </View>
      </View>

      <Text style={[styles.holidayDate, { color: colors.primary }]}>
        {formatDate(item.date)}
      </Text>

      {item.description && (
        <Text
          style={[styles.holidayDescription, { color: colors.textSecondary }]}
          numberOfLines={3}
        >
          {item.description}
        </Text>
      )}

      {item.branch && (
        <Text style={[styles.branchInfo, { color: colors.textSecondary }]}>
          Branch: {item.branch.name}
        </Text>
      )}
    </View>
  );

  const renderMonthSection = (monthName: string, monthHolidays: Holiday[]) => (
    <View key={monthName} style={styles.monthSection}>
      <Text style={[styles.monthHeader, { color: colors.primary }]}>
        {monthName} {selectedYear}
      </Text>
      {monthHolidays.map((holiday, index) => (
        <View
          key={holiday.id}
          style={[
            styles.monthHolidayItem,
            { borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.monthHolidayInfo}>
            <Text
              style={[styles.monthHolidayName, { color: colors.textPrimary }]}
            >
              {holiday.name}
            </Text>
            <Text
              style={[styles.monthHolidayDate, { color: colors.textSecondary }]}
            >
              {formatShortDate(holiday.date)}
            </Text>
          </View>
          <View
            style={[
              styles.monthTypeBadge,
              { backgroundColor: getHolidayTypeColor(holiday.type) + "20" },
            ]}
          >
            <Text
              style={[
                styles.monthTypeText,
                { color: getHolidayTypeColor(holiday.type) },
              ]}
            >
              {holiday.type.toUpperCase()}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderCalendarView = () => {
    const groupedHolidays = groupHolidaysByMonth(holidays);
    const sortedMonths = Array.from(groupedHolidays.keys()).sort((a, b) => {
      const monthA = monthOptions.findIndex((m) => m.name === a);
      const monthB = monthOptions.findIndex((m) => m.name === b);
      return monthA - monthB;
    });

    return (
      <ScrollView
        style={styles.calendarView}
        refreshControl={
          <RefreshControl
            refreshing={holidaysLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {sortedMonths.map((month) =>
          renderMonthSection(month, groupedHolidays.get(month) || []),
        )}
      </ScrollView>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
        No Holidays Found
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        There are no holidays matching your current filters for the selected
        period.
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={[styles.errorTitle, { color: colors.error }]}>
        Unable to Load Holiday Calendar
      </Text>
      <Text style={[styles.errorText, { color: colors.textSecondary }]}>
        Please check your connection and try again.
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={handleRefresh}
      >
        <Text style={[styles.retryButtonText, { color: colors.surface }]}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (branchesLoading || academicYearsLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <TopBar
          title="Holiday Calendar"
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationPress={() => router.push("/notifications")}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading filters...
          </Text>
        </View>
        <SideDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <TopBar
        title="Holiday Calendar"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationPress={() => router.push("/notifications")}
      />

      {/* Global Filters */}
      <View
        style={[
          styles.filtersContainer,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
        >
          <View style={styles.filtersRow}>
            <Text
              style={[styles.filtersLabel, { color: colors.textSecondary }]}
            >
              Filters:
            </Text>

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
              label="Year"
              items={yearOptions}
              selectedValue={selectedYear}
              onValueChange={(value) => setSelectedYear(value)}
              compact={true}
            />

            <ModalDropdownFilter
              label="Month"
              items={monthOptions}
              selectedValue={selectedMonth || 0}
              onValueChange={(value) =>
                setSelectedMonth(value === 0 ? null : value)
              }
              compact={true}
            />

            <ModalDropdownFilter
              label="Type"
              items={typeOptions}
              selectedValue={
                selectedType
                  ? Object.keys(typeMapping).find(
                      (key) => typeMapping[key] === selectedType,
                    ) || 0
                  : 0
              }
              onValueChange={(value) => setSelectedType(typeMapping[value])}
              compact={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* View Mode Toggle */}
      <View
        style={[
          styles.viewModeContainer,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              {
                backgroundColor:
                  viewMode === "list" ? colors.primary : "transparent",
              },
            ]}
            onPress={() => setViewMode("list")}
          >
            <Text
              style={[
                styles.viewModeText,
                {
                  color:
                    viewMode === "list" ? colors.surface : colors.textPrimary,
                },
              ]}
            >
              List View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              {
                backgroundColor:
                  viewMode === "calendar" ? colors.primary : "transparent",
              },
            ]}
            onPress={() => setViewMode("calendar")}
          >
            <Text
              style={[
                styles.viewModeText,
                {
                  color:
                    viewMode === "calendar"
                      ? colors.surface
                      : colors.textPrimary,
                },
              ]}
            >
              Calendar View
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {holidaysLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading holidays...
            </Text>
          </View>
        ) : holidaysError ? (
          renderErrorState()
        ) : holidays.length === 0 ? (
          renderEmptyState()
        ) : viewMode === "calendar" ? (
          renderCalendarView()
        ) : (
          <FlatList
            data={holidays}
            renderItem={renderHolidayCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={holidaysLoading}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  viewModeContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  viewModeToggle: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  holidayCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  holidayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  holidayName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  typeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  holidayDate: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  holidayDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  branchInfo: {
    fontSize: 12,
  },
  calendarView: {
    flex: 1,
    padding: 16,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  monthHolidayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  monthHolidayInfo: {
    flex: 1,
  },
  monthHolidayName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  monthHolidayDate: {
    fontSize: 12,
  },
  monthTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  monthTypeText: {
    fontSize: 8,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
