import { useState, useEffect, useRef, useCallback } from 'react';
import { SubjectType, SolvedQuestionLap, QuestionTimerState } from '../types';
import { sounds } from '../utils/soundEffects';

const TIMER_STORAGE_KEY = 'jee_question_timer_session_v1';

const defaultState: QuestionTimerState = {
  subject: 'physics',
  currentQuestionNumber: 1,
  questionSeconds: 0,
  totalSeconds: 0,
  isActive: false,
  isPaused: false,
  laps: [],
  isFloating: false,
  mode: 'stopwatch',
  targetSecondsPerQuestion: 120,
  aimedQuestions: 25,
};

export function useQuestionTimer() {
  const [timerState, setTimerState] = useState<QuestionTimerState>(() => {
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultState,
          ...parsed,
          // resume paused on initial reload to prevent runaway timers
          isPaused: parsed.isActive ? true : false,
        };
      }
    } catch (e) {
      console.error('Failed to load saved timer session', e);
    }
    return defaultState;
  });

  // Keep ref to avoid stale closures in setInterval
  const stateRef = useRef(timerState);
  stateRef.current = timerState;

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
    } catch (e) {
      console.warn('Failed to persist timer state', e);
    }
  }, [timerState]);

  // Main tick interval
  useEffect(() => {
    if (!timerState.isActive || timerState.isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setTimerState((prev) => {
        if (!prev.isActive || prev.isPaused) return prev;
        return {
          ...prev,
          questionSeconds: prev.questionSeconds + 1,
          totalSeconds: prev.totalSeconds + 1,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.isActive, timerState.isPaused]);

  // Start or resume timer
  const startTimer = useCallback(() => {
    sounds.playTimerStart();
    setTimerState((prev) => ({
      ...prev,
      isActive: true,
      isPaused: false,
    }));
  }, []);

  // Pause timer
  const pauseTimer = useCallback(() => {
    sounds.playClick();
    setTimerState((prev) => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (!stateRef.current.isActive) {
      startTimer();
    } else if (stateRef.current.isPaused) {
      startTimer();
    } else {
      pauseTimer();
    }
  }, [startTimer, pauseTimer]);

  // Advance to Next Question (Primary User Action)
  // Records current question duration, increments question number, resets question timer to 0
  const nextQuestion = useCallback(() => {
    sounds.playNextQuestion();
    setTimerState((prev) => {
      const lap: SolvedQuestionLap = {
        questionNumber: prev.currentQuestionNumber,
        durationSeconds: Math.max(1, prev.questionSeconds),
        subject: prev.subject,
        timestamp: Date.now(),
      };

      const updatedLaps = [lap, ...prev.laps];

      return {
        ...prev,
        currentQuestionNumber: prev.currentQuestionNumber + 1,
        questionSeconds: 0,
        isActive: true, // Keep running for next question
        isPaused: false,
        laps: updatedLaps,
      };
    });
  }, []);

  // Set specific question number (e.g. user wants to solve Question 15)
  const setQuestionNumber = useCallback((qNum: number) => {
    const valid = Math.max(1, Math.min(999, qNum));
    setTimerState((prev) => ({
      ...prev,
      currentQuestionNumber: valid,
    }));
  }, []);

  // Change subject (Physics / Chemistry / Math)
  const setSubject = useCallback((subject: SubjectType) => {
    sounds.playClick();
    setTimerState((prev) => ({
      ...prev,
      subject,
    }));
  }, []);

  // Toggle Flowing (Floating) Mode on screen
  const toggleFloating = useCallback(() => {
    sounds.playClick();
    setTimerState((prev) => ({
      ...prev,
      isFloating: !prev.isFloating,
    }));
  }, []);

  const setFloating = useCallback((floating: boolean) => {
    setTimerState((prev) => ({
      ...prev,
      isFloating: floating,
    }));
  }, []);

  // Reset current question timer only
  const resetCurrentQuestion = useCallback(() => {
    sounds.playClick();
    setTimerState((prev) => ({
      ...prev,
      questionSeconds: 0,
    }));
  }, []);

  // Reset entire session
  const resetSession = useCallback(() => {
    sounds.playClick();
    setTimerState({
      ...defaultState,
      subject: stateRef.current.subject,
      isFloating: stateRef.current.isFloating,
      mode: stateRef.current.mode || 'stopwatch',
      targetSecondsPerQuestion: stateRef.current.targetSecondsPerQuestion || 120,
      aimedQuestions: stateRef.current.aimedQuestions || 25,
      sessionTargetSeconds: stateRef.current.sessionTargetSeconds,
    });
  }, []);

  // Clear completed laps
  const clearLaps = useCallback(() => {
    sounds.playClick();
    setTimerState((prev) => ({
      ...prev,
      laps: [],
    }));
  }, []);

  // Switch between 'stopwatch' (count-up) and 'timer' (countdown) mode
  const setTimerMode = useCallback((mode: 'stopwatch' | 'timer') => {
    sounds.playClick();
    setTimerState((prev) => ({
      ...prev,
      mode,
    }));
  }, []);

  // Configure target time per question for countdown timer (in seconds)
  const setTargetSecondsPerQuestion = useCallback((secs: number) => {
    const valid = Math.max(10, Math.min(3600, Math.round(secs)));
    setTimerState((prev) => ({
      ...prev,
      targetSecondsPerQuestion: valid,
    }));
  }, []);

  // Configure aimed number of questions for session (target question count)
  const setAimedQuestions = useCallback((count: number) => {
    const valid = Math.max(1, Math.min(200, Math.round(count)));
    sounds.playClick();
    setTimerState((prev) => ({
      ...prev,
      aimedQuestions: valid,
    }));
  }, []);

  // Configure session countdown target duration (e.g. 1800s for 30m, 2700s for 45m, 3600s for 1h, 6300s for 1h45m, 7200s for 2h, 9000s for 2.5h)
  const setSessionTargetSeconds = useCallback((secs: number | undefined) => {
    sounds.playClick();
    setTimerState((prev) => ({
      ...prev,
      sessionTargetSeconds: secs && secs > 0 ? secs : undefined,
    }));
  }, []);

  return {
    timerState,
    startTimer,
    pauseTimer,
    togglePlayPause,
    nextQuestion,
    setQuestionNumber,
    setSubject,
    toggleFloating,
    setFloating,
    resetCurrentQuestion,
    resetSession,
    clearLaps,
    setTimerMode,
    setTargetSecondsPerQuestion,
    setAimedQuestions,
    setSessionTargetSeconds,
  };
}
