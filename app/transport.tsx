
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

const { width: screenWidth } = Dimensions.get('window');

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseExpiry: string;
  status: 'active' | 'inactive';
  vehicleId?: string;
}

interface Vehicle {
  id: string;
  name: string;
  dateOfJoining: string;
  startDate: string;
  endDate: string;
  type: 'Bus' | 'Van' | 'Car';
  seats: number;
  status: 'active' | 'maintenance' | 'inactive';
  driverId?: string;
}

interface Trip {
  id: string;
  driverName: string;
  secondaryDriver?: string;
  startPoint: string;
  endPoint: string;
  passengers: number;
  vehicleName: string;
  status: 'active' | 'completed' | 'cancelled';
  startTime: string;
  endTime?: string;
  route: string;
}

interface TransportAnalytics {
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  licenseExpiryAlerts: number;
  totalTrips: number;
  weeklyTrips: number;
  passengers: number;
  tripsWithTracking: number;
}

export default function TransportScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drivers' | 'vehicles' | 'trips' | 'add-trip'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Sample data - in real app, this would come from API
  const [analytics, setAnalytics] = useState<TransportAnalytics>({
    totalVehicles: 15,
    activeVehicles: 12,
    totalDrivers: 18,
    licenseExpiryAlerts: 3,
    totalTrips: 145,
    weeklyTrips: 28,
    passengers: 1250,
    tripsWithTracking: 140,
  });

  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: '1',
      name: 'John Smith',
      phone: '+1234567890',
      licenseExpiry: '2025-12-31',
      status: 'active',
      vehicleId: '1',
    },
    {
      id: '2',
      name: 'Mike Johnson',
      phone: '+1234567891',
      licenseExpiry: '2024-06-15',
      status: 'active',
      vehicleId: '2',
    },
    {
      id: '3',
      name: 'Sarah Wilson',
      phone: '+1234567892',
      licenseExpiry: '2025-03-20',
      status: 'inactive',
    },
  ]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: '1',
      name: 'School Bus 001',
      dateOfJoining: '2023-01-15',
      startDate: '2023-01-15',
      endDate: '2028-01-15',
      type: 'Bus',
      seats: 50,
      status: 'active',
      driverId: '1',
    },
    {
      id: '2',
      name: 'School Van 002',
      dateOfJoining: '2023-03-20',
      startDate: '2023-03-20',
      endDate: '2028-03-20',
      type: 'Van',
      seats: 15,
      status: 'active',
      driverId: '2',
    },
    {
      id: '3',
      name: 'Admin Car 003',
      dateOfJoining: '2023-06-10',
      startDate: '2023-06-10',
      endDate: '2028-06-10',
      type: 'Car',
      seats: 4,
      status: 'maintenance',
    },
  ]);

  const [trips, setTrips] = useState<Trip[]>([
    {
      id: '1',
      driverName: 'John Smith',
      secondaryDriver: 'Mike Johnson',
      startPoint: 'School Campus',
      endPoint: 'Downtown Area',
      passengers: 45,
      vehicleName: 'School Bus 001',
      status: 'active',
      startTime: '08:00 AM',
      route: 'Route A',
    },
    {
      id: '2',
      driverName: 'Sarah Wilson',
      startPoint: 'School Campus',
      endPoint: 'Suburb Area',
      passengers: 12,
      vehicleName: 'School Van 002',
      status: 'completed',
      startTime: '07:30 AM',
      endTime: '09:00 AM',
      route: 'Route B',
    },
  ]);

  const [tripForm, setTripForm] = useState({
    driverId: '',
    secondaryDriverId: '',
    vehicleId: '',
    startPoint: '',
    endPoint: '',
    passengers: '',
    startTime: '',
    parkingLocation: '',
    route: '',
  });

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessage = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const getVehiclesByType = () => {
    const vehiclesByType = vehicles.reduce((acc, vehicle) => {
      acc[vehicle.type] = (acc[vehicle.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(vehiclesByType).map(([type, count]) => ({
      label: type,
      value: count,
      color: type === 'Bus' ? colors.primary : type === 'Van' ? '#8B5CF6' : '#06B6D4',
    }));
  };

  const getWeeklyTripsData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => ({
      label: day,
      value: Math.floor(Math.random() * 10) + 5,
      color: colors.primary,
    }));
  };

  const getLicenseExpiryData = () => {
    const now = new Date();
    return drivers.map(driver => {
      const expiryDate = new Date(driver.licenseExpiry);
      const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        name: driver.name,
        daysToExpiry,
        status: daysToExpiry < 30 ? 'critical' : daysToExpiry < 90 ? 'warning' : 'safe',
      };
    });
  };

  const handleCreateTrip = () => {
    if (!tripForm.driverId || !tripForm.vehicleId || !tripForm.startPoint || !tripForm.endPoint) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const selectedDriver = drivers.find(d => d.id === tripForm.driverId);
    const selectedVehicle = vehicles.find(v => v.id === tripForm.vehicleId);
    const secondaryDriver = drivers.find(d => d.id === tripForm.secondaryDriverId);

    const newTrip: Trip = {
      id: Date.now().toString(),
      driverName: selectedDriver?.name || '',
      secondaryDriver: secondaryDriver?.name,
      startPoint: tripForm.startPoint,
      endPoint: tripForm.endPoint,
      passengers: parseInt(tripForm.passengers) || 0,
      vehicleName: selectedVehicle?.name || '',
      status: 'active',
      startTime: tripForm.startTime,
      route: tripForm.route,
    };

    setTrips([...trips, newTrip]);
    setTripForm({
      driverId: '',
      secondaryDriverId: '',
      vehicleId: '',
      startPoint: '',
      endPoint: '',
      passengers: '',
      startTime: '',
      parkingLocation: '',
      route: '',
    });
    setActiveTab('trips');
    Alert.alert('Success', 'Trip created successfully');
  };

  const renderStatsCard = (title: string, value: string | number, subtitle?: string, color?: string) => (
    <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statsTitle, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.statsValue, { color: color || colors.textPrimary }]}>{value}</Text>
      {subtitle && <Text style={[styles.statsSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </View>
  );

  const renderBarChart = (title: string, data: { label: string; value: number; color: string }[]) => (
    <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{title}</Text>
      <View style={styles.barChart}>
        {data.map((item, index) => {
          const maxValue = Math.max(...data.map(d => d.value));
          const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          
          return (
            <View key={index} style={styles.barContainer}>
              <View style={[styles.bar, { height, backgroundColor: item.color }]} />
              <Text style={[styles.barValue, { color: colors.textPrimary }]}>{item.value}</Text>
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderPieChart = (title: string, data: { label: string; value: number; color: string }[]) => (
    <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{title}</Text>
      <View style={styles.pieChartContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.pieSegment}>
            <View style={[styles.pieColor, { backgroundColor: item.color }]} />
            <Text style={[styles.pieLabel, { color: colors.textSecondary }]}>
              {item.label}: {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderDashboard = () => (
    <ScrollView style={styles.dashboardContent}>
      {/* Key Stats */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Key Statistics</Text>
      <View style={styles.statsContainer}>
        {renderStatsCard('Total Vehicles', analytics.totalVehicles, 'Fleet size')}
        {renderStatsCard('Active Vehicles', analytics.activeVehicles, 'Currently running', colors.primary)}
        {renderStatsCard('Total Drivers', analytics.totalDrivers, 'Available staff')}
        {renderStatsCard('License Alerts', analytics.licenseExpiryAlerts, 'Expiring soon', '#EF4444')}
      </View>

      <View style={styles.statsContainer}>
        {renderStatsCard('Total Trips', analytics.totalTrips, 'All time')}
        {renderStatsCard('Weekly Trips', analytics.weeklyTrips, 'This week', colors.primary)}
        {renderStatsCard('Passengers', analytics.passengers, 'Total served')}
        {renderStatsCard('Tracked Trips', analytics.tripsWithTracking, 'With GPS', '#10B981')}
      </View>

      {/* Charts */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Analytics</Text>
      {renderBarChart('Trips per Week', getWeeklyTripsData())}
      {renderPieChart('Vehicles by Type', getVehiclesByType())}

      {/* License Expiry Alerts */}
      <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>License Expiry Alerts</Text>
        {getLicenseExpiryData().map((driver, index) => (
          <View key={index} style={styles.licenseAlert}>
            <Text style={[styles.driverName, { color: colors.textPrimary }]}>{driver.name}</Text>
            <Text style={[
              styles.expiryDays,
              { color: driver.status === 'critical' ? '#EF4444' : driver.status === 'warning' ? '#F59E0B' : '#10B981' }
            ]}>
              {driver.daysToExpiry > 0 ? `${driver.daysToExpiry} days` : 'Expired'}
            </Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={[styles.quickActions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('add-trip')}
        >
          <Text style={styles.actionButtonText}>Create New Trip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
          onPress={() => setActiveTab('vehicles')}
        >
          <Text style={styles.actionButtonText}>Manage Vehicles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#10B981' }]}
          onPress={() => setActiveTab('drivers')}
        >
          <Text style={styles.actionButtonText}>Manage Drivers</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderDriverCard = ({ item }: { item: Driver }) => {
    const assignedVehicle = vehicles.find(v => v.id === item.vehicleId);
    const expiryDate = new Date(item.licenseExpiry);
    const daysToExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <View style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
            <Text style={[styles.itemDetails, { color: colors.textSecondary }]}>
              {assignedVehicle ? `Driving: ${assignedVehicle.name}` : 'No vehicle assigned'}
            </Text>
            <Text style={[styles.itemDetails, { color: colors.textSecondary }]}>
              License expires: {item.licenseExpiry} ({daysToExpiry} days)
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'active' ? '#34C759' : '#FF3B30' }
          ]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.itemActions}>
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
  };

  const renderVehicleCard = ({ item }: { item: Vehicle }) => {
    const assignedDriver = drivers.find(d => d.id === item.driverId);
    
    return (
      <TouchableOpacity
        style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => {
          setSelectedItem(item);
          setModalVisible(true);
        }}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
            <Text style={[styles.itemDetails, { color: colors.textSecondary }]}>
              {item.type} • {item.seats} seats
            </Text>
            <Text style={[styles.itemDetails, { color: colors.textSecondary }]}>
              DOJ: {new Date(item.dateOfJoining).toLocaleDateString()}
            </Text>
            <Text style={[styles.itemDetails, { color: colors.textSecondary }]}>
              Driver: {assignedDriver?.name || 'Unassigned'}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            { 
              backgroundColor: item.status === 'active' ? '#34C759' : 
                              item.status === 'maintenance' ? '#FF9500' : '#FF3B30'
            }
          ]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTripCard = ({ item }: { item: Trip }) => (
    <View style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]}>
            {item.startPoint} → {item.endPoint}
          </Text>
          <Text style={[styles.itemDetails, { color: colors.textSecondary }]}>
            Driver: {item.driverName}
            {item.secondaryDriver && ` • Co-driver: ${item.secondaryDriver}`}
          </Text>
          <Text style={[styles.itemDetails, { color: colors.textSecondary }]}>
            Vehicle: {item.vehicleName}
          </Text>
          <Text style={[styles.itemDetails, { color: colors.textSecondary }]}>
            Passengers: {item.passengers} • Time: {item.startTime}
            {item.endTime && ` - ${item.endTime}`}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { 
            backgroundColor: item.status === 'active' ? '#34C759' : 
                            item.status === 'completed' ? '#007AFF' : '#FF3B30'
          }
        ]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );

  const renderAddTripForm = () => (
    <ScrollView style={styles.formContainer}>
      <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Create New Trip</Text>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Driver *</Text>
        <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
          <Picker
            selectedValue={tripForm.driverId}
            onValueChange={(value) => setTripForm({...tripForm, driverId: value})}
            style={[styles.picker, { color: colors.textPrimary }]}
          >
            <Picker.Item label="Select Driver" value="" />
            {drivers.filter(d => d.status === 'active').map(driver => (
              <Picker.Item key={driver.id} label={driver.name} value={driver.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Secondary Driver</Text>
        <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
          <Picker
            selectedValue={tripForm.secondaryDriverId}
            onValueChange={(value) => setTripForm({...tripForm, secondaryDriverId: value})}
            style={[styles.picker, { color: colors.textPrimary }]}
          >
            <Picker.Item label="Select Secondary Driver" value="" />
            {drivers.filter(d => d.status === 'active' && d.id !== tripForm.driverId).map(driver => (
              <Picker.Item key={driver.id} label={driver.name} value={driver.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Vehicle *</Text>
        <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
          <Picker
            selectedValue={tripForm.vehicleId}
            onValueChange={(value) => setTripForm({...tripForm, vehicleId: value})}
            style={[styles.picker, { color: colors.textPrimary }]}
          >
            <Picker.Item label="Select Vehicle" value="" />
            {vehicles.filter(v => v.status === 'active').map(vehicle => (
              <Picker.Item key={vehicle.id} label={`${vehicle.name} (${vehicle.seats} seats)`} value={vehicle.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formGroupHalf}>
          <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Start Point *</Text>
          <TextInput
            style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Enter start location"
            placeholderTextColor={colors.textSecondary}
            value={tripForm.startPoint}
            onChangeText={(text) => setTripForm({...tripForm, startPoint: text})}
          />
        </View>
        <View style={styles.formGroupHalf}>
          <Text style={[styles.formLabel, { color: colors.textPrimary }]}>End Point *</Text>
          <TextInput
            style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Enter destination"
            placeholderTextColor={colors.textSecondary}
            value={tripForm.endPoint}
            onChangeText={(text) => setTripForm({...tripForm, endPoint: text})}
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formGroupHalf}>
          <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Passengers</Text>
          <TextInput
            style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Number of passengers"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={tripForm.passengers}
            onChangeText={(text) => setTripForm({...tripForm, passengers: text})}
          />
        </View>
        <View style={styles.formGroupHalf}>
          <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Start Time</Text>
          <TextInput
            style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="HH:MM AM/PM"
            placeholderTextColor={colors.textSecondary}
            value={tripForm.startTime}
            onChangeText={(text) => setTripForm({...tripForm, startTime: text})}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Parking Location</Text>
        <TextInput
          style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Enter parking location"
          placeholderTextColor={colors.textSecondary}
          value={tripForm.parkingLocation}
          onChangeText={(text) => setTripForm({...tripForm, parkingLocation: text})}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Route</Text>
        <TextInput
          style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Enter route details"
          placeholderTextColor={colors.textSecondary}
          value={tripForm.route}
          onChangeText={(text) => setTripForm({...tripForm, route: text})}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }]}
        onPress={handleCreateTrip}
      >
        <Text style={styles.submitButtonText}>Create Trip</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderVehicleDetailModal = () => (
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
              Vehicle Details
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedItem && (
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.vehicleName, { color: colors.textPrimary }]}>
                {selectedItem.name}
              </Text>
              <Text style={[styles.vehicleType, { color: colors.textSecondary }]}>
                {selectedItem.type} • {selectedItem.seats} seats
              </Text>

              <View style={styles.vehicleDetails}>
                <View style={styles.vehicleDetailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date of Joining:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {new Date(selectedItem.dateOfJoining).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.vehicleDetailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Start Date:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {new Date(selectedItem.startDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.vehicleDetailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>End Date:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {new Date(selectedItem.endDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.vehicleDetailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status:</Text>
                  <Text style={[styles.detailValue, { 
                    color: selectedItem.status === 'active' ? '#10B981' : 
                           selectedItem.status === 'maintenance' ? '#F59E0B' : '#EF4444'
                  }]}>
                    {selectedItem.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setModalVisible(false);
                  // Handle edit functionality
                  Alert.alert('Edit Vehicle', 'Edit functionality would be implemented here');
                }}
              >
                <Text style={styles.editButtonText}>Edit Details</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return renderDashboard();
      case 'drivers': 
        return (
          <FlatList
            data={drivers}
            renderItem={renderDriverCard}
            keyExtractor={(item) => item.id}
            style={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        );
      case 'vehicles': 
        return (
          <FlatList
            data={vehicles}
            renderItem={renderVehicleCard}
            keyExtractor={(item) => item.id}
            style={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        );
      case 'trips': 
        return (
          <FlatList
            data={trips}
            renderItem={renderTripCard}
            keyExtractor={(item) => item.id}
            style={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        );
      case 'add-trip': 
        return renderAddTripForm();
      default: 
        return renderDashboard();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Transport Management"
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'drivers', label: 'Drivers' },
            { key: 'vehicles', label: 'Vehicles' },
            { key: 'trips', label: 'Trips' },
            { key: 'add-trip', label: 'Add Trip' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab.key ? colors.primary : colors.textSecondary }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {renderContent()}
      {renderVehicleDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dashboardContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    minWidth: (screenWidth - 48) / 2 - 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 10,
    textAlign: 'center',
  },
  chartCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 2,
    marginBottom: 8,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  pieChartContainer: {
    alignItems: 'flex-start',
  },
  pieSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pieColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  pieLabel: {
    fontSize: 14,
  },
  licenseAlert: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
  },
  expiryDays: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  contactButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 16,
  },
  formContainer: {
    padding: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
  },
  formInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
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
    maxHeight: 400,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: 16,
    marginBottom: 16,
  },
  vehicleDetails: {
    marginBottom: 20,
  },
  vehicleDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
