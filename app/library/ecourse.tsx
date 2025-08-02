
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';

interface ECourse {
  id: string;
  title: string;
  type: 'PDF' | 'Video';
  subject: string;
  class: string;
  description: string;
  uploadDate: string;
  fileSize: string;
  thumbnail: string;
}

export default function ECourseScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [sortBy, setSortBy] = useState('Recent');
  const [viewerModalVisible, setViewerModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<ECourse | null>(null);

  const courses: ECourse[] = [
    {
      id: '1',
      title: 'Introduction to Mathematics',
      type: 'PDF',
      subject: 'Mathematics',
      class: '10',
      description: 'Basic concepts of algebra and geometry',
      uploadDate: '2024-01-15',
      fileSize: '2.5 MB',
      thumbnail: '📄'
    },
    {
      id: '2',
      title: 'Physics Lab Experiments',
      type: 'Video',
      subject: 'Physics',
      class: '11',
      description: 'Practical experiments and demonstrations',
      uploadDate: '2024-01-10',
      fileSize: '25.8 MB',
      thumbnail: '🎥'
    },
    {
      id: '3',
      title: 'English Literature Guide',
      type: 'PDF',
      subject: 'English',
      class: '12',
      description: 'Study guide for Shakespeare and modern literature',
      uploadDate: '2024-01-12',
      fileSize: '4.2 MB',
      thumbnail: '📄'
    }
  ];

  const subjects = ['All', 'Mathematics', 'Physics', 'Chemistry', 'English', 'Biology'];
  const classes = ['All', '9', '10', '11', '12'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'All' || course.subject === filterSubject;
    const matchesClass = filterClass === 'All' || course.class === filterClass;
    return matchesSearch && matchesSubject && matchesClass;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === 'Recent') {
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  const handleOpenCourse = (course: ECourse) => {
    setSelectedCourse(course);
    setViewerModalVisible(true);
  };

  const renderCourseCard = (course: ECourse) => (
    <View key={course.id} style={[styles.courseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.courseHeader}>
        <View style={styles.thumbnail}>
          <Text style={styles.thumbnailIcon}>{course.thumbnail}</Text>
        </View>
        <View style={styles.courseInfo}>
          <Text style={[styles.courseTitle, { color: colors.textPrimary }]}>{course.title}</Text>
          <Text style={[styles.courseSubject, { color: colors.textSecondary }]}>
            {course.subject} • Class {course.class}
          </Text>
          <Text style={[styles.courseDescription, { color: colors.textSecondary }]}>
            {course.description}
          </Text>
        </View>
        <View style={[
          styles.typeBadge,
          { backgroundColor: course.type === 'PDF' ? '#EF4444' : '#10B981' }
        ]}>
          <Text style={styles.typeText}>{course.type}</Text>
        </View>
      </View>
      
      <View style={styles.courseFooter}>
        <Text style={[styles.courseDate, { color: colors.textSecondary }]}>
          {course.uploadDate} • {course.fileSize}
        </Text>
        <TouchableOpacity
          style={[styles.openButton, { backgroundColor: colors.primary }]}
          onPress={() => handleOpenCourse(course)}
        >
          <Text style={styles.openButtonText}>Open</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="E-Courses"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Search and Filters */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Search courses..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Subject:</Text>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject}
                style={[
                  styles.filterButton,
                  { borderColor: colors.border },
                  filterSubject === subject && { backgroundColor: colors.primary }
                ]}
                onPress={() => setFilterSubject(subject)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: filterSubject === subject ? '#FFFFFF' : colors.textPrimary }
                ]}>
                  {subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Class:</Text>
            {classes.map((cls) => (
              <TouchableOpacity
                key={cls}
                style={[
                  styles.filterButton,
                  { borderColor: colors.border },
                  filterClass === cls && { backgroundColor: colors.primary }
                ]}
                onPress={() => setFilterClass(cls)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: filterClass === cls ? '#FFFFFF' : colors.textPrimary }
                ]}>
                  {cls}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.sortContainer}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Sort by:</Text>
          {['Recent', 'Alphabetical'].map((sort) => (
            <TouchableOpacity
              key={sort}
              style={[
                styles.filterButton,
                { borderColor: colors.border },
                sortBy === sort && { backgroundColor: colors.primary }
              ]}
              onPress={() => setSortBy(sort)}
            >
              <Text style={[
                styles.filterButtonText,
                { color: sortBy === sort ? '#FFFFFF' : colors.textPrimary }
              ]}>
                {sort}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Courses List */}
      <ScrollView style={styles.coursesList}>
        {sortedCourses.length > 0 ? (
          sortedCourses.map(renderCourseCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No courses found
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Course Viewer Modal */}
      <Modal
        visible={viewerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setViewerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {selectedCourse?.title}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setViewerModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedCourse && (
              <View style={styles.viewerContent}>
                <View style={styles.viewerPlaceholder}>
                  <Text style={styles.viewerIcon}>
                    {selectedCourse.type === 'PDF' ? '📄' : '🎥'}
                  </Text>
                  <Text style={[styles.viewerText, { color: colors.textPrimary }]}>
                    {selectedCourse.type} Viewer
                  </Text>
                  <Text style={[styles.viewerSubtext, { color: colors.textSecondary }]}>
                    {selectedCourse.type === 'PDF' ? 'PDF viewer will be implemented here' : 'Video player will be implemented here'}
                  </Text>
                </View>
                
                <View style={styles.downloadSection}>
                  <TouchableOpacity
                    style={[styles.downloadButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.downloadButtonText}>Download {selectedCourse.type}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  filterContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  filterScrollView: {
    marginBottom: 8,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coursesList: {
    flex: 1,
    padding: 16,
  },
  courseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  thumbnailIcon: {
    fontSize: 24,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  courseSubject: {
    fontSize: 14,
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseDate: {
    fontSize: 12,
  },
  openButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContent: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewerContent: {
    flex: 1,
    padding: 20,
  },
  viewerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  viewerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  viewerSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  downloadSection: {
    paddingTop: 20,
  },
  downloadButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
