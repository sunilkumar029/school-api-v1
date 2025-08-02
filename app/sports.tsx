import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { SideDrawer } from "@/components/SideDrawer";

const { width } = Dimensions.get("window");

interface Team {
  id: string;
  name: string;
  sport: string;
  captain: string;
  coach: string;
  members: string[];
  logo: string;
  wins: number;
  losses: number;
  draws: number;
}

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  date: string;
  time: string;
  location: string;
  status: "scheduled" | "live" | "completed";
  scoreA?: number;
  scoreB?: number;
  notes: string;
}

interface AIRecommendation {
  id: string;
  type: "learning" | "quiz" | "progress";
  title: string;
  description: string;
  progress: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
}

export default function SportsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "teams" | "matches" | "ai-tutoring" | "ai-learning"
  >("teams");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"team" | "match">("team");

  const [teams, setTeams] = useState<Team[]>([
    {
      id: "1",
      name: "Eagles Football",
      sport: "Football",
      captain: "John Smith",
      coach: "Coach Wilson",
      members: ["John Smith", "Mike Johnson", "Alex Brown", "Chris Davis"],
      logo: "🦅",
      wins: 8,
      losses: 2,
      draws: 1,
    },
    {
      id: "2",
      name: "Thunder Basketball",
      sport: "Basketball",
      captain: "Sarah Connor",
      coach: "Coach Martinez",
      members: ["Sarah Connor", "Lisa Wang", "Emma Wilson", "Maria Garcia"],
      logo: "⚡",
      wins: 12,
      losses: 4,
      draws: 0,
    },
    {
      id: "3",
      name: "Sharks Swimming",
      sport: "Swimming",
      captain: "David Park",
      coach: "Coach Thompson",
      members: ["David Park", "Anna Lee", "Tom Wilson", "Kate Brown"],
      logo: "🦈",
      wins: 15,
      losses: 1,
      draws: 0,
    },
  ]);

  const [matches, setMatches] = useState<Match[]>([
    {
      id: "1",
      teamA: "Eagles Football",
      teamB: "Lions FC",
      date: "2024-01-25",
      time: "15:00",
      location: "Main Stadium",
      status: "scheduled",
      notes: "Championship semi-final",
    },
    {
      id: "2",
      teamA: "Thunder Basketball",
      teamB: "Warriors",
      date: "2024-01-22",
      time: "18:00",
      location: "Sports Hall A",
      status: "live",
      scoreA: 45,
      scoreB: 38,
      notes: "League match",
    },
    {
      id: "3",
      teamA: "Sharks Swimming",
      teamB: "Dolphins",
      date: "2024-01-20",
      time: "10:00",
      location: "Aquatic Center",
      status: "completed",
      scoreA: 8,
      scoreB: 4,
      notes: "Regional championship",
    },
  ]);

  const [aiRecommendations, setAiRecommendations] = useState<
    AIRecommendation[]
  >([
    {
      id: "1",
      type: "learning",
      title: "Advanced Basketball Strategies",
      description:
        "Learn advanced offensive and defensive strategies to improve your game",
      progress: 65,
      difficulty: "advanced",
      category: "Basketball",
    },
    {
      id: "2",
      type: "quiz",
      title: "Football Rules Quiz",
      description: "Test your knowledge of football rules and regulations",
      progress: 0,
      difficulty: "intermediate",
      category: "Football",
    },
    {
      id: "3",
      type: "progress",
      title: "Swimming Technique Analysis",
      description:
        "AI-powered analysis of your swimming technique with improvement suggestions",
      progress: 85,
      difficulty: "beginner",
      category: "Swimming",
    },
  ]);

  const sports = [
    "Football",
    "Basketball",
    "Swimming",
    "Tennis",
    "Cricket",
    "Volleyball",
  ];
  const isAdmin = user?.role === "admin" || user?.role === "staff";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "#2196F3";
      case "live":
        return "#4CAF50";
      case "completed":
        return "#9E9E9E";
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return "📅";
      case "live":
        return "🔴";
      case "completed":
        return "✅";
      default:
        return "📄";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "#4CAF50";
      case "intermediate":
        return "#FF9800";
      case "advanced":
        return "#F44336";
      default:
        return colors.textSecondary;
    }
  };

  const TeamCard = ({ team }: { team: Team }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.teamInfo}>
          <Text style={styles.teamLogo}>{team.logo}</Text>
          <View style={styles.teamDetails}>
            <Text style={[styles.teamName, { color: colors.textPrimary }]}>
              {team.name}
            </Text>
            <Text style={[styles.teamSport, { color: colors.textSecondary }]}>
              {team.sport}
            </Text>
          </View>
        </View>
        <View style={styles.teamStats}>
          <Text style={[styles.winRecord, { color: colors.primary }]}>
            {team.wins}W-{team.losses}L-{team.draws}D
          </Text>
        </View>
      </View>

      <View style={styles.teamMetadata}>
        <Text style={[styles.teamRole, { color: colors.textSecondary }]}>
          Captain: {team.captain}
        </Text>
        <Text style={[styles.teamRole, { color: colors.textSecondary }]}>
          Coach: {team.coach}
        </Text>
        <Text style={[styles.teamMembers, { color: colors.textSecondary }]}>
          Members: {team.members.length}
        </Text>
      </View>

      {isAdmin && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.primary }]}
            onPress={() =>
              Alert.alert("Edit Team", `Edit ${team.name} details`)
            }
          >
            <Text style={[styles.editButtonText, { color: colors.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: colors.primary }]}
            onPress={() =>
              Alert.alert("Team Details", `View ${team.name} full details`)
            }
          >
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const MatchCard = ({ match }: { match: Match }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.matchHeader}>
        <View style={styles.matchTeams}>
          <Text style={[styles.teamVs, { color: colors.textPrimary }]}>
            {match.teamA} vs {match.teamB}
          </Text>
          <Text style={[styles.matchLocation, { color: colors.textSecondary }]}>
            📍 {match.location}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(match.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {getStatusIcon(match.status)} {match.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.matchDetails}>
        <Text style={[styles.matchDateTime, { color: colors.textSecondary }]}>
          📅 {match.date} at {match.time}
        </Text>
        {match.status === "live" || match.status === "completed" ? (
          <Text style={[styles.matchScore, { color: colors.primary }]}>
            Score: {match.scoreA} - {match.scoreB}
          </Text>
        ) : null}
      </View>

      {match.notes && (
        <Text style={[styles.matchNotes, { color: colors.textSecondary }]}>
          📝 {match.notes}
        </Text>
      )}

      {isAdmin && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.primary }]}
            onPress={() => Alert.alert("Edit Match", "Edit match details")}
          >
            <Text style={[styles.editButtonText, { color: colors.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>
          {match.status === "live" && (
            <TouchableOpacity
              style={[styles.updateButton, { backgroundColor: "#4CAF50" }]}
              onPress={() =>
                Alert.alert("Update Score", "Update live match score")
              }
            >
              <Text style={styles.updateButtonText}>Update Score</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const AIRecommendationCard = ({
    recommendation,
  }: {
    recommendation: AIRecommendation;
  }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={() =>
        Alert.alert(recommendation.title, recommendation.description)
      }
    >
      <View style={styles.aiHeader}>
        <View style={styles.aiInfo}>
          <Text style={[styles.aiTitle, { color: colors.textPrimary }]}>
            {recommendation.title}
          </Text>
          <Text style={[styles.aiCategory, { color: colors.textSecondary }]}>
            {recommendation.category}
          </Text>
        </View>
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(recommendation.difficulty) },
          ]}
        >
          <Text style={styles.difficultyText}>
            {recommendation.difficulty.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text
        style={[styles.aiDescription, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {recommendation.description}
      </Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            Progress: {recommendation.progress}%
          </Text>
          <Text style={[styles.aiType, { color: colors.primary }]}>
            {recommendation.type === "learning"
              ? "📚"
              : recommendation.type === "quiz"
                ? "❓"
                : "📊"}{" "}
            {recommendation.type.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${recommendation.progress}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>

      <TouchableOpacity
        style={[styles.continueButton, { backgroundColor: colors.primary }]}
        onPress={() =>
          Alert.alert("AI Learning", `Continue with ${recommendation.title}`)
        }
      >
        <Text style={styles.continueButtonText}>
          {recommendation.progress === 0 ? "Start" : "Continue"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <TopBar
        title="Sports"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onSettingsPress={() => router.push("/(tabs)/settings")}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        {(["teams", "matches", "ai-tutoring", "ai-learning"] as const).map(
          (tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { borderBottomColor: colors.primary },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === tab ? colors.primary : colors.textSecondary,
                    fontWeight: activeTab === tab ? "bold" : "normal",
                  },
                ]}
              >
                {tab === "ai-tutoring"
                  ? "AI Tutoring"
                  : tab === "ai-learning"
                    ? "AI Learning"
                    : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      {/* Add Button for Admin */}
      {isAdmin && (activeTab === "teams" || activeTab === "matches") && (
        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setModalType(activeTab === "teams" ? "team" : "match");
              setShowModal(true);
            }}
          >
            <Text style={styles.addButtonText}>
              + Add {activeTab === "teams" ? "Team" : "Match"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === "teams" && (
          <View>
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </View>
        )}

        {activeTab === "matches" && (
          <View>
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </View>
        )}

        {(activeTab === "ai-tutoring" || activeTab === "ai-learning") && (
          <View>
            <View
              style={[
                styles.aiHeader,
                {
                  backgroundColor: colors.surface,
                  marginBottom: 16,
                  padding: 16,
                  borderRadius: 8,
                },
              ]}
            >
              <Text style={[styles.aiWelcome, { color: colors.textPrimary }]}>
                🤖 AI-Powered Sports Learning
              </Text>
              <Text
                style={[styles.aiDescription, { color: colors.textSecondary }]}
              >
                Get personalized recommendations, take quizzes, and track your
                progress with our intelligent tutoring system.
              </Text>
            </View>

            {aiRecommendations
              .filter((rec) =>
                activeTab === "ai-tutoring"
                  ? rec.type === "quiz"
                  : rec.type !== "quiz",
              )
              .map((recommendation) => (
                <AIRecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                />
              ))}
          </View>
        )}
      </ScrollView>

      {/* Add Modal - Basic placeholder */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Add New {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
            </Text>
            <Text
              style={[styles.modalContent, { color: colors.textSecondary }]}
            >
              {modalType === "team"
                ? "Team creation form with sport selection, captain assignment, and member management would be implemented here."
                : "Match scheduling form with team selection, date/time picker, and venue selection would be implemented here."}
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
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
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 12,
    textAlign: "center",
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  teamLogo: {
    fontSize: 32,
    marginRight: 12,
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  teamSport: {
    fontSize: 14,
  },
  teamStats: {
    alignItems: "flex-end",
  },
  winRecord: {
    fontSize: 14,
    fontWeight: "bold",
  },
  teamMetadata: {
    marginBottom: 12,
  },
  teamRole: {
    fontSize: 14,
    marginBottom: 2,
  },
  teamMembers: {
    fontSize: 14,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  matchTeams: {
    flex: 1,
    marginRight: 12,
  },
  teamVs: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  matchLocation: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  matchDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  matchDateTime: {
    fontSize: 12,
  },
  matchScore: {
    fontSize: 16,
    fontWeight: "bold",
  },
  matchNotes: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: "italic",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  viewButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  updateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  aiHeader: {
    marginBottom: 12,
  },
  aiInfo: {
    flex: 1,
    marginRight: 12,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  aiCategory: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  aiDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  progressLabel: {
    fontSize: 12,
  },
  aiType: {
    fontSize: 12,
    fontWeight: "bold",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  continueButton: {
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  aiWelcome: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "80%",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalContent: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
