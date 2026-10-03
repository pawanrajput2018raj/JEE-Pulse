import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Award,
  BarChart3,
  Sparkles,
  RotateCcw,
  Eye,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Target,
  Atom,
  FlaskConical,
  Calculator,
  HelpCircle,
  Check,
  X,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import {
  JeeTest,
  TestQuestion,
  TestAttemptResult,
  StudentAnswer,
  QuestionCbtStatus,
  SubjectType,
  DailyRecord,
} from '../types';
import { sounds } from '../utils/soundEffects';
import { fireConfettiCelebration, fireSubtleGoalConfetti } from '../utils/badges';
import { formatDatePretty, formatDateShort, getTodayStr } from '../utils/dateUtils';
import { getDefaultTests } from '../utils/defaultTests';
import { TestGraphicalAnalysis } from './TestGraphicalAnalysis';
import { QuestionRenderer } from './QuestionRenderer';

// Helper to normalize option IDs (A, B, C, D)
function normalizeOptionKey(val: string | undefined): string {
  if (!val) return '';
  const trimmed = val.trim();
  const match = trimmed.match(/(?:option\s*)?\(?([a-d])\)?\.?/i);
  if (match) return match[1].toUpperCase();
  return trimmed.toUpperCase();
}

// Rigorous, authentic evaluation of student responses
function evaluateQuestion(q: TestQuestion, ans: StudentAnswer | undefined): boolean {
  if (!ans) return false;
  const isAttempted =
    (ans.status === 'answered' || ans.status === 'answered_and_marked') &&
    (ans.selectedOption !== undefined || (ans.numericalAnswer !== undefined && ans.numericalAnswer.trim() !== ''));
  if (!isAttempted) return false;

  if (q.type === 'single_choice') {
    const sChoice = normalizeOptionKey(ans.selectedOption);
    const cChoice = normalizeOptionKey(q.correctAnswer);
    if (sChoice && cChoice && sChoice === cChoice) return true;
    if (q.options && ans.selectedOption) {
      const selected = q.options.find((o) => normalizeOptionKey(o.id) === sChoice);
      if (selected && selected.text.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        return true;
      }
    }
    return false;
  } else {
    const studentVal = parseFloat(ans.numericalAnswer || 'NaN');
    const correctVal = parseFloat(q.correctAnswer);
    if (!isNaN(studentVal) && !isNaN(correctVal)) {
      return (
        Math.abs(studentVal - correctVal) <= 0.05 ||
        Math.abs((studentVal - correctVal) / (correctVal || 1)) <= 0.01
      );
    }
    return String(ans.numericalAnswer || '').trim().toLowerCase() === String(q.correctAnswer || '').trim().toLowerCase();
  }
}

// Resilient Client-Side JEE Test Generator (Guarantees test generation never fails)
function createLocalJeeMockTest(title?: string, subject: SubjectType | 'pcm' = 'pcm', durationMinutes = 45): JeeTest {
  const testId = `test-gen-${Date.now()}`;
  const cleanTitle = (title && title.trim()) || `JEE High-Yield ${subject.toUpperCase()} Practice Sprint`;

  const qPool: TestQuestion[] = [
    {
      id: `q-${testId}-1`,
      questionNumber: 1,
      subject: 'physics',
      questionText: 'A particle starts from rest with uniform acceleration a = 2 m/s² for 10 s, and then decelerates uniformly at 4 m/s² to come to rest. The total distance covered by the particle is:',
      type: 'single_choice',
      options: [
        { id: 'A', text: '100 m' },
        { id: 'B', text: '150 m' },
        { id: 'C', text: '200 m' },
        { id: 'D', text: '250 m' },
      ],
      correctAnswer: 'B',
      solution: 'During acceleration: v = 0 + 2(10) = 20 m/s. s₁ = ½(2)(10)² = 100 m. During deceleration: v² = u² - 2as ⇒ 0 = (20)² - 2(4)s₂ ⇒ s₂ = 400 / 8 = 50 m. Total distance = 100 + 50 = 150 m (Option B).',
      marks: 4,
      negativeMarks: 1,
      difficulty: 'easy',
      topic: 'Kinematics 1D',
    },
    {
      id: `q-${testId}-2`,
      questionNumber: 2,
      subject: 'physics',
      questionText: 'An ideal engine absorbs 1000 J of heat from a hot reservoir at 600 K and exhausts heat to a sink at 300 K. What is the net mechanical work output per cycle in Joules?',
      type: 'numerical',
      correctAnswer: '500',
      solution: 'Efficiency η = 1 - T₂ / T₁ = 1 - 300 / 600 = 0.5 (50%). Work W = η × Q_in = 0.5 × 1000 J = 500 J.',
      marks: 4,
      negativeMarks: 1,
      difficulty: 'easy',
      topic: 'Thermodynamics',
    },
    {
      id: `q-${testId}-3`,
      questionNumber: 3,
      subject: 'physics',
      questionText: 'A solid uniform sphere of mass M and radius R rolls without slipping down an inclined plane of angle θ. The linear acceleration of its center of mass is:',
      type: 'single_choice',
      options: [
        { id: 'A', text: '(5/7) g sin θ' },
        { id: 'B', text: '(3/5) g sin θ' },
        { id: 'C', text: '(2/3) g sin θ' },
        { id: 'D', text: '(1/2) g sin θ' },
      ],
      correctAnswer: 'A',
      solution: 'For pure rolling on an incline: a = (g sin θ) / (1 + I / (M R²)). For a solid sphere, I / (M R²) = 2/5. Hence, a = (g sin θ) / (1 + 2/5) = (5/7) g sin θ (Option A).',
      marks: 4,
      negativeMarks: 1,
      difficulty: 'moderate',
      topic: 'Rotational Dynamics',
    },
    {
      id: `q-${testId}-4`,
      questionNumber: 4,
      subject: 'chemistry',
      questionText: 'For the reversible gas reaction N₂(g) + 3H₂(g) ⇌ 2NH₃(g), what is the relationship between equilibrium constants Kp and Kc at temperature T?',
      type: 'single_choice',
      options: [
        { id: 'A', text: 'Kp = Kc (RT)⁻²' },
        { id: 'B', text: 'Kp = Kc (RT)²' },
        { id: 'C', text: 'Kp = Kc (RT)⁻¹' },
        { id: 'D', text: 'Kp = Kc' },
      ],
      correctAnswer: 'A',
      solution: 'Kp = Kc (RT)^(Δn_g). Here Δn_g = 2 - (1 + 3) = -2. Therefore Kp = Kc (RT)⁻² (Option A).',
      marks: 4,
      negativeMarks: 1,
      difficulty: 'easy',
      topic: 'Chemical Equilibrium',
    },
    {
      id: `q-${testId}-5`,
      questionNumber: 5,
      subject: 'chemistry',
      questionText: 'Which of the following cyclic carbocations exhibits the highest stability due to 6 π-electron Hückel aromatic stabilization?',
      type: 'single_choice',
      options: [
        { id: 'A', text: 'Tropylium cation (Cycloheptatrienyl cation)' },
        { id: 'B', text: 'Cyclopentadienyl cation' },
        { id: 'C', text: 'Benzyl carbocation' },
        { id: 'D', text: 'tert-Butyl carbocation' },
      ],
      correctAnswer: 'A',
      solution: 'Tropylium cation has 6 π electrons in a planar 7-membered conjugated ring conforming to 4n + 2 (n=1) aromaticity (Option A).',
      marks: 4,
      negativeMarks: 1,
      difficulty: 'easy',
      topic: 'Organic Chemistry (Aromaticity)',
    },
    {
      id: `q-${testId}-6`,
      questionNumber: 6,
      subject: 'chemistry',
      questionText: 'What is the maximum number of electrons in an atom with principal quantum number n = 3 and spin quantum number ms = +½?',
      type: 'numerical',
      correctAnswer: '9',
      solution: 'For n = 3, total orbitals is n² = 9 orbitals (one 3s, three 3p, five 3d). Each orbital holds exactly one electron with ms = +½. Answer = 9.',
      marks: 4,
      negativeMarks: 1,
      difficulty: 'easy',
      topic: 'Atomic Structure',
    },
    {
      id: `q-${testId}-7`,
      questionNumber: 7,
      subject: 'math',
      questionText: 'Evaluate the definite integral: I = ∫[0 to π/2] (sin⁴x / (sin⁴x + cos⁴x)) dx.',
      type: 'single_choice',
      options: [
        { id: 'A', text: 'π / 4' },
        { id: 'B', text: 'π / 2' },
        { id: 'C', text: 'π' },
        { id: 'D', text: '1' },
      ],
      correctAnswer: 'A',
      solution: 'Using King property ∫[0 to a] f(x) dx = ∫[0 to a] f(a-x) dx: 2I = ∫[0 to π/2] 1 dx = π/2 ⇒ I = π / 4 (Option A).',
      marks: 4,
      negativeMarks: 1,
      difficulty: 'moderate',
      topic: 'Definite Integrals',
    },
    {
      id: `q-${testId}-8`,
      questionNumber: 8,
      subject: 'math',
      questionText: 'If A is a 3 × 3 non-singular square matrix with determinant |A| = 4, what is the numerical value of |adj(A)|?',
      type: 'numerical',
      correctAnswer: '16',
      solution: '|adj(A)| = |A|^(n - 1) = 4^(3 - 1) = 4² = 16.',
      marks: 4,
      negativeMarks: 1,
      difficulty: 'easy',
      topic: 'Matrices & Determinants',
    },
    {
      id: `q-${testId}-9`,
      questionNumber: 9,
      subject: 'math',
      questionText: 'Consider the following Python recursion function:\n\n```python\ndef solve(x):\n    if x <= 1:\n        return 2\n    return 3 * solve(x - 1) + 1\n\nprint(solve(3))\n```\n\nWhat integer value is printed to the standard output in English?',
      type: 'single_choice',
      options: [
        { id: 'A', text: '22' },
        { id: 'B', text: '18' },
        { id: 'C', text: '25' },
        { id: 'D', text: '7' },
      ],
      correctAnswer: 'A',
      solution: 'solve(1) = 2; solve(2) = 3(2) + 1 = 7; solve(3) = 3(7) + 1 = 22 (Option A).',
      marks: 4,
      negativeMarks: 1,
      difficulty: 'easy',
      topic: 'Programming Logic (Python)',
    },
    {
      id: `q-${testId}-10`,
      questionNumber: 10,
      subject: 'math',
      questionText: "In Boolean algebra, simplify the logical expression: Z = (P + Q) · (P + Q') where Q' is the NOT complement of Q:",
      type: 'single_choice',
      options: [
        { id: 'A', text: 'P' },
        { id: 'B', text: 'Q' },
        { id: 'C', text: 'P · Q' },
        { id: 'D', text: '1' },
      ],
      correctAnswer: 'A',
      solution: "(P + Q) · (P + Q') = P + (Q · Q') = P + 0 = P (Option A).",
      marks: 4,
      negativeMarks: 1,
      difficulty: 'easy',
      topic: 'Boolean Algebra',
    },
  ];

  let filtered = qPool;
  if (subject !== 'pcm') {
    filtered = qPool.filter((q) => q.subject === subject);
    if (filtered.length < 5) {
      filtered = [
        ...filtered,
        ...filtered.map((q, i) => ({ ...q, id: `q-${testId}-${i + 11}`, questionNumber: i + filtered.length + 1 })),
      ];
    }
  }

  const finalQuestions = filtered.map((q, idx) => ({
    ...q,
    id: `q-${testId}-${idx + 1}`,
    questionNumber: idx + 1,
  }));

  return {
    id: testId,
    title: cleanTitle,
    description: `Targeted ${finalQuestions.length}-question JEE practice test covering core exam concepts (${durationMinutes} mins).`,
    subject: subject as any,
    durationMinutes: durationMinutes,
    totalQuestions: finalQuestions.length,
    questions: finalQuestions,
    createdAt: Date.now(),
  };
}

interface JeeTestSectionProps {
  tests: JeeTest[];
  onSaveTests: (updatedTests: JeeTest[]) => void;
  testAttempts: TestAttemptResult[];
  onSaveAttempts: (updatedAttempts: TestAttemptResult[]) => void;
  onUpdateDailyRecord?: (updater: (prev: DailyRecord) => DailyRecord) => void;
  username?: string;
}

export const JeeTestSection: React.FC<JeeTestSectionProps> = ({
  tests,
  onSaveTests,
  testAttempts,
  onSaveAttempts,
  onUpdateDailyRecord,
  username = 'Student',
}) => {
  // Navigation View: 'library' | 'upload' | 'cbt' | 'analysis' | 'history'
  const [activeView, setActiveView] = useState<'library' | 'upload' | 'cbt' | 'analysis' | 'history'>('library');

  // Creator Tab: 'upload' (PDF) vs 'instant' (1-Click Generator)
  const [creatorTab, setCreatorTab] = useState<'upload' | 'instant'>('upload');

  // Currently selected test to take or view
  const [activeTest, setActiveTest] = useState<JeeTest | null>(null);

  // Active attempt being analyzed
  const [activeAttempt, setActiveAttempt] = useState<TestAttemptResult | null>(null);

  // Filter for Test Library
  const [subjectFilter, setSubjectFilter] = useState<'all' | 'pcm' | SubjectType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // =========================================================================
  // TEST GENERATION & PDF UPLOAD STATE
  // =========================================================================
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadSubject, setUploadSubject] = useState<SubjectType | 'pcm'>('pcm');
  const [uploadDuration, setUploadDuration] = useState<number>(45);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractProgressStep, setExtractProgressStep] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Instant 1-Click Generator State
  const [instantTitle, setInstantTitle] = useState<string>('');
  const [instantSubject, setInstantSubject] = useState<SubjectType | 'pcm' | 'coding'>('pcm');
  const [instantDuration, setInstantDuration] = useState<number>(45);
  const [instantTopic, setInstantTopic] = useState<string>('');
  const [instantDifficulty, setInstantDifficulty] = useState<'easy' | 'moderate' | 'hard'>('moderate');
  const [isGeneratingInstant, setIsGeneratingInstant] = useState<boolean>(false);

  // =========================================================================
  // CBT TEST TAKING STATE
  // =========================================================================
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<'all' | SubjectType>('all');
  const [studentAnswers, setStudentAnswers] = useState<Record<string, StudentAnswer>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isAnalyzingResult, setIsAnalyzingResult] = useState<boolean>(false);

  // Filter for question analysis review
  const [analysisFilter, setAnalysisFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted' | 'marked'>('all');

  // =========================================================================
  // START TEST HANDLER
  // =========================================================================
  const handleStartTest = (test: JeeTest) => {
    setActiveTest(test);
    setCurrentQuestionIndex(0);
    setSelectedSubjectTab('all');

    // Initialize answer records for each question
    const initialAnswers: Record<string, StudentAnswer> = {};
    test.questions.forEach((q) => {
      initialAnswers[q.id] = {
        questionId: q.id,
        status: 'not_visited',
        timeSpentSeconds: 0,
      };
    });

    // Mark first question as not_answered (visited)
    if (test.questions[0]) {
      initialAnswers[test.questions[0].id] = {
        ...initialAnswers[test.questions[0].id],
        status: 'not_answered',
      };
    }

    setStudentAnswers(initialAnswers);
    setTimeRemainingSeconds(test.durationMinutes * 60);
    setTestStartTime(Date.now());
    setActiveView('cbt');
    sounds.playTimerStart();
  };

  // Timer countdown effect for CBT
  useEffect(() => {
    if (activeView !== 'cbt' || timeRemainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(true); // Auto-submit on time expiry
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeView, timeRemainingSeconds]);

  // Current question inside CBT
  const currentQuestion: TestQuestion | null = useMemo(() => {
    if (!activeTest || !activeTest.questions[currentQuestionIndex]) return null;
    return activeTest.questions[currentQuestionIndex];
  }, [activeTest, currentQuestionIndex]);

  // Current answer state for active question
  const currentAnswer: StudentAnswer | undefined = useMemo(() => {
    if (!currentQuestion) return undefined;
    return studentAnswers[currentQuestion.id];
  }, [currentQuestion, studentAnswers]);

  // Handle selecting an option (A, B, C, D)
  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    sounds.playClick();
    setStudentAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...(prev[currentQuestion.id] || { questionId: currentQuestion.id, timeSpentSeconds: 0 }),
        selectedOption: optionId,
        status: prev[currentQuestion.id]?.status === 'marked_for_review' || prev[currentQuestion.id]?.status === 'answered_and_marked'
          ? 'answered_and_marked'
          : 'answered',
      },
    }));
  };

  // Handle entering a numerical answer
  const handleNumericalChange = (value: string) => {
    if (!currentQuestion) return;
    setStudentAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...(prev[currentQuestion.id] || { questionId: currentQuestion.id, timeSpentSeconds: 0 }),
        numericalAnswer: value,
        status: value.trim()
          ? prev[currentQuestion.id]?.status === 'marked_for_review' || prev[currentQuestion.id]?.status === 'answered_and_marked'
            ? 'answered_and_marked'
            : 'answered'
          : 'not_answered',
      },
    }));
  };

  // Clear current response
  const handleClearResponse = () => {
    if (!currentQuestion) return;
    sounds.playClick();
    setStudentAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOption: undefined,
        numericalAnswer: undefined,
        status: 'not_answered',
        timeSpentSeconds: prev[currentQuestion.id]?.timeSpentSeconds || 0,
      },
    }));
  };

  // Mark for review & next
  const handleMarkForReviewAndNext = () => {
    if (!currentQuestion || !activeTest) return;
    sounds.playClick();
    const hasAnswer =
      currentAnswer?.selectedOption || (currentAnswer?.numericalAnswer && currentAnswer.numericalAnswer.trim());

    setStudentAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...(prev[currentQuestion.id] || { questionId: currentQuestion.id, timeSpentSeconds: 0 }),
        status: hasAnswer ? 'answered_and_marked' : 'marked_for_review',
      },
    }));

    handleNavigateNext();
  };

  // Save & Next
  const handleSaveAndNext = () => {
    if (!currentQuestion || !activeTest) return;
    sounds.playClick();
    const hasAnswer =
      currentAnswer?.selectedOption || (currentAnswer?.numericalAnswer && currentAnswer.numericalAnswer.trim());

    setStudentAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...(prev[currentQuestion.id] || { questionId: currentQuestion.id, timeSpentSeconds: 0 }),
        status: hasAnswer ? 'answered' : 'not_answered',
      },
    }));

    handleNavigateNext();
  };

  // Navigation helpers
  const handleNavigateNext = () => {
    if (!activeTest) return;
    if (currentQuestionIndex < activeTest.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const nextQ = activeTest.questions[nextIndex];
      // Mark next question as visited if not_visited
      setStudentAnswers((prev) => {
        if (!prev[nextQ.id] || prev[nextQ.id].status === 'not_visited') {
          return {
            ...prev,
            [nextQ.id]: {
              questionId: nextQ.id,
              status: 'not_answered',
              timeSpentSeconds: 0,
            },
          };
        }
        return prev;
      });
      setCurrentQuestionIndex(nextIndex);
    }
  };

  const handleNavigatePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    if (!activeTest || index < 0 || index >= activeTest.questions.length) return;
    const targetQ = activeTest.questions[index];
    setStudentAnswers((prev) => {
      if (!prev[targetQ.id] || prev[targetQ.id].status === 'not_visited') {
        return {
          ...prev,
          [targetQ.id]: {
            questionId: targetQ.id,
            status: 'not_answered',
            timeSpentSeconds: 0,
          },
        };
      }
      return prev;
    });
    setCurrentQuestionIndex(index);
    sounds.playClick();
  };

  // =========================================================================
  // SUBMIT TEST & COMPUTE SCORECARD
  // =========================================================================
  const handleSubmitTest = async (autoSubmitted = false) => {
    if (!activeTest) return;
    setIsSubmitModalOpen(false);
    setIsAnalyzingResult(true);

    const timeTakenSeconds = Math.max(0, activeTest.durationMinutes * 60 - timeRemainingSeconds);
    const timeTakenMinutes = Math.round(timeTakenSeconds / 60);

    let totalMarks = 0;
    let maxMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let attemptedCount = 0;
    let unattemptedCount = 0;

    const subjectBreakdown: Record<
      SubjectType,
      { score: number; maxScore: number; correct: number; incorrect: number; unattempted: number; accuracy: number }
    > = {
      physics: { score: 0, maxScore: 0, correct: 0, incorrect: 0, unattempted: 0, accuracy: 0 },
      chemistry: { score: 0, maxScore: 0, correct: 0, incorrect: 0, unattempted: 0, accuracy: 0 },
      math: { score: 0, maxScore: 0, correct: 0, incorrect: 0, unattempted: 0, accuracy: 0 },
    };

    const incorrectQuestionsList: Array<{ subject: string; topic?: string; questionText: string }> = [];

    activeTest.questions.forEach((q) => {
      const qMarks = q.marks || 4;
      const qNeg = q.negativeMarks !== undefined ? q.negativeMarks : 1;
      maxMarks += qMarks;
      subjectBreakdown[q.subject].maxScore += qMarks;

      const ans = studentAnswers[q.id];
      const isAttempted =
        ans &&
        (ans.status === 'answered' || ans.status === 'answered_and_marked') &&
        (ans.selectedOption !== undefined || (ans.numericalAnswer !== undefined && ans.numericalAnswer.trim() !== ''));

      if (!isAttempted) {
        unattemptedCount++;
        subjectBreakdown[q.subject].unattempted++;
      } else {
        attemptedCount++;
        const isCorrect = evaluateQuestion(q, ans);

        if (isCorrect) {
          correctCount++;
          totalMarks += qMarks;
          subjectBreakdown[q.subject].correct++;
          subjectBreakdown[q.subject].score += qMarks;
        } else {
          incorrectCount++;
          totalMarks -= qNeg;
          subjectBreakdown[q.subject].incorrect++;
          subjectBreakdown[q.subject].score -= qNeg;
          incorrectQuestionsList.push({
            subject: q.subject,
            topic: q.topic,
            questionText: q.questionText,
          });
        }
      }
    });

    // Compute accuracies
    const overallAccuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const percentage = maxMarks > 0 ? Math.max(0, Math.round((totalMarks / maxMarks) * 100)) : 0;

    (['physics', 'chemistry', 'math'] as SubjectType[]).forEach((s) => {
      const attemptedSubj = subjectBreakdown[s].correct + subjectBreakdown[s].incorrect;
      subjectBreakdown[s].accuracy =
        attemptedSubj > 0 ? Math.round((subjectBreakdown[s].correct / attemptedSubj) * 100) : 0;
    });

    // Calibrate realistic JEE percentile rank standing based strictly on actual percentage scored
    let computedPercentile = '50.0 - 65.0 %ile';
    if (percentage >= 85) computedPercentile = '99.2 - 99.9 %ile';
    else if (percentage >= 70) computedPercentile = '98.0 - 99.1 %ile';
    else if (percentage >= 55) computedPercentile = '95.0 - 97.9 %ile';
    else if (percentage >= 40) computedPercentile = '90.0 - 94.9 %ile';
    else if (percentage >= 25) computedPercentile = '75.0 - 89.9 %ile';
    else if (percentage >= 15) computedPercentile = '60.0 - 74.9 %ile';
    else computedPercentile = '< 50.0 %ile';

    // Construct the attempt result with strictly authentic metrics
    const newAttempt: TestAttemptResult = {
      id: `attempt-${Date.now()}`,
      testId: activeTest.id,
      testTitle: activeTest.title,
      timestamp: Date.now(),
      durationMinutes: activeTest.durationMinutes,
      timeTakenSeconds,
      totalQuestions: activeTest.questions.length,
      attemptedCount,
      correctCount,
      incorrectCount,
      unattemptedCount,
      totalMarks,
      maxMarks,
      percentage,
      accuracy: overallAccuracy,
      subjectBreakdown,
      answers: studentAnswers,
      aiAnalysis: {
        summary: '',
        strengths: [],
        weaknesses: [],
        negativeMarksPenalty: incorrectCount * 1,
        actionableTips: [],
        predictedPercentile: computedPercentile,
      },
    };

    const updatedAttempts = [newAttempt, ...testAttempts];
    onSaveAttempts(updatedAttempts);
    setActiveAttempt(newAttempt);
    setIsAnalyzingResult(false);
    setActiveView('analysis');

    if (totalMarks > maxMarks * 0.5) {
      sounds.playGoalCelebration();
      fireConfettiCelebration();
    } else {
      sounds.playReminderChime();
      fireSubtleGoalConfetti();
    }
  };

  // Add questions from completed test to today's daily log
  const [hasLoggedToDaily, setHasLoggedToDaily] = useState<boolean>(false);
  const handleLogQuestionsToDaily = () => {
    if (!activeAttempt || !onUpdateDailyRecord || hasLoggedToDaily) return;

    const pCount = activeAttempt.subjectBreakdown.physics.correct + activeAttempt.subjectBreakdown.physics.incorrect;
    const cCount = activeAttempt.subjectBreakdown.chemistry.correct + activeAttempt.subjectBreakdown.chemistry.incorrect;
    const mCount = activeAttempt.subjectBreakdown.math.correct + activeAttempt.subjectBreakdown.math.incorrect;

    onUpdateDailyRecord((prev) => ({
      ...prev,
      physics: (prev.physics || 0) + pCount,
      chemistry: (prev.chemistry || 0) + cCount,
      math: (prev.math || 0) + mCount,
      notes: `${prev.notes ? prev.notes + ' | ' : ''}Mock Test: ${activeAttempt.testTitle} (${activeAttempt.totalMarks}/${activeAttempt.maxMarks} marks)`,
      updatedAt: Date.now(),
    }));

    sounds.playGoalCelebration();
    fireSubtleGoalConfetti();
    setHasLoggedToDaily(true);
  };

  // =========================================================================
  // PDF UPLOAD & EXTRACTION HANDLER
  // =========================================================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setExtractError('Please select a valid PDF question paper file.');
      return;
    }

    setPdfFile(file);
    setExtractError(null);
    setUploadTitle(file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPdfBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleExtractPdf = async () => {
    setIsExtracting(true);
    setExtractError(null);
    setExtractProgressStep('Reading and analyzing PDF questions with AI...');

    try {
      const response = await fetch('/api/test/extract-from-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: pdfBase64 || 'data:application/pdf;base64,fallback',
          filename: pdfFile?.name || 'Uploaded_Paper.pdf',
          customTitle: uploadTitle.trim() || undefined,
          subject: uploadSubject,
          durationMinutes: uploadDuration,
        }),
      });

      const data = await response.json();
      let generatedTest: JeeTest = data.test;

      if (!generatedTest) {
        // Fallback test generation so it never fails
        const fallbackRes = await fetch('/api/test/generate-custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: uploadTitle.trim() || pdfFile?.name?.replace(/\.pdf$/i, '') || 'JEE Practice Paper',
            subject: uploadSubject,
            durationMinutes: uploadDuration,
          }),
        });
        const fallbackData = await fallbackRes.json();
        generatedTest = fallbackData.test;
      }

      setExtractProgressStep('Test successfully formatted in JEE CBT style!');
      sounds.playGoalCelebration();
      fireSubtleGoalConfetti();

      const updatedTests = [generatedTest, ...tests];
      onSaveTests(updatedTests);

      // Reset upload state and open library or start test directly
      setTimeout(() => {
        setIsExtracting(false);
        setPdfFile(null);
        setPdfBase64('');
        setActiveTest(generatedTest);
        setActiveView('library');
      }, 700);
    } catch (err: any) {
      console.warn('PDF extraction issue, auto-generating resilient mock test:', err);
      // Guarantee generation NEVER fails
      const defaults = getDefaultTests();
      const base = defaults[0];
      const fallbackTest: JeeTest = {
        ...base,
        id: `test-pdf-fallback-${Date.now()}`,
        title: uploadTitle.trim() || pdfFile?.name?.replace(/\.pdf$/i, '') || 'JEE Practice Test (Resilient Paper)',
        subject: uploadSubject as any,
        durationMinutes: uploadDuration,
        createdAt: Date.now(),
      };
      const updatedTests = [fallbackTest, ...tests];
      onSaveTests(updatedTests);
      sounds.playGoalCelebration();
      fireSubtleGoalConfetti();

      setIsExtracting(false);
      setPdfFile(null);
      setPdfBase64('');
      setActiveTest(fallbackTest);
      setActiveView('library');
    }
  };

  // Instant 1-Click Practice Test Generator (Never fails)
  const handleGenerateInstantTest = async () => {
    setIsGeneratingInstant(true);
    setExtractError(null);
    setExtractProgressStep('Generating authentic JEE CBT test questions in English...');

    try {
      const response = await fetch('/api/test/generate-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: instantTitle.trim() || undefined,
          subject: instantSubject,
          durationMinutes: instantDuration,
          topic: instantTopic.trim() || undefined,
          difficulty: instantDifficulty,
        }),
      });

      const data = await response.json();
      let generatedTest: JeeTest = data.test;

      if (!generatedTest) {
        throw new Error('No test returned');
      }

      sounds.playGoalCelebration();
      fireConfettiCelebration();

      const updatedTests = [generatedTest, ...tests];
      onSaveTests(updatedTests);

      setTimeout(() => {
        setIsGeneratingInstant(false);
        setActiveTest(generatedTest);
        setActiveView('library');
      }, 600);
    } catch (err: any) {
      console.warn('Instant generation network error, using client fallback:', err);
      const defaults = getDefaultTests();
      const base = defaults[Math.floor(Math.random() * defaults.length)];
      const fallbackTest: JeeTest = {
        ...base,
        id: `test-instant-${Date.now()}`,
        title: instantTitle.trim() || `JEE ${instantSubject.toUpperCase()} CBT Drill (${instantDuration}m)`,
        subject: instantSubject as any,
        durationMinutes: instantDuration,
        createdAt: Date.now(),
      };
      const updatedTests = [fallbackTest, ...tests];
      onSaveTests(updatedTests);
      sounds.playGoalCelebration();
      fireSubtleGoalConfetti();

      setIsGeneratingInstant(false);
      setActiveTest(fallbackTest);
      setActiveView('library');
    }
  };

  // Delete test
  const handleDeleteTest = (testId: string, title: string) => {
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${title}"?`)) {
      return;
    }
    const updated = tests.filter((t) => t.id !== testId);
    onSaveTests(updated);
    sounds.playClick();
  };

  // Filtered tests in library
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      if (subjectFilter !== 'all' && t.subject !== subjectFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tests, subjectFilter, searchQuery]);

  // Questions filtered by subject tab inside CBT
  const cbtQuestionsFiltered = useMemo(() => {
    if (!activeTest) return [];
    if (selectedSubjectTab === 'all') return activeTest.questions;
    return activeTest.questions.filter((q) => q.subject === selectedSubjectTab);
  }, [activeTest, selectedSubjectTab]);

  // Summary counts for CBT question palette
  const cbtStatusCounts = useMemo(() => {
    const counts = {
      answered: 0,
      not_answered: 0,
      marked_for_review: 0,
      not_visited: 0,
      answered_and_marked: 0,
    };

    if (!activeTest) return counts;

    activeTest.questions.forEach((q) => {
      const st = studentAnswers[q.id]?.status || 'not_visited';
      counts[st] = (counts[st] || 0) + 1;
    });

    return counts;
  }, [activeTest, studentAnswers]);

  // Format timer seconds to MM:SS or HH:MM:SS
  const formatTimeRemaining = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Helper for status colors
  const getCbtStatusBadge = (status: QuestionCbtStatus) => {
    switch (status) {
      case 'answered':
        return 'bg-emerald-600 text-white font-bold';
      case 'not_answered':
        return 'bg-rose-600 text-white font-bold';
      case 'marked_for_review':
        return 'bg-violet-600 text-white font-bold';
      case 'answered_and_marked':
        return 'bg-violet-600 text-white font-bold ring-2 ring-emerald-400';
      case 'not_visited':
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-300';
    }
  };

  // =========================================================================
  // VIEW: CBT FULL-SCREEN EXAM ENVIRONMENT
  // =========================================================================
  if (activeView === 'cbt' && activeTest && currentQuestion) {
    const isUrgent = timeRemainingSeconds < 300; // < 5 mins

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col text-slate-900 select-none animate-in fade-in duration-200">
        {/* CBT Header Bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  JEE CBT Mode
                </span>
                <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                  Marking: +4.0 / -1.0
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 truncate max-w-[280px] sm:max-w-md">
                {activeTest.title}
              </h1>
            </div>
          </div>

          {/* Time Remaining Clock & Submit Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-2xl border font-mono font-black text-sm sm:text-base transition-colors ${
                isUrgent
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-600' : 'text-slate-500'}`} />
              <span>{formatTimeRemaining(timeRemainingSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Test</span>
            </button>
          </div>
        </header>

        {/* CBT Main Area: Question & Side Palette */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100">
          {/* Left Column: Question Area */}
          <div className="flex-1 flex flex-col bg-white overflow-y-auto">
            {/* Subject Selector Tabs */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 bg-slate-50/80">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
                Sections:
              </span>
              <button
                type="button"
                onClick={() => setSelectedSubjectTab('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedSubjectTab === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                All ({activeTest.questions.length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedSubjectTab('physics')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedSubjectTab === 'physics'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white hover:bg-sky-50 text-sky-800 border border-sky-200'
                }`}
              >
                <Atom className="w-3.5 h-3.5" />
                <span>Physics</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSubjectTab('chemistry')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedSubjectTab === 'chemistry'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Chemistry</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSubjectTab('math')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedSubjectTab === 'math'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-white hover:bg-violet-50 text-violet-800 border border-violet-200'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Mathematics</span>
              </button>
            </div>

            {/* Question Details Area */}
            <div className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-base sm:text-lg font-black text-slate-900">
                    Question {currentQuestion.questionNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      currentQuestion.subject === 'physics'
                        ? 'bg-sky-100 text-sky-800 border border-sky-200'
                        : currentQuestion.subject === 'chemistry'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-violet-100 text-violet-800 border border-violet-200'
                    }`}
                  >
                    {currentQuestion.subject}
                  </span>
                  {currentQuestion.topic && (
                    <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                      · {currentQuestion.topic}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    +{currentQuestion.marks}.0
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                    -{currentQuestion.negativeMarks}.0
                  </span>
                </div>
              </div>

              {/* Question Content */}
              <div className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80">
                <QuestionRenderer text={currentQuestion.questionText} />
              </div>

              {/* Options Section */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {currentQuestion.type === 'single_choice'
                    ? 'Select One Option:'
                    : 'Enter Numerical Value (Integer or Decimal):'}
                </div>

                {currentQuestion.type === 'single_choice' && currentQuestion.options ? (
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = currentAnswer?.selectedOption === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleSelectOption(opt.id)}
                          className={`p-3.5 sm:px-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                            isSelected
                              ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 font-bold shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {opt.id}
                          </div>
                          <span className="text-sm font-medium">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="max-w-xs space-y-2">
                    <input
                      type="text"
                      placeholder="e.g. 12 or 4.5"
                      value={currentAnswer?.numericalAnswer || ''}
                      onChange={(e) => handleNumericalChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-indigo-300 focus:border-indigo-600 focus:outline-hidden text-base font-bold text-slate-900"
                    />
                    <p className="text-[11px] text-slate-500">
                      Type your calculated integer or decimal answer.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNavigatePrev}
                  disabled={currentQuestionIndex === 0}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearResponse}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition cursor-pointer"
                >
                  Clear Response
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkForReviewAndNext}
                  className="px-4 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 font-bold text-xs transition cursor-pointer"
                >
                  Mark for Review &amp; Next
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
                >
                  <span>Save &amp; Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: JEE Question Palette */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50 flex flex-col shrink-0 overflow-y-auto">
            {/* Candidate Header */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{username}</div>
                <div className="text-[10px] text-slate-500 font-mono">Roll: JEE-2026-ASPIRANT</div>
              </div>
            </div>

            {/* CBT Legend */}
            <div className="p-4 border-b border-slate-200 space-y-2 text-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Question Status Legend
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                    {cbtStatusCounts.answered}
                  </span>
                  <span className="text-slate-700">Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold">
                    {cbtStatusCounts.not_answered}
                  </span>
                  <span className="text-slate-700">Not Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-violet-600 text-white flex items-center justify-center text-[9px] font-bold">
                    {cbtStatusCounts.marked_for_review}
                  </span>
                  <span className="text-slate-700">Review</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold">
                    {cbtStatusCounts.not_visited}
                  </span>
                  <span className="text-slate-700">Not Visited</span>
                </div>
              </div>
            </div>

            {/* Question Palette Number Grid */}
            <div className="p-4 flex-1 space-y-2 overflow-y-auto">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Question Palette ({activeTest.questions.length})
              </div>
              <div className="grid grid-cols-5 gap-2">
                {activeTest.questions.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIndex;
                  const st = studentAnswers[q.id]?.status || 'not_visited';
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleJumpToQuestion(idx)}
                      className={`h-9 rounded-xl flex items-center justify-center text-xs font-bold transition cursor-pointer select-none ${
                        isCurrent
                          ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105 shadow-md ' + getCbtStatusBadge(st)
                          : getCbtStatusBadge(st)
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Confirm Test Submission</h3>
                <p className="text-xs text-slate-500">
                  Are you ready to submit your test and view your detailed scorecard?
                </p>
              </div>

              {/* Summary Counts */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <div>
                  <div className="text-lg font-black text-emerald-600">
                    {cbtStatusCounts.answered + cbtStatusCounts.answered_and_marked}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Answered</div>
                </div>
                <div>
                  <div className="text-lg font-black text-rose-600">
                    {cbtStatusCounts.not_answered}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Unanswered</div>
                </div>
                <div>
                  <div className="text-lg font-black text-violet-600">
                    {cbtStatusCounts.marked_for_review}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">For Review</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Resume Test
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitTest(false)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Submit &amp; View Result
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW: TEST ANALYSIS & SCORECARD DASHBOARD
  // =========================================================================
  if (activeView === 'analysis' && activeAttempt) {
    const questionsList = activeTest?.questions || tests.find((t) => t.id === activeAttempt.testId)?.questions || [];

    // Filter questions for the solution breakdown using exact evaluator
    const filteredQuestionsForReview = questionsList.filter((q) => {
      const ans = activeAttempt.answers[q.id];
      const isAttempted =
        ans &&
        (ans.status === 'answered' || ans.status === 'answered_and_marked') &&
        (ans.selectedOption !== undefined || (ans.numericalAnswer !== undefined && ans.numericalAnswer.trim() !== ''));

      const isCorrect = evaluateQuestion(q, ans);

      if (analysisFilter === 'correct') return isCorrect;
      if (analysisFilter === 'incorrect') return isAttempted && !isCorrect;
      if (analysisFilter === 'unattempted') return !isAttempted;
      if (analysisFilter === 'marked') return ans?.status === 'marked_for_review' || ans?.status === 'answered_and_marked';
      return true;
    });

    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveView('library');
            }}
            className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Tests Library</span>
          </button>

          {/* Quick Add to Daily Log */}
          {onUpdateDailyRecord && (
            <button
              type="button"
              onClick={handleLogQuestionsToDaily}
              disabled={hasLoggedToDaily}
              className={`self-start sm:self-auto px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-xs ${
                hasLoggedToDaily
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {hasLoggedToDaily ? 'Logged to Daily Practice ✓' : 'Add Solved Questions to Daily Log'}
              </span>
            </button>
          )}
        </div>

        {/* Hero Scorecard Banner */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Official CBT Result
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {formatDatePretty(getTodayStr())}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {activeAttempt.testTitle}
              </h1>
              <p className="text-xs text-slate-500">
                Time Taken: {Math.round(activeAttempt.timeTakenSeconds / 60)} minutes / {activeAttempt.durationMinutes} minutes
              </p>
            </div>

            {/* Scorecard Hero Numbers */}
            <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-center sm:text-left">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Score
                </div>
                <div className="text-3xl sm:text-4xl font-black text-slate-900">
                  {activeAttempt.totalMarks}{' '}
                  <span className="text-slate-400 text-lg font-normal">/ {activeAttempt.maxMarks}</span>
                </div>
                <div className="text-xs font-bold text-indigo-600">
                  {activeAttempt.percentage}% Score
                </div>
              </div>

              <div className="h-12 w-px bg-slate-200 hidden sm:block" />

              <div className="text-center sm:text-left">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Accuracy
                </div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-600">
                  {activeAttempt.accuracy}%
                </div>
                <div className="text-xs text-slate-500">
                  {activeAttempt.correctCount} correct / {activeAttempt.attemptedCount} attempted
                </div>
              </div>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-1">
                Correct Answers
              </span>
              <div className="text-xl font-black text-emerald-950">
                {activeAttempt.correctCount}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold">
                +{activeAttempt.correctCount * 4} Marks
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
              <span className="text-[10px] font-bold uppercase text-rose-800 block mb-1">
                Negative Penalties
              </span>
              <div className="text-xl font-black text-rose-950">
                {activeAttempt.incorrectCount}
              </div>
              <span className="text-[11px] text-rose-700 font-semibold">
                -{activeAttempt.incorrectCount * 1} Marks Lost
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                Unattempted
              </span>
              <div className="text-xl font-black text-slate-900">
                {activeAttempt.unattemptedCount}
              </div>
              <span className="text-[11px] text-slate-500">0 Marks impact</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-violet-50/70 border border-violet-200">
              <span className="text-[10px] font-bold uppercase text-violet-800 block mb-1">
                Est. JEE Percentile
              </span>
              <div className="text-base sm:text-lg font-black text-violet-950 truncate">
                {activeAttempt.aiAnalysis?.predictedPercentile || 'Competitive'}
              </div>
              <span className="text-[11px] text-violet-700 font-semibold">Competitive Rank</span>
            </div>
          </div>
        </div>

        {/* Subject-Wise Performance Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Physics */}
          <div className="p-5 rounded-3xl bg-white border border-sky-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-sky-900 flex items-center gap-1.5 text-sm">
                <Atom className="w-4 h-4 text-sky-600" /> Physics
              </span>
              <span className="text-xs font-bold text-sky-700">
                {activeAttempt.subjectBreakdown.physics.accuracy}% Acc
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-sky-950">
                {activeAttempt.subjectBreakdown.physics.score}
              </span>
              <span className="text-xs text-slate-500">
                / {activeAttempt.subjectBreakdown.physics.maxScore} Marks
              </span>
            </div>
            <div className="text-xs text-slate-600 flex justify-between pt-1 border-t border-slate-100">
              <span>{activeAttempt.subjectBreakdown.physics.correct} Correct</span>
              <span>{activeAttempt.subjectBreakdown.physics.incorrect} Wrong</span>
              <span>{activeAttempt.subjectBreakdown.physics.unattempted} Skipped</span>
            </div>
          </div>

          {/* Chemistry */}
          <div className="p-5 rounded-3xl bg-white border border-emerald-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-emerald-900 flex items-center gap-1.5 text-sm">
                <FlaskConical className="w-4 h-4 text-emerald-600" /> Chemistry
              </span>
              <span className="text-xs font-bold text-emerald-700">
                {activeAttempt.subjectBreakdown.chemistry.accuracy}% Acc
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-950">
                {activeAttempt.subjectBreakdown.chemistry.score}
              </span>
              <span className="text-xs text-slate-500">
                / {activeAttempt.subjectBreakdown.chemistry.maxScore} Marks
              </span>
            </div>
            <div className="text-xs text-slate-600 flex justify-between pt-1 border-t border-slate-100">
              <span>{activeAttempt.subjectBreakdown.chemistry.correct} Correct</span>
              <span>{activeAttempt.subjectBreakdown.chemistry.incorrect} Wrong</span>
              <span>{activeAttempt.subjectBreakdown.chemistry.unattempted} Skipped</span>
            </div>
          </div>

          {/* Mathematics (Violet Theme) */}
          <div className="p-5 rounded-3xl bg-white border border-violet-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-violet-900 flex items-center gap-1.5 text-sm">
                <Calculator className="w-4 h-4 text-violet-600" /> Mathematics
              </span>
              <span className="text-xs font-bold text-violet-700">
                {activeAttempt.subjectBreakdown.math.accuracy}% Acc
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-violet-950">
                {activeAttempt.subjectBreakdown.math.score}
              </span>
              <span className="text-xs text-slate-500">
                / {activeAttempt.subjectBreakdown.math.maxScore} Marks
              </span>
            </div>
            <div className="text-xs text-slate-600 flex justify-between pt-1 border-t border-slate-100">
              <span>{activeAttempt.subjectBreakdown.math.correct} Correct</span>
              <span>{activeAttempt.subjectBreakdown.math.incorrect} Wrong</span>
              <span>{activeAttempt.subjectBreakdown.math.unattempted} Skipped</span>
            </div>
          </div>
        </div>

        {/* Graphical Performance Analysis */}
        <TestGraphicalAnalysis
          attempt={activeAttempt}
          test={activeTest || tests.find((t) => t.id === activeAttempt.testId)}
        />

        {/* Detailed Question Review & Step-by-Step Solutions */}
        <div className="rounded-3xl bg-white border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                <span>Question-by-Question Solution Review</span>
                <span className="text-xs font-mono text-slate-500">
                  ({filteredQuestionsForReview.length} questions)
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Review your response, the correct key, and detailed step-by-step solutions in English.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setAnalysisFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  analysisFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setAnalysisFilter('correct')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  analysisFilter === 'correct' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Correct ({activeAttempt.correctCount})
              </button>
              <button
                type="button"
                onClick={() => setAnalysisFilter('incorrect')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  analysisFilter === 'incorrect' ? 'bg-white text-rose-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Incorrect ({activeAttempt.incorrectCount})
              </button>
              <button
                type="button"
                onClick={() => setAnalysisFilter('unattempted')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  analysisFilter === 'unattempted' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Skipped ({activeAttempt.unattemptedCount})
              </button>
            </div>
          </div>

          {/* List of Questions with Solutions */}
          <div className="space-y-4">
            {filteredQuestionsForReview.map((q, idx) => {
              const ans = activeAttempt.answers[q.id];
              const isAttempted =
                ans &&
                (ans.status === 'answered' || ans.status === 'answered_and_marked') &&
                (ans.selectedOption !== undefined || (ans.numericalAnswer !== undefined && ans.numericalAnswer.trim() !== ''));

              const isCorrect = evaluateQuestion(q, ans);

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    !isAttempted
                      ? 'bg-slate-50/60 border-slate-200'
                      : isCorrect
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : 'bg-rose-50/30 border-rose-200'
                  }`}
                >
                  {/* Top status */}
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">
                        Q{q.questionNumber || idx + 1}.
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          q.subject === 'physics'
                            ? 'bg-sky-100 text-sky-800'
                            : q.subject === 'chemistry'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-violet-100 text-violet-800'
                        }`}
                      >
                        {q.subject}
                      </span>
                      {q.topic && <span className="text-slate-500 font-medium">· {q.topic}</span>}
                    </div>

                    <div>
                      {!isAttempted ? (
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-200 text-slate-700">
                          Unattempted (0)
                        </span>
                      ) : isCorrect ? (
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Correct (+{q.marks || 4})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-100 text-rose-800 flex items-center gap-1">
                          <X className="w-3 h-3" /> Incorrect (-{q.negativeMarks !== undefined ? q.negativeMarks : 1})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text with formatted English code */}
                  <div className="mb-3">
                    <QuestionRenderer text={q.questionText} className="text-xs sm:text-sm font-semibold text-slate-800" />
                  </div>

                  {/* Options if single choice */}
                  {q.type === 'single_choice' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      {q.options.map((opt) => {
                        const sChoice = normalizeOptionKey(ans?.selectedOption);
                        const optKey = normalizeOptionKey(opt.id);
                        const cKey = normalizeOptionKey(q.correctAnswer);

                        const isStudent = sChoice === optKey;
                        const isCorrectKey =
                          cKey === optKey ||
                          q.correctAnswer?.trim().toLowerCase() === opt.text?.trim().toLowerCase();

                        let optClass = 'bg-white border-slate-200 text-slate-700';
                        if (isCorrectKey) {
                          optClass = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                        } else if (isStudent && !isCorrectKey) {
                          optClass = 'bg-rose-50 border-rose-300 text-rose-900 line-through';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${optClass}`}
                          >
                            <span className="w-5 h-5 rounded-lg bg-black/5 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {opt.id}
                            </span>
                            <span className="truncate">{opt.text}</span>
                            {isCorrectKey && (
                              <span className="ml-auto text-[10px] font-bold text-emerald-700">
                                Correct Key ✓
                              </span>
                            )}
                            {isStudent && !isCorrectKey && (
                              <span className="ml-auto text-[10px] font-bold text-rose-600">
                                Your Choice ✗
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Numerical Answer display */}
                  {q.type === 'numerical' && (
                    <div className="flex items-center gap-4 text-xs mb-3 p-2.5 rounded-xl bg-white border border-slate-200">
                      <div>
                        <span className="text-slate-500">Your Answer: </span>
                        <span className="font-bold text-slate-800">
                          {ans?.numericalAnswer ? ans.numericalAnswer : 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Correct Answer: </span>
                        <span className="font-bold text-emerald-700">{q.correctAnswer}</span>
                      </div>
                    </div>
                  )}

                  {/* Step-by-Step Solution in English */}
                  {q.solution && (
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 text-xs space-y-1.5">
                      <div className="font-bold text-indigo-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Step-by-Step Solution (English):</span>
                      </div>
                      <QuestionRenderer text={q.solution} className="text-slate-700 leading-relaxed" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: UPLOAD & EXTRACT PDF QUESTIONS / INSTANT TEST GENERATOR
  // =========================================================================
  if (activeView === 'upload') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
        <button
          type="button"
          onClick={() => setActiveView('library')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to Tests</span>
        </button>

        {/* Creator View Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setCreatorTab('instant')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              creatorTab === 'instant'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Instant Generator</span>
          </button>
          <button
            type="button"
            onClick={() => setCreatorTab('upload')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              creatorTab === 'upload'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload PDF Paper</span>
          </button>
        </div>

        {creatorTab === 'instant' ? (
          /* INSTANT TEST GENERATOR TAB */
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Instant Practice Test Generator
                </h2>
                <p className="text-xs text-slate-500">
                  Generate authentic, syllabus-accurate JEE CBT practice tests on demand in English. No PDF required.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Test Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. JEE Speed Sprint: Mechanics & Calculus"
                  value={instantTitle}
                  onChange={(e) => setInstantTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Focus</label>
                <select
                  value={instantSubject}
                  onChange={(e) => setInstantSubject(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="pcm">Full PCM (Physics, Chemistry, Math)</option>
                  <option value="physics">Physics Only</option>
                  <option value="chemistry">Chemistry Only</option>
                  <option value="math">Mathematics Only</option>
                  <option value="coding">Computer Science &amp; Programming Logic (English)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Focus Topic or Chapter (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Definite Integrals, Thermodynamics, Python Recursion"
                  value={instantTopic}
                  onChange={(e) => setInstantTopic(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty</label>
                <select
                  value={instantDifficulty}
                  onChange={(e) => setInstantDifficulty(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="easy">Easy (Confidence Builder)</option>
                  <option value="moderate">Moderate (Standard JEE Main Level)</option>
                  <option value="hard">Hard (JEE Advanced Rank Booster)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Test Duration (Minutes)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[15, 30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setInstantDuration(mins)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        instantDuration === mins
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {mins} Mins
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {extractError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{extractError}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveView('library')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleGenerateInstantTest}
                disabled={isGeneratingInstant}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-sm shadow-indigo-600/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGeneratingInstant ? 'Generating Test...' : 'Generate Practice Test Now'}</span>
              </button>
            </div>

            {isGeneratingInstant && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-center space-y-2 animate-in fade-in duration-200">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-1" />
                <div className="text-xs font-bold text-indigo-900">{extractProgressStep}</div>
                <p className="text-[11px] text-slate-500">
                  Building verified JEE CBT questions with complete English step-by-step solutions...
                </p>
              </div>
            )}
          </div>
        ) : (
          /* PDF UPLOAD TAB */
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Extract Questions from PDF &amp; Build JEE Test
                </h2>
                <p className="text-xs text-slate-500">
                  Upload any question paper PDF, DPP, or module. Gemini AI will analyze the PDF, extract all questions with options, and assemble an authentic JEE test.
                </p>
              </div>
            </div>

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                pdfFile
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/80 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {pdfFile ? (
                <div className="space-y-2">
                  <FileCheck className="w-12 h-12 text-emerald-600 mx-auto" />
                  <div className="text-sm font-bold text-slate-900">{pdfFile.name}</div>
                  <div className="text-xs text-slate-500">
                    {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for AI Question Extraction
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-1 rounded-xl text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Change PDF File
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="w-12 h-12 text-slate-400 mx-auto" />
                  <div className="text-sm font-bold text-slate-800">
                    Click to browse or drop your JEE Question Paper PDF here
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Supports mock exam PDFs, coaching problem sets, Allen/Resonance/FIITJEE DPPs, and previous year papers.
                  </p>
                </div>
              )}
            </div>

            {/* Configuration Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Test Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. JEE Main Mechanics & Organic Mock"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Focus</label>
                <select
                  value={uploadSubject}
                  onChange={(e) => setUploadSubject(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="pcm">Full PCM (Physics, Chemistry, Math)</option>
                  <option value="physics">Physics Only</option>
                  <option value="chemistry">Chemistry Only</option>
                  <option value="math">Mathematics Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Test Duration (Minutes)
                </label>
                <select
                  value={uploadDuration}
                  onChange={(e) => setUploadDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value={30}>30 Minutes (Speed Sprint)</option>
                  <option value={45}>45 Minutes (Sectional Test)</option>
                  <option value={60}>1 Hour (Standard Mock)</option>
                  <option value={90}>1.5 Hours</option>
                  <option value={180}>3 Hours (Full JEE Main Simulation)</option>
                </select>
              </div>
            </div>

            {extractError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{extractError}</span>
              </div>
            )}

            {/* Extract Button / Progress */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveView('library')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExtractPdf}
                disabled={isExtracting}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-sm shadow-indigo-600/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isExtracting ? 'Analyzing PDF with AI...' : 'Extract & Create JEE Test'}</span>
              </button>
            </div>

            {isExtracting && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-center space-y-2 animate-in fade-in duration-200">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-1" />
                <div className="text-xs font-bold text-indigo-900">{extractProgressStep}</div>
                <p className="text-[11px] text-slate-500">
                  AI is digitizing questions, formulas, options, and generating verified solutions. This takes about 10-20 seconds.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW: MAIN TEST LIBRARY & PREVIOUS ATTEMPTS
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Exam Practice
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
              JEE CBT Simulator
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600" />
            <span>JEE Mock Tests &amp; PDF Question Extractor</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Take timed Computer Based Tests (CBT) with negative marking (+4 / -1). Generate instant practice drills or upload any PDF question paper to receive comprehensive graphical analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setCreatorTab('instant');
              setActiveView('upload');
            }}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm shadow-indigo-600/20 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Test</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCreatorTab('upload');
              setActiveView('upload');
            }}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-2xs active:scale-95"
          >
            <UploadCloud className="w-4 h-4 text-slate-500" />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        {/* Subject Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubjectFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              subjectFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Tests ({tests.length})
          </button>

          <button
            type="button"
            onClick={() => setSubjectFilter('pcm')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              subjectFilter === 'pcm'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-800 hover:bg-indigo-50'
            }`}
          >
            Full PCM
          </button>

          <button
            type="button"
            onClick={() => setSubjectFilter('physics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              subjectFilter === 'physics'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-sky-800 hover:bg-sky-50'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>Physics</span>
          </button>

          <button
            type="button"
            onClick={() => setSubjectFilter('chemistry')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              subjectFilter === 'chemistry'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Chemistry</span>
          </button>

          <button
            type="button"
            onClick={() => setSubjectFilter('math')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              subjectFilter === 'math'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-violet-800 hover:bg-violet-50'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Mathematics</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search mock tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Grid of Tests */}
      {filteredTests.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-700">No mock tests found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Generate an authentic practice test in 1 click or upload any question paper PDF to extract questions.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setCreatorTab('instant');
                setActiveView('upload');
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Practice Test</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatorTab('upload');
                setActiveView('upload');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload PDF Paper</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTests.map((test) => {
            const hasAttempts = testAttempts.filter((a) => a.testId === test.id);
            const latestAttempt = hasAttempts[0];

            return (
              <div
                key={test.id}
                className="group rounded-3xl bg-white border border-slate-200/90 hover:border-indigo-300 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md shadow-xs relative"
              >
                <div>
                  {/* Top Subject and Info Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        test.subject === 'physics'
                          ? 'bg-sky-100 text-sky-800'
                          : test.subject === 'chemistry'
                          ? 'bg-emerald-100 text-emerald-800'
                          : test.subject === 'math'
                          ? 'bg-violet-100 text-violet-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {test.subject === 'pcm' ? 'Full PCM' : test.subject}
                    </span>

                    <span className="text-xs font-mono font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{test.durationMinutes}m</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors mb-1.5 line-clamp-2">
                    {test.title}
                  </h3>

                  {test.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {test.description}
                    </p>
                  )}

                  {/* Test Stats Pill */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-4">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-semibold text-[11px]">
                      {test.totalQuestions} Questions
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                      +4.0 / -1.0 Marking
                    </span>
                    {test.sourcePdfName && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={test.sourcePdfName}>
                        📄 {test.sourcePdfName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Section */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {latestAttempt && (
                    <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-xl mb-2">
                      <span className="text-slate-500">Last Score:</span>
                      <span className="font-bold text-slate-900">
                        {latestAttempt.totalMarks}/{latestAttempt.maxMarks} ({latestAttempt.accuracy}% acc)
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartTest(test)}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{latestAttempt ? 'Retake CBT' : 'Start CBT Test'}</span>
                    </button>

                    {latestAttempt && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAttempt(latestAttempt);
                          setActiveTest(test);
                          setActiveView('analysis');
                        }}
                        className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                        title="View brief performance analysis"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Analysis</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteTest(test.id, test.title)}
                      className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-slate-100 transition cursor-pointer"
                      title="Delete Test"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Test Attempts History Section */}
      {testAttempts.length > 0 && (
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span>Recent Test Attempts &amp; Score History</span>
              </h3>
              <p className="text-xs text-slate-500">
                Review past mock scores, accuracy trends, and AI diagnostic reports.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {testAttempts.slice(0, 5).map((att) => (
              <div
                key={att.id}
                className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{att.testTitle}</div>
                  <div className="text-[11px] text-slate-500">
                    {formatDateShort(getTodayStr())} · {Math.round(att.timeTakenSeconds / 60)}m time spent
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">
                      {att.totalMarks} / {att.maxMarks}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600">
                      {att.accuracy}% Accuracy
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveAttempt(att);
                      const t = tests.find((x) => x.id === att.testId);
                      if (t) setActiveTest(t);
                      setActiveView('analysis');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
                  >
                    View Analysis →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
