
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';

interface Driver {
  id: string;
  name: string;
  phone: string;
  route: string;
  busNumber: string;
  status: 'active' | 'inactive';
}

interface Route {
  id: string;
  name: string;
  stops: string[];
  timings: string[];
  driverId: string;
}

export default function TransportScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drivers' | 'routes'>('dashboard');

  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: '1',
      name: 'John Smith',
      phone: '+1234567890',
      route: 'Route A - Downtown',
      busNumber: 'BUS-001',
      status: 'active',
    },
    {
      id: '2',
      name: 'Mike Johnson',
      phone: '+1234567891',
      route: 'Route B - Suburbs',
      busNumber: 'BUS-002',
      status: 'active',
    },
    {
      id: '3',
      name: 'Sarah Wilson',
      phone: '+1234567892',
      route: 'Route C - Airport',
      busNumber: 'BUS-003',
      status: 'inactive',
    },
  ]);

  const [routes, setRoutes] = useState<Route[]>([
    {
      id: '1',
      name: 'Route A - Downtown',
      stops: ['School', 'Main Street', 'City Center', 'Downtown'],
      timings: ['8:00 AM', '8:15 AM', '8:30 AM', '8:45 AM'],
      driverId: '1',
    },
    {
      id: '2',
      name: 'Route B - Suburbs',
      stops: ['School', 'Park Avenue', 'Suburb Mall', 'Residential Area'],
      timings: ['8:00 AM', '8:20 AM', '8:40 AM', '9:00 AM'],
      driverId: '2',
    },
  ]);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessage = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const renderDashboard = () => (
    <View style={styles.dashboardContent}>
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {drivers.filter(d => d.status === 'active').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Buses</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {drivers.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Drivers</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {routes.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Routes</Text>
        </View>
      </View>

      <View style={[styles.quickActions, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('routes')}
        >
          <Text style={styles.actionButtonText}>View Routes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
          onPress={() => setActiveTab('drivers')}
        >
          <Text style={styles.actionButtonText}>Contact Drivers</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDriverCard = ({ item }: { item: Driver }) => (
    <View style={[styles.driverCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.driverInfo}>
        <Text style={[styles.driverName, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.driverDetails, { color: colors.textSecondary }]}>
          {item.busNumber} • {item.route}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'active' ? '#34C759' : '#FF3B30' }
        ]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.driverActions}>
        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: '#34C759' }]}
          onPress={() => handleCall(item.phone)}
        >
          <Text style={styles.contactButtonText}>📞</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: '#007AFF' }]}
          onPress={() => handleMessage(item.phone)}
        >
          <Text style={styles.contactButtonText}>💬</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRouteCard = ({ item }: { item: Route }) => {
    const driver = drivers.find(d => d.id === item.driverId);
    return (
      <View style={[styles.routeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.routeName, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.driverAssigned, { color: colors.textSecondary }]}>
          Driver: {driver?.name || 'Unassigned'}
        </Text>
        
        <View style={styles.stopsContainer}>
          <Text style={[styles.stopsTitle, { color: colors.textPrimary }]}>Stops & Timings:</Text>
          {item.stops.map((stop, index) => (
            <View key={index} style={styles.stopRow}>
              <Text style={[styles.stopName, { color: colors.textSecondary }]}>{stop}</Text>
              <Text style={[styles.stopTime, { color: colors.textSecondary }]}>
                {item.timings[index] || 'N/A'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderDrivers = () => (
    <FlatList
      data={drivers}
      renderItem={renderDriverCard}
      keyExtractor={(item) => item.id}
      style={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );

  const renderRoutes = () => (
    <FlatList
      data={routes}
      renderItem={renderRouteCard}
      keyExtractor={(item) => item.id}
      style={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'drivers': return renderDrivers();
      case 'routes': return renderRoutes();
      default: return renderDashboard();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Transport"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        {['dashboard', 'drivers', 'routes'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab ? colors.primary : colors.textSecondary }
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dashboardContent: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  quickActions: {
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  driverCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  driverDetails: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 18,
  },
  routeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  driverAssigned: {
    fontSize: 14,
    marginBottom: 12,
  },
  stopsContainer: {
    marginTop: 8,
  },
  stopsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  stopName: {
    fontSize: 14,
  },
  stopTime: {
    fontSize: 14,
    fontWeight: '600',
  },
});
