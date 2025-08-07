
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { apiService } from '@/api/apiService';
import { useBranches, useAcademicYears } from '@/hooks/useApi';

interface Visitor {
  id: number;
  name: string;
  phone: string;
  relation: string;
  visited_date: string;
  vacated_date?: string;
  check_in_time: string;
  check_out_time?: string;
  alternative_phone?: string;
  profile_pic?: string;
  reasons: string;
  student: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    employee_id: string;
  };
  allowed_by: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export default function HostelVisitorsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [visitorModalVisible, setVisitorModalVisible] = useState(false);

  const { data: branches } = useBranches();
  const { data: academicYears } = useAcademicYears();

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const response = await apiService.api.get('/api/hostel-visitors/');
      setVisitors(response.data.results || []);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      Alert.alert('Error', 'Failed to fetch visitors');
    } finally {
      setLoading(false);
    }
  };

  const checkOutVisitor = async (visitorId: number) => {
    try {
      await apiService.api.post(`/api/hostel-visitors/${visitorId}/check_out/`);
      Alert.alert('Success', 'Visitor checked out successfully');
      fetchVisitors();
    } catch (error) {
      console.error('Error checking out visitor:', error);
      Alert.alert('Error', 'Failed to check out visitor');
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [selectedBranch, selectedAcademicYear]);

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = 
      visitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visitor.student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visitor.student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visitor.phone.includes(searchQuery);

    const isActive = !visitor.check_out_time;
    const matchesStatus = 
      statusFilter === 'All' ||
      (statusFilter === 'Active' && isActive) ||
      (statusFilter === 'Inactive' && !isActive);

    return matchesSearch && matchesStatus;
  });

  const handleVisitorPress = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setVisitorModalVisible(true);
  };

  const handleCheckOut = (visitor: Visitor) => {
    Alert.alert(
      'Check Out Visitor',
      `Are you sure you want to check out ${visitor.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Check Out', onPress: () => checkOutVisitor(visitor.id) }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderVisitor = (visitor: Visitor) => {
    const isActive = !visitor.check_out_time;
    
    return (
      <TouchableOpacity
        key={visitor.id}
        style={[styles.visitorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => handleVisitorPress(visitor)}
      >
        <View style={styles.visitorHeader}>
          <View style={styles.visitorInfo}>
            <Text style={[styles.visitorName, { color: colors.textPrimary }]}>
              {visitor.name}
            </Text>
            <Text style={[styles.visitorPhone, { color: colors.textSecondary }]}>
              {visitor.phone}
            </Text>
            <Text style={[styles.visitorRelation, { color: colors.textSecondary }]}>
              {visitor.relation}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: isActive ? '#F59E0B' : '#10B981' }
          ]}>
            <Text style={styles.statusText}>
              {isActive ? 'In' : 'Out'}
            </Text>
          </View>
        </View>

        <View style={styles.visitDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Visiting:</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {visitor.student.first_name} {visitor.student.last_name}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Student ID:</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {visitor.student.employee_id}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date:</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {formatDate(visitor.visited_date)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Check-in:</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {formatTime(visitor.check_in_time)}
            </Text>
          </View>
          {visitor.check_out_time && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Check-out:</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {formatTime(visitor.check_out_time)}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Purpose:</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {visitor.reasons}
            </Text>
          </View>
        </View>

        {isActive && (
          <TouchableOpacity
            style={[styles.checkOutButton, { backgroundColor: colors.primary }]}
            onPress={() => handleCheckOut(visitor)}
          >
            <Text style={styles.checkOutButtonText}>Check Out</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Hostel Visitors"
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
        {/* Search */}
        <TextInput
          style={[
            styles.searchInput,
            { 
              backgroundColor: colors.background, 
              borderColor: colors.border, 
              color: colors.textPrimary 
            }
          ]}
          placeholder="Search visitors..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Branch Filter */}
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Branch</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {branches?.map((branch: any) => (
                <TouchableOpacity
                  key={branch.id}
                  style={[
                    styles.filterButton,
                    { borderColor: colors.border },
                    selectedBranch === branch.id && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setSelectedBranch(branch.id)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    { color: selectedBranch === branch.id ? '#FFFFFF' : colors.textPrimary }
                  ]}>
                    {branch.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Academic Year Filter */}
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Academic Year</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {academicYears?.map((year: any) => (
                <TouchableOpacity
                  key={year.id}
                  style={[
                    styles.filterButton,
                    { borderColor: colors.border },
                    selectedAcademicYear === year.id && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setSelectedAcademicYear(year.id)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    { color: selectedAcademicYear === year.id ? '#FFFFFF' : colors.textPrimary }
                  ]}>
                    {year.year_range}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Status Filter */}
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['All', 'Active', 'Inactive'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    { borderColor: colors.border },
                    statusFilter === status && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setStatusFilter(status as any)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    { color: statusFilter === status ? '#FFFFFF' : colors.textPrimary }
                  ]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Visitors List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchVisitors} />
        }
      >
        {filteredVisitors.length > 0 ? (
          filteredVisitors.map(renderVisitor)
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No visitors match your search' : 'No visitors found'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Visitor Details Modal */}
      <Modal
        visible={visitorModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVisitorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Visitor Details
              </Text>
              <TouchableOpacity
                onPress={() => setVisitorModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedVisitor && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.visitorProfile}>
                  <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                    {selectedVisitor.name}
                  </Text>
                  <Text style={[styles.profilePhone, { color: colors.textSecondary }]}>
                    {selectedVisitor.phone}
                  </Text>
                  {selectedVisitor.alternative_phone && (
                    <Text style={[styles.profilePhone, { color: colors.textSecondary }]}>
                      Alt: {selectedVisitor.alternative_phone}
                    </Text>
                  )}
                </View>

                <View style={styles.detailsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Visit Information
                  </Text>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                      Visiting Student:
                    </Text>
                    <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                      {selectedVisitor.student.first_name} {selectedVisitor.student.last_name}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                      Student ID:
                    </Text>
                    <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                      {selectedVisitor.student.employee_id}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                      Relation:
                    </Text>
                    <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                      {selectedVisitor.relation}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                      Purpose:
                    </Text>
                    <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                      {selectedVisitor.reasons}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                      Visit Date:
                    </Text>
                    <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                      {formatDate(selectedVisitor.visited_date)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                      Check-in Time:
                    </Text>
                    <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                      {formatTime(selectedVisitor.check_in_time)}
                    </Text>
                  </View>
                  {selectedVisitor.check_out_time && (
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                        Check-out Time:
                      </Text>
                      <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                        {formatTime(selectedVisitor.check_out_time)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Authorization
                  </Text>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                      Allowed By:
                    </Text>
                    <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                      {selectedVisitor.allowed_by.first_name} {selectedVisitor.allowed_by.last_name}
                    </Text>
                  </View>
                </View>

                {!selectedVisitor.check_out_time && (
                  <TouchableOpacity
                    style={[styles.modalCheckOutButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      setVisitorModalVisible(false);
                      handleCheckOut(selectedVisitor);
                    }}
                  >
                    <Text style={styles.modalCheckOutButtonText}>Check Out Visitor</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    padding: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  visitorCard: {
    padding: 16,
    borderRadius: 12,
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
  visitorPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  visitorRelation: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  visitDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  checkOutButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkOutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    maxHeight: 500,
  },
  visitorProfile: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    marginBottom: 2,
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItemLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailItemValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  modalCheckOutButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCheckOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
