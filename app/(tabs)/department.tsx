
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Department {
  id: string;
  name: string;
  type: 'academic' | 'admin' | 'support';
  head: string;
  staffCount: number;
  status: 'active' | 'archived';
  description: string;
}

export default function DepartmentScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'academic' | 'admin' | 'support'>('all');
  const [addDepartmentModal, setAddDepartmentModal] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    type: 'academic' as Department['type'],
    head: '',
    description: '',
  });

  const [departments, setDepartments] = useState<Department[]>([
    {
      id: '1',
      name: 'Computer Science',
      type: 'academic',
      head: 'Dr. Sarah Johnson',
      staffCount: 12,
      status: 'active',
      description: 'Computer Science and Engineering Department',
    },
    {
      id: '2',
      name: 'Mathematics',
      type: 'academic',
      head: 'Prof. Michael Chen',
      staffCount: 8,
      status: 'active',
      description: 'Mathematics and Statistics Department',
    },
    {
      id: '3',
      name: 'Administration',
      type: 'admin',
      head: 'Ms. Jennifer Wilson',
      staffCount: 15,
      status: 'active',
      description: 'Administrative Services Department',
    },
    {
      id: '4',
      name: 'IT Support',
      type: 'support',
      head: 'Mr. David Brown',
      staffCount: 6,
      status: 'active',
      description: 'Information Technology Support',
    },
    {
      id: '5',
      name: 'Library Services',
      type: 'support',
      head: 'Ms. Emily Davis',
      staffCount: 4,
      status: 'archived',
      description: 'Library and Information Services',
    },
  ]);

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.head.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || dept.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const addNewDepartment = () => {
    if (!newDepartment.name || !newDepartment.head) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const department: Department = {
      id: (departments.length + 1).toString(),
      name: newDepartment.name,
      type: newDepartment.type,
      head: newDepartment.head,
      staffCount: 0,
      status: 'active',
      description: newDepartment.description,
    };

    setDepartments(prev => [...prev, department]);
    setNewDepartment({ name: '', type: 'academic', head: '', description: '' });
    setAddDepartmentModal(false);
    Alert.alert('Success', 'Department added successfully!');
  };

  const toggleDepartmentStatus = (id: string) => {
    setDepartments(prev => prev.map(dept =>
      dept.id === id
        ? { ...dept, status: dept.status === 'active' ? 'archived' : 'active' }
        : dept
    ));
  };

  const getTypeColor = (type: Department['type']) => {
    switch (type) {
      case 'academic': return '#007AFF';
      case 'admin': return '#FF9500';
      case 'support': return '#34C759';
      default: return colors.textSecondary;
    }
  };

  const renderDepartment = ({ item }: { item: Department }) => (
    <View style={[styles.departmentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.departmentHeader}>
        <View style={styles.departmentInfo}>
          <Text style={[styles.departmentName, { color: colors.textPrimary }]}>{item.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
            <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'active' ? '#34C759' : '#8E8E93' }
        ]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={[styles.departmentDescription, { color: colors.textSecondary }]}>
        {item.description}
      </Text>

      <View style={styles.departmentMeta}>
        <Text style={[styles.headName, { color: colors.textPrimary }]}>
          Head: {item.head}
        </Text>
        <Text style={[styles.staffCount, { color: colors.textSecondary }]}>
          Staff: {item.staffCount}
        </Text>
      </View>

      {user?.is_staff && (
        <View style={styles.departmentActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => Alert.alert('Edit', `Edit ${item.name} department`)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: item.status === 'active' ? '#FF3B30' : '#34C759' }]}
            onPress={() => toggleDepartmentStatus(item.id)}
          >
            <Text style={styles.actionButtonText}>
              {item.status === 'active' ? 'Archive' : 'Restore'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {['all', 'academic', 'admin', 'support'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              { borderColor: colors.border },
              selectedFilter === filter && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setSelectedFilter(filter as any)}
          >
            <Text style={[
              styles.filterButtonText,
              { color: selectedFilter === filter ? '#FFFFFF' : colors.textPrimary }
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Departments"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Search and Add */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Search departments..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {user?.is_staff && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setAddDepartmentModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      {renderFilters()}

      {/* Statistics */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {departments.filter(d => d.status === 'active').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {departments.reduce((sum, d) => sum + d.staffCount, 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Staff</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {departments.filter(d => d.type === 'academic').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Academic</Text>
        </View>
      </View>

      {/* Departments List */}
      <FlatList
        data={filteredDepartments}
        renderItem={renderDepartment}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Add Department Modal */}
      <Modal
        visible={addDepartmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddDepartmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add New Department</Text>

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Department Name"
              placeholderTextColor={colors.textSecondary}
              value={newDepartment.name}
              onChangeText={(text) => setNewDepartment(prev => ({ ...prev, name: text }))}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Department Head"
              placeholderTextColor={colors.textSecondary}
              value={newDepartment.head}
              onChangeText={(text) => setNewDepartment(prev => ({ ...prev, head: text }))}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, height: 80 }]}
              placeholder="Description"
              placeholderTextColor={colors.textSecondary}
              value={newDepartment.description}
              onChangeText={(text) => setNewDepartment(prev => ({ ...prev, description: text }))}
              multiline
            />

            <View style={styles.typeSelector}>
              <Text style={[styles.typeSelectorLabel, { color: colors.textPrimary }]}>Type:</Text>
              <View style={styles.typeButtons}>
                {['academic', 'admin', 'support'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      { borderColor: colors.border },
                      newDepartment.type === type && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setNewDepartment(prev => ({ ...prev, type: type as Department['type'] }))}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      { color: newDepartment.type === type ? '#FFFFFF' : colors.textPrimary }
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setAddDepartmentModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={addNewDepartment}
              >
                <Text style={styles.modalButtonText}>Add Department</Text>
              </TouchableOpacity>
            </View>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  departmentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  departmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  departmentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  departmentName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  departmentDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  departmentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headName: {
    fontSize: 14,
    fontWeight: '600',
  },
  staffCount: {
    fontSize: 14,
  },
  departmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  typeSelector: {
    marginBottom: 20,
  },
  typeSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
