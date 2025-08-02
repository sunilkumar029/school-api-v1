
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';

const { width } = Dimensions.get('window');

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedDate: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: number;
  icon: string;
  completed: boolean;
}

interface RewardHistory {
  id: string;
  type: 'points' | 'badge' | 'achievement';
  title: string;
  amount?: number;
  date: string;
  reason: string;
}

interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  rank: number;
  avatar: string;
  level: number;
}

export default function MyRewardsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Mock user data
  const userRewards = {
    currentPoints: 1250,
    totalPoints: 3480,
    level: 7,
    nextLevelPoints: 1500,
    rank: 3,
    streakDays: 12,
  };

  const badges: Badge[] = [
    {
      id: '1',
      name: 'Early Bird',
      description: 'Completed 10 tasks before 9 AM',
      icon: '🌅',
      color: '#FFD700',
      earnedDate: '2024-01-15',
      rarity: 'rare',
    },
    {
      id: '2',
      name: 'Team Player',
      description: 'Collaborated on 5 group projects',
      icon: '🤝',
      color: '#4CAF50',
      earnedDate: '2024-01-12',
      rarity: 'common',
    },
    {
      id: '3',
      name: 'Knowledge Seeker',
      description: 'Completed 20 library resources',
      icon: '📚',
      color: '#2196F3',
      earnedDate: '2024-01-10',
      rarity: 'epic',
    },
    {
      id: '4',
      name: 'Perfect Attendance',
      description: 'No absences for 30 days',
      icon: '📅',
      color: '#FF9800',
      earnedDate: '2024-01-08',
      rarity: 'legendary',
    },
  ];

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Task Master',
      description: 'Complete 100 tasks',
      progress: 87,
      maxProgress: 100,
      reward: 500,
      icon: '🎯',
      completed: false,
    },
    {
      id: '2',
      title: 'Social Butterfly',
      description: 'Join 10 events',
      progress: 10,
      maxProgress: 10,
      reward: 200,
      icon: '🦋',
      completed: true,
    },
    {
      id: '3',
      title: 'Finance Guru',
      description: 'Track expenses for 30 days',
      progress: 18,
      maxProgress: 30,
      reward: 300,
      icon: '💰',
      completed: false,
    },
  ];

  const rewardHistory: RewardHistory[] = [
    {
      id: '1',
      type: 'points',
      title: 'Task Completion',
      amount: 50,
      date: '2024-01-15',
      reason: 'Completed Mathematics Assignment',
    },
    {
      id: '2',
      type: 'badge',
      title: 'Early Bird Badge',
      date: '2024-01-15',
      reason: 'Completed 10 tasks before 9 AM',
    },
    {
      id: '3',
      type: 'points',
      title: 'Event Participation',
      amount: 25,
      date: '2024-01-14',
      reason: 'Attended Science Exhibition',
    },
    {
      id: '4',
      type: 'achievement',
      title: 'Social Butterfly',
      amount: 200,
      date: '2024-01-12',
      reason: 'Joined 10 events milestone',
    },
  ];

  const leaderboard: LeaderboardUser[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      points: 2150,
      rank: 1,
      avatar: '👩‍🎓',
      level: 9,
    },
    {
      id: '2',
      name: 'Bob Smith',
      points: 1890,
      rank: 2,
      avatar: '👨‍💼',
      level: 8,
    },
    {
      id: '3',
      name: 'You',
      points: userRewards.currentPoints,
      rank: userRewards.rank,
      avatar: '👤',
      level: userRewards.level,
    },
    {
      id: '4',
      name: 'Carol Wilson',
      points: 1180,
      rank: 4,
      avatar: '👩‍🔬',
      level: 6,
    },
    {
      id: '5',
      name: 'David Brown',
      points: 950,
      rank: 5,
      avatar: '👨‍🎨',
      level: 5,
    },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9E9E9E';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FF9800';
      default: return colors.textSecondary;
    }
  };

  const ProgressRing = ({ progress, maxProgress, size = 100 }: { progress: number; maxProgress: number; size?: number }) => {
    const percentage = (progress / maxProgress) * 100;
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View style={[styles.progressRing, { width: size, height: size }]}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { 
            width: `${percentage}%`,
            backgroundColor: colors.primary,
          }]} />
        </View>
        <View style={styles.progressContent}>
          <Text style={[styles.progressText, { color: colors.textPrimary }]}>
            Level {userRewards.level}
          </Text>
          <Text style={[styles.progressSubtext, { color: colors.textSecondary }]}>
            {userRewards.currentPoints}/{userRewards.nextLevelPoints}
          </Text>
        </View>
      </View>
    );
  };

  const BadgeCard = ({ badge }: { badge: Badge }) => (
    <TouchableOpacity
      style={[styles.badgeCard, { backgroundColor: colors.surface, borderColor: getRarityColor(badge.rarity) }]}
      onPress={() => setSelectedBadge(badge)}
    >
      <Text style={styles.badgeIcon}>{badge.icon}</Text>
      <Text style={[styles.badgeName, { color: colors.textPrimary }]} numberOfLines={2}>
        {badge.name}
      </Text>
      <View style={[styles.rarityDot, { backgroundColor: getRarityColor(badge.rarity) }]} />
    </TouchableOpacity>
  );

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => (
    <View style={[styles.achievementCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.achievementHeader}>
        <Text style={styles.achievementIcon}>{achievement.icon}</Text>
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementTitle, { color: colors.textPrimary }]}>
            {achievement.title}
          </Text>
          <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
            {achievement.description}
          </Text>
        </View>
        <View style={styles.achievementReward}>
          <Text style={[styles.rewardPoints, { color: colors.primary }]}>
            +{achievement.reward}
          </Text>
          <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>
            points
          </Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                backgroundColor: achievement.completed ? '#4CAF50' : colors.primary,
              }
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {achievement.progress}/{achievement.maxProgress}
        </Text>
      </View>
      
      {achievement.completed && (
        <View style={[styles.completedBadge, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.completedText}>✓ Completed</Text>
        </View>
      )}
    </View>
  );

  const HistoryItem = ({ item }: { item: RewardHistory }) => (
    <View style={[styles.historyItem, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
      <View style={styles.historyContent}>
        <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>
          {item.title}
          {item.amount && (
            <Text style={[styles.historyAmount, { color: colors.primary }]}>
              {' '}+{item.amount} pts
            </Text>
          )}
        </Text>
        <Text style={[styles.historyReason, { color: colors.textSecondary }]}>
          {item.reason}
        </Text>
        <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
          {item.date}
        </Text>
      </View>
      <View style={[styles.historyType, { backgroundColor: colors.primary }]}>
        <Text style={styles.historyTypeText}>
          {item.type === 'points' ? '🏆' : item.type === 'badge' ? '🏅' : '🎯'}
        </Text>
      </View>
    </View>
  );

  const LeaderboardItem = ({ user, index }: { user: LeaderboardUser; index: number }) => (
    <View style={[
      styles.leaderboardItem,
      {
        backgroundColor: user.name === 'You' ? colors.primary + '20' : colors.surface,
        borderColor: user.name === 'You' ? colors.primary : colors.border,
      }
    ]}>
      <View style={styles.rankContainer}>
        <Text style={[styles.rankNumber, { color: colors.textPrimary }]}>
          #{user.rank}
        </Text>
        {user.rank <= 3 && (
          <Text style={styles.rankIcon}>
            {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
          </Text>
        )}
      </View>
      
      <Text style={styles.userAvatar}>{user.avatar}</Text>
      
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.textPrimary, fontWeight: user.name === 'You' ? 'bold' : 'normal' }]}>
          {user.name}
        </Text>
        <Text style={[styles.userLevel, { color: colors.textSecondary }]}>
          Level {user.level}
        </Text>
      </View>
      
      <Text style={[styles.userPoints, { color: colors.primary }]}>
        {user.points} pts
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="My Rewards"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      <ScrollView style={styles.content}>
        {/* Current Points Section */}
        <View style={[styles.pointsSection, { backgroundColor: colors.surface }]}>
          <View style={styles.pointsHeader}>
            <View style={styles.pointsInfo}>
              <Text style={[styles.currentPoints, { color: colors.primary }]}>
                {userRewards.currentPoints}
              </Text>
              <Text style={[styles.pointsLabel, { color: colors.textSecondary }]}>
                Current Points
              </Text>
              <Text style={[styles.totalPoints, { color: colors.textSecondary }]}>
                Total Earned: {userRewards.totalPoints}
              </Text>
            </View>
            <ProgressRing progress={userRewards.currentPoints} maxProgress={userRewards.nextLevelPoints} />
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>#{userRewards.rank}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rank</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{userRewards.streakDays}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
            </View>
            <TouchableOpacity
              style={[styles.leaderboardButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowLeaderboard(true)}
            >
              <Text style={styles.leaderboardButtonText}>View Leaderboard</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Badges Earned ({badges.length})
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.badgesContainer}>
              {badges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Achievements
          </Text>
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </View>

        {/* Reward History Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Recent History
          </Text>
          {rewardHistory.map((item) => (
            <HistoryItem key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <Modal
          visible={!!selectedBadge}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSelectedBadge(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.badgeModal, { backgroundColor: colors.surface }]}>
              <Text style={styles.badgeModalIcon}>{selectedBadge.icon}</Text>
              <Text style={[styles.badgeModalName, { color: colors.textPrimary }]}>
                {selectedBadge.name}
              </Text>
              <Text style={[styles.badgeModalDescription, { color: colors.textSecondary }]}>
                {selectedBadge.description}
              </Text>
              <View style={[styles.badgeModalRarity, { backgroundColor: getRarityColor(selectedBadge.rarity) }]}>
                <Text style={styles.badgeModalRarityText}>
                  {selectedBadge.rarity.toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.badgeModalDate, { color: colors.textSecondary }]}>
                Earned on {selectedBadge.earnedDate}
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.primary }]}
                onPress={() => setSelectedBadge(null)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Leaderboard Modal */}
      <Modal
        visible={showLeaderboard}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLeaderboard(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.leaderboardModal, { backgroundColor: colors.surface }]}>
            <View style={styles.leaderboardHeader}>
              <Text style={[styles.leaderboardTitle, { color: colors.textPrimary }]}>
                Leaderboard
              </Text>
              <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
                <Text style={[styles.closeIcon, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.leaderboardList}>
              {leaderboard.map((user, index) => (
                <LeaderboardItem key={user.id} user={user} index={index} />
              ))}
            </ScrollView>
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
  content: {
    flex: 1,
  },
  pointsSection: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsInfo: {
    flex: 1,
  },
  currentPoints: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 16,
    marginBottom: 2,
  },
  totalPoints: {
    fontSize: 14,
  },
  progressRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBackground: {
    width: 80,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressSubtext: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  leaderboardButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  leaderboardButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    paddingRight: 16,
  },
  badgeCard: {
    width: 100,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    marginRight: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rarityDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  achievementCard: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
    position: 'relative',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
    marginRight: 12,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  achievementReward: {
    alignItems: 'center',
  },
  rewardPoints: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rewardLabel: {
    fontSize: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  completedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 8,
    padding: 16,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  historyAmount: {
    fontWeight: 'bold',
  },
  historyReason: {
    fontSize: 14,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
  },
  historyType: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTypeText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeModal: {
    width: '80%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 8,
  },
  badgeModalIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  badgeModalName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeModalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  badgeModalRarity: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeModalRarityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeModalDate: {
    fontSize: 14,
    marginBottom: 24,
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaderboardModal: {
    width: '90%',
    height: '70%',
    borderRadius: 16,
    elevation: 8,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  leaderboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  leaderboardList: {
    flex: 1,
    padding: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    padding: 16,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rankIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  userAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    marginBottom: 2,
  },
  userLevel: {
    fontSize: 12,
  },
  userPoints: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
