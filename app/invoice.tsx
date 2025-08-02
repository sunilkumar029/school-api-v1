
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'fee' | 'vendor' | 'staff';
  recipientName: string;
  recipientEmail: string;
  amount: number;
  dueDate: string;
  issueDate: string;
  status: 'paid' | 'due' | 'overdue';
  description: string;
  items: { description: string; quantity: number; rate: number; amount: number }[];
}

export default function InvoiceScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'due' | 'overdue'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      invoiceNumber: 'INV-2024-001',
      type: 'fee',
      recipientName: 'John Doe',
      recipientEmail: 'john.doe@email.com',
      amount: 1500.00,
      dueDate: '2024-02-01',
      issueDate: '2024-01-15',
      status: 'paid',
      description: 'Semester Fee Payment',
      items: [
        { description: 'Tuition Fee', quantity: 1, rate: 1200.00, amount: 1200.00 },
        { description: 'Library Fee', quantity: 1, rate: 150.00, amount: 150.00 },
        { description: 'Lab Fee', quantity: 1, rate: 150.00, amount: 150.00 },
      ],
    },
    {
      id: '2',
      invoiceNumber: 'INV-2024-002',
      type: 'vendor',
      recipientName: 'TechSupply Co',
      recipientEmail: 'billing@techsupply.com',
      amount: 2500.00,
      dueDate: '2024-01-25',
      issueDate: '2024-01-10',
      status: 'due',
      description: 'Computer Equipment Purchase',
      items: [
        { description: 'Laptops', quantity: 5, rate: 500.00, amount: 2500.00 },
      ],
    },
    {
      id: '3',
      invoiceNumber: 'INV-2024-003',
      type: 'staff',
      recipientName: 'Jane Smith',
      recipientEmail: 'jane.smith@school.edu',
      amount: 3500.00,
      dueDate: '2024-01-05',
      issueDate: '2023-12-31',
      status: 'overdue',
      description: 'Monthly Salary',
      items: [
        { description: 'Base Salary', quantity: 1, rate: 3000.00, amount: 3000.00 },
        { description: 'Teaching Allowance', quantity: 1, rate: 500.00, amount: 500.00 },
      ],
    },
  ]);

  const isAdmin = user?.role === 'admin' || user?.role === 'finance';
  const statusOptions = ['all', 'paid', 'due', 'overdue'] as const;
  const dateOptions = ['all', 'today', 'week', 'month'] as const;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'due': return '#FF9800';
      case 'overdue': return '#F44336';
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return '✅';
      case 'due': return '⏳';
      case 'overdue': return '🚨';
      default: return '📄';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fee': return '🎓';
      case 'vendor': return '🏢';
      case 'staff': return '👨‍💼';
      default: return '📄';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    // Role-based filtering
    if (user?.role === 'student' && invoice.type !== 'fee') return false;
    if (user?.role === 'staff' && invoice.type === 'vendor') return false;

    // Search filter
    if (searchTerm && !invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !invoice.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && invoice.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const InvoiceCard = ({ invoice }: { invoice: Invoice }) => (
    <View style={[styles.invoiceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceTitle}>
          <Text style={styles.typeIcon}>{getTypeIcon(invoice.type)}</Text>
          <View style={styles.invoiceInfo}>
            <Text style={[styles.invoiceNumber, { color: colors.textPrimary }]}>
              {invoice.invoiceNumber}
            </Text>
            <Text style={[styles.recipientName, { color: colors.textSecondary }]}>
              {invoice.recipientName}
            </Text>
          </View>
        </View>
        <View style={styles.invoiceMeta}>
          <Text style={[styles.invoiceAmount, { color: colors.primary }]}>
            ${invoice.amount.toFixed(2)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
            <Text style={styles.statusText}>
              {getStatusIcon(invoice.status)} {invoice.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.invoiceDescription, { color: colors.textSecondary }]}>
        {invoice.description}
      </Text>

      <View style={styles.invoiceDetails}>
        <Text style={[styles.invoiceDate, { color: colors.textSecondary }]}>
          Issued: {invoice.issueDate}
        </Text>
        <Text style={[styles.invoiceDate, { color: colors.textSecondary }]}>
          Due: {invoice.dueDate}
        </Text>
      </View>

      {/* Invoice Items */}
      <View style={[styles.itemsSection, { backgroundColor: colors.background }]}>
        <Text style={[styles.itemsTitle, { color: colors.textPrimary }]}>Items:</Text>
        {invoice.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
              {item.description}
            </Text>
            <Text style={[styles.itemAmount, { color: colors.textPrimary }]}>
              {item.quantity} × ${item.rate.toFixed(2)} = ${item.amount.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.invoiceActions}>
        <TouchableOpacity
          style={[styles.viewButton, { borderColor: colors.primary }]}
          onPress={() => Alert.alert('Invoice Details', `View full details for ${invoice.invoiceNumber}`)}
        >
          <Text style={[styles.viewButtonText, { color: colors.primary }]}>
            View Details
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.downloadButton, { backgroundColor: colors.primary }]}
          onPress={() => Alert.alert('Download PDF', `Download ${invoice.invoiceNumber} as PDF`)}
        >
          <Text style={styles.downloadButtonText}>📄 Download PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Invoices"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Search and Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="Search invoices..."
          placeholderTextColor={colors.textSecondary}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Status:</Text>
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                {
                  backgroundColor: statusFilter === status ? colors.primary : colors.background,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: statusFilter === status ? '#FFFFFF' : colors.textPrimary,
                  }
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Generate Invoice Button for Admin */}
      {isAdmin && (
        <View style={styles.generateButtonContainer}>
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: colors.primary }]}
            onPress={() => Alert.alert('Generate Invoice', 'Create new invoice form would open here')}
          >
            <Text style={styles.generateButtonText}>+ Generate New Invoice</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Invoice List */}
      <ScrollView style={styles.invoicesList}>
        {filteredInvoices.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No invoices found
            </Text>
          </View>
        ) : (
          filteredInvoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginRight: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  generateButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  generateButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  invoicesList: {
    flex: 1,
    padding: 16,
  },
  invoiceCard: {
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
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  recipientName: {
    fontSize: 14,
  },
  invoiceMeta: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  invoiceDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  invoiceDate: {
    fontSize: 12,
  },
  itemsSection: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    flex: 1,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  invoiceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  downloadButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
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
