import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { SideDrawer } from "@/components/SideDrawer";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEvents } from "@/hooks/useApi";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  tags: string[];
  attendees: number;
  maxAttendees?: number;
  description: string;
  isRSVPed: boolean;
  status: "upcoming" | "past" | "ongoing";
  category: string;
  image?: string;
}

export default function EventsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "create">(
    "upcoming",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: events,
    loading,
    error,
    refetch,
  } = useEvents({
    is_active: true,
    limit: 10, // Further reduced limit to avoid timeouts
  });

  const getEventStatus = (startDate: string, endDate?: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;

    if (now < start) return "upcoming";
    if (now > end) return "past";
    return "ongoing";
  };

  const formatEventData = (apiEvents: any[]): Event[] => {
    if (!Array.isArray(apiEvents)) {
      return [];
    }

    return apiEvents.map((event) => ({
      id: event.id?.toString() || Math.random().toString(),
      title: event.name || "Untitled Event",
      date: event.start_date
        ? new Date(event.start_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "TBD",
      time: event.start_date
        ? new Date(event.start_date).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "TBD",
      location:
        event.location ||
        (event.branches && event.branches.length > 0
          ? event.branches[0].name
          : "TBD"),
      category: event.applies_to || "General",
      description: event.description || "No description available",
      status: getEventStatus(event.start_date, event.end_date),
      tags: [event.applies_to || "Event"].filter(Boolean),
      attendees: event.users?.length || 0,
      maxAttendees: undefined,
      isRSVPed: false, // This would need to be determined from user data
      image: event.image,
    }));
  };

  const formattedEvents = formatEventData(events || []);

  const filteredEvents = formattedEvents.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    let matchesFilter = false;

    if (activeTab === "create") {
      matchesFilter = true;
    } else if (activeTab === "past") {
      matchesFilter = event.status === "past";
    } else if (activeTab === "upcoming") {
      matchesFilter = event.status === "upcoming";
    }

    return matchesSearch && matchesFilter;
  });


  const handleRSVP = (eventId: string) => {
    // Handle RSVP logic here
    console.log("RSVP for event:", eventId);
  };

  const renderCreateEventForm = () => (
    <ScrollView style={styles.createForm}>
      <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
        Create New Event
      </Text>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          Event Title
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          placeholder="Enter event title"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          Date & Time
        </Text>
        <View style={styles.dateTimeRow}>
          <TextInput
            style={[
              styles.input,
              styles.dateInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Select date"
            placeholderTextColor={colors.textSecondary}
          />
          <TextInput
            style={[
              styles.input,
              styles.timeInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Select time"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          Location
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          placeholder="Enter location"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          Description
        </Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          placeholder="Enter event description"
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.createButtonText}>Create Event</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <TopBar
        title="Events"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Search Bar */}
      {activeTab !== "create" && (
        <View
          style={[styles.searchContainer, { backgroundColor: colors.surface }]}
        >
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Search events..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Tabs */}
      <View
        style={[
          styles.tabContainer,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "upcoming" && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "upcoming"
                    ? colors.primary
                    : colors.textSecondary,
              },
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "past" && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab("past")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "past" ? colors.primary : colors.textSecondary,
              },
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>
        {user?.is_staff && (
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "create" && {
                borderBottomColor: colors.primary,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setActiveTab("create")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "create"
                      ? colors.primary
                      : colors.textSecondary,
                },
              ]}
            >
              Create Event
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {activeTab === "create" ? (
        renderCreateEventForm()
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Events List */}
          <View style={styles.eventsList}>
            {loading && (!events || events.length === 0) ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text
                  style={[styles.loadingText, { color: colors.textSecondary }]}
                >
                  Loading events...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: "#FF6B6B" }]}>
                  Failed to load events. Please check your connection and try
                  again.
                </Text>
                <TouchableOpacity
                  onPress={refetch}
                  style={[
                    styles.retryButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredEvents.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  {searchQuery
                    ? "No events match your search"
                    : activeTab === "upcoming"
                      ? "No upcoming events"
                      : "No past events"}
                </Text>
              </View>
            ) : (
              <View style={styles.listContent}>
                {filteredEvents.map((event) => (
                  <View
                    key={event.id}
                    style={[
                      styles.eventCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.eventHeader}>
                      <Text
                        style={[
                          styles.eventTitle,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {event.title}
                      </Text>
                      <View style={styles.tags}>
                        {event.tags.map((tag, index) => (
                          <View
                            key={index}
                            style={[
                              styles.tag,
                              { backgroundColor: colors.primary + "20" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.tagText,
                                { color: colors.primary },
                              ]}
                            >
                              {tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={styles.eventDetails}>
                      <Text
                        style={[
                          styles.eventDate,
                          { color: colors.textPrimary },
                        ]}
                      >
                        📅 {event.date}
                      </Text>
                      <Text
                        style={[
                          styles.eventTime,
                          { color: colors.textSecondary },
                        ]}
                      >
                        🕒 {event.time}
                      </Text>
                      <Text
                        style={[
                          styles.eventLocation,
                          { color: colors.textSecondary },
                        ]}
                      >
                        📍 {event.location}
                      </Text>
                      <Text
                        style={[
                          styles.eventAttendees,
                          { color: colors.textSecondary },
                        ]}
                      >
                        👥 {event.attendees} attendees
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.eventDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {event.description}
                    </Text>

                    {activeTab === "upcoming" && (
                      <TouchableOpacity
                        style={[
                          styles.rsvpButton,
                          {
                            backgroundColor: event.isRSVPed
                              ? colors.surface
                              : colors.primary,
                          },
                          {
                            borderColor: colors.primary,
                            borderWidth: event.isRSVPed ? 1 : 0,
                          },
                        ]}
                        onPress={() => handleRSVP(event.id)}
                      >
                        <Text
                          style={[
                            styles.rsvpButtonText,
                            {
                              color: event.isRSVPed
                                ? colors.primary
                                : "#FFFFFF",
                            },
                          ]}
                        >
                          {event.isRSVPed ? "RSVP'd ✓" : "RSVP"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  eventsList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  eventHeader: {
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDate: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    marginBottom: 4,
  },
  eventAttendees: {
    fontSize: 14,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  rsvpButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  rsvpButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  createForm: {
    flex: 1,
    padding: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateInput: {
    flex: 2,
  },
  timeInput: {
    flex: 1,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlignVertical: "top",
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});