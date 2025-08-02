
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';

interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  location: string;
  forecast: {
    day: string;
    temp: number;
    condition: string;
  }[];
}

export default function WeatherScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 28,
    humidity: 65,
    condition: 'Partly Cloudy',
    location: 'School Campus',
    forecast: [
      { day: 'Today', temp: 28, condition: 'Partly Cloudy' },
      { day: 'Tomorrow', temp: 30, condition: 'Sunny' },
      { day: 'Thursday', temp: 26, condition: 'Rainy' },
      { day: 'Friday', temp: 29, condition: 'Sunny' },
    ],
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshWeather = () => {
    // Simulate API call
    setLastUpdated(new Date());
    Alert.alert('Weather Updated', 'Weather data has been refreshed');
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny': return '☀️';
      case 'partly cloudy': return '⛅';
      case 'cloudy': return '☁️';
      case 'rainy': return '🌧️';
      case 'stormy': return '⛈️';
      default: return '🌤️';
    }
  };

  const renderForecastItem = (item: any, index: number) => (
    <View key={index} style={[styles.forecastItem, { backgroundColor: colors.surface }]}>
      <Text style={[styles.forecastDay, { color: colors.textPrimary }]}>{item.day}</Text>
      <Text style={styles.forecastIcon}>{getWeatherIcon(item.condition)}</Text>
      <Text style={[styles.forecastTemp, { color: colors.textPrimary }]}>{item.temp}°C</Text>
      <Text style={[styles.forecastCondition, { color: colors.textSecondary }]}>{item.condition}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Weather"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <View style={styles.content}>
        {/* Current Weather */}
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
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Text>
        </View>

        {/* Forecast */}
        <View style={[styles.forecastCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.forecastTitle, { color: colors.textPrimary }]}>4-Day Forecast</Text>
          <View style={styles.forecastContainer}>
            {weather.forecast.map((item, index) => renderForecastItem(item, index))}
          </View>
        </View>

        {/* Weather Alert */}
        <View style={[styles.alertCard, { backgroundColor: '#FFF3CD', borderColor: '#FFEAA7' }]}>
          <Text style={[styles.alertTitle, { color: '#856404' }]}>Weather Alert</Text>
          <Text style={[styles.alertText, { color: '#856404' }]}>
            Moderate rain expected tomorrow afternoon. Plan indoor activities accordingly.
          </Text>
        </View>
      </View>
    </View>
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
  forecastCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  forecastContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  forecastDay: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  forecastIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  forecastTemp: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  forecastCondition: {
    fontSize: 10,
    textAlign: 'center',
  },
  alertCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
  },
});
