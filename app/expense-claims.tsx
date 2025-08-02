
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

interface Claim {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  receipt: string;
  submittedDate: string;
  comments?: string;
  approver?: string;
}

export default function ExpenseClaimsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-claims' | 'new-claim'>('my-claims');
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);

  const [newClaim, setNewClaim] = useState({
    category: '',
    amount: '',
    date: '',
    description: '',
    receipt: '',
  });

  const [claims, setClaims] = useState<Claim[]>([
    {
      id: '1',
      category: 'Travel',
      amount: 150.00,
      date: '2024-01-10',
      description: 'Conference travel expenses',
      status: 'approved',
      receipt: 'receipt_001.pdf',
      submittedDate: '2024-01-11',
      comments: 'Approved for conference attendance',
      approver: 'John Manager',
    },
    {
      id: '2',
      category: 'Meals',
      amount: 45.50,
      date: '2024-01-12',
      description: 'Client meeting lunch',
      status: 'pending',
      receipt: 'receipt_002.pdf',
      submittedDate: '2024-01-13',
    },
    {
      id: '3',
      category: 'Office Supplies',
      amount: 25.00,
      date: '2024-01-08',
      description: 'Stationery for project',
      status: 'rejected',
      receipt: 'receipt_003.pdf',
      submittedDate: '2024-01-09',
      comments: 'Insufficient documentation provided',
      approver: 'Jane Supervisor',
    },
  ]);

  const categories = ['Travel', 'Meals', 'Office Supplies', 'Equipment', 'Training', 'Other'];

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

  const handleSubmitClaim = () => {
    if (!newClaim.category || !newClaim.amount || !newClaim.date || !newClaim.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const claim: Claim = {
      id: Date.now().toString(),
      category: newClaim.category,
      amount: parseFloat(newClaim.amount),
      date: newClaim.date,
      description: newClaim.description,
      status: 'pending',
      receipt: newClaim.receipt || 'No receipt attached',
      submittedDate: new Date().toISOString().split('T')[0],
    };

    setClaims(prev => [claim, ...prev]);
    setNewClaim({ category: '', amount: '', date: '', description: '', receipt: '' });
    setShowNewClaimModal(false);
    Alert.alert('Success', 'Expense claim submitted successfully');
  };

  const ClaimCard = ({ claim }: { claim: Claim }) => (
    <View style={[styles.claimCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.claimHeader}>
        <View style={styles.claimTitle}>
          <Text style={[styles.claimCategory, { color: colors.textPrimary }]}>
            {claim.category}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(claim.status) }]}>
            <Text style={styles.statusText}>
              {getStatusIcon(claim.status)} {claim.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.claimAmount, { color: colors.primary }]}>
          ${claim.amount.toFixed(2)}
        </Text>
      </View>

      <Text style={[styles.claimDescription, { color: colors.textSecondary }]}>
        {claim.description}
      </Text>

      <View style={styles.claimDetails}>
        <Text style={[styles.claimDate, { color: colors.textSecondary }]}>
          Expense Date: {claim.date}
        </Text>
        <Text style={[styles.claimDate, { color: colors.textSecondary }]}>
          Submitted: {claim.submittedDate}
        </Text>
      </View>

      {claim.comments && (
        <View style={[styles.commentsSection, { backgroundColor: colors.background }]}>
          <Text style={[styles.commentsLabel, { color: colors.textPrimary }]}>
            Comments:
          </Text>
          <Text style={[styles.commentsText, { color: colors.textSecondary }]}>
            {claim.comments}
          </Text>
          {claim.approver && (
            <Text style={[styles.approverText, { color: colors.textSecondary }]}>
              - {claim.approver}
            </Text>
          )}
        </View>
      )}

      <View style={styles.claimFooter}>
        <Text style={[styles.receiptText, { color: colors.textSecondary }]}>
          📎 {claim.receipt}
        </Text>
        <TouchableOpacity
          style={[styles.viewButton, { borderColor: colors.primary }]}
          onPress={() => Alert.alert('Receipt', `View ${claim.receipt}`)}
        >
          <Text style={[styles.viewButtonText, { color: colors.primary }]}>
            View Details
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const CategorySelector = ({ value, onSelect }: { value: string; onSelect: (category: string) => void }) => (
    <View>
      <Text style={[styles.label, { color: colors.textPrimary }]}>Category *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              {
                backgroundColor: value === category ? colors.primary : colors.surface,
                borderColor: colors.border,
              }
            ]}
            onPress={() => onSelect(category)}
          >
            <Text
              style={[
                styles.categoryChipText,
                {
                  color: value === category ? '#FFFFFF' : colors.textPrimary,
                }
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Expense Claims"
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
            activeTab === 'my-claims' && { borderBottomColor: colors.primary }
          ]}
          onPress={() => setActiveTab('my-claims')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'my-claims' ? colors.primary : colors.textSecondary,
                fontWeight: activeTab === 'my-claims' ? 'bold' : 'normal',
              }
            ]}
          >
            My Claims ({claims.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'new-claim' && { borderBottomColor: colors.primary }
          ]}
          onPress={() => setActiveTab('new-claim')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'new-claim' ? colors.primary : colors.textSecondary,
                fontWeight: activeTab === 'new-claim' ? 'bold' : 'normal',
              }
            ]}
          >
            New Claim
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'my-claims' ? (
        <ScrollView style={styles.claimsList}>
          {claims.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No expense claims found
              </Text>
            </View>
          ) : (
            claims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} />
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.formContainer}>
          <View style={styles.form}>
            <CategorySelector
              value={newClaim.category}
              onSelect={(category) => setNewClaim(prev => ({ ...prev, category }))}
            />

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Amount *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={newClaim.amount}
                onChangeText={(text) => setNewClaim(prev => ({ ...prev, amount: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Expense Date *</Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: 'center' }]}
                onPress={() => {
                  // In a real app, you'd use a date picker
                  const today = new Date().toISOString().split('T')[0];
                  setNewClaim(prev => ({ ...prev, date: today }));
                }}
              >
                <Text style={[styles.inputText, { color: newClaim.date ? colors.textPrimary : colors.textSecondary }]}>
                  {newClaim.date || 'Select date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Description *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Describe the expense..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                value={newClaim.description}
                onChangeText={(text) => setNewClaim(prev => ({ ...prev, description: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Receipt Attachment</Text>
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {
                  // In a real app, you'd open file picker
                  setNewClaim(prev => ({ ...prev, receipt: 'receipt_new.pdf' }));
                  Alert.alert('Receipt Attached', 'Receipt uploaded successfully');
                }}
              >
                <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
                  📎 {newClaim.receipt || 'Attach Receipt'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmitClaim}
            >
              <Text style={styles.submitButtonText}>Submit Claim</Text>
            </TouchableOpacity>
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
  claimsList: {
    flex: 1,
    padding: 16,
  },
  claimCard: {
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
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  claimTitle: {
    flex: 1,
    marginRight: 12,
  },
  claimCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  claimAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  claimDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  claimDetails: {
    marginBottom: 12,
  },
  claimDate: {
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
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptText: {
    fontSize: 12,
    flex: 1,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 4,
  },
  viewButtonText: {
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
  categoryScroll: {
    marginBottom: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
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
  uploadButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '500',
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
