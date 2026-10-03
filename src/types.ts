export type SubjectType = 'physics' | 'chemistry' | 'math';

export interface SubjectDurationGoals {
  enabled: boolean;
  physics: number; // minutes
  chemistry: number; // minutes
  math: number; // minutes
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  physics: number;
  chemistry: number;
  math: number;
  durationMinutes?: {
    physics?: number;
    chemistry?: number;
    math?: number;
  };
  notes?: string;
  topics?: {
    physics?: string[];
    chemistry?: string[];
    math?: string[];
  };
  updatedAt: number;
}

export interface SubjectStreakTargets {
  physics: number;
  chemistry: number;
  math: number;
}

export interface SubjectStreakInfo {
  subject: SubjectType;
  currentStreak: number;
  longestStreak: number;
  todayCount: number;
  target: number;
  todayProgress: number; // 0 to 100 percentage
  targetMetToday: boolean;
}

export interface SubjectStreaks {
  physics: SubjectStreakInfo;
  chemistry: SubjectStreakInfo;
  math: SubjectStreakInfo;
}

export interface DailyGoals {
  physics: number;
  chemistry: number;
  math: number;
  total: number;
  streakTarget: number; // minimum questions in a day to maintain streak
  subjectStreakTargets?: SubjectStreakTargets;
  duration?: SubjectDurationGoals;
}

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'apex';

export interface UserBadge {
  id: string;
  title: string;
  description: string;
  category: 'streak' | 'volume' | 'balance' | 'milestone' | 'subject' | 'discipline';
  icon: string;
  tier?: BadgeTier;
  requirement: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  hint?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // HH:MM
  missedSessionAlert: boolean;
  missedSessionCutoff: string; // HH:MM
  soundEnabled: boolean;
  browserPermission: 'default' | 'granted' | 'denied';
}

export interface UserProfile {
  username: string;
  avatarSeed: string;
  syncCode: string;
}

export interface ChapterItem {
  id: string;
  name: string;
  isCompleted: boolean;
  completedAt?: string; // YYYY-MM-DD
  notes?: string;
}

export interface SubjectBook {
  id: string;
  title: string;
  author?: string;
  subject: SubjectType;
  chapters: ChapterItem[];
  targetDate?: string;
  notes?: string;
  createdAt: number;
}

export interface AppStateData {
  records: Record<string, DailyRecord>; // keyed by YYYY-MM-DD
  goals: DailyGoals;
  profile: UserProfile;
  notifications: NotificationSettings;
  books?: SubjectBook[];
  tests?: JeeTest[];
  testAttempts?: TestAttemptResult[];
  lastUpdated: number;
}

export interface LeaderboardStudent {
  id: string;
  username: string;
  avatar: string;
  weeklyQuestions: number;
  monthlyQuestions: number;
  totalQuestions: number;
  currentStreak: number;
  badgesCount: number;
  favoriteSubject: SubjectType;
  lastActive: string;
  isCurrentUser?: boolean;
  rank?: number;
}

export interface SubjectStats {
  physics: number;
  chemistry: number;
  math: number;
  total: number;
}

export interface AnalyticsSummary {
  today: SubjectStats;
  thisWeek: SubjectStats;
  thisMonth: SubjectStats;
  allTime: SubjectStats;
  currentStreak: number;
  longestStreak: number;
  subjectStreaks: SubjectStreaks;
  totalDaysLogged: number;
  dailyAverage: number;
  peakDay: {
    date: string;
    total: number;
  } | null;
  favoriteSubject: SubjectType;
  todayGoalMet: boolean;
  streakTargetMet: boolean;
}

export interface SolvedQuestionLap {
  questionNumber: number;
  durationSeconds: number;
  subject: SubjectType;
  timestamp: number;
}

export interface QuestionTimerState {
  subject: SubjectType;
  currentQuestionNumber: number;
  questionSeconds: number;
  totalSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  laps: SolvedQuestionLap[];
  isFloating: boolean;
  mode?: 'stopwatch' | 'timer';
  targetSecondsPerQuestion?: number; // e.g. 120s (2 min/question)
  aimedQuestions?: number; // Target number of questions to aim for in this session
  sessionTargetSeconds?: number; // e.g. 1800 (30m), 2700 (45m), 3600 (1h), 6300 (1h 45m), 7200 (2h), 9000 (2.5h)
}

// JEE Test & CBT Interfaces
export interface TestOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface TestQuestion {
  id: string;
  questionNumber: number;
  subject: SubjectType;
  questionText: string;
  type: 'single_choice' | 'numerical';
  options?: TestOption[];
  correctAnswer: string; // 'A' | 'B' | 'C' | 'D' or numerical string like '4.5'
  solution?: string;
  marks: number; // default +4
  negativeMarks: number; // default 1
  difficulty?: 'easy' | 'moderate' | 'hard';
  topic?: string;
}

export interface JeeTest {
  id: string;
  title: string;
  description?: string;
  subject: SubjectType | 'pcm';
  durationMinutes: number;
  totalQuestions: number;
  questions: TestQuestion[];
  sourcePdfName?: string;
  createdAt: number;
}

export type QuestionCbtStatus =
  | 'not_visited'
  | 'not_answered'
  | 'answered'
  | 'marked_for_review'
  | 'answered_and_marked';

export interface StudentAnswer {
  questionId: string;
  selectedOption?: string;
  numericalAnswer?: string;
  status: QuestionCbtStatus;
  timeSpentSeconds: number;
}

export interface SubjectAttemptBreakdown {
  score: number;
  maxScore: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number; // percentage
}

export interface AiTestAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  negativeMarksPenalty: number;
  actionableTips: string[];
  predictedPercentile: string;
}

export interface TestAttemptResult {
  id: string;
  testId: string;
  testTitle: string;
  timestamp: number;
  durationMinutes: number;
  timeTakenSeconds: number;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  accuracy: number;
  subjectBreakdown: Record<SubjectType, SubjectAttemptBreakdown>;
  answers: Record<string, StudentAnswer>;
  aiAnalysis?: AiTestAnalysis;
}

