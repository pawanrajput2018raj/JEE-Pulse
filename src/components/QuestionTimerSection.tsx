import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Clock,
  Zap,
  CheckCircle2,
  Atom,
  FlaskConical,
  Binary,
  Layers,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Monitor,
  FileText,
  Target,
  Hourglass,
  Timer,
  Flame,
  AlertTriangle,
  Award,
  Plus,
} from 'lucide-react';
import { SubjectType, QuestionTimerState, DailyRecord } from '../types';
import {
  formatDigitalTime,
  formatHumanDuration,
  formatTimeWithHours,
  getPaceInfo,
} from '../utils/timerUtils';
import { sounds } from '../utils/soundEffects';
import { fireConfettiCelebration } from '../utils/badges';
import { InAppPdfViewer } from './InAppPdfViewer';

interface QuestionTimerSectionProps {
  timerState: QuestionTimerState;
  onPlayPause: () => void;
  onNextQuestion: () => void;
  onSetQuestionNumber: (num: number) => void;
  onSetSubject: (sub: SubjectType) => void;
  onToggleFloating: () => void;
  onResetQuestion: () => void;
  onResetSession: () => void;
  onClearLaps: () => void;
  todayRecord: DailyRecord;
  onSaveRecord: (record: DailyRecord) => void;
  onLaunchPiP?: () => void;
  isPiPActive?: boolean;
  onSetTimerMode?: (mode: 'stopwatch' | 'timer') => void;
  onSetTargetSecondsPerQuestion?: (secs: number) => void;
  onSetAimedQuestions?: (count: number) => void;
  onSetSessionTargetSeconds?: (secs: number | undefined) => void;
}

export const SESSION_DURATION_OPTIONS = [
  { label: '30 minutes', secs: 30 * 60, desc: '30m focused sprint' },
  { label: '45 minutes', secs: 45 * 60, desc: '45m test block' },
  { label: '1 hour', secs: 60 * 60, desc: '60m standard session' },
  { label: '1 hour 45 minutes', secs: 105 * 60, desc: '105m intense mock drill' },
  { label: '2 hours', secs: 120 * 60, desc: '120m deep practice block' },
  { label: '2.5 hours', secs: 150 * 60, desc: '150m full exam conditioning' },
] as const;

export const QuestionTimerSection: React.FC<QuestionTimerSectionProps> = ({
  timerState,
  onPlayPause,
  onNextQuestion,
  onSetQuestionNumber,
  onSetSubject,
  onToggleFloating,
  onResetQuestion,
  onResetSession,
  onClearLaps,
  todayRecord,
  onSaveRecord,
  onLaunchPiP,
  isPiPActive,
  onSetTimerMode,
  onSetTargetSecondsPerQuestion,
  onSetAimedQuestions,
  onSetSessionTargetSeconds,
}) => {
  const [editingQuestionNumber, setEditingQuestionNumber] = useState(false);
  const [qInputVal, setQInputVal] = useState(String(timerState.currentQuestionNumber));
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [showInAppPdf, setShowInAppPdf] = useState(false);

  // Custom Aim editing
  const [isEditingAim, setIsEditingAim] = useState(false);
  const [customAimInput, setCustomAimInput] = useState(String(timerState.aimedQuestions || 25));

  // Custom Target Time editing (for Countdown Timer)
  const [isEditingCustomTime, setIsEditingCustomTime] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState('2');
  const [customSecondsInput, setCustomSecondsInput] = useState('0');

  // Track if current session aim celebration has been fired
  const [celebratedAimCount, setCelebratedAimCount] = useState<number | null>(null);
  const hasAlertedOvertimeRef = useRef(false);
  const hasAlertedSessionEndRef = useRef(false);

  const mode = timerState.mode || 'stopwatch';
  const isTimerMode = mode === 'timer';
  const targetSeconds = timerState.targetSecondsPerQuestion || 120;
  const aimedQuestions = timerState.aimedQuestions || 25;
  const completedQuestions = timerState.laps.length;

  const isAimAchieved = aimedQuestions > 0 && completedQuestions >= aimedQuestions;
  const remainingQuestionsToAim = Math.max(0, aimedQuestions - completedQuestions);
  const aimProgressPercent = Math.min(100, Math.round((completedQuestions / Math.max(1, aimedQuestions)) * 100));

  // Per-question countdown timer calculations
  const remainingSeconds = targetSeconds - timerState.questionSeconds;
  const isOvertime = isTimerMode && remainingSeconds < 0;
  const isTimeExpiring = isTimerMode && remainingSeconds <= 15 && remainingSeconds >= 0;

  // Session Duration Countdown calculations
  const sessionTarget = timerState.sessionTargetSeconds;
  const hasSessionCountdown = typeof sessionTarget === 'number' && sessionTarget > 0;
  const sessionRemainingSeconds = hasSessionCountdown ? sessionTarget - timerState.totalSeconds : 0;
  const isSessionOvertime = hasSessionCountdown && sessionRemainingSeconds < 0;
  const isSessionExpiring = hasSessionCountdown && sessionRemainingSeconds <= 300 && sessionRemainingSeconds >= 0; // <= 5m
  const sessionProgressPercent = hasSessionCountdown
    ? Math.min(100, Math.round((timerState.totalSeconds / sessionTarget) * 100))
    : 0;

  // Overtime audio chime alert for per-question timer
  useEffect(() => {
    if (isTimerMode && timerState.isActive && !timerState.isPaused) {
      if (remainingSeconds === 0 && !hasAlertedOvertimeRef.current) {
        sounds.playReminderChime();
        hasAlertedOvertimeRef.current = true;
      }
    }
  }, [isTimerMode, timerState.isActive, timerState.isPaused, remainingSeconds]);

  // Session duration expiration chime alert
  useEffect(() => {
    if (hasSessionCountdown && timerState.isActive && !timerState.isPaused) {
      if (sessionRemainingSeconds === 0 && !hasAlertedSessionEndRef.current) {
        sounds.playReminderChime();
        hasAlertedSessionEndRef.current = true;
      }
    }
  }, [hasSessionCountdown, timerState.isActive, timerState.isPaused, sessionRemainingSeconds]);

  // Reset session alert if sessionTarget changes
  useEffect(() => {
    hasAlertedSessionEndRef.current = false;
  }, [sessionTarget]);

  // Reset overtime alert flag on next question
  useEffect(() => {
    hasAlertedOvertimeRef.current = false;
  }, [timerState.currentQuestionNumber]);

  // Check and trigger celebration when Aim is completed
  useEffect(() => {
    if (isAimAchieved && celebratedAimCount !== aimedQuestions && completedQuestions > 0) {
      setCelebratedAimCount(aimedQuestions);
      sounds.playGoalCelebration();
      fireConfettiCelebration();
    }
  }, [isAimAchieved, celebratedAimCount, aimedQuestions, completedQuestions]);

  const subjectConfig = {
    physics: {
      name: 'Physics',
      icon: Atom,
      themeColor: 'sky',
      borderActive: 'border-sky-500 bg-sky-50/70 text-sky-900',
      badge: 'bg-sky-100 text-sky-800 border-sky-300',
      btnAccent: 'bg-sky-600 hover:bg-sky-500 text-white',
      accentText: 'text-sky-600',
    },
    chemistry: {
      name: 'Chemistry',
      icon: FlaskConical,
      themeColor: 'emerald',
      borderActive: 'border-emerald-500 bg-emerald-50/70 text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      btnAccent: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      accentText: 'text-emerald-600',
    },
    math: {
      name: 'Mathematics',
      icon: Binary,
      themeColor: 'amber',
      borderActive: 'border-amber-500 bg-amber-50/70 text-amber-900',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      btnAccent: 'bg-amber-500 hover:bg-amber-600 text-white',
      accentText: 'text-amber-600',
    },
  }[timerState.subject];

  const handleApplyQInput = () => {
    const val = parseInt(qInputVal, 10);
    if (!isNaN(val) && val > 0) {
      onSetQuestionNumber(val);
    } else {
      setQInputVal(String(timerState.currentQuestionNumber));
    }
    setEditingQuestionNumber(false);
  };

  const handleApplyCustomAim = () => {
    const val = parseInt(customAimInput, 10);
    if (!isNaN(val) && val > 0 && val <= 200) {
      onSetAimedQuestions?.(val);
    }
    setIsEditingAim(false);
  };

  const handleApplyCustomTime = () => {
    const mins = parseInt(customMinutesInput, 10) || 0;
    const secs = parseInt(customSecondsInput, 10) || 0;
    const total = mins * 60 + secs;
    if (total >= 10 && total <= 3600) {
      onSetTargetSecondsPerQuestion?.(total);
    }
    setIsEditingCustomTime(false);
  };

  // Compute session statistics from laps
  const totalLaps = timerState.laps.length;
  const avgSeconds =
    totalLaps > 0
      ? Math.round(
          timerState.laps.reduce((acc, lap) => acc + lap.durationSeconds, 0) / totalLaps
        )
      : 0;

  const fastestLap =
    totalLaps > 0
      ? timerState.laps.reduce(
          (fastest, lap) => (lap.durationSeconds < fastest.durationSeconds ? lap : fastest),
          timerState.laps[0]
        )
      : null;

  const slowestLap =
    totalLaps > 0
      ? timerState.laps.reduce(
          (slowest, lap) => (lap.durationSeconds > slowest.durationSeconds ? lap : slowest),
          timerState.laps[0]
        )
      : null;

  // Estimated time remaining to reach aim
  const estimatedSecondsToFinishAim = isTimerMode
    ? remainingQuestionsToAim * targetSeconds
    : remainingQuestionsToAim * (avgSeconds || 120);

  // Add session question count and elapsed minutes to today's daily log
  const handleAddToDailyLog = () => {
    if (totalLaps === 0) return;
    sounds.playGoalCelebration();

    const currentCount = todayRecord[timerState.subject] || 0;
    const currentSubjectDur = todayRecord.durationMinutes?.[timerState.subject] || 0;
    const sessionMinutes = Math.round(timerState.totalSeconds / 60);

    const updated = {
      ...todayRecord,
      [timerState.subject]: currentCount + totalLaps,
      durationMinutes: {
        ...(todayRecord.durationMinutes || {}),
        [timerState.subject]: currentSubjectDur + sessionMinutes,
      },
      updatedAt: Date.now(),
    };

    onSaveRecord(updated);

    setAddedToast(
      `Added +${totalLaps} solved questions${sessionMinutes > 0 ? ` & +${sessionMinutes}m study time` : ''} to today's ${subjectConfig.name} log! (Total now: ${
        currentCount + totalLaps
      } questions)`
    );
    setTimeout(() => {
      setAddedToast(null);
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {addedToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{addedToast}</span>
          </div>
          <button
            onClick={() => setAddedToast(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Timer Workspace Card */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-8 space-y-6">
        {/* Header Bar: Mode Switcher (Stopwatch vs Timer) & Subject Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                JEE Practice Studio
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                isTimerMode ? 'bg-indigo-100 text-indigo-800' : 'bg-sky-100 text-sky-800'
              }`}>
                {isTimerMode ? '⏳ Countdown Timer Active' : '⏱️ Stopwatch Mode'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{isTimerMode ? 'Question Countdown Timer' : 'Question Stopwatch'}</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Switcher: Stopwatch vs Timer */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => onSetTimerMode?.('stopwatch')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  !isTimerMode
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Count Up: Measure exact time spent on each question"
              >
                <Clock className="w-4 h-4 text-sky-600" />
                <span>⏱️ Stopwatch</span>
              </button>

              <button
                type="button"
                onClick={() => onSetTimerMode?.('timer')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isTimerMode
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Countdown: Practice under strict timed pace per question"
              >
                <Hourglass className="w-4 h-4 text-amber-300" />
                <span>⏳ Timer (Countdown)</span>
              </button>
            </div>

            {/* Subject Selector Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              {(
                [
                  { id: 'physics', label: 'Physics', icon: Atom },
                  { id: 'chemistry', label: 'Chemistry', icon: FlaskConical },
                  { id: 'math', label: 'Math', icon: Binary },
                ] as const
              ).map((sub) => {
                const Icon = sub.icon;
                const isSelected = timerState.subject === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => onSetSubject(sub.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? sub.id === 'physics'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : sub.id === 'chemistry'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🎯 OPTION IN THE TIMER TO AIM THE NUMBER OF QUESTIONS (Target Question Aim) */}
        {/* ========================================================================= */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 space-y-3.5 ${
          isAimAchieved
            ? 'bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/80 border-emerald-300 ring-2 ring-emerald-400/30 shadow-md'
            : 'bg-slate-50/90 border-slate-200/90'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl shrink-0 transition-transform ${
                isAimAchieved
                  ? 'bg-emerald-600 text-white scale-110 shadow-xs'
                  : 'bg-indigo-600 text-white shadow-xs'
              }`}>
                <Target className="w-5 h-5" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>Aim for Number of Questions</span>
                  </h3>
                  {isAimAchieved ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white animate-pulse shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Aim Complete! ({aimedQuestions}/{aimedQuestions})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      Target: {aimedQuestions} Questions
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set how many questions you aim to solve in this session to track your live goal completion.
                </p>
              </div>
            </div>

            {/* Quick Aim Presets & Custom Input */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              <span className="text-[11px] font-bold text-slate-400 mr-0.5">Aim:</span>
              {[10, 15, 20, 25, 30, 45, 50].map((presetCount) => (
                <button
                  key={presetCount}
                  type="button"
                  onClick={() => onSetAimedQuestions?.(presetCount)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    aimedQuestions === presetCount
                      ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500'
                      : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                  }`}
                >
                  {presetCount} Qs
                </button>
              ))}

              {isEditingAim ? (
                <div className="inline-flex items-center gap-1 bg-white p-0.5 rounded-lg border border-indigo-400">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={customAimInput}
                    onChange={(e) => setCustomAimInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomAim()}
                    autoFocus
                    className="w-12 px-1 text-xs font-bold text-center outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomAim}
                    className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold cursor-pointer"
                  >
                    Set
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCustomAimInput(String(aimedQuestions));
                    setIsEditingAim(true);
                  }}
                  className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold cursor-pointer"
                  title="Enter custom question aim"
                >
                  Custom
                </button>
              )}
            </div>
          </div>

          {/* Aim Progress Bar & Remaining Counter */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Progress Toward Aim:</span>
                <span className="font-mono font-bold text-slate-900">
                  {completedQuestions} / {aimedQuestions} Questions Solved
                </span>
              </span>
              <span className={`font-mono font-bold ${isAimAchieved ? 'text-emerald-700 font-black' : 'text-indigo-700'}`}>
                {aimProgressPercent}%
              </span>
            </div>

            {/* Smooth animated progress bar */}
            <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden p-0.5 border border-slate-300/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isAimAchieved
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-xs animate-pulse'
                    : 'bg-gradient-to-r from-indigo-500 via-sky-500 to-blue-600'
                }`}
                style={{ width: `${aimProgressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-0.5">
              <span>
                {isAimAchieved ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Target aim of {aimedQuestions} questions achieved! Feel free to push beyond.
                  </span>
                ) : (
                  <span>
                    <strong>{remainingQuestionsToAim}</strong> more questions to complete your session aim
                  </span>
                )}
              </span>

              {remainingQuestionsToAim > 0 && (
                <span className="text-slate-400">
                  Est. time left: ~{formatHumanDuration(estimatedSecondsToFinishAim)}
                </span>
              )}
            </div>
          </div>

          {/* Celebratory Banner on Aim Accomplishment */}
          {isAimAchieved && (
            <div className="mt-2 p-3 rounded-xl bg-emerald-100/80 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className="text-xs font-bold">
                  🎉 Aim target accomplished! Solved {completedQuestions} questions in {formatTimeWithHours(timerState.totalSeconds)}.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playGoalCelebration();
                    fireConfettiCelebration();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-2xs"
                >
                  🎉 Confetti!
                </button>
                <button
                  type="button"
                  onClick={() => onSetAimedQuestions?.(aimedQuestions + 5)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs cursor-pointer"
                  title="Aim for 5 more questions"
                >
                  +5 Qs Aim
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ⏳ TOTAL SESSION COUNTDOWN TIMER (Overall Study Session Limit Options)   */}
        {/* ========================================================================= */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 space-y-3.5 ${
          isSessionOvertime
            ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/20'
            : isSessionExpiring
            ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20'
            : hasSessionCountdown
            ? 'bg-indigo-50/70 border-indigo-200'
            : 'bg-slate-50/80 border-slate-200/80'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl shrink-0 transition-transform ${
                isSessionOvertime
                  ? 'bg-rose-600 text-white'
                  : isSessionExpiring
                  ? 'bg-amber-500 text-white animate-pulse'
                  : hasSessionCountdown
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-700 text-white'
              }`}>
                <Clock className="w-5 h-5" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>Total Session Countdown Timer</span>
                  </h3>
                  {hasSessionCountdown ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isSessionOvertime
                        ? 'bg-rose-600 text-white animate-pulse'
                        : isSessionExpiring
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {isSessionOvertime
                        ? `Session Time Limit Exceeded (+${formatTimeWithHours(Math.abs(sessionRemainingSeconds))})`
                        : `⏳ Countdown: ${formatTimeWithHours(sessionRemainingSeconds)} Remaining`}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
                      Standard Count-Up (No Limit)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set an overall practice block countdown limit with audio chime alert when time completes.
                </p>
              </div>
            </div>

            {/* Session Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              <span className="text-[11px] font-bold text-slate-400 mr-0.5">Session:</span>
              {SESSION_DURATION_OPTIONS.map((opt) => {
                const isSelected = sessionTarget === opt.secs;
                return (
                  <button
                    key={opt.secs}
                    type="button"
                    onClick={() => onSetSessionTargetSeconds?.(isSelected ? undefined : opt.secs)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500 font-black'
                        : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                    }`}
                    title={opt.desc}
                  >
                    {opt.label}
                  </button>
                );
              })}

              {/* No limit button */}
              <button
                type="button"
                onClick={() => onSetSessionTargetSeconds?.(undefined)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  !hasSessionCountdown
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
                title="Count up with no overall session time limit"
              >
                No Limit
              </button>
            </div>
          </div>

          {/* Session Progress Bar when countdown is active */}
          {hasSessionCountdown && (
            <div className="space-y-1.5 pt-1 border-t border-indigo-100/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>Session Countdown Progress:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatTimeWithHours(timerState.totalSeconds)} / {formatHumanDuration(sessionTarget!)}
                  </span>
                </span>
                <span className={`font-mono font-bold ${
                  isSessionOvertime ? 'text-rose-600' : isSessionExpiring ? 'text-amber-600' : 'text-indigo-700'
                }`}>
                  {isSessionOvertime ? '100% (Overtime)' : `${sessionProgressPercent}%`}
                </span>
              </div>

              <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-300/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isSessionOvertime
                      ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                      : isSessionExpiring
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse'
                      : 'bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500'
                  }`}
                  style={{ width: `${sessionProgressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>
                  {isSessionOvertime ? (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Session countdown time reached! Overtime: +{formatTimeWithHours(Math.abs(sessionRemainingSeconds))}
                    </span>
                  ) : (
                    <span>
                      Countdown Remaining:{' '}
                      <strong className="text-slate-800 font-mono font-bold">
                        {formatTimeWithHours(sessionRemainingSeconds)}
                      </strong>{' '}
                      out of {formatHumanDuration(sessionTarget!)}
                    </span>
                  )}
                </span>
                <span className="text-slate-400">
                  Target: {formatHumanDuration(sessionTarget!)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ⏳ TIMER MODE SETTINGS (Target Time per Question Countdown Configuration) */}
        {/* ========================================================================= */}
        {isTimerMode && (
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-indigo-700" />
                <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                  Countdown Time Limit per Question:
                </span>
                <span className="font-mono font-bold text-indigo-900 text-xs px-2 py-0.5 rounded-md bg-white border border-indigo-200">
                  {formatDigitalTime(targetSeconds)} ({Math.floor(targetSeconds / 60)}m {targetSeconds % 60 ? `${targetSeconds % 60}s` : ''})
                </span>
              </div>

              {/* Target Time Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: '1m 30s', secs: 90, desc: 'Speed Drill' },
                  { label: '2m 00s', secs: 120, desc: 'JEE Main' },
                  { label: '3m 00s', secs: 180, desc: 'JEE Adv' },
                  { label: '4m 00s', secs: 240, desc: 'Complex' },
                  { label: '5m 00s', secs: 300, desc: 'Deep' },
                ].map((preset) => (
                  <button
                    key={preset.secs}
                    type="button"
                    onClick={() => onSetTargetSecondsPerQuestion?.(preset.secs)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      targetSeconds === preset.secs
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200'
                    }`}
                    title={preset.desc}
                  >
                    {preset.label}
                  </button>
                ))}

                {isEditingCustomTime ? (
                  <div className="inline-flex items-center gap-1 bg-white p-0.5 rounded-lg border border-indigo-400">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={customMinutesInput}
                      onChange={(e) => setCustomMinutesInput(e.target.value)}
                      placeholder="min"
                      className="w-8 px-1 text-xs font-bold text-center outline-hidden"
                    />
                    <span className="text-xs text-slate-400">:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={customSecondsInput}
                      onChange={(e) => setCustomSecondsInput(e.target.value)}
                      placeholder="sec"
                      className="w-8 px-1 text-xs font-bold text-center outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomTime}
                      className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold cursor-pointer"
                    >
                      Set
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMinutesInput(String(Math.floor(targetSeconds / 60)));
                      setCustomSecondsInput(String(targetSeconds % 60));
                      setIsEditingCustomTime(true);
                    }}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold cursor-pointer"
                  >
                    Custom Time
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-indigo-800/80">
              The clock will count down from {formatDigitalTime(targetSeconds)} on every question and alert you if you exceed the allotted time limit.
            </p>
          </div>
        )}

        {/* Step: Question Stepper & Active Question */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${subjectConfig.badge} font-bold text-sm flex items-center gap-1.5`}
            >
              <subjectConfig.icon className="w-5 h-5" />
              <span>{subjectConfig.name}</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Currently Solving:</span>
                {editingQuestionNumber ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={qInputVal}
                      onChange={(e) => setQInputVal(e.target.value)}
                      onBlur={handleApplyQInput}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyQInput()}
                      autoFocus
                      className="w-16 px-2 py-0.5 text-sm font-bold bg-white rounded-lg border border-sky-400 outline-hidden"
                    />
                    <button
                      onClick={handleApplyQInput}
                      className="px-2 py-0.5 rounded-md bg-sky-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Set
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setQInputVal(String(timerState.currentQuestionNumber));
                      setEditingQuestionNumber(true);
                    }}
                    className="group inline-flex items-center gap-1.5 text-base sm:text-lg font-black text-slate-900 hover:text-sky-600 cursor-pointer transition"
                    title="Click to change starting or current question number"
                  >
                    <span>Question #{timerState.currentQuestionNumber}</span>
                    {aimedQuestions > 0 && (
                      <span className="text-xs text-slate-500 font-semibold">
                        of {aimedQuestions} (Aim)
                      </span>
                    )}
                    <span className="text-[11px] font-medium text-slate-400 group-hover:text-sky-500 underline underline-offset-2">
                      (change)
                    </span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">
                You can change the question number anytime to match your PDF or workbook.
              </p>
            </div>
          </div>

          {/* Stepper buttons & PiP launch */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSetQuestionNumber(Math.max(1, timerState.currentQuestionNumber - 1))}
              disabled={timerState.currentQuestionNumber <= 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-700 flex items-center gap-1 transition cursor-pointer"
              title="Previous Question Number"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev Q</span>
            </button>

            <button
              onClick={() => onSetQuestionNumber(timerState.currentQuestionNumber + 1)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1 transition cursor-pointer"
              title="Skip or jump to next Question Number"
            >
              <span>Next Q</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Always-on-top PiP Floating Stopwatch */}
            {onLaunchPiP && (
              <button
                onClick={onLaunchPiP}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                  isPiPActive
                    ? 'bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-400'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
                title="Always-on-top window: floats on top of external PDFs or any desktop apps"
              >
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                <span>{isPiPActive ? '🟢 PiP Active (Floating)' : '🪟 Launch PiP Window'}</span>
              </button>
            )}

            {/* In-App PDF Toggle Button */}
            <button
              onClick={() => setShowInAppPdf(!showInAppPdf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                showInAppPdf
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Open your question PDF right here inside the app"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showInAppPdf ? 'Hide PDF' : 'Open PDF'}</span>
            </button>
          </div>
        </div>

        {/* Big Dual Timer Arena */}
        <div className={`rounded-3xl border p-6 sm:p-10 text-center relative overflow-hidden transition-all duration-300 ${
          isOvertime
            ? 'bg-gradient-to-b from-rose-50/80 via-white to-white border-rose-300'
            : isTimeExpiring
            ? 'bg-gradient-to-b from-amber-50/80 via-white to-white border-amber-300'
            : 'bg-gradient-to-b from-slate-50 to-white border-slate-200'
        }`}>
          {/* Subtle pulse effect */}
          {timerState.isActive && !timerState.isPaused && (
            <div className={`absolute inset-0 pointer-events-none animate-pulse ${
              isOvertime ? 'bg-rose-500/5' : isTimeExpiring ? 'bg-amber-500/5' : 'bg-sky-500/5'
            }`} />
          )}

          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
              {subjectConfig.name} • Question #{timerState.currentQuestionNumber} {isTimerMode ? 'Countdown Pace Limit' : 'Live Second Timer'}
            </span>
            {timerState.isPaused && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-xs">
                PAUSED
              </span>
            )}
            {isOvertime && (
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-xs animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Question Overtime
              </span>
            )}
          </div>

          {/* Primary Big Display (Per-Question Second Timer) */}
          <div className={`font-mono text-6xl sm:text-7xl md:text-8xl font-black tracking-tight select-none py-2 transition-colors ${
            isOvertime
              ? 'text-rose-600'
              : isTimeExpiring
              ? 'text-amber-600'
              : 'text-slate-900'
          }`}>
            {isTimerMode ? (
              isOvertime ? (
                `+${formatDigitalTime(Math.abs(remainingSeconds))}`
              ) : (
                formatDigitalTime(Math.max(0, remainingSeconds))
              )
            ) : (
              formatDigitalTime(timerState.questionSeconds)
            )}
          </div>

          <div className="text-xs sm:text-sm font-medium text-slate-500">
            {isTimerMode ? (
              isOvertime ? (
                <span className="text-rose-600 font-bold">
                  Exceeded target pace limit by {Math.abs(remainingSeconds)}s on Question #{timerState.currentQuestionNumber}
                </span>
              ) : (
                <span>
                  {Math.max(0, remainingSeconds)}s countdown remaining on this question (Limit: {formatDigitalTime(targetSeconds)} / Q)
                </span>
              )
            ) : (
              <span>
                <strong className="text-slate-700">{timerState.questionSeconds} seconds</strong> spent on Question #{timerState.currentQuestionNumber}
              </span>
            )}
          </div>

          {/* Secondary Dual Indicators: Session Countdown Timer & Questions Countdown */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
            {/* Total Session Countdown Timer or Cumulative Session Time */}
            {hasSessionCountdown ? (
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-medium transition-colors ${
                isSessionOvertime
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : isSessionExpiring
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              }`}>
                <Hourglass className={`w-4 h-4 ${isSessionOvertime ? 'text-rose-600' : 'text-indigo-600'}`} />
                <span>Session Countdown:</span>
                <span className="font-mono font-black">
                  {isSessionOvertime
                    ? `+${formatTimeWithHours(Math.abs(sessionRemainingSeconds))} (Overtime)`
                    : `${formatTimeWithHours(sessionRemainingSeconds)} left`}
                </span>
                <span className="text-[11px] opacity-75">
                  / {formatHumanDuration(sessionTarget!)}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-xs sm:text-sm font-medium text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Cumulative Session:</span>
                <span className="font-mono font-black text-slate-900">
                  {formatTimeWithHours(timerState.totalSeconds)}
                </span>
                <span className="text-[11px] text-slate-400">
                  ({formatHumanDuration(timerState.totalSeconds)})
                </span>
              </div>
            )}

            {/* Total Questions Countdown Ticker */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-xs sm:text-sm font-medium text-sky-900">
              <Target className="w-4 h-4 text-sky-600" />
              <span>Questions Countdown:</span>
              <span className="font-mono font-black">
                {remainingQuestionsToAim > 0 ? `${remainingQuestionsToAim} Qs left` : 'Aim Met! ✓'}
              </span>
              <span className="text-[11px] text-sky-700">
                ({completedQuestions}/{aimedQuestions} done)
              </span>
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {/* Play / Pause */}
            <button
              onClick={onPlayPause}
              className={`px-6 py-3.5 rounded-2xl font-black text-sm sm:text-base flex items-center gap-2 transition cursor-pointer shadow-md ${
                timerState.isActive && !timerState.isPaused
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {timerState.isActive && !timerState.isPaused ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause Timer</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>{timerState.isActive ? 'Resume Timer' : 'Start Timer'}</span>
                </>
              )}
            </button>

            {/* Next Question (→) Primary Action */}
            <button
              onClick={onNextQuestion}
              className="px-7 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-98 text-white font-black text-sm sm:text-base flex items-center gap-2.5 transition cursor-pointer shadow-md shadow-sky-600/20"
              title="Record this question's time and immediately start the next question"
            >
              <span>Next Question</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Reset current question timer */}
            <button
              onClick={onResetQuestion}
              className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Reset current question timer"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>Reset Current Q</span>
            </button>

            {/* Reset entire session */}
            <button
              onClick={() => {
                if (window.confirm('Reset this entire timer session and start fresh from Q1?')) {
                  onResetSession();
                }
              }}
              className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Clear all question splits and reset total timer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Session</span>
            </button>
          </div>
        </div>

        {/* Embedded In-App Question PDF Viewer */}
        {showInAppPdf && (
          <InAppPdfViewer onClose={() => setShowInAppPdf(false)} />
        )}
      </div>

      {/* Solved Questions History & Pace Breakdown */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Question Split Times ({totalLaps} Solved)
              </h3>
              {totalLaps > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {totalLaps} Questions
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact seconds and minutes spent on each question during this practice session.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {totalLaps > 0 && (
              <>
                <button
                  onClick={handleAddToDailyLog}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="Add completed questions directly to today's daily log"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Add +{totalLaps} to Today&apos;s {subjectConfig.name}</span>
                </button>

                <button
                  onClick={onClearLaps}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                  title="Clear question laps list"
                >
                  Clear Splits
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary Metric Tiles */}
        {totalLaps > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Solved</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalLaps}</div>
              <span className="text-[11px] text-slate-500">
                {aimedQuestions > 0 ? `of ${aimedQuestions} Aimed` : 'questions'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Average Pace</span>
              <div className="text-2xl font-black text-sky-700 mt-1">
                {formatHumanDuration(avgSeconds)}
              </div>
              <span className="text-[11px] text-slate-500">per question</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Fastest Question</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {fastestLap ? formatHumanDuration(fastestLap.durationSeconds) : '-'}
              </div>
              <span className="text-[11px] text-slate-500">
                {fastestLap ? `Question #${fastestLap.questionNumber}` : '-'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Slowest Question</span>
              <div className="text-2xl font-black text-amber-700 mt-1">
                {slowestLap ? formatHumanDuration(slowestLap.durationSeconds) : '-'}
              </div>
              <span className="text-[11px] text-slate-500">
                {slowestLap ? `Question #${slowestLap.questionNumber}` : '-'}
              </span>
            </div>
          </div>
        )}

        {/* Laps List */}
        {totalLaps === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No question splits recorded yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Start the timer, solve your question, and click &quot;Next Question&quot; to automatically record and track question pace.
            </p>
          </div>
        ) : (
          <div className="space-y-2 mt-4 max-h-96 overflow-y-auto pr-1">
            {timerState.laps.map((lap, idx) => {
              const pace = getPaceInfo(lap.durationSeconds);
              return (
                <div
                  key={`${lap.questionNumber}-${lap.timestamp}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-200/80 font-bold text-xs flex items-center justify-center text-slate-700">
                      {totalLaps - idx}
                    </span>
                    <div>
                      <span className="text-sm font-black text-slate-900">
                        Question #{lap.questionNumber}
                      </span>
                      <span className="text-xs text-slate-500 ml-2 uppercase font-medium">
                        {lap.subject}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${pace.color}`}
                    >
                      {pace.label}
                    </span>
                    <span className="font-mono text-base font-black text-slate-900 min-w-16 text-right">
                      {formatDigitalTime(lap.durationSeconds)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
