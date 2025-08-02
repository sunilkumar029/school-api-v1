
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';

interface Request {
  id: string;
  type: 'leave' | 'shift-change' | 'equipment' | 'general';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  startDate?: string;
  endDate?: string;
  comments?: string;
  approver?: string;
  priority: 'low' | 'medium' | 'high';
}

export default function MyRequestsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'new-request' | 'history'>('history');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  const [newRequest, setNewRequest] = useState({
    type: 'leave' as 'leave' | 'shift-change' | 'equipment' | 'general',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const [requests, setRequests] = useState<Request[]>([
    {
      id: '1',
      type: 'leave',
      title: 'Annual Leave Request',
      description: 'Taking vacation for family trip',
      status: 'approved',
      submittedDate: '2024-01-10',
      startDate: '2024-01-20',
      endDate: '2024-01-25',
      comments: 'Approved. Please ensure handover is complete.',
      approver: 'Sarah Manager',
      priority: 'medium',
    },
    {
      id: '2',
      type: 'equipment',
      title: 'Laptop Replacement',
      description: 'Current laptop is running slow and affecting productivity',
      status: 'pending',
      submittedDate: '2024-01-12',
      priority: 'high',
    },
    {
      id: '3',
      type: 'shift-change',
      title: 'Schedule Change Request',
      description: 'Need to change shift timing for medical appointment',
      status: 'rejected',
      submittedDate: '2024-01-08',
      startDate: '2024-01-15',
      comments: 'Cannot accommodate due to staff shortage. Please reschedule.',
      approver: 'Mike Supervisor',
      priority: 'low',
    },
  ]);

  const requestTypes = [
    { value: 'leave', label: 'Leave Request', icon: '🏖️' },
    { value: 'shift-change', label: 'Shift Change', icon: '⏰' },
    { value: 'equipment', label: 'Work Equipment', icon: '💻' },
    { value: 'general', label: 'General Request', icon: '📝' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#4CAF50' },
    { value: 'medium', label: 'Medium', color: '#FF9800' },
    { value: 'high', label: 'High', color: '#F44336' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'rejected': return '#F44336';
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      default: return '📄';
    }
  };

  const getTypeIcon = (type: string) => {
    const typeData = requestTypes.find(t => t.value === type);
    return typeData?.icon || '📄';
  };

  const getPriorityColor = (priority: string) => {
    const priorityData = priorities.find(p => p.value === priority);
    return priorityData?.color || colors.textSecondary;
  };

  const handleSubmitRequest = () => {
    if (!newRequest.title || !newRequest.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (newRequest.type === 'leave' && (!newRequest.startDate || !newRequest.endDate)) {
      Alert.alert('Error', 'Please specify start and end dates for leave request');
      return;
    }

    const request: Request = {
      id: Date.now().toString(),
      type: newRequest.type,
      title: newRequest.title,
      description: newRequest.description,
      status: 'pending',
      submittedDate: new Date().toISOString().split('T')[0],
      startDate: newRequest.startDate || undefined,
      endDate: newRequest.endDate || undefined,
      priority: newRequest.priority,
    };

    setRequests(prev => [request, ...prev]);
    setNewRequest({
      type: 'leave',
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      priority: 'medium',
    });
    setShowNewRequestModal(false);
    Alert.alert('Success', 'Request submitted successfully');
  };

  const RequestCard = ({ request }: { request: Request }) => (
    <View style={[styles.requestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.requestHeader}>
        <View style={styles.requestTitle}>
          <Text style={styles.requestIcon}>{getTypeIcon(request.type)}</Text>
          <View style={styles.requestInfo}>
            <Text style={[styles.requestTitleText, { color: colors.textPrimary }]}>
              {request.title}
            </Text>
            <Text style={[styles.requestType, { color: colors.textSecondary }]}>
              {requestTypes.find(t => t.value === request.type)?.label}
            </Text>
          </View>
        </View>
        <View style={styles.requestMeta}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
            <Text style={styles.statusText}>
              {getStatusIcon(request.status)} {request.status.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) }]}>
            <Text style={styles.priorityText}>{request.priority.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.requestDescription, { color: colors.textSecondary }]}>
        {request.description}
      </Text>

      <View style={styles.requestDetails}>
        <Text style={[styles.requestDate, { color: colors.textSecondary }]}>
          Submitted: {request.submittedDate}
        </Text>
        {request.startDate && (
          <Text style={[styles.requestDate, { color: colors.textSecondary }]}>
            Period: {request.startDate} {request.endDate ? `to ${request.endDate}` : ''}
          </Text>
        )}
      </View>

      {request.comments && (
        <View style={[styles.commentsSection, { backgroundColor: colors.background }]}>
          <Text style={[styles.commentsLabel, { color: colors.textPrimary }]}>
            Comments:
          </Text>
          <Text style={[styles.commentsText, { color: colors.textSecondary }]}>
            {request.comments}
          </Text>
          {request.approver && (
            <Text style={[styles.approverText, { color: colors.textSecondary }]}>
              - {request.approver}
            </Text>
          )}
        </View>
      )}

      <View style={styles.requestFooter}>
        <Text style={[styles.requestId, { color: colors.textSecondary }]}>
          ID: {request.id}
        </Text>
        <TouchableOpacity
          style={[styles.trackButton, { borderColor: colors.primary }]}
          onPress={() => Alert.alert('Request Tracking', `Track request ${request.id} in real-time`)}
        >
          <Text style={[styles.trackButtonText, { color: colors.primary }]}>
            Track Status
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const TypeSelector = ({ value, onSelect }: { value: string; onSelect: (type: any) => void }) => (
    <View>
      <Text style={[styles.label, { color: colors.textPrimary }]}>Request Type *</Text>
      <View style={styles.typeGrid}>
        {requestTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeOption,
              {
                backgroundColor: value === type.value ? colors.primary : colors.surface,
                borderColor: colors.border,
              }
            ]}
            onPress={() => onSelect(type.value)}
          >
            <Text style={styles.typeIcon}>{type.icon}</Text>
            <Text
              style={[
                styles.typeLabel,
                {
                  color: value === type.value ? '#FFFFFF' : colors.textPrimary,
                }
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const PrioritySelector = ({ value, onSelect }: { value: string; onSelect: (priority: any) => void }) => (
    <View>
      <Text style={[styles.label, { color: colors.textPrimary }]}>Priority</Text>
      <View style={styles.priorityContainer}>
        {priorities.map((priority) => (
          <TouchableOpacity
            key={priority.value}
            style={[
              styles.priorityOption,
              {
                backgroundColor: value === priority.value ? priority.color : colors.surface,
                borderColor: priority.color,
              }
            ]}
            onPress={() => onSelect(priority.value)}
          >
            <Text
              style={[
                styles.priorityLabel,
                {
                  color: value === priority.value ? '#FFFFFF' : priority.color,
                }
              ]}
            >
              {priority.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="My Requests"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'new-request' && { borderBottomColor: colors.primary }
          ]}
          onPress={() => setActiveTab('new-request')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'new-request' ? colors.primary : colors.textSecondary,
                fontWeight: activeTab === 'new-request' ? 'bold' : 'normal',
              }
            ]}
          >
            New Request
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'history' && { borderBottomColor: colors.primary }
          ]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'history' ? colors.primary : colors.textSecondary,
                fontWeight: activeTab === 'history' ? 'bold' : 'normal',
              }
            ]}
          >
            Request History ({requests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'new-request' ? (
        <ScrollView style={styles.formContainer}>
          <View style={styles.form}>
            <TypeSelector
              value={newRequest.type}
              onSelect={(type) => setNewRequest(prev => ({ ...prev, type }))}
            />

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Request Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Enter request title"
                placeholderTextColor={colors.textSecondary}
                value={newRequest.title}
                onChangeText={(text) => setNewRequest(prev => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Description *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Provide detailed description of your request"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                value={newRequest.description}
                onChangeText={(text) => setNewRequest(prev => ({ ...prev, description: text }))}
              />
            </View>

            {(newRequest.type === 'leave' || newRequest.type === 'shift-change') && (
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>Start Date *</Text>
                  <TouchableOpacity
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: 'center' }]}
                    onPress={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setNewRequest(prev => ({ ...prev, startDate: today }));
                    }}
                  >
                    <Text style={[styles.inputText, { color: newRequest.startDate ? colors.textPrimary : colors.textSecondary }]}>
                      {newRequest.startDate || 'Select start date'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {newRequest.type === 'leave' && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>End Date *</Text>
                    <TouchableOpacity
                      style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: 'center' }]}
                      onPress={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setNewRequest(prev => ({ ...prev, endDate: tomorrow.toISOString().split('T')[0] }));
                      }}
                    >
                      <Text style={[styles.inputText, { color: newRequest.endDate ? colors.textPrimary : colors.textSecondary }]}>
                        {newRequest.endDate || 'Select end date'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            <PrioritySelector
              value={newRequest.priority}
              onSelect={(priority) => setNewRequest(prev => ({ ...prev, priority }))}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmitRequest}
            >
              <Text style={styles.submitButtonText}>Submit Request</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.requestsList}>
          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No requests found
              </Text>
            </View>
          ) : (
            requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
  },
  requestsList: {
    flex: 1,
    padding: 16,
  },
  requestCard: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  requestIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  requestType: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requestMeta: {
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
    fontSize: 11,
    fontWeight: 'bold',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  requestDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  requestDetails: {
    marginBottom: 12,
  },
  requestDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  commentsSection: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commentsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentsText: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  approverText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestId: {
    fontSize: 12,
    flex: 1,
  },
  trackButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 4,
  },
  trackButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  form: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputText: {
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
