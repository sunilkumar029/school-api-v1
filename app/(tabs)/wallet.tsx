
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useTheme, fontSizes } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function WalletScreen() {
  const { colors, fontSize } = useTheme();
  const { user } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'recharge'>('overview');

  // Mock data
  const walletBalance = 1250;
  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'debit',
      amount: 150,
      description: 'Canteen Payment',
      date: '2024-01-15',
      status: 'completed',
    },
    {
      id: '2',
      type: 'credit',
      amount: 500,
      description: 'Wallet Recharge',
      date: '2024-01-14',
      status: 'completed',
    },
    {
      id: '3',
      type: 'debit',
      amount: 75,
      description: 'Library Fine',
      date: '2024-01-13',
      status: 'completed',
    },
    {
      id: '4',
      type: 'debit',
      amount: 200,
      description: 'Lab Fee',
      date: '2024-01-12',
      status: 'pending',
    },
  ];

  const handleRecharge = (amount: number) => {
    Alert.alert(
      'Recharge Wallet',
      `Recharge ₹${amount} to your wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => Alert.alert('Success', 'Wallet recharged successfully!') },
      ]
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={[styles.transactionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.transactionIcon}>
        <Text style={styles.transactionIconText}>
          {item.type === 'credit' ? '💳' : '💸'}
        </Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionDescription, { color: colors.textPrimary }]}>
          {item.description}
        </Text>
        <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
          {item.date} • {item.status}
        </Text>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          {
            color: item.type === 'credit' ? '#4CAF50' : '#F44336',
          },
        ]}
      >
        {item.type === 'credit' ? '+' : '-'}₹{item.amount}
      </Text>
    </View>
  );

  const renderOverview = () => (
    <View>
      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>₹{walletBalance}</Text>
        <TouchableOpacity
          style={[styles.quickRechargeBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          onPress={() => setActiveTab('recharge')}
        >
          <Text style={styles.quickRechargeBtnText}>Quick Recharge</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface }]}>
            <Text style={styles.actionIcon}>💳</Text>
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Pay Fees</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface }]}>
            <Text style={styles.actionIcon}>🔄</Text>
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface }]}>
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Receipts</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => setActiveTab('transactions')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
        {transactions.slice(0, 3).map((transaction) => (
          <View key={transaction.id}>
            {renderTransaction({ item: transaction })}
          </View>
        ))}
      </View>
    </View>
  );

  const renderTransactions = () => (
    <FlatList
      data={transactions}
      renderItem={renderTransaction}
      keyExtractor={(item) => item.id}
      style={styles.transactionsList}
      showsVerticalScrollIndicator={false}
    />
  );

  const renderRecharge = () => (
    <View style={styles.rechargeContainer}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recharge Amount</Text>
      <View style={styles.rechargeOptions}>
        {[100, 250, 500, 1000, 2000, 5000].map((amount) => (
          <TouchableOpacity
            key={amount}
            style={[styles.rechargeOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleRecharge(amount)}
          >
            <Text style={[styles.rechargeAmount, { color: colors.textPrimary }]}>₹{amount}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.customRechargeBtn, { backgroundColor: colors.primary }]}
        onPress={() => Alert.alert('Custom Amount', 'Enter custom recharge amount')}
      >
        <Text style={styles.customRechargeBtnText}>Enter Custom Amount</Text>
      </TouchableOpacity>

      <View style={styles.paymentMethods}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Payment Methods</Text>
        <TouchableOpacity style={[styles.paymentMethod, { backgroundColor: colors.surface }]}>
          <Text style={styles.paymentIcon}>💳</Text>
          <Text style={[styles.paymentText, { color: colors.textPrimary }]}>Credit/Debit Card</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.paymentMethod, { backgroundColor: colors.surface }]}>
          <Text style={styles.paymentIcon}>📱</Text>
          <Text style={[styles.paymentText, { color: colors.textPrimary }]}>UPI Payment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.paymentMethod, { backgroundColor: colors.surface }]}>
          <Text style={styles.paymentIcon}>🏦</Text>
          <Text style={[styles.paymentText, { color: colors.textPrimary }]}>Net Banking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Wallet"
        onMenuPress={() => setDrawerVisible(true)}
        showSettings={false}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'transactions', label: 'Transactions' },
          { key: 'recharge', label: 'Recharge' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? colors.primary : colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'recharge' && renderRecharge()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
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
  balanceCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickRechargeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickRechargeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 24,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rechargeContainer: {
    flex: 1,
  },
  rechargeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    marginBottom: 24,
  },
  rechargeOption: {
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    margin: '1.5%',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rechargeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  customRechargeBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  customRechargeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentMethods: {
    marginTop: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  paymentIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
