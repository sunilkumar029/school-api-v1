
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { Image } from 'react-native';


export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const [errors, setErrors] = useState({});
  // const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Step 1: Validate email to get subdomain URL
      const validateResponse = await fetch(
        `https://default.dev.sms.visionariesai.com/api/organisations/validate-email/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!validateResponse.ok) {
        throw new Error('Invalid organization or email domain');
      }

      const validateData = await validateResponse.json();
      const baseUrl = `https://${validateData.url}`;

      // Step 2: Store base URL
      await AsyncStorage.setItem('base_url', baseUrl);

      // Step 3: Login with username/password
      const loginResponse = await fetch(`${baseUrl}/api/get-token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(loginData.detail || loginData.error || 'Login failed');
      }

      // Step 4: Construct user object
      const userData = {
        id: loginData.user_id,
        email: loginData.email,
        username: loginData.username || email,
        is_superuser: loginData.is_superuser,
        is_staff: loginData.is_staff,
        is_active: loginData.is_active,
      };

      // Step 5: Store token and user
      await AsyncStorage.setItem('auth_token', loginData.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));

      // Step 6: Update auth context (replace `login` with your context function)
      await login(loginData.token, userData, baseUrl);

      // Step 7: Navigate to redirector
      router.replace('/auth/redirector');

    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'Login failed. Please try again.',
      });
      Alert.alert('Login Failed', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Image
                source={require('../../assets/images/icon.png')}
                style={styles.logoImg}
              />
              {/* <Text style={styles.logo}>📚</Text> */}
              <Text style={styles.title}>VisionariesAI</Text>
              <Text style={styles.subtitle}>School System</Text>
              <Text style={styles.description}>
                Sign in to access your school management portal
              </Text>
            </View>

            {/* Login Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your organization email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Help Text */}
            <View style={styles.helpSection}>
              <Text style={styles.helpText}>
                Need help? Contact your school administrator
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>VisionariesAI Labs PVT. LTD.</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  logoImg: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4A90E2',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#111827',
  },
  loginButton: {
    backgroundColor: '#4A90E2',
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    color: '#4A90E2',
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  versionText: {
    color: '#4A90E2',
    fontSize: 10,
    opacity: 0.6,
  },
});
