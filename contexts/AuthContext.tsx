import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

interface User {
  id: string;
  email: string;
  username: string;
  is_superuser: boolean;
  is_staff: boolean;
  role?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  baseUrl: string | null;
  login: (token: string, userData: User, baseUrl: string) => Promise<void>;
  logout: () => Promise<void>;
  setBaseUrl: (url: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [baseUrl, setBaseUrlState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("auth_token");
      const storedUser = await AsyncStorage.getItem("user_data");
      const storedBaseUrl = await AsyncStorage.getItem("base_url");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }

      if (storedBaseUrl) {
        setBaseUrlState(storedBaseUrl);
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    authToken: string,
    userData: User,
    orgBaseUrl: string,
  ) => {
    try {
      await AsyncStorage.multiSet([
        ["auth_token", authToken],
        ["user_data", JSON.stringify(userData)],
        ["base_url", orgBaseUrl],
      ]);

      setToken(authToken);
      setUser(userData);
      setBaseUrlState(orgBaseUrl);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error storing auth data:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(["auth_token", "user_data", "base_url"]);
      setToken(null);
      setUser(null);
      setBaseUrlState(null);
      setIsAuthenticated(false);
      router.replace("/splash"); // Go back to splash to restart the flow
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  };

  const setBaseUrl = async (url: string) => {
    if (!url || url.trim() === "") {
      console.error("Error: The provided base URL is undefined or empty.");
      return; // Exit if the URL is invalid
    }

    try {
      const cleanUrl = url.trim();
      await AsyncStorage.setItem("base_url", cleanUrl);
      setBaseUrlState(cleanUrl);
    } catch (error) {
      console.error("Error storing base URL:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    token,
    baseUrl,
    login,
    logout,
    setBaseUrl,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
