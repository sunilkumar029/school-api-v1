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
          const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
          // const userToken = await AsyncStorage.getItem('userToken'); // Check for user token
          if (hasSeenOnboarding === 'true') {
            router.replace('/(tabs)'); // Redirect to home if logged in
          } else {
            router.replace('/onboarding'); // Redirect to onboarding if not
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
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