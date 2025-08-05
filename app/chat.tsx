
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatMessages } from '@/hooks/useApi';
import { apiService } from '@/api/apiService';

interface ChatMessage {
  id: number;
  message: string;
  sender: any;
  receiver: any;
  timestamp: string;
  is_read: boolean;
  message_type?: string;
}

interface ChatPartner {
  id: number;
  name: string;
  email: string;
  role?: string;
  is_online?: boolean;
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatPartner | null>(null);
  const [message, setMessage] = useState('');
  const [chatPartners, setChatPartners] = useState<ChatPartner[]>([]);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { 
    data: messages, 
    loading: messagesLoading, 
    error: messagesError, 
    refetch: refetchMessages 
  } = useChatMessages(
    selectedChat ? { 
      sender: user?.id,
      receiver: selectedChat.id,
      ordering: 'timestamp'
    } : {}
  );

  const fetchChatPartners = async () => {
    try {
      const partners = await apiService.getChatWith();
      setChatPartners(partners || []);
    } catch (error) {
      console.error('Error fetching chat partners:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchChatPartners(),
        refetchMessages()
      ]);
    } catch (error) {
      console.error('Error refreshing chat:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedChat || sending) return;

    setSending(true);
    try {
      await apiService.sendChatMessage({
        message: message.trim(),
        receiver: selectedChat.id,
        message_type: 'text'
      });
      
      setMessage('');
      await refetchMessages();
      
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: number) => {
    try {
      await apiService.markAsRead({ message_id: messageId });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const checkUserOnline = async (userId: number) => {
    try {
      const response = await apiService.isUserOnline(userId);
      return response?.is_online || false;
    } catch (error) {
      console.error('Error checking user online status:', error);
      return false;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (msg: ChatMessage, index: number) => {
    const isOwnMessage = msg.sender?.id === user?.id;
    
    return (
      <View
        key={msg.id || index}
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isOwnMessage ? colors.primary : colors.surface,
              alignSelf: isOwnMessage ? 'flex-end' : 'flex-start'
            }
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isOwnMessage ? '#FFFFFF' : colors.textPrimary }
            ]}
          >
            {msg.message}
          </Text>
          <Text
            style={[
              styles.messageTime,
              { color: isOwnMessage ? '#FFFFFF90' : colors.textSecondary }
            ]}
          >
            {formatTime(msg.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const renderChatPartner = (partner: ChatPartner) => (
    <TouchableOpacity
      key={partner.id}
      style={[
        styles.partnerItem,
        { 
          backgroundColor: selectedChat?.id === partner.id ? colors.primary + '20' : 'transparent',
          borderBottomColor: colors.border
        }
      ]}
      onPress={() => setSelectedChat(partner)}
    >
      <View style={styles.partnerInfo}>
        <View style={styles.partnerHeader}>
          <Text style={[styles.partnerName, { color: colors.textPrimary }]}>
            {partner.name}
          </Text>
          {partner.is_online && (
            <View style={styles.onlineIndicator} />
          )}
        </View>
        <Text style={[styles.partnerRole, { color: colors.textSecondary }]}>
          {partner.role || partner.email}
        </Text>
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    fetchChatPartners();
  }, []);

  useEffect(() => {
    // Auto-refresh messages every 30 seconds
    const interval = setInterval(() => {
      if (selectedChat) {
        refetchMessages();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedChat, refetchMessages]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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

      <View style={styles.content}>
        <View style={styles.chatContainer}>
          {/* Chat Partners Sidebar */}
          <View style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
            <Text style={[styles.sidebarTitle, { color: colors.textPrimary }]}>
              Contacts
            </Text>
            <ScrollView
              style={styles.partnersList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            >
              {chatPartners.map(renderChatPartner)}
            </ScrollView>
          </View>

          {/* Chat Area */}
          <View style={styles.chatArea}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <View style={[styles.chatHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                  <Text style={[styles.chatHeaderTitle, { color: colors.textPrimary }]}>
                    {selectedChat.name}
                  </Text>
                  <Text style={[styles.chatHeaderSubtitle, { color: colors.textSecondary }]}>
                    {selectedChat.role || selectedChat.email}
                  </Text>
                </View>

                {/* Messages */}
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesContainer}
                  contentContainerStyle={styles.messagesContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                      colors={[colors.primary]}
                      tintColor={colors.primary}
                    />
                  }
                >
                  {messagesLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                  ) : messagesError ? (
                    <View style={styles.errorContainer}>
                      <Text style={[styles.errorText, { color: '#C62828' }]}>
                        {messagesError}
                      </Text>
                      <TouchableOpacity onPress={refetchMessages} style={styles.retryButton}>
                        <Text style={[styles.retryText, { color: colors.primary }]}>
                          Retry
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : messages.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        No messages yet. Start a conversation!
                      </Text>
                    </View>
                  ) : (
                    messages.map(renderMessage)
                  )}
                </ScrollView>

                {/* Message Input */}
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                  <TextInput
                    style={[
                      styles.messageInput,
                      { 
                        backgroundColor: colors.background,
                        color: colors.textPrimary,
                        borderColor: colors.border
                      }
                    ]}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.textSecondary}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    maxLength={1000}
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      { 
                        backgroundColor: message.trim() ? colors.primary : colors.border,
                        opacity: sending ? 0.6 : 1
                      }
                    ]}
                    onPress={sendMessage}
                    disabled={!message.trim() || sending}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.sendButtonText}>Send</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.noChatSelected}>
                <Text style={[styles.noChatText, { color: colors.textSecondary }]}>
                  Select a contact to start chatting
                </Text>
              </View>
            )}
          </View>
        </View>
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
  chatContainer: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sidebar: {
    width: 200,
    borderRightWidth: 1,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  partnersList: {
    flex: 1,
  },
  partnerItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  partnerRole: {
    fontSize: 12,
  },
  chatArea: {
    flex: 1,
  },
  chatHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  noChatSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noChatText: {
    fontSize: 16,
  },
});
