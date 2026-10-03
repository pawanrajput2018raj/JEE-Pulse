import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { DailyLogSection } from './components/DailyLogSection';
import { BooksChaptersPage } from './components/BooksChaptersPage';
import { HistorySection } from './components/HistorySection';
import { AnalyticsSection } from './components/AnalyticsSection';
import { QuestionTimerSection } from './components/QuestionTimerSection';
import { DesktopWidget } from './components/DesktopWidget';
import { StandaloneWidgetView } from './components/StandaloneWidgetView';
import { SettingsModal } from './components/SettingsModal';
import { BadgesModal } from './components/BadgesModal';
import { BadgesPage } from './components/BadgesPage';
import { NotificationBanner } from './components/NotificationBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { JeeTestSection } from './components/JeeTestSection';
import { AppStateData, DailyGoals, DailyRecord, NotificationSettings, SubjectBook, JeeTest, TestAttemptResult } from './types';
import { loadAppState, saveAppState } from './utils/storage';
import { computeAnalytics } from './utils/analytics';
import { computeBadges } from './utils/badges';
import { getTodayStr } from './utils/dateUtils';
import { sounds } from './utils/soundEffects';
import { useQuestionTimer } from './hooks/useQuestionTimer';
import { pipManager } from './utils/pipManager';
import { broadcastWidgetUpdate, subscribeWidgetUpdates } from './utils/widgetSync';

export default function App() {
  // Check if launched as a dedicated desktop widget window (?widget=true or ?mode=desktop-widget)
  const isStandaloneWidget = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('widget') === 'true' || params.get('mode') === 'desktop-widget';
  }, []);

  if (isStandaloneWidget) {
    return <StandaloneWidgetView />;
  }

  const [state, setState] = useState<AppStateData>(() => loadAppState());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [activeTab, setActiveTab] = useState<'log' | 'timer' | 'books' | 'topics' | 'test' | 'history' | 'analytics' | 'badges'>('log');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBadgesOpen, setIsBadgesOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);

  // Desktop Screen Widget visibility state (defaults to open on desktop screens >= 1024px)
  const [isDesktopWidgetOpen, setIsDesktopWidgetOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('jee_desktop_widget_open');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.innerWidth >= 1024;
  });

  // Question Stopwatch & Timer Hook
  const timer = useQuestionTimer();

  // Picture-in-Picture OS Window Handler
  const handleLaunchPiP = useCallback(async () => {
    if (isPiPActive) {
      pipManager.close();
      setIsPiPActive(false);
      return;
    }
    const success = await pipManager.openDocumentPiP(
      {
        onPlayPause: timer.togglePlayPause,
        onNextQuestion: timer.nextQuestion,
        onSetQuestionNumber: timer.setQuestionNumber,
        onSetSubject: timer.setSubject,
        onResetQuestion: timer.resetCurrentQuestion,
        onClose: () => setIsPiPActive(false),
      },
      {
        questionNumber: timer.timerState.currentQuestionNumber,
        questionSeconds: timer.timerState.questionSeconds,
        totalSeconds: timer.timerState.totalSeconds,
        subject: timer.timerState.subject,
        isActive: timer.timerState.isActive,
        isPaused: timer.timerState.isPaused,
        lastLapDuration: timer.timerState.laps[0]?.durationSeconds,
        mode: timer.timerState.mode,
        targetSecondsPerQuestion: timer.timerState.targetSecondsPerQuestion,
        aimedQuestions: timer.timerState.aimedQuestions,
        sessionTargetSeconds: timer.timerState.sessionTargetSeconds,
      }
    );
    if (success) {
      setIsPiPActive(true);
    }
  }, [
    isPiPActive,
    timer.togglePlayPause,
    timer.nextQuestion,
    timer.setQuestionNumber,
    timer.setSubject,
    timer.resetCurrentQuestion,
    timer.timerState.currentQuestionNumber,
    timer.timerState.questionSeconds,
    timer.timerState.totalSeconds,
    timer.timerState.subject,
    timer.timerState.isActive,
    timer.timerState.isPaused,
    timer.timerState.laps,
    timer.timerState.mode,
    timer.timerState.targetSecondsPerQuestion,
    timer.timerState.aimedQuestions,
    timer.timerState.sessionTargetSeconds,
  ]);

  // Sync PiP display whenever timer state updates
  useEffect(() => {
    pipManager.update({
      questionNumber: timer.timerState.currentQuestionNumber,
      questionSeconds: timer.timerState.questionSeconds,
      totalSeconds: timer.timerState.totalSeconds,
      subject: timer.timerState.subject,
      isActive: timer.timerState.isActive,
      isPaused: timer.timerState.isPaused,
      lastLapDuration: timer.timerState.laps[0]?.durationSeconds,
      mode: timer.timerState.mode,
      targetSecondsPerQuestion: timer.timerState.targetSecondsPerQuestion,
      aimedQuestions: timer.timerState.aimedQuestions,
      sessionTargetSeconds: timer.timerState.sessionTargetSeconds,
    });
  }, [
    timer.timerState.questionSeconds,
    timer.timerState.totalSeconds,
    timer.timerState.currentQuestionNumber,
    timer.timerState.subject,
    timer.timerState.isActive,
    timer.timerState.isPaused,
    timer.timerState.laps,
    timer.timerState.mode,
    timer.timerState.targetSecondsPerQuestion,
    timer.timerState.aimedQuestions,
    timer.timerState.sessionTargetSeconds,
  ]);

  // Sync sound manager with notification sound setting
  useEffect(() => {
    sounds.setEnabled(state.notifications.soundEnabled);
  }, [state.notifications.soundEnabled]);

  // Compute analytics
  const analytics = useMemo(() => computeAnalytics(state), [state]);

  // Compute badges
  const badges = useMemo(() => computeBadges(state, analytics), [state, analytics]);

  // Record for currently selected date
  const currentRecord: DailyRecord = useMemo(() => {
    return (
      state.records[selectedDate] || {
        date: selectedDate,
        physics: 0,
        chemistry: 0,
        math: 0,
        notes: '',
        updatedAt: Date.now(),
      }
    );
  }, [state.records, selectedDate]);

  // Cloud sync routine
  const syncWithCloud = useCallback(async (appData: AppStateData) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }
    const syncCode = appData.profile.syncCode;
    if (!syncCode) return;

    setIsSyncing(true);
    try {
      // Sync study state
      await fetch(`/api/sync/${syncCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studyData: appData,
          username: appData.profile.username,
          clientTimestamp: Date.now(),
        }),
      });

      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('Background cloud sync failed (offline or network pause):', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial cloud sync on mount
  useEffect(() => {
    syncWithCloud(state);
  }, []);

  // Global hotkey: Alt+W toggles Desktop Widget
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && (e.key === 'w' || e.key === 'W')) || (e.altKey && (e.key === 'd' || e.key === 'D'))) {
        e.preventDefault();
        setIsDesktopWidgetOpen((prev) => {
          const next = !prev;
          try {
            localStorage.setItem('jee_desktop_widget_open', String(next));
          } catch (err) {
            console.warn(err);
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync state with standalone desktop widgets
  useEffect(() => {
    const unsubscribe = subscribeWidgetUpdates((msg) => {
      if (msg.type === 'RECORD_UPDATED') {
        setState((prev) => ({
          ...prev,
          records: {
            ...prev.records,
            [msg.record.date]: msg.record,
          },
          lastUpdated: Date.now(),
        }));
      } else if (msg.type === 'RELOAD_REQUEST') {
        setState(loadAppState());
      }
    });
    return unsubscribe;
  }, []);

  // Reference to pop-out standalone desktop widget window
  const widgetWindowRef = useRef<Window | null>(null);

  // Automatically close popout widget window and PiP when the main app closes or unloads
  useEffect(() => {
    const handleCloseWidgetsOnAppExit = () => {
      // 1. Broadcast PARENT_CLOSED message to standalone window
      broadcastWidgetUpdate({ type: 'PARENT_CLOSED' });

      // 2. Directly close popout window reference if open
      if (widgetWindowRef.current && !widgetWindowRef.current.closed) {
        try {
          widgetWindowRef.current.close();
        } catch (e) {
          console.warn('Failed to close widget window directly', e);
        }
      }

      // 3. Close Picture-in-Picture window if active
      pipManager.close();
    };

    window.addEventListener('beforeunload', handleCloseWidgetsOnAppExit);
    window.addEventListener('unload', handleCloseWidgetsOnAppExit);

    return () => {
      handleCloseWidgetsOnAppExit();
      window.removeEventListener('beforeunload', handleCloseWidgetsOnAppExit);
      window.removeEventListener('unload', handleCloseWidgetsOnAppExit);
    };
  }, []);

  // Launch pop-out OS desktop window
  const handlePopOutDesktopWindow = useCallback(() => {
    sounds.playClick();
    const width = 380;
    const height = 560;
    const left = typeof window !== 'undefined' ? Math.max(0, window.screen.availWidth - width - 40) : 100;
    const top = 60;
    const popout = window.open(
      `${window.location.origin}${window.location.pathname}?widget=true`,
      'JeeDesktopStudyWidget',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no`
    );
    widgetWindowRef.current = popout;
  }, []);

  // Handle saving or incrementing daily record
  const handleSaveRecord = (updatedRecord: DailyRecord) => {
    setState((prevState) => {
      const newRecords = {
        ...prevState.records,
        [updatedRecord.date]: updatedRecord,
      };
      const newState: AppStateData = {
        ...prevState,
        records: newRecords,
        lastUpdated: Date.now(),
      };
      saveAppState(newState);
      // Trigger background sync
      syncWithCloud(newState);
      // Broadcast update to desktop widgets
      broadcastWidgetUpdate({ type: 'RECORD_UPDATED', record: updatedRecord });
      return newState;
    });
  };

  // Handle updating daily goals & streak target
  const handleUpdateGoals = (newGoals: DailyGoals) => {
    setState((prevState) => {
      const newState: AppStateData = {
        ...prevState,
        goals: newGoals,
        lastUpdated: Date.now(),
      };
      saveAppState(newState);
      syncWithCloud(newState);
      return newState;
    });
  };

  // Handle updating subject books and chapter completion
  const handleSaveBooks = (updatedBooks: SubjectBook[]) => {
    setState((prevState) => {
      const newState: AppStateData = {
        ...prevState,
        books: updatedBooks,
        lastUpdated: Date.now(),
      };
      saveAppState(newState);
      syncWithCloud(newState);
      return newState;
    });
  };

  // Handle updating tests
  const handleSaveTests = (updatedTests: JeeTest[]) => {
    setState((prevState) => {
      const newState: AppStateData = {
        ...prevState,
        tests: updatedTests,
        lastUpdated: Date.now(),
      };
      saveAppState(newState);
      syncWithCloud(newState);
      return newState;
    });
  };

  // Handle updating test attempts
  const handleSaveAttempts = (updatedAttempts: TestAttemptResult[]) => {
    setState((prevState) => {
      const newState: AppStateData = {
        ...prevState,
        testAttempts: updatedAttempts,
        lastUpdated: Date.now(),
      };
      saveAppState(newState);
      syncWithCloud(newState);
      return newState;
    });
  };

  // Handle updating daily record (e.g. from completed mock test questions)
  const handleUpdateDailyRecord = (updater: (prev: DailyRecord) => DailyRecord) => {
    setState((prevState) => {
      const today = getTodayStr();
      const current = prevState.records[today] || {
        date: today,
        physics: 0,
        chemistry: 0,
        math: 0,
        notes: '',
        updatedAt: Date.now(),
      };
      const updated = updater(current);
      const newRecords = {
        ...prevState.records,
        [today]: updated,
      };
      const newState: AppStateData = {
        ...prevState,
        records: newRecords,
        lastUpdated: Date.now(),
      };
      saveAppState(newState);
      syncWithCloud(newState);
      broadcastWidgetUpdate({ type: 'RECORD_UPDATED', record: updated });
      return newState;
    });
  };

  // Handle updating notification settings
  const handleUpdateNotifications = (newSettings: NotificationSettings) => {
    setState((prevState) => {
      const newState: AppStateData = {
        ...prevState,
        notifications: newSettings,
        lastUpdated: Date.now(),
      };
      saveAppState(newState);
      return newState;
    });
  };

  // Connect to existing sync code from another device
  const handleConnectSyncCode = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/sync/${code}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.studyData) {
          const cloudState: AppStateData = json.data.studyData;
          // Merge local and cloud records (newer wins per date)
          const mergedRecords = { ...state.records };
          Object.entries(cloudState.records || {}).forEach(([dateKey, record]) => {
            if (!mergedRecords[dateKey] || (record.updatedAt || 0) > (mergedRecords[dateKey].updatedAt || 0)) {
              mergedRecords[dateKey] = record;
            }
          });

          const mergedState: AppStateData = {
            ...cloudState,
            records: mergedRecords,
            profile: {
              ...cloudState.profile,
              syncCode: code,
            },
            lastUpdated: Date.now(),
          };

          setState(mergedState);
          saveAppState(mergedState);
          syncWithCloud(mergedState);
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to connect sync code:', err);
    }
    return false;
  };

  // Import JSON backup
  const handleImportData = (importedState: AppStateData) => {
    setState(importedState);
    saveAppState(importedState);
    syncWithCloud(importedState);
  };

  // Update profile username
  const handleUpdateUsername = (name: string) => {
    setState((prevState) => {
      const newState: AppStateData = {
        ...prevState,
        profile: {
          ...prevState.profile,
          username: name,
        },
        lastUpdated: Date.now(),
      };
      saveAppState(newState);
      syncWithCloud(newState);
      return newState;
    });
  };

  // Handler when clicking "Edit Date" from History section
  const handleSelectDateToEdit = (dateStr: string) => {
    setSelectedDate(dateStr);
    setActiveTab('log');
  };

  // Today's record for widget
  const todayRecord: DailyRecord = useMemo(() => {
    const today = getTodayStr();
    return (
      state.records[today] || {
        date: today,
        physics: 0,
        chemistry: 0,
        math: 0,
        notes: '',
        updatedAt: Date.now(),
      }
    );
  }, [state.records]);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Header Bar */}
      <Header
        state={state}
        analytics={analytics}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBadges={() => setIsBadgesOpen(true)}
        isSyncing={isSyncing}
        onTriggerSync={() => syncWithCloud(state)}
        lastSyncedTime={lastSyncedTime}
        isTimerActive={timer.timerState.isActive && !timer.timerState.isPaused}
        isDesktopWidgetOpen={isDesktopWidgetOpen}
        onToggleDesktopWidget={() => {
          setIsDesktopWidgetOpen((prev) => {
            const next = !prev;
            try {
              localStorage.setItem('jee_desktop_widget_open', String(next));
            } catch (e) {
              console.warn(e);
            }
            return next;
          });
        }}
      />

      {/* Daily Missed/Reminder Notification Banner */}
      <NotificationBanner
        state={state}
        analytics={analytics}
        onGoToLog={() => {
          setSelectedDate(getTodayStr());
          setActiveTab('log');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'log' && (
          <DailyLogSection
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            record={currentRecord}
            goals={state.goals}
            onSaveRecord={handleSaveRecord}
            streakTarget={state.goals.streakTarget || 30}
            currentStreak={analytics.currentStreak}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {(activeTab === 'books' || activeTab === 'topics') && (
          <BooksChaptersPage
            books={state.books || []}
            onSaveBooks={handleSaveBooks}
          />
        )}

        {activeTab === 'test' && (
          <JeeTestSection
            tests={state.tests || []}
            onSaveTests={handleSaveTests}
            testAttempts={state.testAttempts || []}
            onSaveAttempts={handleSaveAttempts}
            onUpdateDailyRecord={handleUpdateDailyRecord}
            username={state.profile.username || 'Student'}
          />
        )}

        {activeTab === 'timer' && (
          <QuestionTimerSection
            timerState={timer.timerState}
            onPlayPause={timer.togglePlayPause}
            onNextQuestion={timer.nextQuestion}
            onSetQuestionNumber={timer.setQuestionNumber}
            onSetSubject={timer.setSubject}
            onToggleFloating={timer.toggleFloating}
            onResetQuestion={timer.resetCurrentQuestion}
            onResetSession={timer.resetSession}
            onClearLaps={timer.clearLaps}
            todayRecord={
              state.records[getTodayStr()] || {
                date: getTodayStr(),
                physics: 0,
                chemistry: 0,
                math: 0,
                updatedAt: Date.now(),
              }
            }
            onSaveRecord={handleSaveRecord}
            onLaunchPiP={handleLaunchPiP}
            isPiPActive={isPiPActive}
            onSetTimerMode={timer.setTimerMode}
            onSetTargetSecondsPerQuestion={timer.setTargetSecondsPerQuestion}
            onSetAimedQuestions={timer.setAimedQuestions}
            onSetSessionTargetSeconds={timer.setSessionTargetSeconds}
          />
        )}

        {activeTab === 'history' && (
          <HistorySection
            state={state}
            onSelectDateToEdit={handleSelectDateToEdit}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsSection
            state={state}
            analytics={analytics}
          />
        )}

        {activeTab === 'badges' && (
          <BadgesPage
            badges={badges}
            currentStreak={analytics.currentStreak}
            totalQuestions={analytics.allTime.total}
          />
        )}
      </main>

      {/* Desktop Screen Widget (HUD / Compact Card / Focus Studio) */}
      {isDesktopWidgetOpen && (
        <DesktopWidget
          todayRecord={todayRecord}
          goals={state.goals}
          analytics={analytics}
          timerState={timer.timerState}
          onSaveRecord={handleSaveRecord}
          onPlayPauseTimer={timer.togglePlayPause}
          onNextQuestion={timer.nextQuestion}
          onSetQuestionNumber={timer.setQuestionNumber}
          onSetSubject={timer.setSubject}
          onResetQuestion={timer.resetCurrentQuestion}
          onClose={() => {
            setIsDesktopWidgetOpen(false);
            try {
              localStorage.setItem('jee_desktop_widget_open', 'false');
            } catch (e) {
              console.warn(e);
            }
          }}
          onOpenFullApp={(tab) => {
            if (tab) setActiveTab(tab);
          }}
          onPopOutWindow={handlePopOutDesktopWindow}
        />
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        state={state}
        onUpdateGoals={handleUpdateGoals}
        onUpdateNotifications={handleUpdateNotifications}
        onConnectSyncCode={handleConnectSyncCode}
        onTriggerSync={() => syncWithCloud(state)}
        onImportData={handleImportData}
        onUpdateUsername={handleUpdateUsername}
        isSyncing={isSyncing}
      />

      <BadgesModal
        isOpen={isBadgesOpen}
        onClose={() => setIsBadgesOpen(false)}
        badges={badges}
        onOpenFullPage={() => setActiveTab('badges')}
      />

      {/* Offline Status Bar */}
      <OfflineIndicator
        isSyncing={isSyncing}
        onManualSync={() => syncWithCloud(state)}
      />
    </div>
  );
}
