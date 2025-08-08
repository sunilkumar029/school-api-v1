import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface DropdownItem {
  id: number;
  name: string;
  [key: string]: any;
}

interface ModalDropdownFilterProps {
  label: string;
  items: DropdownItem[];
  selectedValue: number | null;
  onValueChange: (value: number) => void;
  loading?: boolean;
  placeholder?: string;
  compact?: boolean;
  fullWidth?: boolean; // Added for potential future use or consistency
}

export const ModalDropdownFilter: React.FC<ModalDropdownFilterProps> = ({
  label,
  items,
  selectedValue,
  onValueChange,
  loading = false,
  placeholder = "Select option",
  compact = false,
  fullWidth = false, // Default to false if not provided
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // Ensure items is always an array to prevent errors
  const safeItems = Array.isArray(items) ? items : [];

  const selectedItem = safeItems.find((item) => item && item.id === selectedValue);
  const displayText = selectedItem ? selectedItem.name : placeholder;

  const handleSelect = (value: number) => {
    try {
      onValueChange(value);
      setModalVisible(false);
    } catch (error) {
      console.error('Error in ModalDropdownFilter handleSelect:', error);
      // Optionally, you could show a user-facing error message here
      setModalVisible(false); // Still close the modal even on error
    }
  };

  return (
    <View style={compact ? styles.compactContainer : styles.container}>
      {!compact && (
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.dropdownButton,
          compact && styles.compactButton,
          fullWidth && styles.fullWidth,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
        onPress={() => setModalVisible(true)}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={`Select ${label}: ${selectedItem?.name || "No selection"}`}
        accessibilityHint={`Opens a list to choose ${label}`}
      >
        <Text
          style={[
            styles.buttonText,
            compact && styles.compactText,
            { color: colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {compact && displayText.length > 12
            ? displayText.slice(0, 12) + "..."
            : displayText}
        </Text>
        <Text style={[styles.arrow, { color: colors.textSecondary }]}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: colors.modalOverlay },
          ]}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.surface },
                compact && styles.compactModal,
              ]}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[styles.modalTitle, { color: colors.textPrimary }]}
                >
                  Select {label}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                >
                  <Text
                    style={[styles.closeButtonText, { color: colors.primary }]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {loading ? (
                  <ActivityIndicator
                    size="large"
                    color={colors.primary}
                    style={styles.loading}
                  />
                ) : safeItems.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <Text
                      style={[
                        styles.emptyStateText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      No items available
                    </Text>
                  </View>
                ) : (
                  safeItems.map((item) => (
                    <TouchableOpacity
                      key={item.id} // Assuming item.id is unique and stable
                      style={[
                        styles.modalItem,
                        {
                          backgroundColor:
                            selectedValue === item.id
                              ? colors.primary + "20"
                              : "transparent",
                          borderBottomColor: colors.border,
                        },
                      ]}
                      onPress={() => handleSelect(item.id)}
                      accessibilityRole="menuitem"
                      accessibilityLabel={item.name}
                      accessibilityState={{
                        selected: selectedValue === item.id,
                      }}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          {
                            color:
                              selectedValue === item.id
                                ? colors.primary
                                : colors.textPrimary,
                            fontWeight:
                              selectedValue === item.id ? "bold" : "normal",
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                      {selectedValue === item.id && (
                        <Text
                          style={[styles.checkmark, { color: colors.primary }]}
                        >
                          ✓
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  compactContainer: {
    marginHorizontal: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 44,
    minWidth: 120,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  compactButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 80,
  },
  fullWidth: {
    width: "100%",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginRight: 8, // Add some space for the arrow
  },
  compactText: {
    fontSize: 12,
  },
  arrow: {
    fontSize: 10,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSafeArea: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    maxHeight: "70%",
    borderRadius: 12,
    elevation: 8,
    overflow: "hidden", // To ensure border radius is applied to children
  },
  compactModal: {
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB", // Consider using theme colors here
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBody: {
    flexGrow: 1, // Allow scroll view to take available space
    maxHeight: 300, // Explicitly set max height, though this might conflict with flexGrow depending on usage
    paddingBottom: 16, // Add padding at the bottom of the scrollable content
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
    flex: 1,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: "bold",
  },
  loading: {
    paddingVertical: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontStyle: "italic",
  },
});