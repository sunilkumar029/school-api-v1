
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';

interface StudentMark {
  id: string;
  studentName: string;
  rollNumber: string;
  subject: string;
  examType: string;
  maxMarks: number;
  obtainedMarks: number;
  grade: string;
  date: string;
}

export default function StudentMarksScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'view' | 'entry'>('view');
  const [selectedClass, setSelectedClass] = useState('12-A');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');

  // New marks entry form
  const [newMark, setNewMark] = useState({
    studentId: '',
    subject: 'Mathematics',
    examType: 'Unit Test',
    maxMarks: '100',
    obtainedMarks: '',
  });

  const [marks] = useState<StudentMark[]>([
    {
      id: '1',
      studentName: 'John Smith',
      rollNumber: 'CS2024001',
      subject: 'Mathematics',
      examType: 'Unit Test 1',
      maxMarks: 100,
      obtainedMarks: 92,
      grade: 'A+',
      date: '2024-01-15'
    },
    {
      id: '2',
      studentName: 'Emily Johnson',
      rollNumber: 'CS2024002',
      subject: 'Mathematics',
      examType: 'Unit Test 1',
      maxMarks: 100,
      obtainedMarks: 95,
      grade: 'A+',
      date: '2024-01-15'
    },
    {
      id: '3',
      studentName: 'Michael Brown',
      rollNumber: 'CS2024003',
      subject: 'Mathematics',
      examType: 'Unit Test 1',
      maxMarks: 100,
      obtainedMarks: 78,
      grade: 'B+',
      date: '2024-01-15'
    },
  ]);

  const students = [
    { id: '1', name: 'John Smith', rollNumber: 'CS2024001' },
    { id: '2', name: 'Emily Johnson', rollNumber: 'CS2024002' },
    { id: '3', name: 'Michael Brown', rollNumber: 'CS2024003' },
  ];

  const handleSaveMark = () => {
    if (!newMark.studentId || !newMark.obtainedMarks) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    Alert.alert('Success', 'Marks saved successfully');
    setNewMark({
      studentId: '',
      subject: 'Mathematics',
      examType: 'Unit Test',
      maxMarks: '100',
      obtainedMarks: '',
    });
  };

  const calculateGrade = (obtained: number, max: number) => {
    const percentage = (obtained / max) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'F';
  };

  const renderMarkItem = ({ item }: { item: StudentMark }) => (
    <View style={[styles.markItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.studentInfo}>
        <Text style={[styles.studentName, { color: colors.textPrimary }]}>{item.studentName}</Text>
        <Text style={[styles.rollNumber, { color: colors.textSecondary }]}>{item.rollNumber}</Text>
      </View>
      <View style={styles.markDetails}>
        <Text style={[styles.examType, { color: colors.textSecondary }]}>{item.examType}</Text>
        <Text style={[styles.marks, { color: colors.textPrimary }]}>
          {item.obtainedMarks}/{item.maxMarks}
        </Text>
        <View style={[styles.gradeBadge, { 
          backgroundColor: item.grade.startsWith('A') ? '#4CAF50' : 
                          item.grade.startsWith('B') ? '#FF9800' : '#F44336'
        }]}>
          <Text style={styles.gradeText}>{item.grade}</Text>
        </View>
      </View>
    </View>
  );

  const renderViewContent = () => (
    <View style={styles.content}>
      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Class:</Text>
          <TouchableOpacity style={[styles.dropdown, { borderColor: colors.border }]}>
            <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>{selectedClass}</Text>
            <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Subject:</Text>
          <TouchableOpacity style={[styles.dropdown, { borderColor: colors.border }]}>
            <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>{selectedSubject}</Text>
            <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>88.3%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Class Average</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>95</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Highest</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>78</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Lowest</Text>
        </View>
      </View>

      {/* Marks List */}
      <FlatList
        data={marks}
        renderItem={renderMarkItem}
        keyExtractor={(item) => item.id}
        style={styles.marksList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderEntryContent = () => (
    <ScrollView style={styles.content}>
      <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Enter New Marks</Text>
        
        {/* Student Selection */}
        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Student *</Text>
          <TouchableOpacity style={[styles.dropdown, { borderColor: colors.border }]}>
            <Text style={[styles.dropdownText, { color: newMark.studentId ? colors.textPrimary : colors.textSecondary }]}>
              {newMark.studentId ? students.find(s => s.id === newMark.studentId)?.name : 'Select Student'}
            </Text>
            <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Subject */}
        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Subject</Text>
          <TouchableOpacity style={[styles.dropdown, { borderColor: colors.border }]}>
            <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>{newMark.subject}</Text>
            <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Exam Type */}
        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Exam Type</Text>
          <TouchableOpacity style={[styles.dropdown, { borderColor: colors.border }]}>
            <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>{newMark.examType}</Text>
            <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Max Marks */}
        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Maximum Marks</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.textPrimary }]}
            value={newMark.maxMarks}
            onChangeText={(text) => setNewMark({...newMark, maxMarks: text})}
            keyboardType="numeric"
            placeholder="100"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Obtained Marks */}
        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Obtained Marks *</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.textPrimary }]}
            value={newMark.obtainedMarks}
            onChangeText={(text) => setNewMark({...newMark, obtainedMarks: text})}
            keyboardType="numeric"
            placeholder="Enter marks"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Grade Preview */}
        {newMark.obtainedMarks && (
          <View style={styles.gradePreview}>
            <Text style={[styles.gradePreviewLabel, { color: colors.textSecondary }]}>Grade:</Text>
            <Text style={[styles.gradePreviewValue, { color: colors.primary }]}>
              {calculateGrade(parseInt(newMark.obtainedMarks), parseInt(newMark.maxMarks))}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSaveMark}
        >
          <Text style={styles.saveButtonText}>Save Marks</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Student Marks"
        onMenuPress={() => setDrawerVisible(true)}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'view' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('view')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'view' ? colors.primary : colors.textSecondary }
          ]}>
            View Marks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'entry' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('entry')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'entry' ? colors.primary : colors.textSecondary }
          ]}>
            Enter Marks
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'view' ? renderViewContent() : renderEntryContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  filtersContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 60,
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginLeft: 12,
  },
  dropdownText: {
    fontSize: 14,
  },
  dropdownArrow: {
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  marksList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  markItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rollNumber: {
    fontSize: 12,
  },
  markDetails: {
    alignItems: 'flex-end',
  },
  examType: {
    fontSize: 12,
    marginBottom: 4,
  },
  marks: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  gradeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  formContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  gradePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  gradePreviewLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  gradePreviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
