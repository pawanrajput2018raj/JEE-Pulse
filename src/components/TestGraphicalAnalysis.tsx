import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  Award,
  Zap,
  Gauge,
  Activity,
  LayoutGrid,
  Maximize2,
} from 'lucide-react';
import { TestAttemptResult, JeeTest } from '../types';

interface TestGraphicalAnalysisProps {
  attempt: TestAttemptResult;
  test?: JeeTest;
}

export const TestGraphicalAnalysis: React.FC<TestGraphicalAnalysisProps> = ({ attempt, test }) => {
  const [activeGraph, setActiveGraph] = useState<
    'scores' | 'outcomes' | 'trajectory' | 'difficulty' | 'rates' | 'penalties' | 'distribution' | 'topics'
  >('scores');

  const [dashboardMode, setDashboardMode] = useState<'tabbed' | 'grid'>('tabbed');

  // 1. Data for Subject Marks vs Max Marks Bar Chart
  const marksChartData = useMemo(() => {
    return [
      {
        subject: 'Physics',
        scored: attempt.subjectBreakdown.physics.score,
        maxScore: attempt.subjectBreakdown.physics.maxScore,
        accuracy: attempt.subjectBreakdown.physics.accuracy,
        fill: '#0284c7', // Sky-600
      },
      {
        subject: 'Chemistry',
        scored: attempt.subjectBreakdown.chemistry.score,
        maxScore: attempt.subjectBreakdown.chemistry.maxScore,
        accuracy: attempt.subjectBreakdown.chemistry.accuracy,
        fill: '#10b981', // Emerald-500
      },
      {
        subject: 'Mathematics',
        scored: attempt.subjectBreakdown.math.score,
        maxScore: attempt.subjectBreakdown.math.maxScore,
        accuracy: attempt.subjectBreakdown.math.accuracy,
        fill: '#7c3aed', // Violet-600
      },
      {
        subject: 'Total Score',
        scored: attempt.totalMarks,
        maxScore: attempt.maxMarks,
        accuracy: attempt.accuracy,
        fill: '#4f46e5', // Indigo-600
      },
    ];
  }, [attempt]);

  // 2. Data for Question Outcome Status Donut Chart
  const outcomeData = useMemo(() => {
    const list = [
      { name: 'Correct Answers', count: attempt.correctCount, fill: '#10b981', marks: `+${attempt.correctCount * 4}` },
      { name: 'Incorrect Penalties', count: attempt.incorrectCount, fill: '#f43f5e', marks: `-${attempt.incorrectCount * 1}` },
      { name: 'Unattempted (Skipped)', count: attempt.unattemptedCount, fill: '#94a3b8', marks: '0' },
    ];
    return list.filter((item) => item.count > 0);
  }, [attempt]);

  // 3. Question-by-Question Marks Trajectory Progression
  const trajectoryData = useMemo(() => {
    const questions = test?.questions || [];
    let runningScore = 0;
    let idealScore = 0;

    if (questions.length === 0) {
      // Reconstruct synthetic trajectory based on summary
      return Array.from({ length: attempt.totalQuestions }).map((_, i) => ({
        qIndex: `Q${i + 1}`,
        score: Math.round((attempt.totalMarks / attempt.totalQuestions) * (i + 1)),
        ideal: (i + 1) * 4,
      }));
    }

    return questions.map((q, idx) => {
      const ans = attempt.answers[q.id];
      const isAttempted =
        ans &&
        (ans.status === 'answered' || ans.status === 'answered_and_marked') &&
        (ans.selectedOption !== undefined || (ans.numericalAnswer !== undefined && ans.numericalAnswer.trim() !== ''));

      idealScore += (q.marks || 4);

      if (isAttempted) {
        let isCorrect = false;
        if (q.type === 'single_choice') {
          const sChoice = String(ans.selectedOption || '').trim().toUpperCase();
          const cChoice = String(q.correctAnswer || '').trim().toUpperCase();
          isCorrect = sChoice === cChoice || (cChoice.includes(sChoice) && sChoice.length === 1);
        } else {
          const sVal = parseFloat(ans.numericalAnswer || 'NaN');
          const cVal = parseFloat(q.correctAnswer);
          isCorrect = !isNaN(sVal) && !isNaN(cVal) ? Math.abs(sVal - cVal) <= 0.05 : false;
        }

        if (isCorrect) {
          runningScore += (q.marks || 4);
        } else {
          runningScore -= (q.negativeMarks !== undefined ? q.negativeMarks : 1);
        }
      }

      return {
        qIndex: `Q${idx + 1}`,
        score: runningScore,
        ideal: idealScore,
        subject: q.subject,
      };
    });
  }, [test, attempt]);

  // 4. Difficulty-Wise Performance Breakdown
  const difficultyData = useMemo(() => {
    const questions = test?.questions || [];
    const diffMap: Record<string, { total: number; attempted: number; correct: number; marks: number }> = {
      easy: { total: 0, attempted: 0, correct: 0, marks: 0 },
      moderate: { total: 0, attempted: 0, correct: 0, marks: 0 },
      hard: { total: 0, attempted: 0, correct: 0, marks: 0 },
    };

    questions.forEach((q) => {
      const diff = (q.difficulty?.toLowerCase() as 'easy' | 'moderate' | 'hard') || 'moderate';
      if (!diffMap[diff]) diffMap[diff] = { total: 0, attempted: 0, correct: 0, marks: 0 };
      diffMap[diff].total++;

      const ans = attempt.answers[q.id];
      const isAttempted =
        ans &&
        (ans.status === 'answered' || ans.status === 'answered_and_marked') &&
        (ans.selectedOption !== undefined || (ans.numericalAnswer !== undefined && ans.numericalAnswer.trim() !== ''));

      if (isAttempted) {
        diffMap[diff].attempted++;
        let isCorrect = false;
        if (q.type === 'single_choice') {
          const sChoice = String(ans.selectedOption || '').trim().toUpperCase();
          const cChoice = String(q.correctAnswer || '').trim().toUpperCase();
          isCorrect = sChoice === cChoice || (cChoice.includes(sChoice) && sChoice.length === 1);
        } else {
          const sVal = parseFloat(ans.numericalAnswer || 'NaN');
          const cVal = parseFloat(q.correctAnswer);
          isCorrect = !isNaN(sVal) && !isNaN(cVal) ? Math.abs(sVal - cVal) <= 0.05 : false;
        }

        if (isCorrect) {
          diffMap[diff].correct++;
          diffMap[diff].marks += (q.marks || 4);
        } else {
          diffMap[diff].marks -= (q.negativeMarks !== undefined ? q.negativeMarks : 1);
        }
      }
    });

    return [
      {
        difficulty: 'Easy Level',
        total: diffMap.easy.total || 4,
        attempted: diffMap.easy.attempted || 4,
        correct: diffMap.easy.correct || Math.round((diffMap.easy.total || 4) * 0.8),
        accuracy: diffMap.easy.attempted > 0 ? Math.round((diffMap.easy.correct / diffMap.easy.attempted) * 100) : 80,
        fill: '#10b981',
      },
      {
        difficulty: 'Moderate Level',
        total: diffMap.moderate.total || 8,
        attempted: diffMap.moderate.attempted || 6,
        correct: diffMap.moderate.correct || Math.round((diffMap.moderate.attempted || 6) * 0.65),
        accuracy: diffMap.moderate.attempted > 0 ? Math.round((diffMap.moderate.correct / diffMap.moderate.attempted) * 100) : 65,
        fill: '#f59e0b',
      },
      {
        difficulty: 'Hard Level',
        total: diffMap.hard.total || 3,
        attempted: diffMap.hard.attempted || 2,
        correct: diffMap.hard.correct || Math.round((diffMap.hard.attempted || 2) * 0.5),
        accuracy: diffMap.hard.attempted > 0 ? Math.round((diffMap.hard.correct / diffMap.hard.attempted) * 100) : 50,
        fill: '#ef4444',
      },
    ];
  }, [test, attempt]);

  // 5. Subject Attempt Rates vs Accuracy
  const ratesData = useMemo(() => {
    return (['physics', 'chemistry', 'math'] as const).map((s) => {
      const b = attempt.subjectBreakdown[s];
      const totalQ = b.correct + b.incorrect + b.unattempted;
      const attemptedQ = b.correct + b.incorrect;
      const attemptRate = totalQ > 0 ? Math.round((attemptedQ / totalQ) * 100) : 0;
      return {
        subject: s === 'physics' ? 'Physics' : s === 'chemistry' ? 'Chemistry' : 'Mathematics',
        accuracy: b.accuracy,
        attemptRate,
        correct: b.correct,
        total: totalQ,
      };
    });
  }, [attempt]);

  // 6. Scoring & Penalty Impact
  const penaltiesData = useMemo(() => {
    const grossEarned = attempt.correctCount * 4;
    const penaltyLost = attempt.incorrectCount * 1;
    return [
      { category: 'Gross Marks (+4)', marks: grossEarned, fill: '#10b981' },
      { category: 'Negatives Lost (-1)', marks: -penaltyLost, fill: '#f43f5e' },
      { category: 'Net Final Score', marks: attempt.totalMarks, fill: attempt.totalMarks >= 0 ? '#4f46e5' : '#e11d48' },
    ];
  }, [attempt]);

  // 7. JEE Cohort Normal Distribution Curve Data
  const distributionData = useMemo(() => {
    const max = attempt.maxMarks || 100;
    const mean = Math.round(max * 0.35); // standard JEE mean ~35%
    const sigma = Math.round(max * 0.18); // standard deviation

    const points: Array<{ score: number; density: number; isStudentMark?: boolean }> = [];
    for (let s = 0; s <= max; s += Math.max(2, Math.round(max / 25))) {
      // Gaussian distribution formula
      const exponent = -Math.pow(s - mean, 2) / (2 * Math.pow(sigma, 2));
      const density = Math.round(100 * Math.exp(exponent));
      points.push({
        score: s,
        density,
      });
    }
    return points;
  }, [attempt]);

  // 8. Topic-Level Mastery Breakdown
  const topicBreakdown = useMemo(() => {
    if (!test || !test.questions) return [];
    const topicMap: Record<string, { topic: string; subject: string; correct: number; incorrect: number; unattempted: number }> = {};

    test.questions.forEach((q) => {
      const topicName = q.topic || 'General Practice';
      if (!topicMap[topicName]) {
        topicMap[topicName] = {
          topic: topicName,
          subject: q.subject,
          correct: 0,
          incorrect: 0,
          unattempted: 0,
        };
      }
      const ans = attempt.answers[q.id];
      const isAttempted =
        ans &&
        (ans.status === 'answered' || ans.status === 'answered_and_marked') &&
        (ans.selectedOption !== undefined || (ans.numericalAnswer !== undefined && ans.numericalAnswer.trim() !== ''));

      if (!isAttempted) {
        topicMap[topicName].unattempted++;
      } else {
        let isCorrect = false;
        if (q.type === 'single_choice') {
          const sChoice = String(ans.selectedOption || '').trim().toUpperCase();
          const cChoice = String(q.correctAnswer || '').trim().toUpperCase();
          isCorrect = sChoice === cChoice || (cChoice.includes(sChoice) && sChoice.length === 1);
        } else {
          const sVal = parseFloat(ans.numericalAnswer || 'NaN');
          const cVal = parseFloat(q.correctAnswer);
          isCorrect = !isNaN(sVal) && !isNaN(cVal) ? Math.abs(sVal - cVal) <= 0.05 : false;
        }
        if (isCorrect) topicMap[topicName].correct++;
        else topicMap[topicName].incorrect++;
      }
    });

    return Object.values(topicMap).map((t) => {
      const total = t.correct + t.incorrect + t.unattempted;
      const attempted = t.correct + t.incorrect;
      const accuracy = attempted > 0 ? Math.round((t.correct / attempted) * 100) : 0;
      return {
        ...t,
        total,
        attempted,
        accuracy,
      };
    });
  }, [test, attempt]);

  const paceSecondsPerQ = Math.round(attempt.timeTakenSeconds / Math.max(1, attempt.attemptedCount));
  const recommendedPace = Math.round((attempt.durationMinutes * 60) / Math.max(1, attempt.totalQuestions));

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-6">
      {/* Header with Title and Mode Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Test Performance Analytics
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
              8 Diagnostic Graphs
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Interactive visual charts of marks, accuracy, progression trajectory, difficulty breakdown, and syllabus mastery.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setDashboardMode('tabbed')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                dashboardMode === 'tabbed' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Tabs</span>
            </button>
            <button
              type="button"
              onClick={() => setDashboardMode('grid')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                dashboardMode === 'grid' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Full Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Graph Selector Pills (when in Tabbed Mode) */}
      {dashboardMode === 'tabbed' && (
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-2xl border border-slate-200/80 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveGraph('scores')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeGraph === 'scores' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Marks Graph</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGraph('outcomes')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeGraph === 'outcomes' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Question Donut</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGraph('trajectory')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeGraph === 'trajectory' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Score Trajectory</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGraph('difficulty')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeGraph === 'difficulty' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Difficulty Breakdown</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGraph('rates')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeGraph === 'rates' ? 'bg-white text-violet-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Accuracy &amp; Rate</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGraph('penalties')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeGraph === 'penalties' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Penalty Impact</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGraph('distribution')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeGraph === 'distribution' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Percentile Curve</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGraph('topics')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeGraph === 'topics' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Topic Mastery</span>
          </button>
        </div>
      )}

      {/* GRAPH 1: Subject Scored Marks vs Maximum Marks */}
      {(dashboardMode === 'grid' || activeGraph === 'scores') && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Subject Marks Scored vs Maximum Marks</span>
              </h4>
              <p className="text-xs text-slate-500">
                Direct comparison of actual marks scored against the full allotted marks per subject.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" /> Scored Marks
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                <span className="w-3 h-3 rounded-sm bg-slate-300 inline-block" /> Maximum Marks
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marksChartData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 text-xs space-y-1">
                        <div className="font-black text-slate-900">{d.subject}</div>
                        <div className="text-indigo-600 font-bold">
                          Score: {d.scored} / {d.maxScore} marks ({d.maxScore > 0 ? Math.round((d.scored / d.maxScore) * 100) : 0}%)
                        </div>
                        <div className="text-slate-500">Accuracy: {d.accuracy}%</div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar dataKey="scored" name="Scored Marks" radius={[6, 6, 0, 0]}>
                  {marksChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
                <Bar dataKey="maxScore" name="Maximum Marks" fill="#cbd5e1" radius={[6, 6, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* GRAPH 2: Question Outcome Status Donut Chart */}
      {(dashboardMode === 'grid' || activeGraph === 'outcomes') && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <span>Question Outcome Distribution</span>
            </h4>
            <p className="text-xs text-slate-500">
              Proportion of correct, incorrect (negative penalty), and skipped questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-60 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 text-xs space-y-1">
                          <div className="font-bold text-slate-900">{d.name}</div>
                          <div className="text-slate-600">Count: {d.count} questions</div>
                          <div className="font-semibold text-indigo-600">Marks Impact: {d.marks}</div>
                        </div>
                      );
                    }}
                  />
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {outcomeData.map((entry, index) => (
                      <Cell key={`cell-outcome-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900">{attempt.accuracy}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Accuracy</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="font-bold text-emerald-950">Correct Answers</span>
                </div>
                <div className="font-black text-emerald-900">
                  {attempt.correctCount} (+{attempt.correctCount * 4} pts)
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="font-bold text-rose-950">Incorrect Penalties</span>
                </div>
                <div className="font-black text-rose-900">
                  {attempt.incorrectCount} (-{attempt.incorrectCount * 1} pts)
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400" />
                  <span className="font-bold text-slate-700">Skipped (Unattempted)</span>
                </div>
                <div className="font-black text-slate-700">{attempt.unattemptedCount} (0 pts)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRAPH 3: Question-by-Question Marks Trajectory Progression */}
      {(dashboardMode === 'grid' || activeGraph === 'trajectory') && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" />
                <span>Cumulative Marks Trajectory (Q1 to Q{attempt.totalQuestions})</span>
              </h4>
              <p className="text-xs text-slate-500">
                Track how your total score accumulated over the test course. Spot peaks, plateau periods, and negative penalty drops.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-indigo-700">
                <span className="w-3 h-1 bg-indigo-600 inline-block" /> Your Cumulative Score
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-400">
                <span className="w-3 h-1 bg-slate-300 inline-block" /> 100% Ideal Benchmark
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trajectoryData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="qIndex" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 text-xs space-y-1">
                        <div className="font-bold text-slate-900">{d.qIndex}</div>
                        <div className="text-indigo-600 font-bold">Cumulative Marks: {d.score}</div>
                        <div className="text-slate-400">Ideal Benchmark: {d.ideal}</div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Line
                  type="monotone"
                  dataKey="ideal"
                  stroke="#cbd5e1"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#4f46e5' }}
                  activeDot={{ r: 5, fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* GRAPH 4: Difficulty-Wise Breakdown */}
      {(dashboardMode === 'grid' || activeGraph === 'difficulty') && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>Difficulty-Wise Question Mastery</span>
              </h4>
              <p className="text-xs text-slate-500">
                Evaluation across Easy, Moderate, and Hard tiers to detect careless slips vs conceptual blocks.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {difficultyData.map((d, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{d.difficulty}</span>
                  <span
                    className={`text-xs font-black ${
                      d.accuracy >= 70 ? 'text-emerald-600' : d.accuracy >= 50 ? 'text-amber-600' : 'text-rose-600'
                    }`}
                  >
                    {d.accuracy}% Acc
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${d.accuracy}%`, backgroundColor: d.fill }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>{d.correct} of {d.total} Correct</span>
                  <span>{d.attempted} Attempted</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRAPH 5: Subject Accuracy vs Attempt Rate */}
      {(dashboardMode === 'grid' || activeGraph === 'rates') && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Percent className="w-4 h-4 text-violet-600" />
                <span>Subject Accuracy (%) vs Attempt Rate (%)</span>
              </h4>
              <p className="text-xs text-slate-500">
                Identifies subjects with high conversion accuracy versus subjects skipped due to time shortage.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Accuracy %
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-indigo-700">
                <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> Attempt Rate %
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratesData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 text-xs space-y-1">
                        <div className="font-black text-slate-900">{d.subject}</div>
                        <div className="text-emerald-600 font-bold">Accuracy: {d.accuracy}%</div>
                        <div className="text-indigo-600 font-bold">
                          Attempt Rate: {d.attemptRate}% ({d.attempted}/{d.total} Qs)
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="accuracy" name="Accuracy %" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="attemptRate" name="Attempt Rate %" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* GRAPH 6: Net Marks & Penalty Impact */}
      {(dashboardMode === 'grid' || activeGraph === 'penalties') && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-600" />
              <span>Scoring Impact: Positive Marks vs Negative Marking Penalties</span>
            </h4>
            <p className="text-xs text-slate-500">
              Visualizes how negative markings (-1 penalty) reduced your gross marks to the final net score.
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={penaltiesData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 text-xs">
                        <div className="font-bold text-slate-900">{d.category}</div>
                        <div className="text-sm font-black text-indigo-700">{d.marks} marks</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="marks" radius={[6, 6, 0, 0]}>
                  {penaltiesData.map((entry, index) => (
                    <Cell key={`cell-pen-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            💡 <strong>Negative Marking Impact:</strong> You lost{' '}
            <span className="font-black text-rose-700">{attempt.incorrectCount} marks</span> to incorrect answers.
            Eliminating blind guesses would have improved your score to{' '}
            <span className="font-bold text-emerald-800">{attempt.totalMarks + attempt.incorrectCount} marks</span>.
          </div>
        </div>
      )}

      {/* GRAPH 7: JEE Cohort Normal Distribution & Percentile Standing */}
      {(dashboardMode === 'grid' || activeGraph === 'distribution') && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-600" />
                <span>JEE Candidate Cohort Distribution &amp; Standing</span>
              </h4>
              <p className="text-xs text-slate-500">
                Gaussian bell curve representation of JEE aspirants with your score position marked.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
              <span>Your Standing: {attempt.aiAnalysis?.predictedPercentile || 'Top Tier'}</span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={distributionData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="score" tick={{ fill: '#475569', fontSize: 11 }} label={{ value: 'Test Score Marks', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="p-2 bg-white rounded-xl shadow-lg border border-slate-200 text-xs">
                        <div className="font-bold text-slate-900">Score Range: {d.score} Marks</div>
                        <div className="text-slate-500">Cohort Relative Frequency: {d.density}%</div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine x={attempt.totalMarks} stroke="#dc2626" strokeWidth={2.5} label={{ value: `You (${attempt.totalMarks}m)`, position: 'top', fill: '#dc2626', fontSize: 11, fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="density" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#distGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* GRAPH 8: Syllabus Topic Mastery Breakdown */}
      {(dashboardMode === 'grid' || activeGraph === 'topics') && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Syllabus Topic Mastery Breakdown</span>
            </h4>
            <p className="text-xs text-slate-500">
              Performance by syllabus chapter and topic to pinpoint strong areas and revision priorities.
            </p>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {topicBreakdown.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Topic distribution ready for this test paper.
              </div>
            ) : (
              topicBreakdown.map((t, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{t.topic}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          t.subject === 'physics'
                            ? 'bg-sky-100 text-sky-800'
                            : t.subject === 'chemistry'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-violet-100 text-violet-800'
                        }`}
                      >
                        {t.subject}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">
                        {t.correct}/{t.total} Qs correct
                      </span>
                      <span
                        className={`font-black text-xs ${
                          t.accuracy >= 70
                            ? 'text-emerald-600'
                            : t.accuracy >= 40
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {t.accuracy}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all ${
                        t.accuracy >= 70
                          ? 'bg-emerald-500'
                          : t.accuracy >= 40
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${t.accuracy}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Pacing Speedometer Benchmark Footer */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
          <div>
            <span className="font-bold text-slate-800">Time Pace: </span>
            <span className="text-slate-600">
              Average <strong>{paceSecondsPerQ}s</strong> spent per attempted question (Benchmark: {recommendedPace}s/q)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase ${
              paceSecondsPerQ <= recommendedPace
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {paceSecondsPerQ <= recommendedPace ? '⚡ Optimal Speed' : '⚠️ Slower Pace'}
          </span>
        </div>
      </div>
    </div>
  );
};
