
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  avatar: string;
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const chats: ChatItem[] = [
    {
      id: '1',
      name: 'John Doe',
      lastMessage: 'Hey, how are you doing?',
      time: '2:30 PM',
      unreadCount: 2,
      avatar: '👨',
    },
    {
      id: '2',
      name: 'Jane Smith',
      lastMessage: 'Thanks for the help!',
      time: '1:15 PM',
      unreadCount: 0,
      avatar: '👩',
    },
    {
      id: '3',
      name: 'Staff Group',
      lastMessage: 'Meeting at 3 PM today',
      time: '12:45 PM',
      unreadCount: 5,
      avatar: '👥',
    },
  ];

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChat = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity style={[styles.chatItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Text style={styles.avatar}>{item.avatar}</Text>
      <View style={styles.chatContent}>
        <Text style={[styles.chatName, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      <View style={styles.chatMeta}>
        <Text style={[styles.chatTime, { color: colors.textSecondary }]}>{item.time}</Text>
        {item.unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.unreadCount}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar 
        title="Chat"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />
      
      <SideDrawer 
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Search chats..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredChats}
        renderItem={renderChat}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    fontSize: 24,
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  chatTime: {
    fontSize: 12,
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
