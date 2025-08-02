
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';

export default function AddVisitorScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  const [formData, setFormData] = useState({
    visitorName: '',
    purpose: '',
    idProof: null,
    visitingStudent: '',
    contactNo: '',
    expectedInTime: '',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const students = ['John Smith (H101)', 'Emily Davis (H205)', 'Alex Thompson (H303)', 'Sarah Wilson (H112)'];

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.visitorName.trim()) {
      newErrors.visitorName = 'Visitor name is required';
    }
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }
    if (!formData.visitingStudent) {
      newErrors.visitingStudent = 'Please select a student';
    }
    if (!formData.contactNo.trim()) {
      newErrors.contactNo = 'Contact number is required';
    } else if (!/^[+]?[\d\s\-()]+$/.test(formData.contactNo)) {
      newErrors.contactNo = 'Please enter a valid contact number';
    }
    if (!formData.expectedInTime.trim()) {
      newErrors.expectedInTime = 'Expected in-time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // Submit the form
    Alert.alert(
      'Success',
      'Visitor registered successfully!',
      [
        {
          text: 'OK',
          onPress: () => router.push('/hostel/visitor-list')
        }
      ]
    );
  };

  const handleImageUpload = () => {
    // Logic for image upload
    Alert.alert('Info', 'Image upload functionality will be implemented');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Add Visitor"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <ScrollView style={styles.content}>
        <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Visitor Information</Text>
          
          {/* Visitor Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Visitor Name *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, borderColor: errors.visitorName ? '#EF4444' : colors.border, color: colors.text }
              ]}
              placeholder="Enter visitor's full name"
              placeholderTextColor={colors.textSecondary}
              value={formData.visitorName}
              onChangeText={(text) => setFormData({...formData, visitorName: text})}
            />
            {errors.visitorName && <Text style={styles.errorText}>{errors.visitorName}</Text>}
          </View>

          {/* Purpose */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Purpose of Visit *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.background, borderColor: errors.purpose ? '#EF4444' : colors.border, color: colors.text }
              ]}
              placeholder="Enter purpose of visit"
              placeholderTextColor={colors.textSecondary}
              value={formData.purpose}
              onChangeText={(text) => setFormData({...formData, purpose: text})}
              multiline
              numberOfLines={3}
            />
            {errors.purpose && <Text style={styles.errorText}>{errors.purpose}</Text>}
          </View>

          {/* ID Proof Upload */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>ID Proof</Text>
            <TouchableOpacity
              style={[styles.uploadButton, { borderColor: colors.border }]}
              onPress={handleImageUpload}
            >
              <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
                📷 Upload ID Proof
              </Text>
            </TouchableOpacity>
          </View>

          {/* Visiting Student */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Visiting Student *</Text>
            <View style={[styles.dropdown, { backgroundColor: colors.background, borderColor: errors.visitingStudent ? '#EF4444' : colors.border }]}>
              <ScrollView style={styles.dropdownContent}>
                {students.map((student, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dropdownItem,
                      formData.visitingStudent === student && { backgroundColor: colors.primary + '20' }
                    ]}
                    onPress={() => setFormData({...formData, visitingStudent: student})}
                  >
                    <Text style={[styles.dropdownItemText, { color: colors.textPrimary }]}>{student}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {errors.visitingStudent && <Text style={styles.errorText}>{errors.visitingStudent}</Text>}
          </View>

          {/* Contact Number */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Contact Number *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, borderColor: errors.contactNo ? '#EF4444' : colors.border, color: colors.text }
              ]}
              placeholder="+1234567890"
              placeholderTextColor={colors.textSecondary}
              value={formData.contactNo}
              onChangeText={(text) => setFormData({...formData, contactNo: text})}
              keyboardType="phone-pad"
            />
            {errors.contactNo && <Text style={styles.errorText}>{errors.contactNo}</Text>}
          </View>

          {/* Expected In-Time */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Expected In-Time *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, borderColor: errors.expectedInTime ? '#EF4444' : colors.border, color: colors.text }
              ]}
              placeholder="YYYY-MM-DD HH:MM"
              placeholderTextColor={colors.textSecondary}
              value={formData.expectedInTime}
              onChangeText={(text) => setFormData({...formData, expectedInTime: text})}
            />
            {errors.expectedInTime && <Text style={styles.errorText}>{errors.expectedInTime}</Text>}
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Register Visitor</Text>
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
  content: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  uploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 150,
  },
  dropdownContent: {
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownItemText: {
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
