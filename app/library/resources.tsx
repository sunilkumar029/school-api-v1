
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';

interface Resource {
  id: string;
  title: string;
  author: string;
  category: string;
  type: 'ebook' | 'physical';
  subject: string;
  class: string;
  availability: 'available' | 'borrowed' | 'reserved';
  totalCopies: number;
  availableCopies: number;
}

export default function LibraryResourcesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ebook' | 'physical'>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  const [resources, setResources] = useState<Resource[]>([
    {
      id: '1',
      title: 'Advanced Mathematics',
      author: 'Dr. John Smith',
      category: 'Textbook',
      type: 'physical',
      subject: 'Mathematics',
      class: 'Grade 12',
      availability: 'available',
      totalCopies: 10,
      availableCopies: 7,
    },
    {
      id: '2',
      title: 'Physics Fundamentals',
      author: 'Prof. Sarah Johnson',
      category: 'Reference',
      type: 'ebook',
      subject: 'Physics',
      class: 'Grade 11',
      availability: 'available',
      totalCopies: 1,
      availableCopies: 1,
    },
    {
      id: '3',
      title: 'Chemistry Lab Manual',
      author: 'Dr. Michael Brown',
      category: 'Lab Manual',
      type: 'physical',
      subject: 'Chemistry',
      class: 'Grade 10',
      availability: 'borrowed',
      totalCopies: 5,
      availableCopies: 0,
    },
  ]);

  const subjects = ['all', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return '#34C759';
      case 'borrowed': return '#FF3B30';
      case 'reserved': return '#FF9500';
      default: return colors.textSecondary;
    }
  };

  const handleBorrow = (resourceId: string) => {
    setResources(prev => prev.map(resource => {
      if (resource.id === resourceId && resource.availability === 'available') {
        return {
          ...resource,
          availability: 'borrowed' as const,
          availableCopies: resource.availableCopies - 1,
        };
      }
      return resource;
    }));
  };

  const renderResourceCard = ({ item }: { item: Resource }) => (
    <View style={[styles.resourceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.resourceInfo}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.author, { color: colors.textSecondary }]}>by {item.author}</Text>
          <Text style={[styles.details, { color: colors.textSecondary }]}>
            {item.subject} • {item.class} • {item.category}
          </Text>
          <Text style={[styles.details, { color: colors.textSecondary }]}>
            {item.type === 'ebook' ? '📱 E-book' : '📚 Physical'}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getAvailabilityColor(item.availability) }]}>
            <Text style={styles.statusText}>{item.availability.toUpperCase()}</Text>
          </View>
          {item.type === 'physical' && (
            <Text style={[styles.copies, { color: colors.textSecondary }]}>
              {item.availableCopies}/{item.totalCopies} available
            </Text>
          )}
        </View>
      </View>

      {item.availability === 'available' && (
        <TouchableOpacity
          style={[styles.borrowButton, { backgroundColor: colors.primary }]}
          onPress={() => handleBorrow(item.id)}
        >
          <Text style={styles.borrowButtonText}>
            {item.type === 'ebook' ? 'Access' : 'Borrow'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || resource.type === filterType;
    const matchesSubject = filterSubject === 'all' || resource.subject === filterSubject;
    
    return matchesSearch && matchesType && matchesSubject;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Library Resources"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Search books, authors..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Type:</Text>
            {['all', 'ebook', 'physical'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  { 
                    backgroundColor: filterType === type ? colors.primary : 'transparent',
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setFilterType(type as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: filterType === type ? '#FFFFFF' : colors.textSecondary }
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Subject:</Text>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject}
                style={[
                  styles.filterButton,
                  { 
                    backgroundColor: filterSubject === subject ? colors.primary : 'transparent',
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setFilterSubject(subject)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: filterSubject === subject ? '#FFFFFF' : colors.textSecondary }
                ]}>
                  {subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={filteredResources}
        renderItem={renderResourceCard}
        keyExtractor={(item) => item.id}
        style={styles.resourceList}
        showsVerticalScrollIndicator={false}
      />
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
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resourceList: {
    padding: 16,
  },
  resourceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    marginBottom: 4,
  },
  details: {
    fontSize: 12,
    marginBottom: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  copies: {
    fontSize: 10,
  },
  borrowButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  borrowButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
