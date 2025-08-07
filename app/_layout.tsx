import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useFonts } from "expo-font";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { GlobalFiltersProvider } from "@/contexts/GlobalFiltersContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ErrorBoundary } from "@/components/ErrorBoundary"; // Assuming ErrorBoundary is in components/ErrorBoundary.tsx
import { useEffect } from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Keep the splash screen visible until fonts are loaded
  useEffect(() => {
    if (loaded) {
      // Hide the splash screen once the fonts are loaded
      // require('expo-splash-screen').hideAsync(); // This would typically be called here
    }
  }, [loaded]);

  if (!loaded) {
    return null; // Or a loading component
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <GlobalFiltersProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="splash" options={{ headerShown: false }} />
              <Stack.Screen
                name="onboarding/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="auth/organisation-email"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="auth/login"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="auth/redirector"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          </GlobalFiltersProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
