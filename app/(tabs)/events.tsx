
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { useTheme, fontSizes } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';

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
  status: 'upcoming' | 'past';
}

export default function EventsScreen() {
  const { colors, fontSize } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'create'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  const events: Event[] = [
    {
      id: '1',
      title: 'Science Fair 2024',
      date: 'Jan 15, 2024',
      time: '10:00 AM - 4:00 PM',
      location: 'Main Auditorium',
      tags: ['Academic', 'Competition'],
      attendees: 45,
      maxAttendees: 100,
      description: 'Annual science fair showcasing student projects',
      isRSVPed: true,
      status: 'upcoming',
    },
    {
      id: '2',
      title: 'Parent-Teacher Meeting',
      date: 'Jan 20, 2024',
      time: '2:00 PM - 5:00 PM',
      location: 'Classrooms',
      tags: ['Meeting', 'Academic'],
      attendees: 120,
      description: 'Quarterly parent-teacher interactions',
      isRSVPed: false,
      status: 'upcoming',
    },
    {
      id: '3',
      title: 'Sports Day',
      date: 'Dec 10, 2023',
      time: '9:00 AM - 3:00 PM',
      location: 'Sports Ground',
      tags: ['Sports', 'Competition'],
      attendees: 200,
      description: 'Annual sports day event',
      isRSVPed: true,
      status: 'past',
    },
  ];

  const filteredEvents = events
    .filter(event => event.status === (activeTab === 'create' ? 'upcoming' : activeTab))
    .filter(event => 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const handleRSVP = (eventId: string) => {
    // Handle RSVP logic here
    console.log('RSVP for event:', eventId);
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.eventHeader}>
        <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>{item.title}</Text>
        <View style={styles.tags}>
          {item.tags.map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.eventDetails}>
        <Text style={[styles.eventDate, { color: colors.textPrimary }]}>📅 {item.date}</Text>
        <Text style={[styles.eventTime, { color: colors.textSecondary }]}>🕒 {item.time}</Text>
        <Text style={[styles.eventLocation, { color: colors.textSecondary }]}>📍 {item.location}</Text>
        <Text style={[styles.eventAttendees, { color: colors.textSecondary }]}>
          👥 {item.attendees}{item.maxAttendees ? `/${item.maxAttendees}` : ''} attendees
        </Text>
      </View>

      <Text style={[styles.eventDescription, { color: colors.textSecondary }]}>
        {item.description}
      </Text>

      {activeTab === 'upcoming' && (
        <TouchableOpacity
          style={[
            styles.rsvpButton,
            { backgroundColor: item.isRSVPed ? colors.surface : colors.primary },
            { borderColor: colors.primary, borderWidth: item.isRSVPed ? 1 : 0 }
          ]}
          onPress={() => handleRSVP(item.id)}
        >
          <Text style={[
            styles.rsvpButtonText,
            { color: item.isRSVPed ? colors.primary : '#FFFFFF' }
          ]}>
            {item.isRSVPed ? 'RSVP\'d ✓' : 'RSVP'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCreateEventForm = () => (
    <ScrollView style={styles.createForm}>
      <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Create New Event</Text>
      
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Event Title</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Enter event title"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Date & Time</Text>
        <View style={styles.dateTimeRow}>
          <TextInput
            style={[styles.input, styles.dateInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Select date"
            placeholderTextColor={colors.textSecondary}
          />
          <TextInput
            style={[styles.input, styles.timeInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Select time"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Location</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Enter location"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Description</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Enter event description"
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]}>
        <Text style={styles.createButtonText}>Create Event</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar 
        title="Events"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />
      
      <SideDrawer 
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Search Bar */}
      {activeTab !== 'create' && (
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Search events..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'upcoming' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'upcoming' ? colors.primary : colors.textSecondary }
          ]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'past' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'past' ? colors.primary : colors.textSecondary }
          ]}>
            Past
          </Text>
        </TouchableOpacity>
        {user?.is_staff && (
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'create' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('create')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'create' ? colors.primary : colors.textSecondary }
            ]}>
              Create Event
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {activeTab === 'create' ? (
        renderCreateEventForm()
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          style={styles.eventsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
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
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  eventHeader: {
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontWeight: '600',
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDate: {
    fontSize: 14,
    fontWeight: '600',
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
    alignItems: 'center',
  },
  rsvpButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createForm: {
    flex: 1,
    padding: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
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
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 2,
  },
  timeInput: {
    flex: 1,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
