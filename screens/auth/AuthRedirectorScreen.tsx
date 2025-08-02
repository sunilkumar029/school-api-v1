
import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";

export const AuthRedirectorScreen: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/auth/organisation-email");
      return;
    }

    // Redirect based on user role after a short delay
    const timeout = setTimeout(() => {
      if (user.is_superuser) {
        router.replace("/(tabs)");
      } else if (user.is_staff) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(tabs)");
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [user, isAuthenticated, router]);

  const getRoleText = () => {
    if (!user) return "Loading...";

    if (user.is_superuser) return "Setting up Admin Dashboard...";
    if (user.is_staff) return "Setting up Staff Dashboard...";
    return "Setting up Student Dashboard...";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#004AAD" style={styles.loader} />
        <Text style={styles.title}>Welcome back!</Text>
        <Text style={styles.subtitle}>{getRoleText()}</Text>
        {user && (
          <Text style={styles.userText}>
            Hello, {user.username || user.email}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loader: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E1E1E",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  userText: {
    fontSize: 14,
    color: "#004AAD",
    textAlign: "center",
  },
});
