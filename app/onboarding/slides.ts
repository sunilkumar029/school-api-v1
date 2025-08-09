
export interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  backgroundColor: string;
  backgroundImage: string;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: "1",
    title: "Welcome to VisionariesAI School System",
    subtitle: "Empowering Schools with Smart Management",
    image: "🏫",
    backgroundColor: "#4A90E2",
    backgroundImage: ""
  },
  {
    id: "2",
    title: "Manage Academics Easily",
    subtitle: "Timetables, Exams, Performance, and More",
    image: "📚",
    backgroundColor: "#4A90E2",
    backgroundImage: ""
  },
  {
    id: "3",
    title: "Simplify School Operations",
    subtitle: "HR, Finance, Library, Hostel, Transport",
    image: "⚙️",
    backgroundColor: "#4A90E2",
    backgroundImage: ""
  },
  {
    id: "4",
    title: "Real-time Updates & Notifications",
    subtitle: "Be notified instantly with smart alerts",
    image: "🔔",
    backgroundColor: "#4A90E2",
    backgroundImage: ""
  }
];

export default onboardingSlides;
