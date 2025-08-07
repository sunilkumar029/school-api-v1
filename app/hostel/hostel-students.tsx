
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { apiService } from '@/api/apiService';
import { useBranches, useAcademicYears, useStandards } from '@/hooks/useApi';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  employee_id: string;
  student_type: string;
  standard: any;
  section: any;
  branch: any;
  is_active: boolean;
  profile_image?: string;
  guardians: any[];
  address: any;
}

export default function HostelStudentsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [selectedStandard, setSelectedStandard] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string>('All');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentModalVisible, setStudentModalVisible] = useState(false);

  const { data: branches } = useBranches();
  const { data: academicYears } = useAcademicYears();
  const { data: standards } = useStandards();

  const floors = ['All', 'Ground Floor', 'First Floor', 'Second Floor', 'Third Floor'];

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = {
        branch: selectedBranch,
        student_type: 'Hostel'
      };
      
      if (selectedStandard) {
        params.standard = selectedStandard;
      }

      const response = await apiService.api.get('/api/users/', { params });
      setStudents(response.data.results || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedBranch, selectedAcademicYear, selectedStandard]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.employee_id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const handleStudentPress = (student: Student) => {
    setSelectedStudent(student);
    setStudentModalVisible(true);
  };

  const renderStudent = (student: Student) => (
    <TouchableOpacity
      key={student.id}
      style={[styles.studentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleStudentPress(student)}
    >
      <View style={styles.studentHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>
            {student.first_name.charAt(0)}{student.last_name.charAt(0)}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: colors.textPrimary }]}>
            {student.first_name} {student.last_name}
          </Text>
          <Text style={[styles.studentEmail, { color: colors.textSecondary }]}>
            {student.email}
          </Text>
          <Text style={[styles.studentId, { color: colors.textSecondary }]}>
            ID: {student.employee_id}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: student.is_active ? '#10B981' : '#EF4444' }
        ]}>
          <Text style={styles.statusText}>
            {student.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.studentDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Standard:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
            {student.standard?.name || 'N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Section:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
            {student.section?.name || 'N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Phone:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
            {student.phone || 'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Hostel Students"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
        {/* Search */}
        <TextInput
          style={[
            styles.searchInput,
            { 
              backgroundColor: colors.background, 
              borderColor: colors.border, 
              color: colors.textPrimary 
            }
          ]}
          placeholder="Search students..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Branch Filter */}
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Branch</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {branches?.map((branch: any) => (
                <TouchableOpacity
                  key={branch.id}
                  style={[
                    styles.filterButton,
                    { borderColor: colors.border },
                    selectedBranch === branch.id && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setSelectedBranch(branch.id)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    { color: selectedBranch === branch.id ? '#FFFFFF' : colors.textPrimary }
                  ]}>
                    {branch.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Academic Year Filter */}
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Academic Year</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {academicYears?.map((year: any) => (
                <TouchableOpacity
                  key={year.id}
                  style={[
                    styles.filterButton,
                    { borderColor: colors.border },
                    selectedAcademicYear === year.id && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setSelectedAcademicYear(year.id)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    { color: selectedAcademicYear === year.id ? '#FFFFFF' : colors.textPrimary }
                  ]}>
                    {year.year_range}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Standard Filter */}
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Standard</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  { borderColor: colors.border },
                  selectedStandard === null && { backgroundColor: colors.primary }
                ]}
                onPress={() => setSelectedStandard(null)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: selectedStandard === null ? '#FFFFFF' : colors.textPrimary }
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              {standards?.map((standard: any) => (
                <TouchableOpacity
                  key={standard.id}
                  style={[
                    styles.filterButton,
                    { borderColor: colors.border },
                    selectedStandard === standard.id && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setSelectedStandard(standard.id)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    { color: selectedStandard === standard.id ? '#FFFFFF' : colors.textPrimary }
                  ]}>
                    {standard.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Floor Filter */}
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Floor</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {floors.map((floor) => (
                <TouchableOpacity
                  key={floor}
                  style={[
                    styles.filterButton,
                    { borderColor: colors.border },
                    selectedFloor === floor && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setSelectedFloor(floor)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    { color: selectedFloor === floor ? '#FFFFFF' : colors.textPrimary }
                  ]}>
                    {floor}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Students List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchStudents} />
        }
      >
        {filteredStudents.length > 0 ? (
          filteredStudents.map(renderStudent)
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No students match your search' : 'No hostel students found'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Student Details Modal */}
      <Modal
        visible={studentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStudentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Student Details
              </Text>
              <TouchableOpacity
                onPress={() => setStudentModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedStudent && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.studentProfile}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {selectedStudent.first_name.charAt(0)}{selectedStudent.last_name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </Text>
                  <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                    {selectedStudent.email}
                  </Text>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Basic Information
                  </Text>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                      Student ID:
                    </Text>
                    <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                      {selectedStudent.employee_id}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                      Phone:
                    </Text>
                    <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                      {selectedStudent.phone || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                      Standard:
                    </Text>
                    <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                      {selectedStudent.standard?.name || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                      Section:
                    </Text>
                    <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                      {selectedStudent.section?.name || 'N/A'}
                    </Text>
                  </View>
                </View>

                {selectedStudent.address && (
                  <View style={styles.detailsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                      Address
                    </Text>
                    <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                      {selectedStudent.address.street}, {selectedStudent.address.city}
                      {selectedStudent.address.state && `, ${selectedStudent.address.state}`}
                      {selectedStudent.address.zip_code && ` - ${selectedStudent.address.zip_code}`}
                    </Text>
                  </View>
                )}

                {selectedStudent.guardians && selectedStudent.guardians.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                      Guardian Information
                    </Text>
                    {selectedStudent.guardians.map((guardian, index) => (
                      <View key={index} style={styles.guardianItem}>
                        <Text style={[styles.guardianName, { color: colors.textPrimary }]}>
                          {guardian.first_name} {guardian.last_name}
                        </Text>
                        <Text style={[styles.guardianRelation, { color: colors.textSecondary }]}>
                          {guardian.relation}
                        </Text>
                        <Text style={[styles.guardianContact, { color: colors.textSecondary }]}>
                          {guardian.contact_number}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
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
  filtersContainer: {
    padding: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
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
  content: {
    flex: 1,
    padding: 16,
  },
  studentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 50,
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  studentId: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  studentDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
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
  studentProfile: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItemLabel: {
    fontSize: 14,
  },
  detailItemValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
  },
  guardianItem: {
    marginBottom: 12,
  },
  guardianName: {
    fontSize: 14,
    fontWeight: '600',
  },
  guardianRelation: {
    fontSize: 12,
    marginTop: 2,
  },
  guardianContact: {
    fontSize: 12,
    marginTop: 2,
  },
});
