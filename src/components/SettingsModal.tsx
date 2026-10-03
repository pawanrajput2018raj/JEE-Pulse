import React, { useState } from 'react';
import { X, Settings, Target, Flame, Bell, Cloud, Download, Upload, Copy, Check, RefreshCw, Volume2, VolumeX, Smartphone, Shield, Clock } from 'lucide-react';
import { AppStateData, DailyGoals, NotificationSettings } from '../types';
import { sounds } from '../utils/soundEffects';
import { exportDataJSON } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppStateData;
  onUpdateGoals: (goals: DailyGoals) => void;
  onUpdateNotifications: (settings: NotificationSettings) => void;
  onConnectSyncCode: (code: string) => Promise<boolean>;
  onTriggerSync: () => void;
  onImportData: (importedState: AppStateData) => void;
  onUpdateUsername: (name: string) => void;
  isSyncing: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateGoals,
  onUpdateNotifications,
  onConnectSyncCode,
  onTriggerSync,
  onImportData,
  onUpdateUsername,
  isSyncing,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'goals' | 'notifications' | 'cloud'>('goals');

  // Goals Form State
  const [physicsGoal, setPhysicsGoal] = useState(state.goals.physics || 25);
  const [chemistryGoal, setChemistryGoal] = useState(state.goals.chemistry || 25);
  const [mathGoal, setMathGoal] = useState(state.goals.math || 25);
  const [totalGoal, setTotalGoal] = useState(state.goals.total || 75);
  const [streakTarget, setStreakTarget] = useState(state.goals.streakTarget || 30);

  // Optional Study Duration Goals State
  const [durationEnabled, setDurationEnabled] = useState(state.goals.duration?.enabled ?? false);
  const [physicsDuration, setPhysicsDuration] = useState(state.goals.duration?.physics || 60);
  const [chemistryDuration, setChemistryDuration] = useState(state.goals.duration?.chemistry || 60);
  const [mathDuration, setMathDuration] = useState(state.goals.duration?.math || 60);

  // Notification Form State
  const [notifEnabled, setNotifEnabled] = useState(state.notifications.enabled);
  const [reminderTime, setReminderTime] = useState(state.notifications.reminderTime || '19:30');
  const [missedAlert, setMissedAlert] = useState(state.notifications.missedSessionAlert);
  const [missedCutoff, setMissedCutoff] = useState(state.notifications.missedSessionCutoff || '20:30');
  const [soundEnabled, setSoundEnabled] = useState(state.notifications.soundEnabled);

  // Cloud Sync Form State
  const [connectCodeInput, setConnectCodeInput] = useState('');
  const [connectStatus, setConnectStatus] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testNotifNotice, setTestNotifNotice] = useState(false);

  if (!isOpen) return null;

  const handleSaveGoals = () => {
    const p = Math.max(1, Number(physicsGoal) || 20);
    const c = Math.max(1, Number(chemistryGoal) || 20);
    const m = Math.max(1, Number(mathGoal) || 20);
    const tot = Math.max(1, Number(totalGoal) || (p + c + m));
    const stk = Math.max(1, Number(streakTarget) || 25);
    const pDur = Math.max(1, Number(physicsDuration) || 60);
    const cDur = Math.max(1, Number(chemistryDuration) || 60);
    const mDur = Math.max(1, Number(mathDuration) || 60);

    onUpdateGoals({
      physics: p,
      chemistry: c,
      math: m,
      total: tot,
      streakTarget: stk,
      duration: {
        enabled: durationEnabled,
        physics: pDur,
        chemistry: cDur,
        math: mDur,
      },
    });
    sounds.playClick();
    onClose();
  };

  const handleSaveNotifications = () => {
    const updated: NotificationSettings = {
      ...state.notifications,
      enabled: notifEnabled,
      reminderTime,
      missedSessionAlert: missedAlert,
      missedSessionCutoff: missedCutoff,
      soundEnabled,
    };
    sounds.setEnabled(soundEnabled);
    onUpdateNotifications(updated);
    sounds.playClick();
    onClose();
  };

  const requestBrowserPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      onUpdateNotifications({
        ...state.notifications,
        browserPermission: permission,
      });
      if (permission === 'granted') {
        new Notification('JEE Journey Tracker', {
          body: 'Notifications enabled! We will remind you to keep your daily study streak.',
          icon: '/icon.svg',
        });
      }
    }
  };

  const handleTestNotification = () => {
    sounds.playReminderChime();
    setTestNotifNotice(true);
    setTimeout(() => setTestNotifNotice(false), 3500);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Practice Session Reminder 📚', {
        body: 'Time to solve your daily Physics, Chemistry & Math questions!',
        icon: '/icon.svg',
      });
    }
  };

  const handleCopySyncCode = () => {
    navigator.clipboard.writeText(state.profile.syncCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConnectDevice = async () => {
    if (!connectCodeInput.trim()) return;
    setConnectStatus('Connecting...');
    const success = await onConnectSyncCode(connectCodeInput.trim().toUpperCase());
    if (success) {
      setConnectStatus('Device linked! Data synced successfully.');
      setConnectCodeInput('');
      setTimeout(() => {
        setConnectStatus(null);
        onClose();
      }, 1500);
    } else {
      setConnectStatus('Failed: Code not found on cloud server.');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && imported.records) {
          onImportData(imported);
          sounds.playGoalCelebration();
          onClose();
        }
      } catch {
        alert('Invalid backup JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Preferences &amp; Settings</h2>
              <p className="text-xs text-slate-500">Goals, reminders, and cloud sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 px-4 pt-2 bg-slate-50 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveSubTab('goals')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'goals'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Goals &amp; Streak</span>
          </button>
          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'notifications'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Reminders</span>
          </button>
          <button
            onClick={() => setActiveSubTab('cloud')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'cloud'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Cloud Sync</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: GOALS & STREAK TARGET */}
          {activeSubTab === 'goals' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Daily Streak Target (Questions)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Minimum total questions you must solve in a day to keep your consistency streak alive.
                </p>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={streakTarget}
                  onChange={(e) => setStreakTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-amber-600 font-bold text-base focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-sky-600" />
                  Overall Daily Question Goal
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Your primary daily question benchmark (Physics + Chemistry + Math).
                </p>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={totalGoal}
                  onChange={(e) => setTotalGoal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sky-700 font-bold text-base focus:border-sky-500 focus:outline-hidden"
                />
              </div>

              {/* Subject Breakdown Targets */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200">
                  <label className="block text-[11px] font-bold text-sky-800 mb-1">
                    Physics Goal
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={physicsGoal}
                    onChange={(e) => setPhysicsGoal(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white border border-sky-300 text-sky-800 text-sm font-bold"
                  />
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                    Chemistry Goal
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={chemistryGoal}
                    onChange={(e) => setChemistryGoal(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-sm font-bold"
                  />
                </div>

                <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-200">
                  <label className="block text-[11px] font-bold text-violet-800 mb-1">
                    Math Goal
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={mathGoal}
                    onChange={(e) => setMathGoal(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white border border-violet-300 text-violet-800 text-sm font-bold"
                  />
                </div>
              </div>

              {/* Optional Study Duration Goal */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>Study Duration Goal</span>
                        <span className="text-[10px] text-sky-700 font-semibold bg-sky-100/80 px-1.5 py-0.5 rounded border border-sky-200">
                          Optional
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Set target minutes per subject to see a study time progress bar in Daily Log
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={durationEnabled}
                      onChange={(e) => setDurationEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                </div>

                {durationEnabled && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-2.5 animate-in fade-in duration-150">
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-200">
                        <label className="block text-[10px] font-bold text-sky-800 mb-1">
                          Physics (min)
                        </label>
                        <input
                          type="number"
                          min="5"
                          step="5"
                          value={physicsDuration}
                          onChange={(e) => setPhysicsDuration(Math.max(1, Number(e.target.value)))}
                          className="w-full px-2 py-1.5 rounded-md bg-white border border-sky-300 text-sky-800 font-bold text-xs"
                        />
                      </div>

                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                        <label className="block text-[10px] font-bold text-emerald-800 mb-1">
                          Chemistry (min)
                        </label>
                        <input
                          type="number"
                          min="5"
                          step="5"
                          value={chemistryDuration}
                          onChange={(e) => setChemistryDuration(Math.max(1, Number(e.target.value)))}
                          className="w-full px-2 py-1.5 rounded-md bg-white border border-emerald-300 text-emerald-800 font-bold text-xs"
                        />
                      </div>

                      <div className="p-2.5 rounded-lg bg-violet-50/70 border border-violet-200">
                        <label className="block text-[10px] font-bold text-violet-800 mb-1">
                          Math (min)
                        </label>
                        <input
                          type="number"
                          min="5"
                          step="5"
                          value={mathDuration}
                          onChange={(e) => setMathDuration(Math.max(1, Number(e.target.value)))}
                          className="w-full px-2 py-1.5 rounded-md bg-white border border-violet-300 text-violet-800 font-bold text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="font-medium">Total Daily Target Duration:</span>
                      <span className="font-bold text-sky-700 font-mono text-xs">
                        {physicsDuration + chemistryDuration + mathDuration} mins ({((physicsDuration + chemistryDuration + mathDuration) / 60).toFixed(1)} hrs)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveGoals}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Save Goals &amp; Streak Target
              </button>
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS & REMINDERS */}
          {activeSubTab === 'notifications' && (
            <div className="space-y-4">
              {/* Master notification switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">Daily Study Reminders</div>
                  <div className="text-[11px] text-slate-500">Receive reminders to complete your goals</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifEnabled}
                  onChange={(e) => setNotifEnabled(e.target.checked)}
                  className="w-4 h-4 accent-sky-600 cursor-pointer"
                />
              </div>

              {/* Time Picker */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Daily Reminder Time
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:border-sky-500 cursor-pointer"
                />
              </div>

              {/* Missed session alert */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-600">Missed Practice Alert</div>
                    <div className="text-[11px] text-slate-500">
                      Warn me if daily questions are 0 by this evening cutoff
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={missedAlert}
                    onChange={(e) => setMissedAlert(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>
                {missedAlert && (
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-[11px] text-slate-600 mb-1">Cutoff Time</label>
                    <input
                      type="time"
                      value={missedCutoff}
                      onChange={(e) => setMissedCutoff(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Audio feedback */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-800">Audio Feedback Chimes</div>
                    <div className="text-[11px] text-slate-500">Clicks, streak achievements &amp; alerts</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 accent-sky-600 cursor-pointer"
                />
              </div>

              {/* Browser Notification Permissions & Test */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Desktop / Mobile Push</span>
                  <button
                    onClick={requestBrowserPermission}
                    className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium cursor-pointer transition"
                  >
                    Enable Browser Push
                  </button>
                </div>
                <button
                  onClick={handleTestNotification}
                  className="w-full py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-sky-600 transition cursor-pointer"
                >
                  🔔 Test Sound &amp; Notification Now
                </button>
                {testNotifNotice && (
                  <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-[11px] text-sky-700 font-semibold text-center animate-fade-in">
                    Chime played! Reminder notification sent.
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveNotifications}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Save Notification Settings
              </button>
            </div>
          )}

          {/* TAB 3: CLOUD SYNC & MULTI-DEVICE */}
          {activeSubTab === 'cloud' && (
            <div className="space-y-4">
              {/* User Sync Code display */}
              <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700">Your Device Sync Code</span>
                  <button
                    onClick={onTriggerSync}
                    disabled={isSyncing}
                    className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync Now</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 px-3 py-2 rounded-lg bg-white border border-sky-300 font-mono text-base font-bold text-sky-700 tracking-wider">
                    {state.profile.syncCode}
                  </div>
                  <button
                    onClick={handleCopySyncCode}
                    className="p-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 transition cursor-pointer border border-slate-200"
                    title="Copy Sync Code"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Use this unique code on your phone, tablet, or another computer to sync all practice logs!
                </p>
              </div>

              {/* Connect existing code */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <label className="block text-xs font-bold text-slate-800">
                  Connect Another Device
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Code (e.g. PCM-8492)"
                    value={connectCodeInput}
                    onChange={(e) => setConnectCodeInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-mono uppercase text-slate-800 focus:border-sky-500 focus:outline-hidden"
                  />
                  <button
                    onClick={handleConnectDevice}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Link &amp; Sync
                  </button>
                </div>
                {connectStatus && (
                  <p className="text-xs font-semibold text-sky-600">{connectStatus}</p>
                )}
              </div>

              {/* Offline Export / Import */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700">Offline Backup &amp; Transfer</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportDataJSON(state)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer border border-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>

                  <label className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer border border-slate-200">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
