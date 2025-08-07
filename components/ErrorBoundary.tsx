import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeProvider } from "@react-navigation/native";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryClass extends Component<Props & { colors: any }, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View
          style={[
            styles.container,
            { backgroundColor: this.props.colors.background },
          ]}
        >
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: this.props.colors.surface },
            ]}
          >
            <Text
              style={[
                styles.errorTitle,
                { color: this.props.colors.textPrimary },
              ]}
            >
              Something went wrong
            </Text>
            <Text
              style={[
                styles.errorMessage,
                { color: this.props.colors.textSecondary },
              ]}
            >
              We're sorry, but something unexpected happened. Please try again.
            </Text>
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: this.props.colors.primary },
              ]}
              onPress={this.handleRetry}
            >
              <Text
                style={[
                  styles.retryButtonText,
                  { color: this.props.colors.surface },
                ]}
              >
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  const { colors } = useTheme();
  return (
    <ThemeProvider>
      <ErrorBoundaryClass colors={colors} fallback={fallback}>
        {children}
      </ErrorBoundaryClass>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    maxWidth: 320,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
