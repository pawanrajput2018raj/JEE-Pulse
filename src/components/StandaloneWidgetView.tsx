import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Minus,
  Atom,
  FlaskConical,
  Calculator,
  CheckCircle2,
  ExternalLink,
  Tv,
} from 'lucide-react';
import { SubjectType, DailyRecord, QuestionTimerState, AppStateData } from '../types';
import { formatDigitalTime } from '../utils/timerUtils';
import { sounds } from '../utils/soundEffects';
import { loadAppState, saveAppState } from '../utils/storage';
import { getTodayStr } from '../utils/dateUtils';
import { broadcastWidgetUpdate, subscribeWidgetUpdates } from '../utils/widgetSync';
import { fireSubtleGoalConfetti } from '../utils/badges';
import { computeAnalytics } from '../utils/analytics';

export const StandaloneWidgetView: React.FC = () => {
  const [appState, setAppState] = useState<AppStateData>(() => loadAppState());
  const todayStr = getTodayStr();

  // Local question timer state for standalone window
  const [timerState, setTimerState] = useState<QuestionTimerState>(() => {
    try {
      const saved = localStorage.getItem('jee_question_timer_session_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return {
      subject: 'physics',
      currentQuestionNumber: 1,
      questionSeconds: 0,
      totalSeconds: 0,
      isActive: false,
      isPaused: false,
      laps: [],
      isFloating: false,
    };
  });

  const [activeTab, setActiveTab] = useState<'counters' | 'timer' | 'notes'>('counters');
  const [notesText, setNotesText] = useState('');

  // Synchronize on storage changes and broadcast channel
  useEffect(() => {
    const unsubscribe = subscribeWidgetUpdates((msg) => {
      if (msg.type === 'RECORD_UPDATED') {
        setAppState((prev) => ({
          ...prev,
          records: { ...prev.records, [msg.record.date]: msg.record },
        }));
      } else if (msg.type === 'RELOAD_REQUEST') {
        setAppState(loadAppState());
      } else if (msg.type === 'PARENT_CLOSED') {
        window.close();
      }
    });

    // Check if parent window is closed; if so, close the widget window automatically
    const openerCheckInterval = setInterval(() => {
      try {
        if (!window.opener || window.opener.closed) {
          window.close();
        }
      } catch {
        window.close();
      }
    }, 500);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pcm_question_tracker_state_v1') {
        setAppState(loadAppState());
      }
      if (e.key === 'jee_question_timer_session_v1' && e.newValue) {
        try {
          setTimerState(JSON.parse(e.newValue));
        } catch (err) {
          console.warn(err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribe();
      clearInterval(openerCheckInterval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Timer tick
  useEffect(() => {
    if (!timerState.isActive || timerState.isPaused) return;
    const interval = setInterval(() => {
      setTimerState((prev) => {
        const next = {
          ...prev,
          questionSeconds: prev.questionSeconds + 1,
          totalSeconds: prev.totalSeconds + 1,
        };
        try {
          localStorage.setItem('jee_question_timer_session_v1', JSON.stringify(next));
        } catch (e) {
          console.warn(e);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.isActive, timerState.isPaused]);

  const currentRecord: DailyRecord = appState.records[todayStr] || {
    date: todayStr,
    physics: 0,
    chemistry: 0,
    math: 0,
    notes: '',
    updatedAt: Date.now(),
  };

  useEffect(() => {
    setNotesText(currentRecord.notes || '');
  }, [currentRecord.notes]);

  const goals = appState.goals;
  const analytics = useMemo(() => computeAnalytics(appState), [appState]);

  const todayTotal = (currentRecord.physics || 0) + (currentRecord.chemistry || 0) + (currentRecord.math || 0);
  const dailyTarget = goals.total || 75;
  const streakTarget = goals.streakTarget || 30;
  const goalPercent = Math.min(100, Math.round((todayTotal / dailyTarget) * 100));

  const physicsStreak = analytics.subjectStreaks?.physics || {
    subject: 'physics',
    currentStreak: 0,
    longestStreak: 0,
    todayCount: currentRecord.physics || 0,
    target: 10,
    todayProgress: Math.min(100, Math.round(((currentRecord.physics || 0) / 10) * 100)),
    targetMetToday: (currentRecord.physics || 0) >= 10,
  };
  const chemistryStreak = analytics.subjectStreaks?.chemistry || {
    subject: 'chemistry',
    currentStreak: 0,
    longestStreak: 0,
    todayCount: currentRecord.chemistry || 0,
    target: 10,
    todayProgress: Math.min(100, Math.round(((currentRecord.chemistry || 0) / 10) * 100)),
    targetMetToday: (currentRecord.chemistry || 0) >= 10,
  };
  const mathStreak = analytics.subjectStreaks?.math || {
    subject: 'math',
    currentStreak: 0,
    longestStreak: 0,
    todayCount: currentRecord.math || 0,
    target: 10,
    todayProgress: Math.min(100, Math.round(((currentRecord.math || 0) / 10) * 100)),
    targetMetToday: (currentRecord.math || 0) >= 10,
  };

  const saveRecord = (updated: DailyRecord) => {
    const newState: AppStateData = {
      ...appState,
      records: {
        ...appState.records,
        [updated.date]: updated,
      },
      lastUpdated: Date.now(),
    };
    setAppState(newState);
    saveAppState(newState);
    broadcastWidgetUpdate({ type: 'RECORD_UPDATED', record: updated });
  };

  const handleAdjustSubject = (subject: SubjectType, delta: number) => {
    const currentVal = currentRecord[subject] || 0;
    const nextVal = Math.max(0, currentVal + delta);
    const oldTotal = todayTotal;
    const newTotal = oldTotal + (nextVal - currentVal);

    sounds.playClick();
    const subTarget = analytics.subjectStreaks?.[subject]?.target || 10;
    if (delta > 0 && nextVal >= subTarget && currentVal < subTarget) {
      sounds.playGoalCelebration();
      fireSubtleGoalConfetti();
    } else if (delta > 0 && newTotal >= dailyTarget && oldTotal < dailyTarget) {
      sounds.playGoalCelebration();
      fireSubtleGoalConfetti();
    } else if (delta > 0 && newTotal >= streakTarget && oldTotal < streakTarget) {
      sounds.playGoalCelebration();
      fireSubtleGoalConfetti();
    }

    const updated: DailyRecord = {
      ...currentRecord,
      [subject]: nextVal,
      updatedAt: Date.now(),
    };
    saveRecord(updated);
  };

  // Timer controls
  const togglePlayPause = () => {
    sounds.playClick();
    setTimerState((prev) => {
      const next = {
        ...prev,
        isActive: true,
        isPaused: !prev.isPaused,
      };
      localStorage.setItem('jee_question_timer_session_v1', JSON.stringify(next));
      return next;
    });
  };

  const handleNextQuestion = () => {
    sounds.playNextQuestion();
    setTimerState((prev) => {
      const next = {
        ...prev,
        currentQuestionNumber: prev.currentQuestionNumber + 1,
        questionSeconds: 0,
        isActive: true,
        isPaused: false,
      };
      localStorage.setItem('jee_question_timer_session_v1', JSON.stringify(next));
      return next;
    });
  };

  const handleResetQuestion = () => {
    sounds.playClick();
    setTimerState((prev) => {
      const next = { ...prev, questionSeconds: 0 };
      localStorage.setItem('jee_question_timer_session_v1', JSON.stringify(next));
      return next;
    });
  };

  const handleOpenFullDashboard = () => {
    if (window.opener && !window.opener.closed) {
      window.opener.focus();
    } else {
      window.open(window.location.origin, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col p-3 select-none">
      {/* Title Bar */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-sky-600" />
          <span className="font-bold text-xs tracking-tight text-slate-900">JEE Desktop Study Widget</span>
        </div>
        <button
          onClick={handleOpenFullDashboard}
          className="flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700 font-medium cursor-pointer"
          title="Switch to full dashboard"
        >
          <span>Full App</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Progress & Streak Card */}
      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke={todayTotal >= dailyTarget ? '#10b981' : '#0284c7'}
                strokeWidth="3"
                strokeDasharray="94.2"
                strokeDashoffset={94.2 - (94.2 * goalPercent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute font-mono text-[10px] font-bold text-slate-800">{goalPercent}%</div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 font-mono">
              {todayTotal} <span className="text-slate-500 font-normal">/ {dailyTarget} Qs</span>
            </div>
            <div className="text-[10px] text-slate-500">
              {todayTotal >= dailyTarget ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 inline" /> Goal Achieved!
                </span>
              ) : (
                <span>{dailyTarget - todayTotal} questions remaining</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
          <span>{todayTotal >= streakTarget ? 'Streak Safe 🔥' : `${streakTarget - todayTotal} left`}</span>
        </div>
      </div>

      {/* Subject Consistency Streaks with Small Progress Rings */}
      <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 mb-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 px-0.5">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
            <span>Subject Consistency Streaks</span>
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Daily Targets</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {/* Physics Progress Ring */}
          <div
            className={`p-2 rounded-xl border flex items-center gap-2 transition ${
              physicsStreak.targetMetToday ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-200' : 'bg-white border-slate-200'
            }`}
            title={`Physics Consistency Streak: ${physicsStreak.currentStreak}d. Today: ${currentRecord.physics || 0}/${physicsStreak.target} Qs (${physicsStreak.todayProgress}%)${physicsStreak.targetMetToday ? ' - Safe! 🔥' : ''}`}
          >
            <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#e0f2fe" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke={physicsStreak.targetMetToday ? '#0284c7' : '#38bdf8'}
                  strokeWidth="3.5"
                  strokeDasharray="87.96"
                  strokeDashoffset={87.96 - (87.96 * physicsStreak.todayProgress) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute font-mono text-[9px] font-bold text-sky-950">
                {physicsStreak.currentStreak}d
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-sky-800">Phy</span>
                {physicsStreak.targetMetToday ? (
                  <span className="text-[9px] font-bold text-sky-600">✓</span>
                ) : (
                  <span className="text-[9px] font-mono text-slate-400">{currentRecord.physics || 0}/{physicsStreak.target}</span>
                )}
              </div>
              <div className="text-[9px] font-medium truncate leading-tight mt-0.5">
                {physicsStreak.targetMetToday ? (
                  <span className="text-sky-700 font-bold">Safe 🔥</span>
                ) : (
                  <span className="text-slate-500">{Math.max(0, physicsStreak.target - (currentRecord.physics || 0))} left</span>
                )}
              </div>
            </div>
          </div>

          {/* Chemistry Progress Ring */}
          <div
            className={`p-2 rounded-xl border flex items-center gap-2 transition ${
              chemistryStreak.targetMetToday ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200' : 'bg-white border-slate-200'
            }`}
            title={`Chemistry Consistency Streak: ${chemistryStreak.currentStreak}d. Today: ${currentRecord.chemistry || 0}/${chemistryStreak.target} Qs (${chemistryStreak.todayProgress}%)${chemistryStreak.targetMetToday ? ' - Safe! 🔥' : ''}`}
          >
            <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#d1fae5" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke={chemistryStreak.targetMetToday ? '#059669' : '#34d399'}
                  strokeWidth="3.5"
                  strokeDasharray="87.96"
                  strokeDashoffset={87.96 - (87.96 * chemistryStreak.todayProgress) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute font-mono text-[9px] font-bold text-emerald-950">
                {chemistryStreak.currentStreak}d
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800">Chem</span>
                {chemistryStreak.targetMetToday ? (
                  <span className="text-[9px] font-bold text-emerald-600">✓</span>
                ) : (
                  <span className="text-[9px] font-mono text-slate-400">{currentRecord.chemistry || 0}/{chemistryStreak.target}</span>
                )}
              </div>
              <div className="text-[9px] font-medium truncate leading-tight mt-0.5">
                {chemistryStreak.targetMetToday ? (
                  <span className="text-emerald-700 font-bold">Safe 🔥</span>
                ) : (
                  <span className="text-slate-500">{Math.max(0, chemistryStreak.target - (currentRecord.chemistry || 0))} left</span>
                )}
              </div>
            </div>
          </div>

          {/* Math Progress Ring */}
          <div
            className={`p-2 rounded-xl border flex items-center gap-2 transition ${
              mathStreak.targetMetToday ? 'bg-violet-50 border-violet-300 ring-1 ring-violet-200' : 'bg-white border-slate-200'
            }`}
            title={`Math Consistency Streak: ${mathStreak.currentStreak}d. Today: ${currentRecord.math || 0}/${mathStreak.target} Qs (${mathStreak.todayProgress}%)${mathStreak.targetMetToday ? ' - Safe! 🔥' : ''}`}
          >
            <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#ede9fe" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke={mathStreak.targetMetToday ? '#7c3aed' : '#a78bfa'}
                  strokeWidth="3.5"
                  strokeDasharray="87.96"
                  strokeDashoffset={87.96 - (87.96 * mathStreak.todayProgress) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute font-mono text-[9px] font-bold text-violet-950">
                {mathStreak.currentStreak}d
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-violet-800">Math</span>
                {mathStreak.targetMetToday ? (
                  <span className="text-[9px] font-bold text-violet-600">✓</span>
                ) : (
                  <span className="text-[9px] font-mono text-slate-400">{currentRecord.math || 0}/{mathStreak.target}</span>
                )}
              </div>
              <div className="text-[9px] font-medium truncate leading-tight mt-0.5">
                {mathStreak.targetMetToday ? (
                  <span className="text-violet-700 font-bold">Safe 🔥</span>
                ) : (
                  <span className="text-slate-500">{Math.max(0, mathStreak.target - (currentRecord.math || 0))} left</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 mb-3">
        <button
          onClick={() => setActiveTab('counters')}
          className={`flex-1 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeTab === 'counters' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Quick Log
        </button>
        <button
          onClick={() => setActiveTab('timer')}
          className={`flex-1 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeTab === 'timer' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Stopwatch
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeTab === 'notes' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Notes
        </button>
      </div>

      {/* Tab 1: Subject Counters */}
      {activeTab === 'counters' && (
        <div className="space-y-2.5 flex-1">
          {/* Physics */}
          <div className="bg-sky-50/60 p-2.5 rounded-2xl border border-sky-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Mini Progress Ring in Card */}
              <div
                className="relative w-7 h-7 flex-shrink-0 flex items-center justify-center"
                title={`Physics consistency streak: ${physicsStreak.currentStreak}d (${physicsStreak.todayProgress}% today)`}
              >
                <svg className="w-7 h-7 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#bae6fd" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={physicsStreak.targetMetToday ? '#0284c7' : '#38bdf8'}
                    strokeWidth="4"
                    strokeDasharray="87.96"
                    strokeDashoffset={87.96 - (87.96 * physicsStreak.todayProgress) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute font-mono text-[8px] font-bold text-sky-950">
                  {physicsStreak.currentStreak}d
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-sky-900 flex items-center gap-1">
                  <Atom className="w-3.5 h-3.5 text-sky-600" /> Physics
                </div>
                <div className="text-sm font-mono font-bold text-slate-900">{currentRecord.physics || 0} Qs</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleAdjustSubject('physics', 1)}
                className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs cursor-pointer shadow-2xs"
              >
                +1
              </button>
              <button
                onClick={() => handleAdjustSubject('physics', 5)}
                className="px-2.5 py-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 border border-sky-300 text-sky-800 font-bold text-xs cursor-pointer"
              >
                +5
              </button>
              <button
                onClick={() => handleAdjustSubject('physics', -1)}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 text-xs cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Chemistry */}
          <div className="bg-emerald-50/60 p-2.5 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Mini Progress Ring in Card */}
              <div
                className="relative w-7 h-7 flex-shrink-0 flex items-center justify-center"
                title={`Chemistry consistency streak: ${chemistryStreak.currentStreak}d (${chemistryStreak.todayProgress}% today)`}
              >
                <svg className="w-7 h-7 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#a7f3d0" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={chemistryStreak.targetMetToday ? '#059669' : '#34d399'}
                    strokeWidth="4"
                    strokeDasharray="87.96"
                    strokeDashoffset={87.96 - (87.96 * chemistryStreak.todayProgress) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute font-mono text-[8px] font-bold text-emerald-950">
                  {chemistryStreak.currentStreak}d
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                  <FlaskConical className="w-3.5 h-3.5 text-emerald-600" /> Chemistry
                </div>
                <div className="text-sm font-mono font-bold text-slate-900">{currentRecord.chemistry || 0} Qs</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleAdjustSubject('chemistry', 1)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs cursor-pointer shadow-2xs"
              >
                +1
              </button>
              <button
                onClick={() => handleAdjustSubject('chemistry', 5)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-800 font-bold text-xs cursor-pointer"
              >
                +5
              </button>
              <button
                onClick={() => handleAdjustSubject('chemistry', -1)}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 text-xs cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Math */}
          <div className="bg-violet-50/60 p-2.5 rounded-2xl border border-violet-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Mini Progress Ring in Card */}
              <div
                className="relative w-7 h-7 flex-shrink-0 flex items-center justify-center"
                title={`Math consistency streak: ${mathStreak.currentStreak}d (${mathStreak.todayProgress}% today)`}
              >
                <svg className="w-7 h-7 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#ede9fe" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={mathStreak.targetMetToday ? '#7c3aed' : '#a78bfa'}
                    strokeWidth="4"
                    strokeDasharray="87.96"
                    strokeDashoffset={87.96 - (87.96 * mathStreak.todayProgress) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute font-mono text-[8px] font-bold text-violet-950">
                  {mathStreak.currentStreak}d
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-violet-900 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-violet-600" /> Math
                </div>
                <div className="text-sm font-mono font-bold text-slate-900">{currentRecord.math || 0} Qs</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleAdjustSubject('math', 1)}
                className="px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold text-xs cursor-pointer shadow-2xs"
              >
                +1
              </button>
              <button
                onClick={() => handleAdjustSubject('math', 5)}
                className="px-2.5 py-1.5 rounded-lg bg-violet-100 hover:bg-violet-200 border border-violet-300 text-violet-800 font-bold text-xs cursor-pointer"
              >
                +5
              </button>
              <button
                onClick={() => handleAdjustSubject('math', -1)}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 text-xs cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Question Stopwatch */}
      {activeTab === 'timer' && (
        <div className="space-y-3 flex-1 flex flex-col justify-between">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="uppercase font-bold tracking-wider text-sky-700">
                {timerState.subject}
              </span>
              <span className="font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                Q#{timerState.currentQuestionNumber}
              </span>
            </div>

            <div className="font-mono text-3xl font-black text-slate-900 tracking-tight">
              {formatDigitalTime(timerState.questionSeconds)}
            </div>

            <div className="text-[10px] text-slate-500 font-mono">
              Total session: {formatDigitalTime(timerState.totalSeconds)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetQuestion}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Reset question timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlayPause}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-white transition active:scale-95 cursor-pointer shadow-2xs ${
                timerState.isActive && !timerState.isPaused
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {timerState.isActive && !timerState.isPaused ? (
                <>
                  <Pause className="w-4 h-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" /> Start
                </>
              )}
            </button>

            <button
              onClick={handleNextQuestion}
              className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-2xs"
            >
              Next Q <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Study Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-2 flex-1 flex flex-col">
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Jot down quick formulas, doubts, or solved question notes..."
            className="flex-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none font-mono"
          />
          <button
            onClick={() => {
              const updated = { ...currentRecord, notes: notesText, updatedAt: Date.now() };
              saveRecord(updated);
              sounds.playClick();
            }}
            className="w-full py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
          >
            Save Notes
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
        <span>Desktop Companion</span>
        <span>Always synced</span>
      </div>
    </div>
  );
};
