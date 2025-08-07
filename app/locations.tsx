
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBranches } from '@/hooks/useApi';

interface Branch {
  id: number;
  name: string;
  address: any;
  is_active: boolean;
  phone?: string;
  email?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export default function LocationsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const { 
    data: branches, 
    loading, 
    error, 
    refetch 
  } = useBranches({ is_active: true });

  const openMap = (branch: Branch) => {
    if (branch.location) {
      const url = `https://maps.google.com/?q=${branch.location.latitude},${branch.location.longitude}`;
      Linking.openURL(url);
    } else if (branch.address) {
      const addressStr = typeof branch.address === 'string' ? branch.address : JSON.stringify(branch.address);
      const url = `https://maps.google.com/?q=${encodeURIComponent(addressStr)}`;
      Linking.openURL(url);
    }
  };

  const renderBranchCard = (branch: Branch) => (
    <View key={branch.id} style={[styles.branchCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.branchHeader}>
        <Text style={[styles.branchName, { color: colors.textPrimary }]}>
          {branch.name}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: branch.is_active ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.statusText}>
            {branch.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {branch.address && (
        <View style={styles.addressContainer}>
          <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>Address:</Text>
          <Text style={[styles.addressText, { color: colors.textPrimary }]}>
            {typeof branch.address === 'string' ? branch.address : JSON.stringify(branch.address)}
          </Text>
        </View>
      )}

      {branch.phone && (
        <View style={styles.contactRow}>
          <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Phone:</Text>
          <Text style={[styles.contactText, { color: colors.textPrimary }]}>
            {branch.phone}
          </Text>
        </View>
      )}

      {branch.email && (
        <View style={styles.contactRow}>
          <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Email:</Text>
          <Text style={[styles.contactText, { color: colors.textPrimary }]}>
            {branch.email}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.mapButton, { backgroundColor: colors.primary }]}
        onPress={() => openMap(branch)}
      >
        <Text style={styles.mapButtonText}>📍 View on Map</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Branch Locations"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {loading && (!branches || branches.length === 0) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading locations...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
              Failed to load locations. Please try again.
            </Text>
            <TouchableOpacity
              onPress={refetch}
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : branches && branches.length > 0 ? (
          <View style={styles.branchesList}>
            {branches.map(renderBranchCard)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No branch locations found
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
  content: {
    flex: 1,
    padding: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  branchesList: {
    paddingBottom: 20,
  },
  branchCard: {
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
  branchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  branchName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addressContainer: {
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 60,
  },
  contactText: {
    fontSize: 14,
    flex: 1,
  },
  mapButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
});
