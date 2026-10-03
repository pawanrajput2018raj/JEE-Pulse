import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  GripHorizontal,
  X,
  Minimize2,
  Maximize2,
  ExternalLink,
  Flame,
  Target,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Minus,
  FileText,
  Sliders,
  Atom,
  FlaskConical,
  Calculator,
  CheckCircle2,
  Eye,
  Tv,
} from 'lucide-react';
import { SubjectType, DailyRecord, DailyGoals, QuestionTimerState, AnalyticsSummary } from '../types';
import { formatDigitalTime } from '../utils/timerUtils';
import { sounds } from '../utils/soundEffects';
import { fireSubtleGoalConfetti } from '../utils/badges';

export type WidgetViewMode = 'pill' | 'standard' | 'expanded';
export type DockPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'free';

interface DesktopWidgetProps {
  todayRecord: DailyRecord;
  goals: DailyGoals;
  analytics: AnalyticsSummary;
  timerState: QuestionTimerState;
  onSaveRecord: (record: DailyRecord) => void;
  onPlayPauseTimer: () => void;
  onNextQuestion: () => void;
  onSetQuestionNumber: (num: number) => void;
  onSetSubject: (sub: SubjectType) => void;
  onResetQuestion: () => void;
  onClose: () => void;
  onOpenFullApp: (tab?: 'log' | 'timer' | 'books' | 'topics' | 'history' | 'analytics' | 'badges') => void;
  onPopOutWindow: () => void;
}

const STORAGE_PREFS_KEY = 'jee_desktop_widget_prefs_v1';

interface WidgetPreferences {
  mode: WidgetViewMode;
  dock: DockPosition;
  opacity: number; // 0.6 to 1.0
  pos: { x: number; y: number };
  isCollapsed: boolean;
}

const DEFAULT_PREFS: WidgetPreferences = {
  mode: 'standard',
  dock: 'bottom-right',
  opacity: 1.0,
  pos: { x: 24, y: 24 },
  isCollapsed: false,
};

export const DesktopWidget: React.FC<DesktopWidgetProps> = ({
  todayRecord,
  goals,
  analytics,
  timerState,
  onSaveRecord,
  onPlayPauseTimer,
  onNextQuestion,
  onSetQuestionNumber,
  onSetSubject,
  onResetQuestion,
  onClose,
  onOpenFullApp,
  onPopOutWindow,
}) => {
  // Load saved preferences
  const [prefs, setPrefs] = useState<WidgetPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFS_KEY);
      if (saved) return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load desktop widget preferences', e);
    }
    return DEFAULT_PREFS;
  });

  const [showSettings, setShowSettings] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState(todayRecord.notes || '');

  // Keep quick notes synchronized with record
  useEffect(() => {
    if (!isEditingNotes) {
      setQuickNoteText(todayRecord.notes || '');
    }
  }, [todayRecord.notes, isEditingNotes]);

  // Save preferences when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.warn('Failed to save desktop widget preferences', e);
    }
  }, [prefs]);

  // Dragging logic
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('select')
    ) {
      return;
    }

    isDraggingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      posX: prefs.pos.x,
      posY: prefs.pos.y,
    };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      let deltaX = 0;
      let deltaY = 0;

      // Calculate based on anchor dock
      if (prefs.dock === 'bottom-right' || prefs.dock === 'top-right') {
        deltaX = dragStartRef.current.mouseX - clientX;
      } else {
        deltaX = clientX - dragStartRef.current.mouseX;
      }

      if (prefs.dock === 'bottom-right' || prefs.dock === 'bottom-left') {
        deltaY = dragStartRef.current.mouseY - clientY;
      } else {
        deltaY = clientY - dragStartRef.current.mouseY;
      }

      const nextX = Math.max(10, Math.min(window.innerWidth - 320, dragStartRef.current.posX + deltaX));
      const nextY = Math.max(10, Math.min(window.innerHeight - 200, dragStartRef.current.posY + deltaY));

      setPrefs((prev) => ({
        ...prev,
        dock: 'free',
        pos: { x: nextX, y: nextY },
      }));
    };

    const handleUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [prefs.dock]);

  // Today calculations
  const todayTotal = (todayRecord.physics || 0) + (todayRecord.chemistry || 0) + (todayRecord.math || 0);
  const dailyTarget = goals.total || 75;
  const streakTarget = goals.streakTarget || 30;
  const goalPercent = Math.min(100, Math.round((todayTotal / dailyTarget) * 100));
  const isGoalMet = todayTotal >= dailyTarget;
  const isStreakMet = todayTotal >= streakTarget;

  // Individual Subject Consistency Streaks
  const physicsStreak = analytics.subjectStreaks?.physics || {
    subject: 'physics',
    currentStreak: 0,
    longestStreak: 0,
    todayCount: todayRecord.physics || 0,
    target: 10,
    todayProgress: Math.min(100, Math.round(((todayRecord.physics || 0) / 10) * 100)),
    targetMetToday: (todayRecord.physics || 0) >= 10,
  };
  const chemistryStreak = analytics.subjectStreaks?.chemistry || {
    subject: 'chemistry',
    currentStreak: 0,
    longestStreak: 0,
    todayCount: todayRecord.chemistry || 0,
    target: 10,
    todayProgress: Math.min(100, Math.round(((todayRecord.chemistry || 0) / 10) * 100)),
    targetMetToday: (todayRecord.chemistry || 0) >= 10,
  };
  const mathStreak = analytics.subjectStreaks?.math || {
    subject: 'math',
    currentStreak: 0,
    longestStreak: 0,
    todayCount: todayRecord.math || 0,
    target: 10,
    todayProgress: Math.min(100, Math.round(((todayRecord.math || 0) / 10) * 100)),
    targetMetToday: (todayRecord.math || 0) >= 10,
  };

  // Increment/Decrement handlers
  const handleAdjustSubject = (subject: SubjectType, amount: number) => {
    const currentVal = todayRecord[subject] || 0;
    const nextVal = Math.max(0, currentVal + amount);

    const oldTotal = todayTotal;
    const newTotal = oldTotal + (nextVal - currentVal);

    sounds.playClick();

    const subTarget = analytics.subjectStreaks?.[subject]?.target || 10;
    if (amount > 0 && nextVal >= subTarget && currentVal < subTarget) {
      sounds.playGoalCelebration();
      fireSubtleGoalConfetti();
    } else if (amount > 0 && newTotal >= dailyTarget && oldTotal < dailyTarget) {
      sounds.playGoalCelebration();
      fireSubtleGoalConfetti();
    } else if (amount > 0 && newTotal >= streakTarget && oldTotal < streakTarget) {
      sounds.playGoalCelebration();
      fireSubtleGoalConfetti();
    }

    const updated: DailyRecord = {
      ...todayRecord,
      [subject]: nextVal,
      updatedAt: Date.now(),
    };
    onSaveRecord(updated);
  };

  const handleSaveNotes = () => {
    const updated: DailyRecord = {
      ...todayRecord,
      notes: quickNoteText,
      updatedAt: Date.now(),
    };
    onSaveRecord(updated);
    setIsEditingNotes(false);
    sounds.playClick();
  };

  // Dock position styles
  const positionStyles: React.CSSProperties = useMemo(() => {
    if (prefs.dock === 'bottom-right') {
      return { bottom: '24px', right: '24px' };
    }
    if (prefs.dock === 'bottom-left') {
      return { bottom: '24px', left: '24px' };
    }
    if (prefs.dock === 'top-right') {
      return { top: '80px', right: '24px' };
    }
    if (prefs.dock === 'top-left') {
      return { top: '80px', left: '24px' };
    }
    return {
      bottom: `${prefs.pos.y}px`,
      right: `${prefs.pos.x}px`,
    };
  }, [prefs.dock, prefs.pos.x, prefs.pos.y]);

  // When collapsed into mini floating badge
  if (prefs.isCollapsed) {
    return (
      <div
        style={positionStyles}
        className="fixed z-50 transition-all select-none animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          onClick={() => setPrefs((p) => ({ ...p, isCollapsed: false }))}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white text-slate-800 shadow-2xl shadow-slate-900/15 border border-slate-200/90 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Click to expand Desktop Study Widget"
        >
          <div className="relative">
            <Tv className="w-4 h-4 text-sky-600 group-hover:text-sky-700" />
            {timerState.isActive && !timerState.isPaused && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>
          <div className="text-left font-mono text-xs">
            <span className="font-bold text-slate-900">{todayTotal}</span>
            <span className="text-slate-500 text-[10px]">/{dailyTarget}q</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <Flame className="w-3 h-3 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{analytics.currentStreak}d</span>
          </div>
          <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
        </button>
      </div>
    );
  }

  // --- 1. PILL HUD MODE (Ultra-compact horizontal bar with white background) ---
  if (prefs.mode === 'pill') {
    return (
      <div
        style={{ ...positionStyles, opacity: prefs.opacity }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className="fixed z-50 flex items-center gap-2 px-3 py-2 rounded-2xl bg-white text-slate-800 shadow-2xl shadow-slate-900/15 border border-slate-200/90 select-none transition-opacity hover:opacity-100! animate-in fade-in slide-in-from-bottom-2 duration-150"
      >
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 pr-1">
          <GripHorizontal className="w-4 h-4" />
        </div>

        {/* Goal / Total */}
        <div
          onClick={() => onOpenFullApp('log')}
          className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition"
          title={`Today's Solved: ${todayTotal}/${dailyTarget} (${goalPercent}%)`}
        >
          <Target className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-xs font-bold font-mono text-slate-900">{todayTotal}</span>
          <span className="text-[10px] text-slate-500">/{dailyTarget}</span>
          {isGoalMet && <span className="text-[10px] text-emerald-600 font-bold">✓</span>}
        </div>

        {/* Streak */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold"
          title={`Streak: ${analytics.currentStreak} days`}
        >
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
          <span>{analytics.currentStreak}d</span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Physics Quick Increment with Small Progress Ring */}
        <div
          className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 rounded-xl px-2 py-1"
          title={`Physics Consistency Streak: ${physicsStreak.currentStreak}d (Record: ${physicsStreak.longestStreak}d). Today: ${todayRecord.physics || 0}/${physicsStreak.target} questions (${physicsStreak.todayProgress}%)${physicsStreak.targetMetToday ? ' - Streak Safe! 🔥' : ''}`}
        >
          <div className="relative w-5 h-5 flex-shrink-0 flex items-center justify-center">
            <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
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
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute font-mono text-[8px] font-bold text-sky-950 leading-none">
              {physicsStreak.currentStreak}
            </span>
          </div>
          <span className="text-[10px] font-bold text-sky-700 uppercase">P</span>
          <span className="text-xs font-mono font-bold text-slate-900 min-w-4 text-center">
            {todayRecord.physics || 0}
          </span>
          <button
            onClick={() => handleAdjustSubject('physics', 1)}
            className="w-5 h-5 rounded-md bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center text-xs font-bold transition active:scale-90 cursor-pointer shadow-2xs"
            title="Add +1 to Physics"
          >
            +1
          </button>
        </div>

        {/* Chemistry Quick Increment with Small Progress Ring */}
        <div
          className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-2 py-1"
          title={`Chemistry Consistency Streak: ${chemistryStreak.currentStreak}d (Record: ${chemistryStreak.longestStreak}d). Today: ${todayRecord.chemistry || 0}/${chemistryStreak.target} questions (${chemistryStreak.todayProgress}%)${chemistryStreak.targetMetToday ? ' - Streak Safe! 🔥' : ''}`}
        >
          <div className="relative w-5 h-5 flex-shrink-0 flex items-center justify-center">
            <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
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
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute font-mono text-[8px] font-bold text-emerald-950 leading-none">
              {chemistryStreak.currentStreak}
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 uppercase">C</span>
          <span className="text-xs font-mono font-bold text-slate-900 min-w-4 text-center">
            {todayRecord.chemistry || 0}
          </span>
          <button
            onClick={() => handleAdjustSubject('chemistry', 1)}
            className="w-5 h-5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-xs font-bold transition active:scale-90 cursor-pointer shadow-2xs"
            title="Add +1 to Chemistry"
          >
            +1
          </button>
        </div>

        {/* Math Quick Increment with Small Progress Ring */}
        <div
          className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-xl px-2 py-1"
          title={`Math Consistency Streak: ${mathStreak.currentStreak}d (Record: ${mathStreak.longestStreak}d). Today: ${todayRecord.math || 0}/${mathStreak.target} questions (${mathStreak.todayProgress}%)${mathStreak.targetMetToday ? ' - Streak Safe! 🔥' : ''}`}
        >
          <div className="relative w-5 h-5 flex-shrink-0 flex items-center justify-center">
            <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
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
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute font-mono text-[8px] font-bold text-violet-950 leading-none">
              {mathStreak.currentStreak}
            </span>
          </div>
          <span className="text-[10px] font-bold text-violet-700 uppercase">M</span>
          <span className="text-xs font-mono font-bold text-slate-900 min-w-4 text-center">
            {todayRecord.math || 0}
          </span>
          <button
            onClick={() => handleAdjustSubject('math', 1)}
            className="w-5 h-5 rounded-md bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center text-xs font-bold transition active:scale-90 cursor-pointer shadow-2xs"
            title="Add +1 to Math"
          >
            +1
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Mini Timer Control */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
          <span className="text-[10px] text-sky-700 font-bold">Q#{timerState.currentQuestionNumber}</span>
          <span className="text-xs font-mono font-bold text-slate-900">
            {formatDigitalTime(timerState.questionSeconds)}
          </span>
          <button
            onClick={onPlayPauseTimer}
            className={`w-5 h-5 rounded-md flex items-center justify-center text-white transition active:scale-90 cursor-pointer ${
              timerState.isActive && !timerState.isPaused
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
            title={timerState.isActive && !timerState.isPaused ? 'Pause Timer' : 'Start Timer'}
          >
            {timerState.isActive && !timerState.isPaused ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>
          <button
            onClick={onNextQuestion}
            className="w-5 h-5 rounded-md bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
            title="Next Question"
          >
            <SkipForward className="w-3 h-3" />
          </button>
        </div>

        {/* Switch to standard view / Pop out / Close */}
        <div className="flex items-center gap-1 pl-1">
          <button
            onClick={() => setPrefs((p) => ({ ...p, mode: 'standard' }))}
            className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Switch to Standard Card Widget"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onPopOutWindow}
            className="p-1 rounded-md text-slate-400 hover:text-sky-600 hover:bg-slate-100 transition cursor-pointer"
            title="Pop out into separate OS Desktop Window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPrefs((p) => ({ ...p, isCollapsed: true }))}
            className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Minimize to Floating Button"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
            title="Close Desktop Widget (Alt+W to reopen)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // --- 2. STANDARD & EXPANDED CARD MODES (White Background) ---
  return (
    <div
      style={{ ...positionStyles, opacity: prefs.opacity }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      className={`fixed z-50 w-84 sm:w-92 bg-white text-slate-800 rounded-3xl shadow-2xl shadow-slate-900/15 border border-slate-200/90 overflow-hidden select-none transition-opacity hover:opacity-100! animate-in fade-in zoom-in-95 duration-150 ${
        prefs.mode === 'expanded' ? 'max-h-[85vh] flex flex-col' : ''
      }`}
    >
      {/* Top Drag & Control Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200/80 bg-slate-50/90 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-slate-400 hover:text-slate-600" />
          <div className="flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-xs font-bold tracking-tight text-slate-900">Desktop Study Widget</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Settings / Customize Menu */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded-md transition cursor-pointer ${
              showSettings ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
            }`}
            title="Widget options, dock presets & opacity"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Mode Switcher */}
          <button
            onClick={() =>
              setPrefs((p) => ({
                ...p,
                mode: p.mode === 'standard' ? 'expanded' : p.mode === 'expanded' ? 'pill' : 'standard',
              }))
            }
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            title={`Current: ${prefs.mode} mode. Click to cycle modes.`}
          >
            {prefs.mode === 'expanded' ? (
              <FileText className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Pop out to OS Window */}
          <button
            onClick={onPopOutWindow}
            className="p-1 rounded-md text-slate-400 hover:text-sky-600 hover:bg-slate-200/60 transition cursor-pointer"
            title="Open as Standalone Desktop Window (always on top)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Minimize / Collapse */}
          <button
            onClick={() => setPrefs((p) => ({ ...p, isCollapsed: true }))}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            title="Minimize to floating orb"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-200/60 transition cursor-pointer"
            title="Hide Widget (Alt+W to restore)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Settings Drawer (if toggled) */}
      {showSettings && (
        <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs space-y-2.5 animate-in fade-in duration-100">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Layout View</span>
            <div className="flex gap-1">
              {(['pill', 'standard', 'expanded'] as WidgetViewMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setPrefs((p) => ({ ...p, mode: m }))}
                  className={`px-2 py-0.5 rounded capitalize font-medium cursor-pointer transition ${
                    prefs.mode === m ? 'bg-sky-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Screen Dock</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPrefs((p) => ({ ...p, dock: 'bottom-right' }))}
                className={`px-1.5 py-0.5 rounded text-[11px] cursor-pointer ${
                  prefs.dock === 'bottom-right'
                    ? 'bg-sky-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Dock Bottom-Right"
              >
                ↘ BR
              </button>
              <button
                onClick={() => setPrefs((p) => ({ ...p, dock: 'bottom-left' }))}
                className={`px-1.5 py-0.5 rounded text-[11px] cursor-pointer ${
                  prefs.dock === 'bottom-left'
                    ? 'bg-sky-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Dock Bottom-Left"
              >
                ↙ BL
              </button>
              <button
                onClick={() => setPrefs((p) => ({ ...p, dock: 'top-right' }))}
                className={`px-1.5 py-0.5 rounded text-[11px] cursor-pointer ${
                  prefs.dock === 'top-right' ? 'bg-sky-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Dock Top-Right"
              >
                ↗ TR
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium flex items-center gap-1">
              <Eye className="w-3 h-3" /> Opacity
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={prefs.opacity}
                onChange={(e) => setPrefs((p) => ({ ...p, opacity: parseFloat(e.target.value) }))}
                className="w-24 accent-sky-600 cursor-pointer h-1.5"
              />
              <span className="font-mono text-[10px] text-slate-500 w-7 text-right">
                {Math.round(prefs.opacity * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className={`p-3.5 space-y-3.5 ${prefs.mode === 'expanded' ? 'overflow-y-auto' : ''}`}>
        {/* Daily Goal & Streak Banner */}
        <div className="flex items-center justify-between bg-slate-50/90 p-2.5 rounded-2xl border border-slate-200/90">
          <div className="flex items-center gap-3">
            {/* Circular Progress Ring */}
            <div className="relative w-11 h-11 flex items-center justify-center">
              <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke={isGoalMet ? '#10b981' : '#0284c7'}
                  strokeWidth="3"
                  strokeDasharray="94.2"
                  strokeDashoffset={94.2 - (94.2 * goalPercent) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute font-mono text-[11px] font-bold text-slate-800">
                {goalPercent}%
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 font-mono">{todayTotal}</span>
                <span className="text-xs text-slate-500">/ {dailyTarget} Qs</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {isGoalMet ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 inline" /> Daily Goal Smashed!
                  </span>
                ) : (
                  <span>{dailyTarget - todayTotal} questions remaining</span>
                )}
              </div>
            </div>
          </div>

          {/* Streak pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
              isStreakMet
                ? 'bg-amber-100/90 border-amber-300 text-amber-900'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
            title={`Current Streak: ${analytics.currentStreak} days`}
          >
            <Flame
              className={`w-4 h-4 ${
                analytics.currentStreak > 0 ? 'fill-amber-500 text-amber-500 animate-pulse' : 'text-slate-400'
              }`}
            />
            <div className="text-right">
              <div className="text-xs font-bold leading-tight">{analytics.currentStreak}d</div>
              <div className="text-[9px] text-amber-800/80 leading-tight">
                {isStreakMet ? 'Shielded' : `${Math.max(0, streakTarget - todayTotal)} to save`}
              </div>
            </div>
          </div>
        </div>

        {/* Separate Consistency Streaks for Physics, Chemistry, and Math with Small Progress Rings */}
        <div className="bg-slate-50/90 p-2.5 rounded-2xl border border-slate-200/90 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 px-0.5">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span>Subject Consistency Streaks</span>
            </span>
            <span
              onClick={() => onOpenFullApp('analytics')}
              className="text-[10px] text-sky-600 hover:text-sky-700 font-bold cursor-pointer hover:underline"
              title="View full analytics"
            >
              Analytics ➔
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {/* Physics Progress Ring */}
            <div
              className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                physicsStreak.targetMetToday
                  ? 'bg-sky-50/90 border-sky-300 ring-1 ring-sky-200'
                  : 'bg-white border-slate-200'
              }`}
              title={`Physics Consistency Streak: ${physicsStreak.currentStreak} days (Record: ${physicsStreak.longestStreak}d). Today: ${todayRecord.physics || 0}/${physicsStreak.target} questions (${physicsStreak.todayProgress}%)${physicsStreak.targetMetToday ? ' - Streak Safe! 🔥' : ''}`}
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
                    className="transition-all duration-500"
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
                    <span className="text-[9px] font-mono text-slate-400">{todayRecord.physics || 0}/{physicsStreak.target}</span>
                  )}
                </div>
                <div className="text-[9px] font-medium truncate leading-tight mt-0.5">
                  {physicsStreak.targetMetToday ? (
                    <span className="text-sky-700 font-bold">Safe 🔥</span>
                  ) : (
                    <span className="text-slate-500">{Math.max(0, physicsStreak.target - (todayRecord.physics || 0))} left</span>
                  )}
                </div>
              </div>
            </div>

            {/* Chemistry Progress Ring */}
            <div
              className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                chemistryStreak.targetMetToday
                  ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-200'
                  : 'bg-white border-slate-200'
              }`}
              title={`Chemistry Consistency Streak: ${chemistryStreak.currentStreak} days (Record: ${chemistryStreak.longestStreak}d). Today: ${todayRecord.chemistry || 0}/${chemistryStreak.target} questions (${chemistryStreak.todayProgress}%)${chemistryStreak.targetMetToday ? ' - Streak Safe! 🔥' : ''}`}
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
                    className="transition-all duration-500"
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
                    <span className="text-[9px] font-mono text-slate-400">{todayRecord.chemistry || 0}/{chemistryStreak.target}</span>
                  )}
                </div>
                <div className="text-[9px] font-medium truncate leading-tight mt-0.5">
                  {chemistryStreak.targetMetToday ? (
                    <span className="text-emerald-700 font-bold">Safe 🔥</span>
                  ) : (
                    <span className="text-slate-500">{Math.max(0, chemistryStreak.target - (todayRecord.chemistry || 0))} left</span>
                  )}
                </div>
              </div>
            </div>

            {/* Math Progress Ring */}
            <div
              className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                mathStreak.targetMetToday
                  ? 'bg-violet-50/90 border-violet-300 ring-1 ring-violet-200'
                  : 'bg-white border-slate-200'
              }`}
              title={`Math Consistency Streak: ${mathStreak.currentStreak} days (Record: ${mathStreak.longestStreak}d). Today: ${todayRecord.math || 0}/${mathStreak.target} questions (${mathStreak.todayProgress}%)${mathStreak.targetMetToday ? ' - Streak Safe! 🔥' : ''}`}
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
                    className="transition-all duration-500"
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
                    <span className="text-[9px] font-mono text-slate-400">{todayRecord.math || 0}/{mathStreak.target}</span>
                  )}
                </div>
                <div className="text-[9px] font-medium truncate leading-tight mt-0.5">
                  {mathStreak.targetMetToday ? (
                    <span className="text-violet-700 font-bold">Safe 🔥</span>
                  ) : (
                    <span className="text-slate-500">{Math.max(0, mathStreak.target - (todayRecord.math || 0))} left</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Subject Counters */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-semibold uppercase tracking-wider">
            <span>Quick Subject Logger</span>
            <span className="text-[10px] text-sky-600 hover:text-sky-700 font-bold cursor-pointer" onClick={() => onOpenFullApp('log')}>
              Full Log ➔
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Physics */}
            <div className="bg-sky-50/60 hover:bg-sky-50 p-2 rounded-2xl border border-sky-200/90 flex flex-col justify-between transition">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {/* Mini Progress Ring in Card Header */}
                  <div
                    className="relative w-5 h-5 flex-shrink-0 flex items-center justify-center"
                    title={`Physics streak: ${physicsStreak.currentStreak}d (${physicsStreak.todayProgress}% today)`}
                  >
                    <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
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
                    <span className="absolute font-mono text-[7px] font-bold text-sky-950">
                      {physicsStreak.currentStreak}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-sky-800 flex items-center gap-1">
                    <Atom className="w-3 h-3 text-sky-600" /> Phy
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-900">{todayRecord.physics || 0}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => handleAdjustSubject('physics', 1)}
                  className="flex-1 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                  title="Add 1 Physics question"
                >
                  +1
                </button>
                <button
                  onClick={() => handleAdjustSubject('physics', 5)}
                  className="px-1.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-[10px] border border-sky-300 active:scale-95 transition cursor-pointer"
                  title="Add 5 Physics questions"
                >
                  +5
                </button>
                <button
                  onClick={() => handleAdjustSubject('physics', -1)}
                  className="p-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 text-[10px] active:scale-90 transition cursor-pointer"
                  title="Undo 1"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* Chemistry */}
            <div className="bg-emerald-50/60 hover:bg-emerald-50 p-2 rounded-2xl border border-emerald-200/90 flex flex-col justify-between transition">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {/* Mini Progress Ring in Card Header */}
                  <div
                    className="relative w-5 h-5 flex-shrink-0 flex items-center justify-center"
                    title={`Chemistry streak: ${chemistryStreak.currentStreak}d (${chemistryStreak.todayProgress}% today)`}
                  >
                    <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
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
                    <span className="absolute font-mono text-[7px] font-bold text-emerald-950">
                      {chemistryStreak.currentStreak}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                    <FlaskConical className="w-3 h-3 text-emerald-600" /> Chem
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-900">{todayRecord.chemistry || 0}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => handleAdjustSubject('chemistry', 1)}
                  className="flex-1 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                  title="Add 1 Chemistry question"
                >
                  +1
                </button>
                <button
                  onClick={() => handleAdjustSubject('chemistry', 5)}
                  className="px-1.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] border border-emerald-300 active:scale-95 transition cursor-pointer"
                  title="Add 5 Chemistry questions"
                >
                  +5
                </button>
                <button
                  onClick={() => handleAdjustSubject('chemistry', -1)}
                  className="p-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 text-[10px] active:scale-90 transition cursor-pointer"
                  title="Undo 1"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* Math */}
            <div className="bg-violet-50/60 hover:bg-violet-50 p-2 rounded-2xl border border-violet-200/90 flex flex-col justify-between transition">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {/* Mini Progress Ring in Card Header */}
                  <div
                    className="relative w-5 h-5 flex-shrink-0 flex items-center justify-center"
                    title={`Math streak: ${mathStreak.currentStreak}d (${mathStreak.todayProgress}% today)`}
                  >
                    <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
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
                    <span className="absolute font-mono text-[7px] font-bold text-violet-950">
                      {mathStreak.currentStreak}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-violet-800 flex items-center gap-1">
                    <Calculator className="w-3 h-3 text-violet-600" /> Math
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-900">{todayRecord.math || 0}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => handleAdjustSubject('math', 1)}
                  className="flex-1 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                  title="Add 1 Math question"
                >
                  +1
                </button>
                <button
                  onClick={() => handleAdjustSubject('math', 5)}
                  className="px-1.5 py-1 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-800 font-bold text-[10px] border border-violet-300 active:scale-95 transition cursor-pointer"
                  title="Add 5 Math questions"
                >
                  +5
                </button>
                <button
                  onClick={() => handleAdjustSubject('math', -1)}
                  className="p-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 text-[10px] active:scale-90 transition cursor-pointer"
                  title="Undo 1"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Question Stopwatch Section */}
        <div className="bg-slate-50/90 p-2.5 rounded-2xl border border-slate-200/90 space-y-2">
          <div className="flex items-center justify-between">
            {/* Subject Select */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200">
              {(['physics', 'chemistry', 'math'] as SubjectType[]).map((sub) => (
                <button
                  key={sub}
                  onClick={() => onSetSubject(sub)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase transition cursor-pointer ${
                    timerState.subject === sub
                      ? sub === 'physics'
                        ? 'bg-sky-600 text-white'
                        : sub === 'chemistry'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-violet-600 text-white'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {sub.slice(0, 4)}
                </button>
              ))}
            </div>

            {/* Question Number */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 text-[10px]">Solving:</span>
              <button
                onClick={() => onSetQuestionNumber(timerState.currentQuestionNumber + 1)}
                className="font-bold text-sky-700 hover:underline cursor-pointer bg-white px-1.5 py-0.5 rounded border border-slate-200"
                title="Click to increment Q number"
              >
                Q#{timerState.currentQuestionNumber}
              </button>
            </div>
          </div>

          {/* Time & Controls */}
          <div className="flex items-center justify-between pt-0.5">
            <div>
              <div className="font-mono text-2xl font-black tracking-tight text-slate-900 leading-none">
                {formatDigitalTime(timerState.questionSeconds)}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {timerState.sessionTargetSeconds && timerState.sessionTargetSeconds > 0 ? (
                  timerState.sessionTargetSeconds >= timerState.totalSeconds ? (
                    <span className="text-indigo-600 font-semibold">
                      ⏳ {formatDigitalTime(timerState.sessionTargetSeconds - timerState.totalSeconds)} left
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold">
                      +{formatDigitalTime(timerState.totalSeconds - timerState.sessionTargetSeconds)} over
                    </span>
                  )
                ) : (
                  <span>Session: {formatDigitalTime(timerState.totalSeconds)}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onResetQuestion}
                className="p-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                title="Reset current question timer to 0:00"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onPlayPauseTimer}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer text-white shadow-2xs ${
                  timerState.isActive && !timerState.isPaused
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {timerState.isActive && !timerState.isPaused ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" /> Start
                  </>
                )}
              </button>

              <button
                onClick={onNextQuestion}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                title="Finish question & advance to next"
              >
                Next Q <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* EXPANDED VIEW: Quick Study Scratchpad */}
        {prefs.mode === 'expanded' && (
          <div className="space-y-2 pt-1 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-700">
              <span className="font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" /> Today's Quick Study Notes
              </span>
              {isEditingNotes ? (
                <button
                  onClick={handleSaveNotes}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-[10px] text-sky-600 hover:underline cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <textarea
                value={quickNoteText}
                onChange={(e) => setQuickNoteText(e.target.value)}
                placeholder="Jot key formulas, tricky questions, or doubts..."
                className="w-full h-20 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none font-mono"
              />
            ) : (
              <div
                onClick={() => setIsEditingNotes(true)}
                className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 min-h-14 max-h-24 overflow-y-auto cursor-pointer hover:border-slate-300 transition"
              >
                {quickNoteText ? (
                  <p className="whitespace-pre-wrap font-mono text-[11px]">{quickNoteText}</p>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">
                    Click here to write quick formulas or notes for today...
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status / Shortcut Hint */}
      <div className="px-3.5 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="px-1 py-0.2 rounded bg-white border border-slate-200 font-mono text-slate-600">Alt+W</span> toggles
          widget
        </span>
        <button
          onClick={() => onOpenFullApp('timer')}
          className="text-sky-600 hover:text-sky-700 font-medium hover:underline cursor-pointer"
        >
          Open Full Timer ➔
        </button>
      </div>
    </div>
  );
};
