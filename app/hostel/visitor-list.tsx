
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';

interface Visitor {
  id: string;
  visitorName: string;
  visitingStudent: string;
  studentRoom: string;
  purpose: string;
  inTime: string;
  outTime: string | null;
  status: 'In' | 'Completed';
  contactNo: string;
}

export default function VisitorListScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('Today');

  const visitors: Visitor[] = [
    {
      id: '1',
      visitorName: 'Robert Johnson',
      visitingStudent: 'John Smith',
      studentRoom: 'H101',
      purpose: 'Family Visit',
      inTime: '2024-01-20 14:30',
      outTime: null,
      status: 'In',
      contactNo: '+1234567890'
    },
    {
      id: '2',
      visitorName: 'Mary Wilson',
      visitingStudent: 'Emily Davis',
      studentRoom: 'H205',
      purpose: 'Academic Discussion',
      inTime: '2024-01-20 10:15',
      outTime: '2024-01-20 16:45',
      status: 'Completed',
      contactNo: '+1234567891'
    },
    {
      id: '3',
      visitorName: 'David Brown',
      visitingStudent: 'Alex Thompson',
      studentRoom: 'H303',
      purpose: 'Personal Visit',
      inTime: '2024-01-19 13:20',
      outTime: '2024-01-19 18:30',
      status: 'Completed',
      contactNo: '+1234567892'
    }
  ];

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = visitor.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         visitor.visitingStudent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleCheckOut = (visitorId: string) => {
    // Logic to mark visitor as checked out
    console.log('Checking out visitor:', visitorId);
  };

  const renderVisitorCard = (visitor: Visitor) => (
    <View key={visitor.id} style={[styles.visitorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.visitorHeader}>
        <View style={styles.visitorInfo}>
          <Text style={[styles.visitorName, { color: colors.textPrimary }]}>{visitor.visitorName}</Text>
          <Text style={[styles.contactNumber, { color: colors.textSecondary }]}>{visitor.contactNo}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: visitor.status === 'In' ? '#F59E0B' : '#10B981' }
        ]}>
          <Text style={styles.statusText}>{visitor.status}</Text>
        </View>
      </View>
      
      <View style={styles.visitDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Visiting:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
            {visitor.visitingStudent} ({visitor.studentRoom})
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Purpose:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{visitor.purpose}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>In-Time:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{visitor.inTime}</Text>
        </View>
        {visitor.outTime && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Out-Time:</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{visitor.outTime}</Text>
          </View>
        )}
      </View>
      
      {visitor.status === 'In' && (
        <TouchableOpacity
          style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
          onPress={() => handleCheckOut(visitor.id)}
        >
          <Text style={styles.checkoutButtonText}>Mark as Checked Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Visitor Management"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Search and Filter */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Search by visitor or student name..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
          {['Today', 'This Week', 'This Month', 'All Time'].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.filterButton,
                { borderColor: colors.border },
                dateRange === range && { backgroundColor: colors.primary }
              ]}
              onPress={() => setDateRange(range)}
            >
              <Text style={[
                styles.filterButtonText,
                { color: dateRange === range ? '#FFFFFF' : colors.textPrimary }
              ]}>
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Add Visitor Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/hostel/add-visitor')}
        >
          <Text style={styles.addButtonText}>+ Add New Visitor</Text>
        </TouchableOpacity>
      </View>

      {/* Visitors List */}
      <ScrollView style={styles.visitorsList}>
        {filteredVisitors.length > 0 ? (
          filteredVisitors.map(renderVisitorCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No visitors found
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
  filterContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  filterScrollView: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionContainer: {
    padding: 16,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  visitorsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  visitorCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  visitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  visitorInfo: {
    flex: 1,
  },
  visitorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactNumber: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  visitDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  checkoutButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 16,
  },
});
