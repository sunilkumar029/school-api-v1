
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDocuments } from '@/hooks/useApi';
import { apiService } from '@/api/apiService';

interface Document {
  id: number;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by?: any;
  created: string;
  modified: string;
  is_public: boolean;
  category?: string;
}

export default function FileManagementScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { 
    data: documents, 
    loading, 
    error, 
    refetch 
  } = useDocuments({
    search: searchQuery,
    category: selectedCategory,
    ordering: '-created'
  });

  const categories = [
    'All',
    'Academic',
    'Administrative',
    'Student Records',
    'Staff Records',
    'Reports',
    'Policies',
    'Forms'
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing documents:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDocumentPress = async (document: Document) => {
    try {
      // In a real app, you would open the document
      Alert.alert(
        document.title,
        `Type: ${document.file_type}\n` +
        `Size: ${formatFileSize(document.file_size)}\n` +
        `${document.description || 'No description available'}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View Document',
            onPress: () => {
              // Open document URL
              console.log('Opening document:', document.file_url);
              Alert.alert('Info', 'Document viewing not implemented in demo');
            }
          },
          {
            text: 'Download',
            onPress: () => {
              // Download document
              console.log('Downloading document:', document.file_url);
              Alert.alert('Info', 'Document download not implemented in demo');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error handling document:', error);
      Alert.alert('Error', 'Failed to process document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '📄';
    if (type.includes('doc') || type.includes('word')) return '📝';
    if (type.includes('xls') || type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('ppt') || type.includes('powerpoint')) return '📋';
    if (type.includes('image') || type.includes('jpg') || type.includes('png')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📁';
  };

  const renderCategoryTab = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryTab,
        {
          backgroundColor: selectedCategory === (category === 'All' ? null : category) 
            ? colors.primary 
            : colors.surface,
          borderColor: colors.border
        }
      ]}
      onPress={() => setSelectedCategory(category === 'All' ? null : category)}
    >
      <Text
        style={[
          styles.categoryTabText,
          {
            color: selectedCategory === (category === 'All' ? null : category)
              ? '#FFFFFF'
              : colors.textPrimary
          }
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );

  const renderDocument = (document: Document) => (
    <TouchableOpacity
      key={document.id}
      style={[styles.documentCard, { backgroundColor: colors.surface }]}
      onPress={() => handleDocumentPress(document)}
      activeOpacity={0.7}
    >
      <View style={styles.documentHeader}>
        <Text style={styles.fileIcon}>{getFileIcon(document.file_type)}</Text>
        <View style={styles.documentInfo}>
          <Text style={[styles.documentTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {document.title}
          </Text>
          <Text style={[styles.documentMeta, { color: colors.textSecondary }]}>
            {document.file_type} • {formatFileSize(document.file_size)}
          </Text>
        </View>
        <View style={[
          styles.visibilityBadge,
          { backgroundColor: document.is_public ? '#E8F5E8' : '#FFF3CD' }
        ]}>
          <Text style={[
            styles.visibilityText,
            { color: document.is_public ? '#2E7D32' : '#856404' }
          ]}>
            {document.is_public ? 'Public' : 'Private'}
          </Text>
        </View>
      </View>

      {document.description && (
        <Text style={[styles.documentDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {document.description}
        </Text>
      )}

      <View style={styles.documentFooter}>
        <Text style={[styles.uploadDate, { color: colors.textSecondary }]}>
          {new Date(document.created).toLocaleDateString()}
        </Text>
        {document.uploaded_by && (
          <Text style={[styles.uploader, { color: colors.textSecondary }]}>
            By {document.uploaded_by.name || document.uploaded_by.email}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="File Management"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <TextInput
            style={[
              styles.searchInput,
              { 
                color: colors.textPrimary,
                backgroundColor: colors.background
              }
            ]}
            placeholder="Search documents..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map(renderCategoryTab)}
        </ScrollView>

        {/* Error State */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: '#FFEBEE' }]}>
            <Text style={[styles.errorText, { color: '#C62828' }]}>
              {error}
            </Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Documents List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading documents...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.documentsContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {documents.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No documents found
                </Text>
                <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                  <Text style={[styles.refreshText, { color: colors.primary }]}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.documentsList}>
                {documents.map(renderDocument)}
              </View>
            )}
          </ScrollView>
        )}

        {/* Upload Button */}
        <TouchableOpacity 
          style={[styles.uploadButton, { backgroundColor: colors.primary }]}
          onPress={() => Alert.alert('Info', 'Document upload not implemented in demo')}
        >
          <Text style={styles.uploadButtonText}>+ Upload Document</Text>
        </TouchableOpacity>
      </View>
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
  searchContainer: {
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  searchInput: {
    padding: 12,
    fontSize: 16,
    borderRadius: 6,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesContent: {
    paddingRight: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  documentsContainer: {
    flex: 1,
  },
  documentsList: {
    paddingBottom: 80, // Space for upload button
  },
  documentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
    marginRight: 12,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 12,
  },
  visibilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  visibilityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  documentDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  documentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadDate: {
    fontSize: 12,
  },
  uploader: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
