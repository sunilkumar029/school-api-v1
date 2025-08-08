
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
  Dimensions,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBranches, useAcademicYears } from '@/hooks/useApi';
import { apiService } from '@/api/apiService';
import { GlobalFilters } from '@/components/GlobalFilters';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';

const { width } = Dimensions.get('window');

interface Vehicle {
  id: number;
  name: string;
  type: string;
  seats: number;
  date_of_joining: string;
  start_date?: string;
  end_date?: string;
  license_plate: string;
  driver_id?: number;
  status: 'active' | 'inactive' | 'maintenance';
  license_expiry?: string;
  vehicle_type?: string;
  joining_date?: string;
  registration_number?: string;
  total_seats?: number;
}

interface Trip {
  id: number;
  primary_driver_name?: string;
  secondary_driver_name?: string;
  start_point: string;
  end_point: string;
  passenger_count: number;
  vehicle_name: string;
  status: 'active' | 'completed' | 'cancelled';
  departure_time?: string;
  parking_location?: string;
  total_passengers?: number;
  stops: { stop_name: string }[];
}

interface TransportStats {
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
  // const [selectedBranch, setSelectedBranch] = useState<number>(1);
  // const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vehicles' | 'trips' | 'drivers'>('dashboard');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'vehicle' | 'trip' | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedBranch, selectedAcademicYear } = useGlobalFilters();

  const [transportStats, setTransportStats] = useState<TransportStats>({
    totalVehicles: 0,
    activeVehicles: 0,
    totalDrivers: 0,
    licenseExpiryAlerts: 0,
    totalTrips: 0,
    weeklyTrips: 0,
    passengers: 0,
    tripsWithTracking: 0,
  });

  // Form states
  const [vehicleForm, setVehicleForm] = useState({
    name: '',
    type: 'Bus',
    seats: '',
    license_plate: '',
    driver_id: null as number | null,
  });

  const [tripForm, setTripForm] = useState({
    driver_id: null as number | null,
    secondary_driver_id: null as number | null,
    vehicle_id: null as number | null,
    start_point: '',
    end_point: '',
    departure_time: '',
    parking_location: '',
  });

  // Fetch data
  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears();

  const fetchTransportData = async () => {
    try {
      setLoading(true);

      const [vehiclesResponse, tripsResponse, driversResponse] = await Promise.all([
        apiService.getVehicles({ branch: selectedBranch }).catch(() => ({ results: null })),
        apiService.getTrips({ branch: selectedBranch }).catch(() => ({ results: null })),
        apiService.getDrivers({ branch: selectedBranch }).catch(() => ({ results: null }))
      ]);

      setVehicles(vehiclesResponse.results || []);
      setTrips(tripsResponse.results || []);
      setDrivers(driversResponse.results || []);

      calculateStats();

    } catch (error) {
      console.error('Error fetching transport data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackData = () => {
    const vehicleTypes = ['Bus', 'Van', 'Car'];
    const fallbackVehicles: Vehicle[] = [];
    const fallbackTrips: Trip[] = [];
    const fallbackDrivers: any[] = [];

    // Generate vehicles
    for (let i = 1; i <= 15; i++) {
      const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
      const seats = type === 'Bus' ? 40 + Math.floor(Math.random() * 20) : type === 'Van' ? 12 + Math.floor(Math.random() * 8) : 4;

      fallbackVehicles.push({
        id: i,
        name: `${type} ${i}`,
        type,
        seats,
        date_of_joining: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        license_plate: `ABC${1000 + i}`,
        status: Math.random() > 0.8 ? 'maintenance' : Math.random() > 0.9 ? 'inactive' : 'active',
        license_expiry: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }

    // Generate drivers
    for (let i = 1; i <= 20; i++) {
      fallbackDrivers.push({
        id: i,
        first_name: `Driver`,
        last_name: `${i}`,
        phone: `9876543${100 + i}`,
        license_number: `DL${12345 + i}`,
        license_expiry: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }

    // Generate trips
    // for (let i = 1; i <= 25; i++) {
    //   const vehicle = fallbackVehicles[Math.floor(Math.random() * fallbackVehicles.length)];
    //   const driver = fallbackDrivers[Math.floor(Math.random() * fallbackDrivers.length)];

    //   fallbackTrips.push({
    //     id: i,
    //     primary_driver_name: `${driver.first_name} ${driver.last_name}`,
    //     secondary_driver_name: Math.random() > 0.7 ? `${fallbackDrivers[Math.floor(Math.random() * fallbackDrivers.length)].first_name} Helper` : undefined,
    //     start_point: ['School Campus', 'City Center', 'Station Area', 'Residential Complex'][Math.floor(Math.random() * 4)],
    //     end_point: ['School Campus', 'City Center', 'Station Area', 'Residential Complex'][Math.floor(Math.random() * 4)],
    //     // passengers: Math.floor(Math.random() * vehicle.seats * 0.8),
    //     vehicle_name: vehicle.name,
    //     status: Math.random() > 0.7 ? 'completed' : Math.random() > 0.9 ? 'cancelled' : 'active',
    //     departure_time: `${Math.floor(Math.random() * 12) + 6}:${Math.floor(Math.random() * 6)}0 AM`,
    //     parking_location: 'Main Parking Area',
    //   });
    // }

    setVehicles(fallbackVehicles);
    setTrips(fallbackTrips);
    setDrivers(fallbackDrivers);
  };

  const calculateStats = () => {
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'active').length;
    const totalDrivers = drivers.length;

    // Calculate license expiry alerts (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const licenseExpiryAlerts = [
      ...vehicles.filter(v => v.license_expiry && new Date(v.license_expiry) <= thirtyDaysFromNow),
      ...drivers.filter(d => d.license_expiry && new Date(d.license_expiry) <= thirtyDaysFromNow)
    ].length;

    const totalTrips = trips.length;
    const weeklyTrips = trips.filter(t => {
      const tripDate = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return tripDate >= weekAgo;
    }).length;

    const passengers = trips.reduce((sum, trip) => sum + (trip.total_passengers || 0), 0);
    const tripsWithTracking = trips.filter(t => t.status === 'active').length;

    setTransportStats({
      totalVehicles,
      activeVehicles,
      totalDrivers,
      licenseExpiryAlerts,
      totalTrips,
      weeklyTrips,
      passengers,
      tripsWithTracking,
    });
  };

  React.useEffect(() => {
    fetchTransportData();
  }, [selectedBranch, selectedAcademicYear]);

  React.useEffect(() => {
    calculateStats();
  }, [vehicles, trips, drivers]);

  const handleCreateVehicle = async () => {
    try {
      if (!vehicleForm.name || !vehicleForm.license_plate || !vehicleForm.seats) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      await apiService.createVehicle({
        ...vehicleForm,
        seats: parseInt(vehicleForm.seats),
        branch: selectedBranch,
        academic_year: selectedAcademicYear,
      });

      Alert.alert('Success', 'Vehicle added successfully');
      setModalVisible(false);
      resetVehicleForm();
      fetchTransportData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add vehicle');
    }
  };

  const handleCreateTrip = async () => {
    try {
      if (!tripForm.driver_id || !tripForm.vehicle_id || !tripForm.start_point || !tripForm.end_point) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      await apiService.createTrip({
        ...tripForm,
        branch: selectedBranch,
        academic_year: selectedAcademicYear,
      });

      Alert.alert('Success', 'Trip created successfully');
      setModalVisible(false);
      resetTripForm();
      fetchTransportData();
    } catch (error) {
      Alert.alert('Error', 'Failed to create trip');
    }
  };

  const resetVehicleForm = () => {
    setVehicleForm({
      name: '',
      type: 'Bus',
      seats: '',
      license_plate: '',
      driver_id: null,
    });
  };

  const resetTripForm = () => {
    setTripForm({
      driver_id: null,
      secondary_driver_id: null,
      vehicle_id: null,
      start_point: '',
      end_point: '',
      departure_time: '',
      parking_location: '',
    });
  };

  const renderDashboard = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {transportStats.totalVehicles}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Vehicles
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {transportStats.activeVehicles}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Active Vehicles
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {transportStats.totalDrivers}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Drivers
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: '#FF9800' }]}>
              {transportStats.licenseExpiryAlerts}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              License Alerts
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {transportStats.totalTrips}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Trips
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {transportStats.weeklyTrips}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Weekly Trips
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {transportStats.passengers}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Passengers
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: '#2196F3' }]}>
              {transportStats.tripsWithTracking}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              With Tracking
            </Text>
          </View>
        </View>
      </View>

      {/* Charts Section */}
      <View style={[styles.chartSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Vehicle Types Distribution
        </Text>
        <View style={styles.vehicleTypes}>
          {['Bus', 'Van', 'Car'].map((type) => {
            const count = vehicles.filter(v => v.type === type).length;
            const percentage = vehicles.length > 0 ? (count / vehicles.length) * 100 : 0;

            return (
              <View key={type} style={styles.vehicleTypeItem}>
                <Text style={[styles.vehicleTypeName, { color: colors.textPrimary }]}>
                  {type}
                </Text>
                <Text style={[styles.vehicleTypeCount, { color: colors.textSecondary }]}>
                  {count} ({percentage.toFixed(1)}%)
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );

  const renderVehicles = () => (
    <FlatList
      data={vehicles}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.vehicleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            // Handle vehicle detail view
          }}
        >
          <View style={styles.vehicleHeader}>
            <Text style={[styles.vehicleName, { color: colors.textPrimary }]}>
              {item.name}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.vehicle_type === 'bus' ? '#4CAF50' : item.vehicle_type === 'van' ? '#FF9800' : '#F44336' }
            ]}>
              <Text style={styles.statusText}>
                {item.vehicle_type ? item.vehicle_type.charAt(0).toUpperCase() + item.vehicle_type.slice(1) : 'Unknown'}
              </Text>
            </View>
          </View>

          <View style={styles.vehicleDetails}>
            <Text style={[styles.vehicleInfo, { color: colors.textSecondary }]}>
              Seats: {item.total_seats}
            </Text>
            <Text style={[styles.vehicleInfo, { color: colors.textSecondary }]}>
              License: {item.registration_number}
            </Text>
            <Text style={[styles.vehicleInfo, { color: colors.textSecondary }]}>
              DOJ: {item.joining_date ? new Date(item.joining_date).toLocaleDateString() : '-'}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No vehicles found
          </Text>
        </View>
      }
    />
  );

  const renderTrips = () => (
    <FlatList
      data={trips}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.tripCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            // Handle trip detail view with tracking
          }}
        >
          <View style={styles.tripHeader}>
            <Text style={[styles.tripRoute, { color: colors.textPrimary }]}>
              {item.start_point} → {item.end_point}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.status === 'active' ? '#4CAF50' : item.status === 'completed' ? '#2196F3' : '#F44336' }
            ]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>

          <View style={styles.tripDetails}>
            <Text style={[styles.tripInfo, { color: colors.textSecondary }]}>
              Driver: {item.primary_driver_name}
            </Text>
            {item.secondary_driver_name && (
              <Text style={[styles.tripInfo, { color: colors.textSecondary }]}>
                Secondary: {item.secondary_driver_name}
              </Text>
            )}
            <Text style={[styles.tripInfo, { color: colors.textSecondary }]}>
              Vehicle: {item.vehicle_name} • Passengers: {item.total_passengers}
            </Text>
            {item.stops.length > 0 && (
              <Text style={[styles.tripInfo, { color: colors.textSecondary }]}>
                Stops: {item.stops.map((stop) => stop.stop_name).join(', ')}
              </Text>
            )}
            {item.departure_time && (
              <Text style={[styles.tripInfo, { color: colors.textSecondary }]}>
                Departure: {item.departure_time}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No trips found
          </Text>
        </View>
      }
    />
  );

  const renderDrivers = () => (
    <FlatList
      data={drivers}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={[styles.driverCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.driverName, { color: colors.textPrimary }]}>
            {item.full_name}
          </Text>
          <Text style={[styles.driverInfo, { color: colors.textSecondary }]}>
            License: {item.license_number}
          </Text>
          {item.license_expiry_date && (
            <Text style={[styles.driverInfo, { color: colors.textSecondary }]}>
              Expires: {new Date(item.license_expiry_date).toLocaleDateString()}
              {/* Expires: {item.license_expiry_date} */}
            </Text>
          )}
        </View>
      )}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No drivers found
          </Text>
        </View>
      }
    />
  );

  const renderModal = () => {
    if (!modalVisible || !modalType) return null;

    return (
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
                {modalType === 'vehicle' ? 'Add Vehicle' : 'Create Trip'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setModalType(null);
                  modalType === 'vehicle' ? resetVehicleForm() : resetTripForm();
                }}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.primary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {modalType === 'vehicle' ? (
                <>
                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Vehicle Name *</Text>
                    <TextInput
                      style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                      placeholder="Enter vehicle name"
                      placeholderTextColor={colors.textSecondary}
                      value={vehicleForm.name}
                      onChangeText={(text) => setVehicleForm(prev => ({ ...prev, name: text }))}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Type *</Text>
                    <View style={styles.radioGroup}>
                      {['Bus', 'Van', 'Car'].map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={styles.radioOption}
                          onPress={() => setVehicleForm(prev => ({ ...prev, type }))}
                        >
                          <View style={[
                            styles.radioCircle,
                            { borderColor: colors.border },
                            vehicleForm.type === type && { backgroundColor: colors.primary }
                          ]}>
                            {vehicleForm.type === type && (
                              <Text style={styles.radioCheck}>●</Text>
                            )}
                          </View>
                          <Text style={[styles.radioLabel, { color: colors.textPrimary }]}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Seats *</Text>
                    <TextInput
                      style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                      placeholder="Number of seats"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      value={vehicleForm.seats}
                      onChangeText={(text) => setVehicleForm(prev => ({ ...prev, seats: text }))}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textPrimary }]}>License Plate *</Text>
                    <TextInput
                      style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                      placeholder="Enter license plate"
                      placeholderTextColor={colors.textSecondary}
                      value={vehicleForm.license_plate}
                      onChangeText={(text) => setVehicleForm(prev => ({ ...prev, license_plate: text }))}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handleCreateVehicle}
                  >
                    <Text style={styles.submitButtonText}>Add Vehicle</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Driver *</Text>
                    <TouchableOpacity style={[styles.formInput, { borderColor: colors.border }]}>
                      <Text style={[styles.formInputText, { color: colors.textPrimary }]}>
                        {tripForm.driver_id ?
                          drivers.find(d => d.id === tripForm.driver_id)?.first_name + ' ' + drivers.find(d => d.id === tripForm.driver_id)?.last_name :
                          'Select Driver'
                        }
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Vehicle *</Text>
                    <TouchableOpacity style={[styles.formInput, { borderColor: colors.border }]}>
                      <Text style={[styles.formInputText, { color: colors.textPrimary }]}>
                        {tripForm.vehicle_id ?
                          vehicles.find(v => v.id === tripForm.vehicle_id)?.name :
                          'Select Vehicle'
                        }
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Start Point *</Text>
                    <TextInput
                      style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                      placeholder="Enter start location"
                      placeholderTextColor={colors.textSecondary}
                      value={tripForm.start_point}
                      onChangeText={(text) => setTripForm(prev => ({ ...prev, start_point: text }))}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textPrimary }]}>End Point *</Text>
                    <TextInput
                      style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                      placeholder="Enter destination"
                      placeholderTextColor={colors.textSecondary}
                      value={tripForm.end_point}
                      onChangeText={(text) => setTripForm(prev => ({ ...prev, end_point: text }))}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Parking Location</Text>
                    <TextInput
                      style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                      placeholder="Enter parking location"
                      placeholderTextColor={colors.textSecondary}
                      value={tripForm.parking_location}
                      onChangeText={(text) => setTripForm(prev => ({ ...prev, parking_location: text }))}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handleCreateTrip}
                  >
                    <Text style={styles.submitButtonText}>Create Trip</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
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

      {/* Filter Row */}
      <GlobalFilters />

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['dashboard', 'vehicles', 'trips', 'drivers'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { backgroundColor: colors.primary }
              ]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab ? '#FFFFFF' : colors.textSecondary }
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading transport data...
            </Text>
          </View>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'vehicles' && renderVehicles()}
            {activeTab === 'trips' && renderTrips()}
            {activeTab === 'drivers' && renderDrivers()}
          </>
        )}
      </View>

      {renderModal()}
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
  filterButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterText: {
    fontSize: 12,
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
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
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
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  chartSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  vehicleTypes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  vehicleTypeItem: {
    alignItems: 'center',
  },
  vehicleTypeName: {
    fontSize: 14,
    fontWeight: '600',
  },
  vehicleTypeCount: {
    fontSize: 12,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  vehicleCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 16,
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
    fontSize: 10,
    fontWeight: 'bold',
  },
  vehicleDetails: {
    gap: 4,
  },
  vehicleInfo: {
    fontSize: 14,
  },
  tripCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripRoute: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  tripDetails: {
    gap: 4,
  },
  tripInfo: {
    fontSize: 14,
  },
  driverCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  driverInfo: {
    fontSize: 14,
    marginBottom: 4,
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
    justifyContent: 'center',
  },
  formInputText: {
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
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
