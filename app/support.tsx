
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '@/api/apiService';

interface SupportQuery {
  id: number;
  created: string;
  description: string;
  modified: string;
  subject: string;
  image?: string;
  comment: string;
  priority: 'Low' | 'Medium' | 'High';
  assigned_to?: any;
  status: 'Open' | 'In Progress' | 'Closed';
}

export default function SupportScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [queries, setQueries] = useState<SupportQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Open' | 'In Progress' | 'Closed'>('All');

  // Form State
  const [queryForm, setQueryForm] = useState({
    subject: '',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    comment: 'App' as 'App' | 'Tech' | 'Operation' | 'Subject',
    image: '',
  });

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSupportQueries({ omit: 'created_by,modified_by,user' });
      setQueries(response.results || []);
    } catch (error) {
      console.error('Error fetching support queries:', error);
      // Generate fallback data
      setQueries([
        {
          id: 1,
          created: '2025-06-03T12:12:39.959376+05:30',
          description: 'User list not visible',
          modified: '2025-06-03T12:12:39.959376+05:30',
          subject: 'Not visible data',
          comment: 'Tech',
          priority: 'Medium',
          assigned_to: null,
          status: 'Open',
        },
        {
          id: 2,
          created: '2025-06-08T12:08:31.733573+05:30',
          description: 'Payload errors',
          modified: '2025-06-08T12:08:31.733573+05:30',
          subject: 'Leave Approval/Rejection not working',
          comment: 'App',
          priority: 'High',
          assigned_to: null,
          status: 'Open',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchQueries();
  }, []);

  const filteredQueries = useMemo(() => {
    if (filterStatus === 'All') return queries;
    return queries.filter(query => query.status === filterStatus);
  }, [queries, filterStatus]);

  const handleCreateQuery = async () => {
    try {
      if (!queryForm.subject || !queryForm.description) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      await apiService.createSupportQuery({
        user_id: user?.id || 3,
        description: queryForm.description,
        priority: queryForm.priority,
        subject: queryForm.subject,
        comment: queryForm.comment,
        image: queryForm.image || null,
      });

      Alert.alert('Success', 'Query submitted successfully');
      setModalVisible(false);
      resetForm();
      fetchQueries();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit query');
    }
  };

  const resetForm = () => {
    setQueryForm({
      subject: '',
      description: '',
      priority: 'Medium',
      comment: 'App',
      image: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return '#FF9800';
      case 'In Progress': return '#2196F3';
      case 'Closed': return '#4CAF50';
      default: return colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#F44336';
      case 'Medium': return '#FF9800';
      case 'Low': return '#4CAF50';
      default: return colors.textSecondary;
    }
  };

  const renderQueryItem = ({ item }: { item: SupportQuery }) => (
    <View style={[styles.queryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.queryHeader}>
        <Text style={[styles.querySubject, { color: colors.textPrimary }]}>
          {item.subject}
        </Text>
        <View style={styles.badgesContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.badgeText}>{item.priority}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.queryDescription, { color: colors.textSecondary }]}>
        {item.description}
      </Text>

      <View style={styles.queryFooter}>
        <Text style={[styles.queryDate, { color: colors.textSecondary }]}>
          {new Date(item.created).toLocaleDateString()}
        </Text>
        <View style={[styles.issueBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.issueText, { color: colors.primary }]}>
            {item.comment}
          </Text>
        </View>
      </View>

      {item.image && (
        <Image source={{ uri: item.image }} style={styles.queryImage} />
      )}
    </View>
  );

  const renderCreateQueryModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Submit Query
            </Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                resetForm();
              }}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Issue At *</Text>
              <View style={styles.radioGroup}>
                {['App', 'Tech', 'Operation', 'Subject'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.radioOption}
                    onPress={() => setQueryForm(prev => ({ ...prev, comment: option as any }))}
                  >
                    <View style={[
                      styles.radioCircle,
                      { borderColor: colors.border },
                      queryForm.comment === option && { backgroundColor: colors.primary }
                    ]}>
                      {queryForm.comment === option && (
                        <Text style={styles.radioCheck}>●</Text>
                      )}
                    </View>
                    <Text style={[styles.radioLabel, { color: colors.textPrimary }]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Subject *</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter subject"
                placeholderTextColor={colors.textSecondary}
                value={queryForm.subject}
                onChangeText={(text) => setQueryForm(prev => ({ ...prev, subject: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Description *</Text>
              <TextInput
                style={[styles.formTextArea, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Describe your issue in detail"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                value={queryForm.description}
                onChangeText={(text) => setQueryForm(prev => ({ ...prev, description: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Priority *</Text>
              <View style={styles.radioGroup}>
                {['Low', 'Medium', 'High'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.radioOption}
                    onPress={() => setQueryForm(prev => ({ ...prev, priority: option as any }))}
                  >
                    <View style={[
                      styles.radioCircle,
                      { borderColor: colors.border },
                      queryForm.priority === option && { backgroundColor: getPriorityColor(option) }
                    ]}>
                      {queryForm.priority === option && (
                        <Text style={styles.radioCheck}>●</Text>
                      )}
                    </View>
                    <Text style={[styles.radioLabel, { color: colors.textPrimary }]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateQuery}
            >
              <Text style={styles.submitButtonText}>Submit Query</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Support"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['All', 'Open', 'In Progress', 'Closed'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                filterStatus === filter && { backgroundColor: colors.primary }
              ]}
              onPress={() => setFilterStatus(filter as any)}
            >
              <Text style={[
                styles.filterText,
                { color: filterStatus === filter ? '#FFFFFF' : colors.textSecondary }
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add Query</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading queries...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredQueries}
          renderItem={renderQueryItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.queriesList}
          contentContainerStyle={styles.queriesListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchQueries}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No queries found
              </Text>
            </View>
          }
        />
      )}

      {renderCreateQueryModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  queriesList: {
    flex: 1,
  },
  queriesListContent: {
    padding: 16,
  },
  queryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  queryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  querySubject: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  queryDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  queryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queryDate: {
    fontSize: 12,
  },
  issueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  issueText: {
    fontSize: 12,
    fontWeight: '600',
  },
  queryImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
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
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  formTextArea: {
    height: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCheck: {
    color: '#FFFFFF',
    fontSize: 8,
  },
  radioLabel: {
    fontSize: 14,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
