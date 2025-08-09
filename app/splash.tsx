
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.3);

  useEffect(() => {
    const animateAndNavigate = async () => {
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Wait for splash duration
      setTimeout(async () => {
        try {
          // Check if user has seen onboarding
          const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
          
          // Check if user is already logged in
          const userToken = await AsyncStorage.getItem('auth_token');
          const baseUrl = await AsyncStorage.getItem('base_url');
          
          if (hasSeenOnboarding !== 'true') {
            // First time user - show onboarding
            router.replace('/onboarding');
          } else if (userToken && baseUrl) {
            // User has seen onboarding and is logged in - verify token
            try {
              const response = await fetch(`${baseUrl}/api/academic-years/`, {
                method: 'HEAD',
                headers: {
                  'Authorization': `Token ${userToken}`,
                },
                timeout: 10000,
              });
              
              if (response.ok) {
                // Token is valid - go to home
                router.replace('/(tabs)');
              } else {
                // Token is invalid - clear and go to login
                await AsyncStorage.multiRemove(['auth_token', 'user_data']);
                router.replace('/auth/login');
              }
            } catch (tokenError) {
              // Network error or invalid token - go to login
              console.log('Token verification failed:', tokenError);
              await AsyncStorage.multiRemove(['auth_token', 'user_data']);
              router.replace('/auth/login');
            }
          } else {
            // User has seen onboarding but not logged in - go to login
            router.replace('/auth/login');
          }
        } catch (error) {
          console.error('Error checking app state:', error);
          // On error, show onboarding to be safe
          router.replace('/onboarding');
        }
      }, 2500);
    };

    animateAndNavigate();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FFFFFF" />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logoEmoji}
            resizeMode="contain"
          />
          <View style={styles.logoBorder} />
        </View>

        {/* App Name */}
        <Text style={styles.appName}>VisionariesAI</Text>
        <Text style={styles.appSubtitle}>School System</Text>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingDot, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.loadingDot, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.loadingDot, { opacity: fadeAnim }]} />
        </View>
      </Animated.View>

      {/* Company Footer */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.footerText}>VisionariesAI Labs PVT. LTD.</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  logoEmoji: {
    height: 80,
    width: 80,
  },
  logoBorder: {
    position: 'absolute',
    width: 120,
    height: 120,
    opacity: 0.3,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#4A90E2',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 60,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A90E2',
    marginHorizontal: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    color: '#4A90E2',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  versionText: {
    color: '#4A90E2',
    fontSize: 12,
    opacity: 0.6,
  },
});
