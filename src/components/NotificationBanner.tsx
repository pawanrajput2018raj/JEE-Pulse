import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Flame, X, ChevronRight } from 'lucide-react';
import { AnalyticsSummary, AppStateData } from '../types';
import { sounds } from '../utils/soundEffects';

interface NotificationBannerProps {
  state: AppStateData;
  analytics: AnalyticsSummary;
  onGoToLog: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  state,
  analytics,
  onGoToLog,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [alertType, setAlertType] = useState<'missed' | 'reminder' | null>(null);

  const { notifications, goals } = state;
  const todayTotal = analytics.today.total;
  const streakTarget = goals.streakTarget || 30;

  useEffect(() => {
    if (!notifications.enabled || dismissed) {
      setShouldShow(false);
      return;
    }

    const checkSchedule = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeVal = currentHours * 60 + currentMinutes;

      // Parse reminder time (e.g. 19:30)
      const [remH, remM] = (notifications.reminderTime || '19:30').split(':').map(Number);
      const reminderTimeVal = remH * 60 + remM;

      // Parse missed session cutoff (e.g. 20:30)
      const [cutH, cutM] = (notifications.missedSessionCutoff || '20:30').split(':').map(Number);
      const cutoffTimeVal = cutH * 60 + cutM;

      // Check for missed session alert (0 questions logged and past cutoff)
      if (notifications.missedSessionAlert && todayTotal === 0 && currentTimeVal >= cutoffTimeVal) {
        setAlertType('missed');
        setShouldShow(true);
        return;
      }

      // Check for daily reminder (streak target not yet met and past reminder time)
      if (todayTotal < streakTarget && currentTimeVal >= reminderTimeVal) {
        setAlertType('reminder');
        setShouldShow(true);
        return;
      }

      // Proactive prompt if streak is at risk
      if (analytics.currentStreak > 0 && todayTotal < streakTarget) {
        setAlertType('reminder');
        setShouldShow(true);
        return;
      }

      setShouldShow(false);
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 60000); // check every minute
    return () => clearInterval(interval);
  }, [notifications, todayTotal, streakTarget, analytics.currentStreak, dismissed]);

  if (!shouldShow || dismissed) return null;

  return (
    <aside
      aria-label="Practice Session Alert"
      className={`relative px-4 py-3 border-b flex items-center justify-between text-xs transition-all ${
        alertType === 'missed'
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : 'bg-amber-50 border-amber-200 text-amber-950'
      }`}
    >
      <div className="flex items-center gap-2.5 max-w-3xl">
        {alertType === 'missed' ? (
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
        ) : (
          <Bell className="w-4 h-4 text-amber-600 shrink-0" />
        )}

        <div>
          {alertType === 'missed' ? (
            <span>
              <strong>Missed Session Alert:</strong> You haven't logged any Physics, Chemistry, or Math questions yet today! Solve at least {streakTarget} questions to protect your streak.
            </span>
          ) : (
            <span>
              <strong>Daily Target Reminder:</strong> Today you have solved {todayTotal} / {streakTarget} questions. Keep your {analytics.currentStreak}-day streak alive!
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-3">
        <button
          onClick={onGoToLog}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs ${
            alertType === 'missed'
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-amber-600 hover:bg-amber-500 text-white'
          }`}
        >
          <span>Log Questions</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition cursor-pointer"
          title="Dismiss reminder"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
