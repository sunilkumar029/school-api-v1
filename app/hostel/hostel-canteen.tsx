
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { apiService } from '@/api/apiService';

interface MealPlan {
  id: number;
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

interface EditMealData {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

export default function HostelCanteenScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealPlan | null>(null);
  const [editData, setEditData] = useState<EditMealData>({
    day: '',
    breakfast: '',
    lunch: '',
    dinner: ''
  });

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      const response = await apiService.api.get('/api/hostel-mealplans/');
      const sortedMeals = (response.data.results || []).sort((a: MealPlan, b: MealPlan) => {
        return daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day);
      });
      setMealPlans(sortedMeals);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      Alert.alert('Error', 'Failed to fetch meal plans');
    } finally {
      setLoading(false);
    }
  };

  const updateMealPlan = async () => {
    if (!selectedMeal) return;

    try {
      await apiService.api.patch(`/api/hostel-mealplans/${selectedMeal.id}/`, editData);
      Alert.alert('Success', 'Meal plan updated successfully');
      setEditModalVisible(false);
      fetchMealPlans();
    } catch (error) {
      console.error('Error updating meal plan:', error);
      Alert.alert('Error', 'Failed to update meal plan');
    }
  };

  const createMealPlan = async () => {
    try {
      await apiService.api.post('/api/hostel-mealplans/', editData);
      Alert.alert('Success', 'Meal plan created successfully');
      setEditModalVisible(false);
      fetchMealPlans();
    } catch (error) {
      console.error('Error creating meal plan:', error);
      Alert.alert('Error', 'Failed to create meal plan');
    }
  };

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const handleEditMeal = (meal: MealPlan) => {
    setSelectedMeal(meal);
    setEditData({
      day: meal.day,
      breakfast: meal.breakfast,
      lunch: meal.lunch,
      dinner: meal.dinner
    });
    setEditModalVisible(true);
  };

  const handleAddMeal = () => {
    setSelectedMeal(null);
    setEditData({
      day: '',
      breakfast: '',
      lunch: '',
      dinner: ''
    });
    setEditModalVisible(true);
  };

  const handleSaveMeal = () => {
    if (!editData.day || !editData.breakfast || !editData.lunch || !editData.dinner) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (selectedMeal) {
      updateMealPlan();
    } else {
      createMealPlan();
    }
  };

  const getMealEmoji = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🌞';
      case 'dinner': return '🌙';
      default: return '🍽️';
    }
  };

  const renderMealCard = (meal: MealPlan) => (
    <View key={meal.id} style={[styles.mealCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.dayHeader}>
        <Text style={[styles.dayTitle, { color: colors.textPrimary }]}>
          {meal.day}
        </Text>
        {user?.is_staff && (
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => handleEditMeal(meal)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mealsContainer}>
        <View style={styles.mealItem}>
          <Text style={[styles.mealTitle, { color: colors.textPrimary }]}>
            {getMealEmoji('breakfast')} Breakfast
          </Text>
          <Text style={[styles.mealText, { color: colors.textSecondary }]}>
            {meal.breakfast}
          </Text>
        </View>

        <View style={styles.mealItem}>
          <Text style={[styles.mealTitle, { color: colors.textPrimary }]}>
            {getMealEmoji('lunch')} Lunch
          </Text>
          <Text style={[styles.mealText, { color: colors.textSecondary }]}>
            {meal.lunch}
          </Text>
        </View>

        <View style={styles.mealItem}>
          <Text style={[styles.mealTitle, { color: colors.textPrimary }]}>
            {getMealEmoji('dinner')} Dinner
          </Text>
          <Text style={[styles.mealText, { color: colors.textSecondary }]}>
            {meal.dinner}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Hostel Canteen"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Weekly Meal Schedule
        </Text>
        {user?.is_staff && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddMeal}
          >
            <Text style={styles.addButtonText}>+ Add Meal</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Meal Plans */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchMealPlans} />
        }
      >
        {mealPlans.length > 0 ? (
          mealPlans.map(renderMealCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No meal plans available
            </Text>
            {user?.is_staff && (
              <TouchableOpacity
                style={[styles.addFirstButton, { backgroundColor: colors.primary }]}
                onPress={handleAddMeal}
              >
                <Text style={styles.addFirstButtonText}>Add First Meal Plan</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Edit Meal Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {selectedMeal ? 'Edit Meal Plan' : 'Add Meal Plan'}
              </Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Day</Text>
                {selectedMeal ? (
                  <View style={[styles.disabledInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.disabledText, { color: colors.textSecondary }]}>
                      {editData.day}
                    </Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
                    {daysOrder.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayOption,
                          { borderColor: colors.border },
                          editData.day === day && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setEditData({ ...editData, day })}
                      >
                        <Text style={[
                          styles.dayOptionText,
                          { color: editData.day === day ? '#FFFFFF' : colors.textPrimary }
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  {getMealEmoji('breakfast')} Breakfast
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.background, 
                      borderColor: colors.border, 
                      color: colors.textPrimary 
                    }
                  ]}
                  placeholder="Enter breakfast menu"
                  placeholderTextColor={colors.textSecondary}
                  value={editData.breakfast}
                  onChangeText={(text) => setEditData({ ...editData, breakfast: text })}
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  {getMealEmoji('lunch')} Lunch
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.background, 
                      borderColor: colors.border, 
                      color: colors.textPrimary 
                    }
                  ]}
                  placeholder="Enter lunch menu"
                  placeholderTextColor={colors.textSecondary}
                  value={editData.lunch}
                  onChangeText={(text) => setEditData({ ...editData, lunch: text })}
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  {getMealEmoji('dinner')} Dinner
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.background, 
                      borderColor: colors.border, 
                      color: colors.textPrimary 
                    }
                  ]}
                  placeholder="Enter dinner menu"
                  placeholderTextColor={colors.textSecondary}
                  value={editData.dinner}
                  onChangeText={(text) => setEditData({ ...editData, dinner: text })}
                  multiline
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveMeal}
                >
                  <Text style={styles.saveButtonText}>
                    {selectedMeal ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mealCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  mealsContainer: {
    gap: 12,
  },
  mealItem: {
    marginBottom: 4,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  mealText: {
    fontSize: 14,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  addFirstButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  disabledInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  disabledText: {
    fontSize: 14,
  },
  daySelector: {
    flexDirection: 'row',
  },
  dayOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 8,
  },
  dayOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
