import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { InputField } from "../../components/InputField";
import { validateEmail } from "../../api/auth";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";

interface OrganisationEmailScreenProps {
  navigation?: any;
}

export const OrganisationEmailScreen: React.FC<
  OrganisationEmailScreenProps
> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setBaseUrl } = useAuth();
  const router = useRouter();

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await validateEmail(email);
      const baseUrl = `https://${response.url}`;
      await setBaseUrl(baseUrl);

      if (navigation && navigation.navigate) {
        navigation.navigate("Login", {
          email,
          organizationName: response.organization_name,
        });
      } else {
        router.push({
          pathname: "/auth/login",
          params: { email, organizationName: response.organization_name || "" },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Organization not found");
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
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to VisionariesAI</Text>
            <Text style={styles.subtitle}>
              Enter your school or organization email to get started
            </Text>
          </View>

          <View style={styles.form}>
            <InputField
              label="Organization Email"
              placeholder="Enter your email address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError("");
              }}
              error={error}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Button
              title="Continue"
              onPress={handleContinue}
              loading={loading}
              disabled={!email.trim() || loading}
              style={styles.continueButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Your email helps us identify your school and connect you to the
              right platform
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
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
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  continueButton: {
    marginTop: 8,
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
