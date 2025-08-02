
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedBy: string;
  createdDate: string;
  comments: string[];
  attachments: string[];
  tags: string[];
}

export default function MyTasksScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState<Task | null>(null);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
  });

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Review Student Applications',
      description: 'Review and process new student admission applications for the upcoming semester',
      status: 'in-progress',
      priority: 'high',
      dueDate: '2024-01-20',
      assignedBy: 'Principal Office',
      createdDate: '2024-01-15',
      comments: ['Started review process', 'Need to verify documents'],
      attachments: ['applications.pdf', 'checklist.xlsx'],
      tags: ['admissions', 'urgent'],
    },
    {
      id: '2',
      title: 'Prepare Monthly Report',
      description: 'Compile monthly performance report for the department',
      status: 'todo',
      priority: 'medium',
      dueDate: '2024-01-25',
      assignedBy: 'Department Head',
      createdDate: '2024-01-16',
      comments: [],
      attachments: ['template.docx'],
      tags: ['report', 'monthly'],
    },
    {
      id: '3',
      title: 'Organize Parent-Teacher Meeting',
      description: 'Coordinate and schedule parent-teacher meetings for Grade 10',
      status: 'done',
      priority: 'medium',
      dueDate: '2024-01-18',
      assignedBy: 'Academic Coordinator',
      createdDate: '2024-01-10',
      comments: ['All parents contacted', 'Schedule finalized'],
      attachments: ['meeting_schedule.pdf'],
      tags: ['meetings', 'grade-10'],
    },
    {
      id: '4',
      title: 'Update Student Records',
      description: 'Update and verify student academic records in the system',
      status: 'todo',
      priority: 'low',
      dueDate: '2024-01-30',
      assignedBy: 'System Admin',
      createdDate: '2024-01-17',
      comments: [],
      attachments: [],
      tags: ['records', 'maintenance'],
    },
  ]);

  const priorities = [
    { value: 'low', label: 'Low', color: '#4CAF50' },
    { value: 'medium', label: 'Medium', color: '#FF9800' },
    { value: 'high', label: 'High', color: '#F44336' },
  ];

  const filteredTasks = activeTab === 'all'
    ? tasks
    : tasks.filter(task => task.status === activeTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return '#9E9E9E';
      case 'in-progress': return '#2196F3';
      case 'done': return '#4CAF50';
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return '📋';
      case 'in-progress': return '⚡';
      case 'done': return '✅';
      default: return '📄';
    }
  };

  const getPriorityColor = (priority: string) => {
    const priorityData = priorities.find(p => p.value === priority);
    return priorityData?.color || colors.textSecondary;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleStatusChange = (taskId: string, newStatus: 'todo' | 'in-progress' | 'done') => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const handleAddTask = () => {
    if (!newTask.title || !newTask.description || !newTask.dueDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      status: 'todo',
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      assignedBy: 'Self-assigned',
      createdDate: new Date().toISOString().split('T')[0],
      comments: [],
      attachments: [],
      tags: [],
    };

    setTasks(prev => [task, ...prev]);
    setNewTask({ title: '', description: '', priority: 'medium', dueDate: '' });
    setShowAddModal(false);
    Alert.alert('Success', 'Task added successfully');
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const daysUntilDue = getDaysUntilDue(task.dueDate);
    const isOverdue = daysUntilDue < 0;
    const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;

    return (
      <TouchableOpacity
        style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setShowTaskDetail(task)}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskTitle}>
            <Text style={[styles.taskTitleText, { color: colors.textPrimary }]}>
              {task.title}
            </Text>
            <Text style={[styles.assignedBy, { color: colors.textSecondary }]}>
              by {task.assignedBy}
            </Text>
          </View>
          <View style={styles.taskMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
              <Text style={styles.priorityText}>{task.priority.toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
              <Text style={styles.statusText}>
                {getStatusIcon(task.status)} {task.status.replace('-', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.taskDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {task.description}
        </Text>

        <View style={styles.taskDetails}>
          <Text style={[
            styles.dueDate,
            {
              color: isOverdue ? '#F44336' : isDueSoon ? '#FF9800' : colors.textSecondary
            }
          ]}>
            Due: {task.dueDate}
            {isOverdue && ' (Overdue)'}
            {isDueSoon && !isOverdue && ` (${daysUntilDue} days left)`}
          </Text>
          
          <View style={styles.taskFooter}>
            <View style={styles.taskStats}>
              {task.comments.length > 0 && (
                <Text style={[styles.statItem, { color: colors.textSecondary }]}>
                  💬 {task.comments.length}
                </Text>
              )}
              {task.attachments.length > 0 && (
                <Text style={[styles.statItem, { color: colors.textSecondary }]}>
                  📎 {task.attachments.length}
                </Text>
              )}
            </View>
          </View>
        </View>

        {task.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {task.tags.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick Status Change */}
        <View style={styles.statusActions}>
          {task.status !== 'todo' && (
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: getStatusColor('todo') }]}
              onPress={() => handleStatusChange(task.id, 'todo')}
            >
              <Text style={styles.statusButtonText}>To Do</Text>
            </TouchableOpacity>
          )}
          {task.status !== 'in-progress' && (
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: getStatusColor('in-progress') }]}
              onPress={() => handleStatusChange(task.id, 'in-progress')}
            >
              <Text style={styles.statusButtonText}>In Progress</Text>
            </TouchableOpacity>
          )}
          {task.status !== 'done' && (
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: getStatusColor('done') }]}
              onPress={() => handleStatusChange(task.id, 'done')}
            >
              <Text style={styles.statusButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="My Tasks"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        {(['all', 'todo', 'in-progress', 'done'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: colors.primary }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === tab ? colors.primary : colors.textSecondary,
                  fontWeight: activeTab === tab ? 'bold' : 'normal',
                }
              ]}
            >
              {tab === 'all' ? 'All' : tab.replace('-', ' ')} ({
                tab === 'all' ? tasks.length : tasks.filter(t => t.status === tab).length
              })
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Task Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add New Task</Text>
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      <ScrollView style={styles.tasksList}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No tasks found
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add New Task</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Task title"
              placeholderTextColor={colors.textSecondary}
              value={newTask.title}
              onChangeText={(text) => setNewTask(prev => ({ ...prev, title: text }))}
            />
            
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Task description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={newTask.description}
              onChangeText={(text) => setNewTask(prev => ({ ...prev, description: text }))}
            />
            
            <TouchableOpacity
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, justifyContent: 'center' }]}
              onPress={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setNewTask(prev => ({ ...prev, dueDate: tomorrow.toISOString().split('T')[0] }));
              }}
            >
              <Text style={[styles.inputText, { color: newTask.dueDate ? colors.textPrimary : colors.textSecondary }]}>
                {newTask.dueDate || 'Select due date'}
              </Text>
            </TouchableOpacity>

            <View style={styles.priorityContainer}>
              <Text style={[styles.priorityLabel, { color: colors.textPrimary }]}>Priority:</Text>
              {priorities.map((priority) => (
                <TouchableOpacity
                  key={priority.value}
                  style={[
                    styles.priorityOption,
                    {
                      backgroundColor: newTask.priority === priority.value ? priority.color : colors.background,
                      borderColor: priority.color,
                    }
                  ]}
                  onPress={() => setNewTask(prev => ({ ...prev, priority: priority.value as any }))}
                >
                  <Text
                    style={[
                      styles.priorityOptionText,
                      {
                        color: newTask.priority === priority.value ? '#FFFFFF' : priority.color,
                      }
                    ]}
                  >
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAddTask}
              >
                <Text style={styles.saveButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Task Detail Modal */}
      {showTaskDetail && (
        <Modal
          visible={!!showTaskDetail}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTaskDetail(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.detailModal, { backgroundColor: colors.surface }]}>
              <ScrollView>
                <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>
                  {showTaskDetail.title}
                </Text>
                
                <Text style={[styles.detailDescription, { color: colors.textSecondary }]}>
                  {showTaskDetail.description}
                </Text>

                <View style={styles.detailInfo}>
                  <Text style={[styles.detailLabel, { color: colors.textPrimary }]}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(showTaskDetail.status) }]}>
                    <Text style={styles.statusText}>
                      {getStatusIcon(showTaskDetail.status)} {showTaskDetail.status.replace('-', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailInfo}>
                  <Text style={[styles.detailLabel, { color: colors.textPrimary }]}>Priority:</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(showTaskDetail.priority) }]}>
                    <Text style={styles.priorityText}>{showTaskDetail.priority.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.detailInfo}>
                  <Text style={[styles.detailLabel, { color: colors.textPrimary }]}>Due Date:</Text>
                  <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                    {showTaskDetail.dueDate}
                  </Text>
                </View>

                <View style={styles.detailInfo}>
                  <Text style={[styles.detailLabel, { color: colors.textPrimary }]}>Assigned By:</Text>
                  <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                    {showTaskDetail.assignedBy}
                  </Text>
                </View>

                {showTaskDetail.comments.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailSectionTitle, { color: colors.textPrimary }]}>
                      Comments:
                    </Text>
                    {showTaskDetail.comments.map((comment, index) => (
                      <Text key={index} style={[styles.comment, { color: colors.textSecondary }]}>
                        • {comment}
                      </Text>
                    ))}
                  </View>
                )}

                {showTaskDetail.attachments.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailSectionTitle, { color: colors.textPrimary }]}>
                      Attachments:
                    </Text>
                    {showTaskDetail.attachments.map((attachment, index) => (
                      <Text key={index} style={[styles.attachment, { color: colors.primary }]}>
                        📎 {attachment}
                      </Text>
                    ))}
                  </View>
                )}
              </ScrollView>
              
              <TouchableOpacity
                style={[styles.closeDetailButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowTaskDetail(null)}
              >
                <Text style={styles.closeDetailButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    textAlign: 'center',
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tasksList: {
    flex: 1,
    padding: 16,
  },
  taskCard: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    marginRight: 12,
  },
  taskTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  assignedBy: {
    fontSize: 12,
  },
  taskMeta: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  taskDetails: {
    marginBottom: 12,
  },
  dueDate: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskStats: {
    flexDirection: 'row',
  },
  statItem: {
    fontSize: 12,
    marginRight: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    padding: 24,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  inputText: {
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    marginBottom: 8,
  },
  priorityOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailModal: {
    width: '90%',
    height: '80%',
    borderRadius: 16,
    padding: 24,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  detailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  attachment: {
    fontSize: 14,
    marginBottom: 4,
  },
  closeDetailButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeDetailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
