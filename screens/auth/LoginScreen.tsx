import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { InputField } from "../../components/InputField";
import { validateEmail, loginUser } from "../../api/auth";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";

interface LoginScreenProps {
  navigation?: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const { login } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      // Validate email and get base URL
      const emailValidationResponse = await validateEmail(email);
      const baseUrl = `https://${emailValidationResponse.url}`;

      // Prepare the login payload
      const payload = {
        username: email,
        password: password,
      };

      // Attempt to log in
      const loginResponse = await loginUser(baseUrl, payload);
      console.log("Login successful, response:", loginResponse);

      // Ensure the response contains the user and token
      const userData = {
        id: loginResponse.user_id, // In your response
        email: loginResponse.email,
        username: loginResponse.username || email,
        is_superuser: loginResponse.is_superuser,
        is_staff: loginResponse.is_staff,
        is_active: loginResponse.is_active,
      };

      // Step to store authentication data
      await login(loginResponse.token, userData, baseUrl); // Set user data and token

      // Navigate to redirector
      if (navigation && navigation.replace) {
        navigation.replace("AuthRedirector");
      } else {
        router.replace("/auth/redirector");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome to VisionariesAI</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            <View style={styles.form}>
              {errors.general && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.general}</Text>
                </View>
              )}

              <InputField
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors({ ...errors, email: undefined });
                  }
                }}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <InputField
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined });
                  }
                }}
                error={errors.password}
                secureTextEntry
              />

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.loginButton}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Your email helps us identify your organization and connect you
                to the right platform
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E1E1E",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  form: {
    gap: 8,
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
  },
  loginButton: {
    marginTop: 16,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
});
