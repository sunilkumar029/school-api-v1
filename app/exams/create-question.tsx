
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Question {
  id: string;
  type: 'mcq' | 'subjective' | 'true-false';
  subject: string;
  chapter: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options?: string[];
  correctAnswer: string;
  marks: number;
  createdBy: string;
  createdAt: string;
}

export default function CreateQuestionScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'bank'>('create');

  const [newQuestion, setNewQuestion] = useState({
    type: 'mcq' as 'mcq' | 'subjective' | 'true-false',
    subject: 'Mathematics',
    chapter: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: '1',
  });

  const [questions] = useState<Question[]>([
    {
      id: '1',
      type: 'mcq',
      subject: 'Mathematics',
      chapter: 'Algebra',
      difficulty: 'medium',
      question: 'What is the value of x in the equation 2x + 3 = 7?',
      options: ['1', '2', '3', '4'],
      correctAnswer: '2',
      marks: 2,
      createdBy: 'Dr. Smith',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      type: 'subjective',
      subject: 'Physics',
      chapter: 'Motion',
      difficulty: 'hard',
      question: 'Explain Newton\'s second law of motion with examples.',
      correctAnswer: 'Force equals mass times acceleration (F = ma)',
      marks: 5,
      createdBy: 'Prof. Johnson',
      createdAt: '2024-01-14'
    },
  ]);

  const handleAddOption = () => {
    if (newQuestion.options.length < 6) {
      setNewQuestion({
        ...newQuestion,
        options: [...newQuestion.options, '']
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (newQuestion.options.length > 2) {
      const updatedOptions = newQuestion.options.filter((_, i) => i !== index);
      setNewQuestion({
        ...newQuestion,
        options: updatedOptions
      });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = value;
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions
    });
  };

  const handleSaveQuestion = () => {
    if (!newQuestion.question.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    if (newQuestion.type === 'mcq' && !newQuestion.correctAnswer) {
      Alert.alert('Error', 'Please select the correct answer');
      return;
    }

    Alert.alert('Success', 'Question saved successfully');
    // Reset form
    setNewQuestion({
      type: 'mcq',
      subject: 'Mathematics',
      chapter: '',
      difficulty: 'medium',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: '1',
    });
  };

  const renderQuestionItem = ({ item }: { item: Question }) => (
    <View style={[styles.questionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.questionHeader}>
        <View style={[styles.typeBadge, {
          backgroundColor: item.type === 'mcq' ? '#2196F3' :
            item.type === 'subjective' ? '#FF9800' : '#4CAF50'
        }]}>
          <Text style={styles.typeText}>
            {item.type === 'mcq' ? 'MCQ' : item.type === 'subjective' ? 'SUB' : 'T/F'}
          </Text>
        </View>
        <View style={[styles.difficultyBadge, {
          backgroundColor: item.difficulty === 'easy' ? '#4CAF50' :
            item.difficulty === 'medium' ? '#FF9800' : '#F44336'
        }]}>
          <Text style={styles.difficultyText}>{item.difficulty.toUpperCase()}</Text>
        </View>
        <Text style={[styles.marks, { color: colors.primary }]}>{item.marks} marks</Text>
      </View>

      <Text style={[styles.questionText, { color: colors.textPrimary }]}>
        {item.question}
      </Text>

      {item.options && (
        <View style={styles.optionsContainer}>
          {item.options.map((option, index) => (
            <Text key={index} style={[
              styles.optionText,
              { color: option === item.correctAnswer ? colors.primary : colors.textSecondary }
            ]}>
              {String.fromCharCode(65 + index)}. {option}
              {option === item.correctAnswer && ' ✓'}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.questionFooter}>
        <Text style={[styles.subjectInfo, { color: colors.textSecondary }]}>
          {item.subject} • {item.chapter}
        </Text>
        <Text style={[styles.createdInfo, { color: colors.textSecondary }]}>
          By {item.createdBy} • {item.createdAt}
        </Text>
      </View>
    </View>
  );

  const renderCreateContent = () => (
    <ScrollView style={styles.content}>
      <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Create New Question</Text>

        {/* Question Type */}
        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Question Type</Text>
          <View style={styles.typeButtons}>
            {['mcq', 'subjective', 'true-false'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  newQuestion.type === type && { backgroundColor: colors.primary }
                ]}
                onPress={() => setNewQuestion({ ...newQuestion, type: type as any })}
              >
                <Text style={[
                  styles.typeButtonText,
                  { color: newQuestion.type === type ? '#FFFFFF' : colors.textPrimary }
                ]}>
                  {type === 'mcq' ? 'MCQ' : type === 'subjective' ? 'Subjective' : 'True/False'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subject & Chapter */}
        <View style={styles.rowFields}>
          <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Subject</Text>
            <TouchableOpacity style={[styles.dropdown, { borderColor: colors.border }]}>
              <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>{newQuestion.subject}</Text>
              <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Chapter</Text>
            <TextInput
              style={[styles.textInput, { borderColor: colors.border, color: colors.textPrimary }]}
              value={newQuestion.chapter}
              onChangeText={(text) => setNewQuestion({ ...newQuestion, chapter: text })}
              placeholder="Enter chapter"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Difficulty & Marks */}
        <View style={styles.rowFields}>
          <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Difficulty</Text>
            <View style={styles.difficultyButtons}>
              {['easy', 'medium', 'hard'].map((difficulty) => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.difficultyButton,
                    newQuestion.difficulty === difficulty && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setNewQuestion({ ...newQuestion, difficulty: difficulty as any })}
                >
                  <Text style={[
                    styles.difficultyButtonText,
                    { color: newQuestion.difficulty === difficulty ? '#FFFFFF' : colors.textPrimary }
                  ]}>
                    {difficulty}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Marks</Text>
            <TextInput
              style={[styles.textInput, { borderColor: colors.border, color: colors.textPrimary }]}
              value={newQuestion.marks}
              onChangeText={(text) => setNewQuestion({ ...newQuestion, marks: text })}
              keyboardType="numeric"
              placeholder="Marks"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Question */}
        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Question *</Text>
          <TextInput
            style={[styles.textArea, { borderColor: colors.border, color: colors.textPrimary }]}
            value={newQuestion.question}
            onChangeText={(text) => setNewQuestion({ ...newQuestion, question: text })}
            placeholder="Enter your question here..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Options for MCQ */}
        {newQuestion.type === 'mcq' && (
          <View style={styles.formField}>
            <View style={styles.optionsHeader}>
              <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Options</Text>
              <TouchableOpacity onPress={handleAddOption}>
                <Text style={[styles.addOptionButton, { color: colors.primary }]}>+ Add Option</Text>
              </TouchableOpacity>
            </View>
            {newQuestion.options.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <TextInput
                  style={[styles.optionInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  value={option}
                  onChangeText={(text) => handleOptionChange(index, text)}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                  style={[
                    styles.correctButton,
                    newQuestion.correctAnswer === option && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setNewQuestion({ ...newQuestion, correctAnswer: option })}
                >
                  <Text style={[
                    styles.correctButtonText,
                    { color: newQuestion.correctAnswer === option ? '#FFFFFF' : colors.textSecondary }
                  ]}>✓</Text>
                </TouchableOpacity>
                {newQuestion.options.length > 2 && (
                  <TouchableOpacity onPress={() => handleRemoveOption(index)}>
                    <Text style={[styles.removeButton, { color: '#F44336' }]}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Correct Answer for Subjective */}
        {newQuestion.type === 'subjective' && (
          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Model Answer</Text>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, color: colors.textPrimary }]}
              value={newQuestion.correctAnswer}
              onChangeText={(text) => setNewQuestion({ ...newQuestion, correctAnswer: text })}
              placeholder="Enter model answer or key points..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSaveQuestion}
        >
          <Text style={styles.saveButtonText}>Save Question</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderBankContent = () => (
    <View style={styles.content}>
      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={[styles.filterButton, { borderColor: colors.border }]}>
          <Text style={[styles.filterButtonText, { color: colors.textPrimary }]}>All Subjects</Text>
          <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, { borderColor: colors.border }]}>
          <Text style={[styles.filterButtonText, { color: colors.textPrimary }]}>All Types</Text>
          <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Questions List */}
      <FlatList
        data={questions}
        renderItem={renderQuestionItem}
        keyExtractor={(item) => item.id}
        style={styles.questionsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Question Bank"
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
            activeTab === 'create' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'create' ? colors.primary : colors.textSecondary }
          ]}>
            Create Question
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'bank' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('bank')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'bank' ? colors.primary : colors.textSecondary }
          ]}>
            Question Bank
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'create' ? renderCreateContent() : renderBankContent()}
    </SafeAreaView>
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
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowFields: {
    flexDirection: 'row',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: {
    fontSize: 14,
  },
  dropdownArrow: {
    fontSize: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  difficultyButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addOptionButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  correctButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  correctButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  removeButton: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterButtonText: {
    fontSize: 14,
  },
  questionsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  questionItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  marks: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  optionsContainer: {
    marginBottom: 12,
  },
  optionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectInfo: {
    fontSize: 12,
  },
  createdInfo: {
    fontSize: 12,
  },
});
