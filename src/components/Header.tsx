import React from 'react';
import { Flame, Cloud, RefreshCw, Settings, Award, CloudOff, Timer, Tv } from 'lucide-react';
import { AnalyticsSummary, AppStateData } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Logo } from './Logo';

interface HeaderProps {
  state: AppStateData;
  analytics: AnalyticsSummary;
  activeTab: 'log' | 'timer' | 'books' | 'topics' | 'test' | 'history' | 'analytics' | 'badges';
  setActiveTab: (tab: 'log' | 'timer' | 'books' | 'topics' | 'test' | 'history' | 'analytics' | 'badges') => void;
  onOpenSettings: () => void;
  onOpenBadges: () => void;
  isSyncing: boolean;
  onTriggerSync: () => void;
  lastSyncedTime: string | null;
  isTimerActive?: boolean;
  isDesktopWidgetOpen?: boolean;
  onToggleDesktopWidget?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  analytics,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenBadges,
  isSyncing,
  onTriggerSync,
  lastSyncedTime,
  isTimerActive,
  isDesktopWidgetOpen,
  onToggleDesktopWidget,
}) => {
  const isOnline = useOnlineStatus();
  const streakTarget = state.goals.streakTarget || 30;
  const todayTotal = analytics.today.total;
  const todayGoal = state.goals.total || 75;
  const todayPercent = Math.min(100, Math.round((todayTotal / todayGoal) * 100));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and branding */}
          <Logo size="md" showText={true} onClick={() => setActiveTab('log')} />

          {/* Center / Right stats indicators */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Daily Streak target pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                analytics.currentStreak > 0
                  ? todayTotal >= streakTarget
                    ? 'bg-amber-100/90 border-amber-400 text-amber-900 shadow-2xs ring-1 ring-amber-300'
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
              title={`Streak: ${analytics.currentStreak} days. Target: ${streakTarget} questions/day. (Today: ${todayTotal}/${streakTarget}${todayTotal >= streakTarget ? ' - Shield Secured! 🔥' : ''})`}
            >
              <Flame
                className={`w-4 h-4 ${
                  analytics.currentStreak > 0 ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-slate-400'
                }`}
              />
              <span className="text-xs font-bold">{analytics.currentStreak}d</span>
              <span className="text-[10px] opacity-75 hidden md:inline">
                streak ({todayTotal}/{streakTarget}q)
              </span>
              {todayTotal >= streakTarget && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping hidden sm:inline-block" />
              )}
            </div>

            {/* Cloud Sync pill */}
            <button
              id="header-cloud-sync-btn"
              onClick={onTriggerSync}
              disabled={isSyncing || !isOnline}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer ${
                !isOnline
                  ? 'bg-slate-100 border-slate-200 text-slate-500'
                  : isSyncing
                  ? 'bg-sky-50 border-sky-300 text-sky-700'
                  : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700'
              }`}
              title={
                !isOnline
                  ? 'Offline: Changes saved locally on device'
                  : isSyncing
                  ? 'Syncing with cloud...'
                  : `Sync Code: ${state.profile.syncCode} (Click to Sync Now)`
              }
            >
              {!isOnline ? (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden lg:inline">Offline</span>
                </>
              ) : isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                  <span className="hidden lg:inline">Syncing...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden lg:inline">{state.profile.syncCode}</span>
                </>
              )}
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Desktop Screen Widget Button */}
            {onToggleDesktopWidget && (
              <button
                id="header-desktop-widget-btn"
                onClick={onToggleDesktopWidget}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                  isDesktopWidgetOpen
                    ? 'bg-slate-900 text-sky-400 border-slate-700 shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="Desktop Screen Widget (Alt+W) - Floating companion for multi-tasking and problem sets"
              >
                <Tv className={`w-3.5 h-3.5 ${isDesktopWidgetOpen ? 'text-sky-400' : 'text-slate-600'}`} />
                <span className="hidden sm:inline">Widget</span>
                <span className="hidden lg:inline text-[10px] font-mono opacity-70">Alt+W</span>
                {isDesktopWidgetOpen && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                )}
              </button>
            )}

            {/* Settings button */}
            <button
              id="header-settings-btn"
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition cursor-pointer border border-slate-200"
              title="Goals, notifications & cloud sync settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Main Navigation" className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5 border-t border-slate-200/70 text-xs sm:text-sm font-semibold">
          <button
            id="nav-tab-log"
            onClick={() => setActiveTab('log')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'log'
                ? 'bg-slate-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <span>📝 Log Questions</span>
          </button>

          <button
            id="nav-tab-books"
            onClick={() => setActiveTab('books')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'books' || activeTab === 'topics'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-indigo-900 hover:bg-indigo-50/70'
            }`}
          >
            <span>📖 Books &amp; Chapters</span>
          </button>

          <button
            id="nav-tab-test"
            onClick={() => setActiveTab('test')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'test'
                ? 'bg-purple-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50/70'
            }`}
          >
            <span>🎯 JEE Test &amp; CBT</span>
          </button>

          <button
            id="nav-tab-timer"
            onClick={() => setActiveTab('timer')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'timer'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <span>⏱️ Question Stopwatch</span>
            {isTimerActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            id="nav-tab-history"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <span>📅 Date History</span>
          </button>

          <button
            id="nav-tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <span>📊 Analytics &amp; Trends</span>
          </button>

          <button
            id="nav-tab-badges"
            onClick={() => setActiveTab('badges')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'badges'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <span>🏅 Badges &amp; Milestones</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
