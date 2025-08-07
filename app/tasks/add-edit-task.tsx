import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { SideDrawer } from "@/components/SideDrawer";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useDepartments,
  useStandards,
  useAllUsersExceptStudents,
  useSections,
} from "@/hooks/useApi";
import { apiService } from "@/api/apiService";

interface FormData {
  title: string;
  description: string;
  from_date: string;
  due_date: string;
  assigned_to_users: number[];
  assigned_to_departments: number[];
  assigned_to_standards: number[];
  assigned_to_sections: number[];
}

export default function AddEditTaskScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    from_date: "",
    due_date: "",
    assigned_to_users: [],
    assigned_to_departments: [],
    assigned_to_standards: [],
    assigned_to_sections: [],
  });

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const [selectedStandards, setSelectedStandards] = useState<number[]>([]);
  const [selectedSections, setSelectedSections] = useState<number[]>([]);

  // Fetch data
  const { data: departments } = useDepartments({
    branch: 1,
    academic_year: 1,
    inactive: true,
  });

  const { data: standards } = useStandards({
    branch: 1,
    academic_year: 1,
    inactive: true,
  });

  const { data: users } = useAllUsersExceptStudents({
    branch: 1,
    academic_year: 1,
    limit: 1500,
  });

  const { data: sections } = useSections({
    branch: 1,
  });

  const isEditing = !!id;

  useEffect(() => {
    if (isEditing && id) {
      loadTaskData();
    }
  }, [id, isEditing]);

  const loadTaskData = async () => {
    try {
      setLoading(true);
      const task = await apiService.getTask(Number(id));

      setFormData({
        title: task.title,
        description: task.description,
        from_date: task.from_date,
        due_date: task.due_date,
        assigned_to_users: task.assigned_users?.map((u: any) => u.id) || [],
        assigned_to_departments: task.departments?.map((d: any) => d.id) || [],
        assigned_to_standards: task.standards?.map((s: any) => s.id) || [],
        assigned_to_sections: task.sections?.map((s: any) => s.id) || [],
      });

      setSelectedUsers(task.assigned_users?.map((u: any) => u.id) || []);
      setSelectedDepartments(task.departments?.map((d: any) => d.id) || []);
      setSelectedStandards(task.standards?.map((s: any) => s.id) || []);
      setSelectedSections(task.sections?.map((s: any) => s.id) || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load task data");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter a task title");
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert("Error", "Please enter a task description");
      return false;
    }
    if (!formData.from_date) {
      Alert.alert("Error", "Please select a from date");
      return false;
    }
    if (!formData.due_date) {
      Alert.alert("Error", "Please select a due date");
      return false;
    }

    const fromDate = new Date(formData.from_date);
    const dueDate = new Date(formData.due_date);

    if (dueDate <= fromDate) {
      Alert.alert("Error", "Due date must be after from date");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const taskData = {
        ...formData,
        assigned_to_users: selectedUsers,
        assigned_to_departments: selectedDepartments,
        assigned_to_standards: selectedStandards,
        assigned_to_sections: selectedSections,
        created_by: user?.id,
      };

      if (isEditing) {
        await apiService.updateTask(Number(id), taskData);
        Alert.alert("Success", "Task updated successfully");
      } else {
        await apiService.createTask(taskData);
        Alert.alert("Success", "Task created successfully");
      }

      router.back();
    } catch (error) {
      Alert.alert("Error", `Failed to ${isEditing ? "update" : "create"} task`);
    } finally {
      setSaving(false);
    }
  };

  const toggleSelection = (
    id: number,
    selectedList: number[],
    setSelectedList: React.Dispatch<React.SetStateAction<number[]>>,
  ) => {
    if (selectedList.includes(id)) {
      setSelectedList(selectedList.filter((item) => item !== id));
    } else {
      setSelectedList([...selectedList, id]);
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <TopBar
          title={isEditing ? "Edit Task" : "Add Task"}
          onMenuPress={() => setDrawerVisible(true)}
          onNotificationsPress={() => router.push("/(tabs)/notifications")}
          onSettingsPress={() => router.push("/(tabs)/settings")}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading task data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <TopBar
        title={isEditing ? "Edit Task" : "Add Task"}
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Basic Information
          </Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              Title *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Enter task title"
              placeholderTextColor={colors.textSecondary}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              Description *
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Enter task description"
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                From Date *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                value={formatDateForInput(formData.from_date)}
                onChangeText={(text) =>
                  setFormData({ ...formData, from_date: text })
                }
              />
            </View>

            <View style={styles.dateGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Due Date *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                value={formatDateForInput(formData.due_date)}
                onChangeText={(text) =>
                  setFormData({ ...formData, due_date: text })
                }
              />
            </View>
          </View>
        </View>

        {/* Assignment Selection */}
        {users && users.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Assign to Users
            </Text>
            <ScrollView style={styles.selectionContainer} nestedScrollEnabled>
              {users.map((user: any) => (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.selectionItem,
                    {
                      backgroundColor: selectedUsers.includes(user.id)
                        ? colors.primary + "20"
                        : colors.background,
                      borderColor: selectedUsers.includes(user.id)
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() =>
                    toggleSelection(user.id, selectedUsers, setSelectedUsers)
                  }
                >
                  <Text
                    style={[
                      styles.selectionText,
                      {
                        color: selectedUsers.includes(user.id)
                          ? colors.primary
                          : colors.textPrimary,
                      },
                    ]}
                  >
                    {user.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {departments && departments.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Assign to Departments
            </Text>
            <ScrollView style={styles.selectionContainer} nestedScrollEnabled>
              {departments.map((dept: any) => (
                <TouchableOpacity
                  key={dept.id}
                  style={[
                    styles.selectionItem,
                    {
                      backgroundColor: selectedDepartments.includes(dept.id)
                        ? colors.primary + "20"
                        : colors.background,
                      borderColor: selectedDepartments.includes(dept.id)
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() =>
                    toggleSelection(
                      dept.id,
                      selectedDepartments,
                      setSelectedDepartments,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.selectionText,
                      {
                        color: selectedDepartments.includes(dept.id)
                          ? colors.primary
                          : colors.textPrimary,
                      },
                    ]}
                  >
                    {dept.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {standards && standards.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Assign to Standards
            </Text>
            <ScrollView style={styles.selectionContainer} nestedScrollEnabled>
              {standards.map((standard: any) => (
                <TouchableOpacity
                  key={standard.id}
                  style={[
                    styles.selectionItem,
                    {
                      backgroundColor: selectedStandards.includes(standard.id)
                        ? colors.primary + "20"
                        : colors.background,
                      borderColor: selectedStandards.includes(standard.id)
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() =>
                    toggleSelection(
                      standard.id,
                      selectedStandards,
                      setSelectedStandards,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.selectionText,
                      {
                        color: selectedStandards.includes(standard.id)
                          ? colors.primary
                          : colors.textPrimary,
                      },
                    ]}
                  >
                    {standard.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {sections && sections.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Assign to Sections
            </Text>
            <ScrollView style={styles.selectionContainer} nestedScrollEnabled>
              {sections.map((section: any) => (
                <TouchableOpacity
                  key={section.id}
                  style={[
                    styles.selectionItem,
                    {
                      backgroundColor: selectedSections.includes(section.id)
                        ? colors.primary + "20"
                        : colors.background,
                      borderColor: selectedSections.includes(section.id)
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() =>
                    toggleSelection(
                      section.id,
                      selectedSections,
                      setSelectedSections,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.selectionText,
                      {
                        color: selectedSections.includes(section.id)
                          ? colors.primary
                          : colors.textPrimary,
                      },
                    ]}
                  >
                    {section.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Text
              style={[styles.cancelButtonText, { color: colors.textSecondary }]}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? "Update Task" : "Create Task"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlignVertical: "top",
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateGroup: {
    flex: 1,
  },
  selectionContainer: {
    maxHeight: 200,
  },
  selectionItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
