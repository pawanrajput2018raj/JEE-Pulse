import React, { useState, useEffect } from 'react';
import { Atom, FlaskConical, Calculator, Minus, Check, Flame, Target, Calendar, Clock, Plus, Settings2, BookOpen, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { DailyRecord, DailyGoals, SubjectType } from '../types';
import { formatDatePretty, getPastNDays, getTodayStr } from '../utils/dateUtils';
import { sounds } from '../utils/soundEffects';
import { fireSubtleGoalConfetti } from '../utils/badges';
import { DailyInsightCard } from './DailyInsightCard';

interface DailyLogSectionProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  record: DailyRecord;
  goals: DailyGoals;
  onSaveRecord: (updated: DailyRecord) => void;
  streakTarget: number;
  currentStreak?: number;
  onOpenSettings?: () => void;
}

export const DailyLogSection: React.FC<DailyLogSectionProps> = ({
  selectedDate,
  setSelectedDate,
  record,
  goals,
  onSaveRecord,
  streakTarget,
  currentStreak = 0,
  onOpenSettings,
}) => {
  const [physicsCount, setPhysicsCount] = useState<number>(record.physics || 0);
  const [chemistryCount, setChemistryCount] = useState<number>(record.chemistry || 0);
  const [mathCount, setMathCount] = useState<number>(record.math || 0);
  const [notes, setNotes] = useState<string>(record.notes || '');
  const [saveToast, setSaveToast] = useState(false);
  const [isGoalCelebrating, setIsGoalCelebrating] = useState(false);
  const [isStreakCelebrating, setIsStreakCelebrating] = useState(false);

  // Optional Study Duration State (in minutes)
  const [physicsDuration, setPhysicsDuration] = useState<number>(record.durationMinutes?.physics || 0);
  const [chemistryDuration, setChemistryDuration] = useState<number>(record.durationMinutes?.chemistry || 0);
  const [mathDuration, setMathDuration] = useState<number>(record.durationMinutes?.math || 0);
  const [isDurationCelebrating, setIsDurationCelebrating] = useState(false);

  // Sync state when record or selectedDate changes
  useEffect(() => {
    setPhysicsCount(record.physics || 0);
    setChemistryCount(record.chemistry || 0);
    setMathCount(record.math || 0);
    setNotes(record.notes || '');
    setPhysicsDuration(record.durationMinutes?.physics || 0);
    setChemistryDuration(record.durationMinutes?.chemistry || 0);
    setMathDuration(record.durationMinutes?.math || 0);
  }, [record, selectedDate]);

  const totalQuestions = physicsCount + chemistryCount + mathCount;
  const isToday = selectedDate === getTodayStr();
  const physicsTarget = goals.physics || 25;
  const chemistryTarget = goals.chemistry || 25;
  const mathTarget = goals.math || 25;
  const dailyTarget = goals.total || (physicsTarget + chemistryTarget + mathTarget);
  const streakGoalMet = totalQuestions >= streakTarget;
  const dailyGoalMet = totalQuestions >= dailyTarget;

  const totalPercent = Math.min(100, Math.round((totalQuestions / Math.max(1, dailyTarget)) * 100));
  const phyPercent = Math.min(100, Math.round((physicsCount / Math.max(1, physicsTarget)) * 100));
  const chemPercent = Math.min(100, Math.round((chemistryCount / Math.max(1, chemistryTarget)) * 100));
  const mathPercent = Math.min(100, Math.round((mathCount / Math.max(1, mathTarget)) * 100));

  // Multi-segment progress bar relative to total target
  const phySegment = Math.min(100, (physicsCount / Math.max(1, dailyTarget)) * 100);
  const chemSegment = Math.min(100 - phySegment, (chemistryCount / Math.max(1, dailyTarget)) * 100);
  const mathSegment = Math.min(100 - phySegment - chemSegment, (mathCount / Math.max(1, dailyTarget)) * 100);

  // Study Duration Goals calculations
  const isDurationGoalEnabled = !!goals.duration?.enabled;
  const physicsTargetDur = goals.duration?.physics || 60;
  const chemistryTargetDur = goals.duration?.chemistry || 60;
  const mathTargetDur = goals.duration?.math || 60;
  const totalTargetDur = physicsTargetDur + chemistryTargetDur + mathTargetDur;
  const totalDuration = physicsDuration + chemistryDuration + mathDuration;
  const durationGoalMet = isDurationGoalEnabled && totalTargetDur > 0 && totalDuration >= totalTargetDur;
  const durationPercent = totalTargetDur > 0 ? Math.min(100, Math.round((totalDuration / totalTargetDur) * 100)) : 0;

  const handleUpdate = (newP: number, newC: number, newM: number, newNotes: string) => {
    const validP = Math.max(0, newP);
    const validC = Math.max(0, newC);
    const validM = Math.max(0, newM);

    setPhysicsCount(validP);
    setChemistryCount(validC);
    setMathCount(validM);
    setNotes(newNotes);

    const updated: DailyRecord = {
      date: selectedDate,
      physics: validP,
      chemistry: validC,
      math: validM,
      durationMinutes: {
        physics: physicsDuration,
        chemistry: chemistryDuration,
        math: mathDuration,
      },
      notes: newNotes,
      updatedAt: Date.now(),
    };

    onSaveRecord(updated);
    sounds.playClick();

    // Check if goal was just unlocked
    const newTotal = validP + validC + validM;
    const oldTotal = (record.physics || 0) + (record.chemistry || 0) + (record.math || 0);
    if (newTotal >= dailyTarget && oldTotal < dailyTarget) {
      sounds.playGoalCelebration();
      fireSubtleGoalConfetti();
      setIsGoalCelebrating(true);
      setIsStreakCelebrating(true);
      setTimeout(() => {
        setIsGoalCelebrating(false);
        setIsStreakCelebrating(false);
      }, 3500);
    } else if (newTotal >= streakTarget && oldTotal < streakTarget) {
      sounds.playGoalCelebration();
      fireSubtleGoalConfetti();
      setIsStreakCelebrating(true);
      setTimeout(() => setIsStreakCelebrating(false), 3500);
    }

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleUpdateDuration = (newPDur: number, newCDur: number, newMDur: number) => {
    const validPDur = Math.max(0, newPDur);
    const validCDur = Math.max(0, newCDur);
    const validMDur = Math.max(0, newMDur);

    setPhysicsDuration(validPDur);
    setChemistryDuration(validCDur);
    setMathDuration(validMDur);

    const updated: DailyRecord = {
      date: selectedDate,
      physics: physicsCount,
      chemistry: chemistryCount,
      math: mathCount,
      durationMinutes: {
        physics: validPDur,
        chemistry: validCDur,
        math: validMDur,
      },
      notes: notes,
      updatedAt: Date.now(),
    };

    onSaveRecord(updated);
    sounds.playClick();

    // Check celebration
    if (isDurationGoalEnabled) {
      const newTotalDur = validPDur + validCDur + validMDur;
      const oldTotalDur = physicsDuration + chemistryDuration + mathDuration;
      if (totalTargetDur > 0 && newTotalDur >= totalTargetDur && oldTotalDur < totalTargetDur) {
        sounds.playGoalCelebration();
        fireSubtleGoalConfetti();
        setIsDurationCelebrating(true);
        setTimeout(() => setIsDurationCelebrating(false), 3500);
      }
    }

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const adjustSubjectDuration = (subject: SubjectType, delta: number) => {
    if (subject === 'physics') {
      handleUpdateDuration(physicsDuration + delta, chemistryDuration, mathDuration);
    } else if (subject === 'chemistry') {
      handleUpdateDuration(physicsDuration, chemistryDuration + delta, mathDuration);
    } else if (subject === 'math') {
      handleUpdateDuration(physicsDuration, chemistryDuration, mathDuration + delta);
    }
  };

  const setSubjectDurationDirect = (subject: SubjectType, valueStr: string) => {
    const parsed = parseInt(valueStr, 10);
    const val = isNaN(parsed) ? 0 : Math.max(0, parsed);
    if (subject === 'physics') {
      handleUpdateDuration(val, chemistryDuration, mathDuration);
    } else if (subject === 'chemistry') {
      handleUpdateDuration(physicsDuration, val, mathDuration);
    } else if (subject === 'math') {
      handleUpdateDuration(physicsDuration, chemistryDuration, val);
    }
  };

  const adjustSubject = (subject: SubjectType, delta: number) => {
    if (subject === 'physics') {
      const val = Math.max(0, physicsCount + delta);
      handleUpdate(val, chemistryCount, mathCount, notes);
    } else if (subject === 'chemistry') {
      const val = Math.max(0, chemistryCount + delta);
      handleUpdate(physicsCount, val, mathCount, notes);
    } else if (subject === 'math') {
      const val = Math.max(0, mathCount + delta);
      handleUpdate(physicsCount, chemistryCount, val, notes);
    }
  };

  const setSubjectDirect = (subject: SubjectType, valueStr: string) => {
    const parsed = parseInt(valueStr, 10);
    const val = isNaN(parsed) ? 0 : Math.max(0, parsed);
    if (subject === 'physics') {
      handleUpdate(val, chemistryCount, mathCount, notes);
    } else if (subject === 'chemistry') {
      handleUpdate(physicsCount, val, mathCount, notes);
    } else if (subject === 'math') {
      handleUpdate(physicsCount, chemistryCount, val, notes);
    }
  };

  const quickDates = getPastNDays(5).reverse();

  return (
    <div className="space-y-6">
      {/* Date Bar & Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {isToday ? 'Today\'s Session' : 'Logged Date'}
              </span>
              {isToday && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                  Active
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {formatDatePretty(selectedDate)}
            </h2>
          </div>
        </div>

        {/* Date Selector and Quick Day Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {quickDates.map((dateStr) => {
            const isSelected = dateStr === selectedDate;
            const isT = dateStr === getTodayStr();
            const label = isT ? 'Today' : dateStr.slice(5); // MM-DD
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60'
                }`}
              >
                {label}
              </button>
            );
          })}

          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 hover:border-slate-300 focus:outline-hidden focus:border-sky-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 📝 TODAY'S SESSIONS (Physics, Chemistry, Math Cards)     */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Today's Sessions
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              • Total: <strong className="text-slate-800">{totalQuestions}</strong> questions solved
            </span>
          </div>

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer border border-slate-200"
              title="Edit Subject Question Goals & Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* The 3 Core Subject Question Cards: Physics, Chemistry, Math */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PHYSICS CARD */}
        <div className="rounded-2xl border border-sky-200 bg-linear-to-b from-sky-50/70 via-white to-white p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-100 border border-sky-200 text-sky-600">
                  <Atom className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Physics</h3>
                  <p className="text-[11px] text-sky-700 font-medium">
                    Goal: {goals.physics} questions
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 border border-sky-200 text-sky-800">
                PHY
              </span>
            </div>

            {/* Direct Number Input */}
            <div className="my-5 flex items-center justify-center">
              <div className="relative flex items-baseline gap-1">
                <input
                  id="input-physics-count"
                  type="number"
                  min="0"
                  max="999"
                  value={physicsCount}
                  onChange={(e) => setSubjectDirect('physics', e.target.value)}
                  className="w-28 text-center text-4xl font-extrabold text-sky-600 bg-transparent border-b-2 border-sky-400 focus:outline-hidden focus:border-sky-600 p-1"
                />
                <span className="text-xs text-slate-500 font-semibold">qs</span>
              </div>
            </div>

            {/* Progress vs Physics Goal */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Subject Question Goal</span>
                <span className={physicsCount >= goals.physics ? 'text-emerald-600 font-bold' : ''}>
                  {physicsCount} / {goals.physics}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (physicsCount / (goals.physics || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Subject Study Duration Progress (if enabled) */}
            {isDurationGoalEnabled && (
              <div className="space-y-1.5 mb-4 p-2.5 rounded-xl bg-sky-50/70 border border-sky-200">
                <div className="flex justify-between items-center text-[11px] text-sky-900 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-600" /> Study Time
                  </span>
                  <span className={physicsDuration >= physicsTargetDur ? 'text-emerald-600 font-bold' : 'font-mono'}>
                    {physicsDuration} / {physicsTargetDur} min
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-1.5 overflow-hidden border border-sky-200">
                  <div
                    className="h-full bg-sky-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (physicsDuration / Math.max(1, physicsTargetDur)) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] text-sky-700 font-medium">Quick add:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => adjustSubjectDuration('physics', 15)}
                      className="px-1.5 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold cursor-pointer transition"
                    >
                      +15m
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustSubjectDuration('physics', 30)}
                      className="px-1.5 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold cursor-pointer transition"
                    >
                      +30m
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustSubjectDuration('physics', -15)}
                      disabled={physicsDuration <= 0}
                      className="px-1 py-0.5 rounded bg-white hover:bg-slate-100 border border-sky-200 text-slate-500 text-[10px] disabled:opacity-40 cursor-pointer transition"
                    >
                      -15m
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Increment Controls */}
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => adjustSubject('physics', 1)}
                className="py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-bold text-sky-800 transition cursor-pointer"
              >
                +1
              </button>
              <button
                onClick={() => adjustSubject('physics', 5)}
                className="py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-bold text-sky-800 transition cursor-pointer"
              >
                +5
              </button>
              <button
                onClick={() => adjustSubject('physics', 10)}
                className="py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-bold text-sky-800 transition cursor-pointer"
              >
                +10
              </button>
              <button
                onClick={() => adjustSubject('physics', 25)}
                className="py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-bold text-sky-800 transition cursor-pointer"
              >
                +25
              </button>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => adjustSubject('physics', -1)}
                disabled={physicsCount <= 0}
                className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-40 text-xs font-medium text-slate-700 transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Minus className="w-3 h-3" /> 1
              </button>
              <button
                onClick={() => handleUpdate(0, chemistryCount, mathCount, notes)}
                disabled={physicsCount <= 0}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-30 text-[10px] font-medium text-slate-600 transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* CHEMISTRY CARD */}
        <div className="rounded-2xl border border-emerald-200 bg-linear-to-b from-emerald-50/70 via-white to-white p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-600">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Chemistry</h3>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Goal: {goals.chemistry} questions
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 border border-emerald-200 text-emerald-800">
                CHEM
              </span>
            </div>

            {/* Direct Number Input */}
            <div className="my-5 flex items-center justify-center">
              <div className="relative flex items-baseline gap-1">
                <input
                  id="input-chemistry-count"
                  type="number"
                  min="0"
                  max="999"
                  value={chemistryCount}
                  onChange={(e) => setSubjectDirect('chemistry', e.target.value)}
                  className="w-28 text-center text-4xl font-extrabold text-emerald-600 bg-transparent border-b-2 border-emerald-400 focus:outline-hidden focus:border-emerald-600 p-1"
                />
                <span className="text-xs text-slate-500 font-semibold">qs</span>
              </div>
            </div>

            {/* Progress vs Chemistry Goal */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Subject Goal</span>
                <span className={chemistryCount >= goals.chemistry ? 'text-emerald-600 font-bold' : ''}>
                  {chemistryCount} / {goals.chemistry}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (chemistryCount / (goals.chemistry || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Subject Study Duration Progress (if enabled) */}
            {isDurationGoalEnabled && (
              <div className="space-y-1.5 mb-4 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex justify-between items-center text-[11px] text-emerald-900 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> Study Time
                  </span>
                  <span className={chemistryDuration >= chemistryTargetDur ? 'text-emerald-600 font-bold' : 'font-mono'}>
                    {chemistryDuration} / {chemistryTargetDur} min
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-1.5 overflow-hidden border border-emerald-200">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (chemistryDuration / Math.max(1, chemistryTargetDur)) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] text-emerald-700 font-medium">Quick add:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => adjustSubjectDuration('chemistry', 15)}
                      className="px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold cursor-pointer transition"
                    >
                      +15m
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustSubjectDuration('chemistry', 30)}
                      className="px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold cursor-pointer transition"
                    >
                      +30m
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustSubjectDuration('chemistry', -15)}
                      disabled={chemistryDuration <= 0}
                      className="px-1 py-0.5 rounded bg-white hover:bg-slate-100 border border-emerald-200 text-slate-500 text-[10px] disabled:opacity-40 cursor-pointer transition"
                    >
                      -15m
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Increment Controls */}
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => adjustSubject('chemistry', 1)}
                className="py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 transition cursor-pointer"
              >
                +1
              </button>
              <button
                onClick={() => adjustSubject('chemistry', 5)}
                className="py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 transition cursor-pointer"
              >
                +5
              </button>
              <button
                onClick={() => adjustSubject('chemistry', 10)}
                className="py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 transition cursor-pointer"
              >
                +10
              </button>
              <button
                onClick={() => adjustSubject('chemistry', 25)}
                className="py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 transition cursor-pointer"
              >
                +25
              </button>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => adjustSubject('chemistry', -1)}
                disabled={chemistryCount <= 0}
                className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-40 text-xs font-medium text-slate-700 transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Minus className="w-3 h-3" /> 1
              </button>
              <button
                onClick={() => handleUpdate(physicsCount, 0, mathCount, notes)}
                disabled={chemistryCount <= 0}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-30 text-[10px] font-medium text-slate-600 transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* MATH CARD */}
        <div className="rounded-2xl border border-amber-200 bg-linear-to-b from-amber-50/70 via-white to-white p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 border border-amber-200 text-amber-600">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Mathematics</h3>
                  <p className="text-[11px] text-amber-700 font-medium">
                    Goal: {goals.math} questions
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 border border-amber-200 text-amber-900">
                MATH
              </span>
            </div>

            {/* Direct Number Input */}
            <div className="my-5 flex items-center justify-center">
              <div className="relative flex items-baseline gap-1">
                <input
                  id="input-math-count"
                  type="number"
                  min="0"
                  max="999"
                  value={mathCount}
                  onChange={(e) => setSubjectDirect('math', e.target.value)}
                  className="w-28 text-center text-4xl font-extrabold text-amber-600 bg-transparent border-b-2 border-amber-400 focus:outline-hidden focus:border-amber-600 p-1"
                />
                <span className="text-xs text-slate-500 font-semibold">qs</span>
              </div>
            </div>

            {/* Progress vs Math Goal */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Subject Goal</span>
                <span className={mathCount >= goals.math ? 'text-emerald-600 font-bold' : ''}>
                  {mathCount} / {goals.math}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (mathCount / (goals.math || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Subject Study Duration Progress (if enabled) */}
            {isDurationGoalEnabled && (
              <div className="space-y-1.5 mb-4 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="flex justify-between items-center text-[11px] text-amber-900 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Study Time
                  </span>
                  <span className={mathDuration >= mathTargetDur ? 'text-emerald-600 font-bold' : 'font-mono'}>
                    {mathDuration} / {mathTargetDur} min
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-1.5 overflow-hidden border border-amber-200">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (mathDuration / Math.max(1, mathTargetDur)) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] text-amber-700 font-medium">Quick add:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => adjustSubjectDuration('math', 15)}
                      className="px-1.5 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold cursor-pointer transition"
                    >
                      +15m
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustSubjectDuration('math', 30)}
                      className="px-1.5 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold cursor-pointer transition"
                    >
                      +30m
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustSubjectDuration('math', -15)}
                      disabled={mathDuration <= 0}
                      className="px-1 py-0.5 rounded bg-white hover:bg-slate-100 border border-amber-200 text-slate-500 text-[10px] disabled:opacity-40 cursor-pointer transition"
                    >
                      -15m
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Increment Controls */}
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => adjustSubject('math', 1)}
                className="py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-800 transition cursor-pointer"
              >
                +1
              </button>
              <button
                onClick={() => adjustSubject('math', 5)}
                className="py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-800 transition cursor-pointer"
              >
                +5
              </button>
              <button
                onClick={() => adjustSubject('math', 10)}
                className="py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-800 transition cursor-pointer"
              >
                +10
              </button>
              <button
                onClick={() => adjustSubject('math', 25)}
                className="py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-800 transition cursor-pointer"
              >
                +25
              </button>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => adjustSubject('math', -1)}
                disabled={mathCount <= 0}
                className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-40 text-xs font-medium text-slate-700 transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Minus className="w-3 h-3" /> 1
              </button>
              <button
                onClick={() => handleUpdate(physicsCount, chemistryCount, 0, notes)}
                disabled={mathCount <= 0}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-30 text-[10px] font-medium text-slate-600 transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Streak Shield & Optional Study Duration Cards Row (Positioned directly after Today's Sessions) */}
      <div className={`grid grid-cols-1 ${isDurationGoalEnabled ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4`}>

        {/* Streak target progress with Celebratory Pulse */}
        <div
          className={`p-4 rounded-2xl bg-white border shadow-xs flex flex-col justify-between transition-all duration-500 ${
            isStreakCelebrating || isGoalCelebrating
              ? 'border-amber-500 ring-4 ring-amber-400/40 shadow-xl shadow-amber-500/20 scale-[1.02] bg-linear-to-b from-amber-50/80 via-white to-white'
              : streakGoalMet
              ? 'border-amber-200/90 bg-linear-to-b from-amber-50/30 via-white to-white'
              : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-xl transition-all duration-300 ${
                  isStreakCelebrating || isGoalCelebrating
                    ? 'bg-amber-500 text-white scale-125 animate-bounce shadow-md'
                    : streakGoalMet
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Flame className={`w-4 h-4 ${streakGoalMet ? 'fill-current animate-pulse' : ''}`} />
              </div>
              <span className="text-xs font-semibold text-slate-700">Streak Shield Target</span>
              {(isStreakCelebrating || isGoalCelebrating) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse shadow-xs">
                  🔥 Streak Shield Safe!
                </span>
              )}
            </div>
            <span
              className={`text-xs font-bold transition-all duration-300 ${
                isStreakCelebrating || isGoalCelebrating ? 'text-amber-700 scale-110 font-black' : 'text-amber-600'
              }`}
            >
              {totalQuestions} / {streakTarget} Questions
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-linear-to-r from-amber-500 to-orange-400 ${
                streakGoalMet ? 'shadow-xs' : ''
              }`}
              style={{ width: `${Math.min(100, Math.round((totalQuestions / streakTarget) * 100))}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-500">
            <span>
              {streakGoalMet ? (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playGoalCelebration();
                    fireSubtleGoalConfetti();
                  }}
                  className="text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 cursor-pointer transition-transform hover:scale-105"
                  title="Click to celebrate again 🎉"
                >
                  🔥 Streak Safe for {isToday ? 'Today' : selectedDate}! (Tap 🎉)
                </button>
              ) : (
                <span>{streakTarget - totalQuestions} more needed to keep streak alive</span>
              )}
            </span>
            <span className={`font-semibold transition-all ${isStreakCelebrating ? 'text-amber-700 font-black scale-110' : 'text-amber-600'}`}>
              {Math.min(100, Math.round((totalQuestions / streakTarget) * 100))}%
            </span>
          </div>
        </div>

        {/* Study Duration Goal Progress Banner (Optional Goal) */}
        {isDurationGoalEnabled && (
          <div
            className={`p-4 rounded-2xl bg-white border shadow-xs flex flex-col justify-between transition-all duration-500 ${
              isDurationCelebrating
                ? 'border-indigo-500 ring-4 ring-indigo-400/40 shadow-xl shadow-indigo-500/20 scale-[1.02] bg-linear-to-b from-indigo-50/80 via-white to-white'
                : durationGoalMet
                ? 'border-indigo-200/90 bg-linear-to-b from-indigo-50/30 via-white to-white'
                : 'border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-xl transition-all duration-300 ${
                    isDurationCelebrating
                      ? 'bg-indigo-600 text-white scale-125 animate-bounce shadow-md'
                      : durationGoalMet
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">Study Duration Goal</span>
                  {isDurationCelebrating && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white animate-pulse shadow-xs">
                      🎯 Target Met!
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-bold font-mono transition-all duration-300 ${
                  isDurationCelebrating ? 'text-indigo-700 scale-110 font-black' : 'text-slate-800'
                }`}
              >
                {totalDuration} / {totalTargetDur} min
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  durationGoalMet
                    ? 'bg-linear-to-r from-indigo-500 via-sky-500 to-emerald-400 shadow-xs'
                    : 'bg-linear-to-r from-indigo-500 to-sky-500'
                }`}
                style={{ width: `${durationPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-500">
              <span>
                {durationGoalMet ? (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playGoalCelebration();
                      fireSubtleGoalConfetti();
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer transition-transform hover:scale-105"
                    title="Click to celebrate duration goal 🎉"
                  >
                    <Check className="w-3.5 h-3.5" /> Time Goal Complete! ({(totalDuration / 60).toFixed(1)} hrs)
                  </button>
                ) : (
                  <span>{totalTargetDur - totalDuration} min remaining (~{((totalTargetDur - totalDuration) / 60).toFixed(1)} hrs)</span>
                )}
              </span>
              <span className={`font-semibold font-mono transition-all ${isDurationCelebrating ? 'text-indigo-700 font-black scale-110' : 'text-slate-700'}`}>
                {durationPercent}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Subject-Wise Duration Progress & Quick Log Bar */}
      {isDurationGoalEnabled && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-indigo-50 text-indigo-700">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Subject Study Duration Progress (Target Minutes)
              </h3>
            </div>
            <div className="text-[11px] text-slate-500">
              Total Target: <span className="font-bold text-slate-800">{totalTargetDur} min</span> ({(totalTargetDur / 60).toFixed(1)} hrs)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* Physics Duration Progress */}
            <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-sky-900 flex items-center gap-1.5">
                  <Atom className="w-3.5 h-3.5 text-sky-600" /> Physics Time
                </span>
                <span className="font-mono text-slate-800">
                  {physicsDuration} / {physicsTargetDur} min
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-sky-200">
                <div
                  className="h-full bg-sky-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((physicsDuration / Math.max(1, physicsTargetDur)) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-sky-800 font-semibold font-mono">
                  {Math.round((physicsDuration / Math.max(1, physicsTargetDur)) * 100)}%
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => adjustSubjectDuration('physics', 15)}
                    className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] cursor-pointer shadow-2xs transition"
                    title="Add 15 minutes of Physics study"
                  >
                    +15m
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustSubjectDuration('physics', 30)}
                    className="px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-[10px] border border-sky-300 cursor-pointer transition"
                    title="Add 30 minutes of Physics study"
                  >
                    +30m
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustSubjectDuration('physics', -15)}
                    disabled={physicsDuration <= 0}
                    className="p-1 rounded bg-white hover:bg-slate-100 border border-sky-200 text-slate-500 text-[10px] disabled:opacity-40 cursor-pointer transition"
                    title="Subtract 15 minutes"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chemistry Duration Progress */}
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-900 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-emerald-600" /> Chemistry Time
                </span>
                <span className="font-mono text-slate-800">
                  {chemistryDuration} / {chemistryTargetDur} min
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-emerald-200">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((chemistryDuration / Math.max(1, chemistryTargetDur)) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-emerald-800 font-semibold font-mono">
                  {Math.round((chemistryDuration / Math.max(1, chemistryTargetDur)) * 100)}%
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => adjustSubjectDuration('chemistry', 15)}
                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer shadow-2xs transition"
                    title="Add 15 minutes of Chemistry study"
                  >
                    +15m
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustSubjectDuration('chemistry', 30)}
                    className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] border border-emerald-300 cursor-pointer transition"
                    title="Add 30 minutes of Chemistry study"
                  >
                    +30m
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustSubjectDuration('chemistry', -15)}
                    disabled={chemistryDuration <= 0}
                    className="p-1 rounded bg-white hover:bg-slate-100 border border-emerald-200 text-slate-500 text-[10px] disabled:opacity-40 cursor-pointer transition"
                    title="Subtract 15 minutes"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Math Duration Progress */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-amber-900 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-amber-600" /> Math Time
                </span>
                <span className="font-mono text-slate-800">
                  {mathDuration} / {mathTargetDur} min
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-amber-200">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((mathDuration / Math.max(1, mathTargetDur)) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-amber-800 font-semibold font-mono">
                  {Math.round((mathDuration / Math.max(1, mathTargetDur)) * 100)}%
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => adjustSubjectDuration('math', 15)}
                    className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] cursor-pointer shadow-2xs transition"
                    title="Add 15 minutes of Math study"
                  >
                    +15m
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustSubjectDuration('math', 30)}
                    className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] border border-amber-300 cursor-pointer transition"
                    title="Add 30 minutes of Math study"
                  >
                    +30m
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustSubjectDuration('math', -15)}
                    disabled={mathDuration <= 0}
                    className="p-1 rounded bg-white hover:bg-slate-100 border border-amber-200 text-slate-500 text-[10px] disabled:opacity-40 cursor-pointer transition"
                    title="Subtract 15 minutes"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Hint when Study Duration Goal is not enabled */}
      {!isDurationGoalEnabled && onOpenSettings && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 transition">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold">Optional Study Duration Goal:</span>{' '}
              <span className="text-slate-600">
                Define daily target minutes per subject in settings to track study time progress bars.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer shadow-2xs whitespace-nowrap flex items-center gap-1.5"
          >
            <span>Configure in Settings</span>
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* AI-Powered Daily Insight Card (Placed at the very bottom) */}
      <DailyInsightCard
        selectedDate={selectedDate}
        record={{
          ...record,
          physics: physicsCount,
          chemistry: chemistryCount,
          math: mathCount,
          notes: notes,
        }}
        dailyGoal={dailyTarget}
        streakTarget={streakTarget}
        currentStreak={currentStreak}
        isToday={isToday}
      />
    </div>
  );
};
