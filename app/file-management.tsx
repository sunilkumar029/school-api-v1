
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

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: string;
  lastModified: string;
  owner: string;
  shared: boolean;
  tags: string[];
}

export default function FileManagementScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'grid' | 'list'>('list');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'docs' | 'images' | 'videos'>('all');

  // Mock data
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: '1',
      name: 'Class Notes',
      type: 'folder',
      lastModified: '2024-01-15',
      owner: 'You',
      shared: false,
      tags: ['academic', 'notes']
    },
    {
      id: '2',
      name: 'Assignment_Physics.pdf',
      type: 'file',
      size: '2.4 MB',
      lastModified: '2024-01-14',
      owner: 'Dr. Smith',
      shared: true,
      tags: ['assignment', 'physics']
    },
    {
      id: '3',
      name: 'Presentation_Math.pptx',
      type: 'file',
      size: '5.1 MB',
      lastModified: '2024-01-13',
      owner: 'You',
      shared: false,
      tags: ['presentation', 'math']
    },
  ]);

  const handleUpload = () => {
    Alert.alert('Upload File', 'File upload functionality would be implemented here');
  };

  const handleCreateFolder = () => {
    Alert.alert('Create Folder', 'Folder creation functionality would be implemented here');
  };

  const handleFilePress = (file: FileItem) => {
    if (file.type === 'folder') {
      // Navigate into folder
      Alert.alert('Open Folder', `Opening ${file.name}`);
    } else {
      // Open file
      Alert.alert('Open File', `Opening ${file.name}`);
    }
  };

  const handleShare = (file: FileItem) => {
    Alert.alert('Share File', `Sharing ${file.name}`);
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') return '📁';
    if (file.name.endsWith('.pdf')) return '📄';
    if (file.name.endsWith('.pptx') || file.name.endsWith('.ppt')) return '📊';
    if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) return '📝';
    if (file.name.endsWith('.jpg') || file.name.endsWith('.png')) return '🖼️';
    return '📎';
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || file.tags.includes(selectedFilter);
    return matchesSearch && matchesFilter;
  });

  const renderFileItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity
      style={[styles.fileItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleFilePress(item)}
    >
      <View style={styles.fileInfo}>
        <Text style={styles.fileIcon}>{getFileIcon(item)}</Text>
        <View style={styles.fileDetails}>
          <Text style={[styles.fileName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.fileMetadata, { color: colors.textSecondary }]}>
            {item.size && `${item.size} • `}{item.lastModified} • {item.owner}
          </Text>
          <View style={styles.tagsContainer}>
            {item.tags.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.fileActions}>
        {item.shared && <Text style={styles.sharedIcon}>🔗</Text>}
        <TouchableOpacity onPress={() => handleShare(item)}>
          <Text style={[styles.actionIcon, { color: colors.primary }]}>⋯</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="File Management"
        onMenuPress={() => setDrawerVisible(true)}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Search and Actions */}
      <View style={[styles.toolbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="Search files and folders..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleUpload}
        >
          <Text style={styles.actionButtonText}>📤</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateFolder}
        >
          <Text style={styles.actionButtonText}>📁+</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        {['all', 'docs', 'images', 'videos'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setSelectedFilter(filter as any)}
          >
            <Text style={[
              styles.filterText,
              { color: selectedFilter === filter ? colors.primary : colors.textSecondary }
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Files List */}
      <FlatList
        data={filteredFiles}
        renderItem={renderFileItem}
        keyExtractor={(item) => item.id}
        style={styles.filesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Storage Info */}
      <View style={[styles.storageInfo, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Text style={[styles.storageText, { color: colors.textSecondary }]}>
          Storage: 2.4 GB used of 10 GB
        </Text>
        <View style={[styles.storageBar, { backgroundColor: colors.border }]}>
          <View style={[styles.storageUsed, { backgroundColor: colors.primary }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  filterTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filesList: {
    flex: 1,
    padding: 16,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  fileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileMetadata: {
    fontSize: 12,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sharedIcon: {
    fontSize: 16,
  },
  actionIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  storageInfo: {
    padding: 16,
    borderTopWidth: 1,
  },
  storageText: {
    fontSize: 12,
    marginBottom: 8,
  },
  storageBar: {
    height: 4,
    borderRadius: 2,
  },
  storageUsed: {
    height: 4,
    width: '24%',
    borderRadius: 2,
  },
});
