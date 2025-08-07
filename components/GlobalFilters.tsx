import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useGlobalFilters } from "@/contexts/GlobalFiltersContext";

interface GlobalFiltersProps {
  showInline?: boolean;
  compact?: boolean;
}

export const GlobalFilters: React.FC<GlobalFiltersProps> = ({
  showInline = false,
  compact = false,
}) => {
  const { colors } = useTheme();
  const {
    selectedBranch,
    selectedAcademicYear,
    setSelectedBranch,
    setSelectedAcademicYear,
    branches,
    academicYears,
    branchesLoading,
    academicYearsLoading,
  } = useGlobalFilters();

  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);

  const selectedBranchName =
    branches.find((b) => b.id === selectedBranch)?.name || "Select Branch";
  const selectedYearName =
    academicYears.find((y) => y.id === selectedAcademicYear)?.name ||
    "Select Year";

  const renderBranchModal = () => (
    <Modal
      visible={branchModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setBranchModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Select Branch
            </Text>
            <TouchableOpacity
              onPress={() => setBranchModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {branchesLoading ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={styles.loading}
              />
            ) : (
              branches.map((branch) => (
                <TouchableOpacity
                  key={branch.id}
                  style={[
                    styles.modalItem,
                    {
                      backgroundColor:
                        selectedBranch === branch.id
                          ? colors.primary + "20"
                          : "transparent",
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setSelectedBranch(branch.id);
                    setBranchModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color:
                          selectedBranch === branch.id
                            ? colors.primary
                            : colors.textPrimary,
                        fontWeight:
                          selectedBranch === branch.id ? "bold" : "normal",
                      },
                    ]}
                  >
                    {branch.name}
                  </Text>
                  {selectedBranch === branch.id && (
                    <Text style={[styles.checkmark, { color: colors.primary }]}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderYearModal = () => (
    <Modal
      visible={yearModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setYearModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Select Academic Year
            </Text>
            <TouchableOpacity
              onPress={() => setYearModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {academicYearsLoading ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={styles.loading}
              />
            ) : (
              academicYears.map((year) => (
                <TouchableOpacity
                  key={year.id}
                  style={[
                    styles.modalItem,
                    {
                      backgroundColor:
                        selectedAcademicYear === year.id
                          ? colors.primary + "20"
                          : "transparent",
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setSelectedAcademicYear(year.id);
                    setYearModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color:
                          selectedAcademicYear === year.id
                            ? colors.primary
                            : colors.textPrimary,
                        fontWeight:
                          selectedAcademicYear === year.id ? "bold" : "normal",
                      },
                    ]}
                  >
                    {year.name}
                  </Text>
                  {selectedAcademicYear === year.id && (
                    <Text style={[styles.checkmark, { color: colors.primary }]}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (showInline) {
    return (
      <View
        style={[styles.inlineContainer, compact && styles.compactContainer]}
      >
        <TouchableOpacity
          style={[
            styles.filterButton,
            compact && styles.compactFilterButton,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
          onPress={() => setBranchModalVisible(true)}
        >
          <Text
            style={[
              styles.filterButtonText,
              compact && styles.compactFilterButtonText,
              { color: colors.textPrimary },
            ]}
          >
            {compact ? selectedBranchName.split(" ")[0] : selectedBranchName}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            compact && styles.compactFilterButton,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
          onPress={() => setYearModalVisible(true)}
        >
          <Text
            style={[
              styles.filterButtonText,
              compact && styles.compactFilterButtonText,
              { color: colors.textPrimary },
            ]}
          >
            {compact ? selectedYearName.split("-")[0] : selectedYearName}
          </Text>
        </TouchableOpacity>

        {renderBranchModal()}
        {renderYearModal()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.filtersRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Filters:
        </Text>

        <TouchableOpacity
          style={[styles.filterButton, { borderColor: colors.border }]}
          onPress={() => setBranchModalVisible(true)}
        >
          <Text
            style={[styles.filterButtonText, { color: colors.textPrimary }]}
          >
            {selectedBranchName}
          </Text>
          <Text style={[styles.dropdownIcon, { color: colors.textSecondary }]}>
            ▼
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, { borderColor: colors.border }]}
          onPress={() => setYearModalVisible(true)}
        >
          <Text
            style={[styles.filterButtonText, { color: colors.textPrimary }]}
          >
            {selectedYearName}
          </Text>
          <Text style={[styles.dropdownIcon, { color: colors.textSecondary }]}>
            ▼
          </Text>
        </TouchableOpacity>
      </View>

      {renderBranchModal()}
      {renderYearModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  inlineContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  compactContainer: {
    gap: 4,
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 120,
  },
  compactFilterButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
    borderRadius: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  compactFilterButtonText: {
    fontSize: 12,
  },
  dropdownIcon: {
    fontSize: 10,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    maxHeight: "70%",
    borderRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
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
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
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
    padding: 20,
  },
});
