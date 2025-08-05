
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '@/api/apiService';

interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  location: string;
  last_updated: string;
}

interface DeviceReading {
  id: number;
  device: any;
  reading_value: number;
  reading_type: string;
  timestamp: string;
  unit: string;
}

export default function WeatherScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [deviceReadings, setDeviceReadings] = useState<DeviceReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async () => {
    try {
      setError(null);
      
      // Fetch live device readings for weather data
      const liveReadings = await apiService.getLiveDeviceReadings();
      setDeviceReadings(liveReadings || []);

      // Process readings to extract weather information
      const tempReading = liveReadings?.find((r: DeviceReading) => 
        r.reading_type?.toLowerCase().includes('temperature')
      );
      const humidityReading = liveReadings?.find((r: DeviceReading) => 
        r.reading_type?.toLowerCase().includes('humidity')
      );

      if (tempReading || humidityReading) {
        setWeather({
          temperature: tempReading?.reading_value || 25,
          humidity: humidityReading?.reading_value || 60,
          condition: getConditionFromReadings(tempReading?.reading_value, humidityReading?.reading_value),
          location: 'School Campus',
          last_updated: tempReading?.timestamp || new Date().toISOString(),
        });
      } else {
        // Fallback to default if no readings available
        setWeather({
          temperature: 25,
          humidity: 60,
          condition: 'No Data',
          location: 'School Campus',
          last_updated: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Failed to fetch weather data');
      // Set fallback data
      setWeather({
        temperature: 25,
        humidity: 60,
        condition: 'Offline',
        location: 'School Campus',
        last_updated: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getConditionFromReadings = (temp?: number, humidity?: number) => {
    if (!temp && !humidity) return 'No Data';
    if (temp && temp > 30) return 'Hot';
    if (temp && temp < 15) return 'Cold';
    if (humidity && humidity > 80) return 'Humid';
    if (humidity && humidity < 30) return 'Dry';
    return 'Pleasant';
  };

  const refreshWeather = async () => {
    setRefreshing(true);
    await fetchWeatherData();
  };

  useEffect(() => {
    fetchWeatherData();
    
    // Set up periodic refresh every 5 minutes
    const interval = setInterval(fetchWeatherData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'hot': return '🌡️';
      case 'cold': return '❄️';
      case 'humid': return '💧';
      case 'dry': return '🌵';
      case 'pleasant': return '🌤️';
      case 'offline': return '📡';
      case 'no data': return '❓';
      default: return '🌤️';
    }
  };

  const renderDeviceReading = (reading: DeviceReading, index: number) => (
    <View key={index} style={[styles.readingCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.readingType, { color: colors.textPrimary }]}>
        {reading.reading_type}
      </Text>
      <Text style={[styles.readingValue, { color: colors.primary }]}>
        {reading.reading_value} {reading.unit}
      </Text>
      <Text style={[styles.readingTime, { color: colors.textSecondary }]}>
        {new Date(reading.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar
          title="Weather & IoT"
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationsPress={() => router.push('/(tabs)/notifications')}
          onSettingsPress={() => router.push('/(tabs)/settings')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading weather data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Weather & IoT"
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
            refreshing={refreshing}
            onRefresh={refreshWeather}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {error && (
          <View style={[styles.errorCard, { backgroundColor: '#FFEBEE', borderColor: '#F44336' }]}>
            <Text style={[styles.errorText, { color: '#C62828' }]}>{error}</Text>
            <TouchableOpacity onPress={refreshWeather} style={styles.retryButton}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Current Weather */}
        {weather && (
          <View style={[styles.currentWeatherCard, { backgroundColor: colors.surface }]}>
            <View style={styles.currentWeatherHeader}>
              <Text style={[styles.location, { color: colors.textSecondary }]}>{weather.location}</Text>
              <TouchableOpacity onPress={refreshWeather} style={styles.refreshButton}>
                <Text style={styles.refreshIcon}>🔄</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.currentWeatherMain}>
              <Text style={styles.weatherIcon}>{getWeatherIcon(weather.condition)}</Text>
              <Text style={[styles.temperature, { color: colors.textPrimary }]}>{weather.temperature}°C</Text>
            </View>

            <Text style={[styles.condition, { color: colors.textSecondary }]}>{weather.condition}</Text>

            <View style={styles.weatherDetails}>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Humidity</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{weather.humidity}%</Text>
              </View>
            </View>

            <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
              Last updated: {new Date(weather.last_updated).toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* Device Readings */}
        {deviceReadings.length > 0 && (
          <View style={[styles.readingsCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.readingsTitle, { color: colors.textPrimary }]}>Live Sensor Readings</Text>
            <View style={styles.readingsContainer}>
              {deviceReadings.slice(0, 6).map((reading, index) => renderDeviceReading(reading, index))}
            </View>
          </View>
        )}

        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>System Status</Text>
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Sensors Online:</Text>
            <Text style={[styles.statusValue, { color: colors.primary }]}>{deviceReadings.length}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Data Quality:</Text>
            <Text style={[styles.statusValue, { color: error ? '#F44336' : '#4CAF50' }]}>
              {error ? 'Poor' : 'Good'}
            </Text>
          </View>
        </View>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  currentWeatherCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  currentWeatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  location: {
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
  },
  refreshIcon: {
    fontSize: 20,
  },
  currentWeatherMain: {
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherIcon: {
    fontSize: 80,
    marginBottom: 10,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  condition: {
    fontSize: 18,
    marginBottom: 20,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastUpdated: {
    fontSize: 12,
  },
  readingsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  readingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  readingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  readingCard: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  readingType: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  readingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  readingTime: {
    fontSize: 10,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
