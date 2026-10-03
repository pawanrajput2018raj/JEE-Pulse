import { AppStateData, DailyRecord } from '../types';
import { getPastNDays, getTodayStr } from './dateUtils';
import { getDefaultBooks } from './defaultBooks';
import { getDefaultTests } from './defaultTests';

const STORAGE_KEY = 'pcm_question_tracker_state_v1';

function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'PCM-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate realistic starter data for the past 6 days + today
function generateStarterRecords(): Record<string, DailyRecord> {
  const records: Record<string, DailyRecord> = {};
  const pastDays = getPastNDays(7);

  const sampleWorkloads = [
    { p: 25, c: 20, m: 30, note: 'Rotational dynamics, organic haloalkanes, vectors' },
    { p: 30, c: 25, m: 35, note: 'Thermodynamics, chemical equilibrium, definite integrals' },
    { p: 20, c: 30, m: 25, note: 'Wave optics, electrochemistry, matrices' },
    { p: 35, c: 20, m: 30, note: 'Modern physics, solutions & colligative properties, calculus' },
    { p: 25, c: 25, m: 25, note: 'Current electricity, coordination chemistry, differential equations' },
    { p: 40, c: 35, m: 45, note: 'Full length mock test question review' },
  ];

  pastDays.forEach((dateStr, idx) => {
    if (idx < pastDays.length - 1) {
      const sample = sampleWorkloads[idx % sampleWorkloads.length];
      records[dateStr] = {
        date: dateStr,
        physics: sample.p,
        chemistry: sample.c,
        math: sample.m,
        notes: sample.note,
        updatedAt: Date.now() - (pastDays.length - idx) * 86400000,
      };
    } else {
      // Today: starter active session
      records[dateStr] = {
        date: dateStr,
        physics: 18,
        chemistry: 15,
        math: 20,
        notes: 'Targeting JEE/NEET high yield questions today',
        updatedAt: Date.now(),
      };
    }
  });

  return records;
}

export function getDefaultAppState(): AppStateData {
  return {
    records: generateStarterRecords(),
    goals: {
      physics: 25,
      chemistry: 25,
      math: 25,
      total: 75,
      streakTarget: 30,
      subjectStreakTargets: {
        physics: 10,
        chemistry: 10,
        math: 10,
      },
      duration: {
        enabled: false,
        physics: 60,
        chemistry: 60,
        math: 60,
      },
    },
    profile: {
      username: 'Student Scholar',
      avatarSeed: 'SS',
      syncCode: generateSyncCode(),
    },
    notifications: {
      enabled: true,
      reminderTime: '19:30',
      missedSessionAlert: true,
      missedSessionCutoff: '20:30',
      soundEnabled: true,
      browserPermission: 'default',
    },
    books: getDefaultBooks(),
    tests: getDefaultTests(),
    testAttempts: [],
    lastUpdated: Date.now(),
  };
}

export function loadAppState(): AppStateData {
  if (typeof window === 'undefined') return getDefaultAppState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultAppState();
      saveAppState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    // Ensure all required fields exist
    const defaultState = getDefaultAppState();
    return {
      records: parsed.records || defaultState.records,
      goals: {
        ...defaultState.goals,
        ...parsed.goals,
        subjectStreakTargets: {
          physics: parsed.goals?.subjectStreakTargets?.physics ?? defaultState.goals.subjectStreakTargets?.physics ?? 10,
          chemistry: parsed.goals?.subjectStreakTargets?.chemistry ?? defaultState.goals.subjectStreakTargets?.chemistry ?? 10,
          math: parsed.goals?.subjectStreakTargets?.math ?? defaultState.goals.subjectStreakTargets?.math ?? 10,
        },
        duration: {
          ...defaultState.goals.duration,
          ...(parsed.goals?.duration || {}),
        },
      },
      profile: { ...defaultState.profile, ...parsed.profile },
      notifications: { ...defaultState.notifications, ...parsed.notifications },
      books: Array.isArray(parsed.books) && parsed.books.length > 0 ? parsed.books : getDefaultBooks(),
      tests: (() => {
        const defaults = getDefaultTests();
        if (!Array.isArray(parsed.tests) || parsed.tests.length === 0) return defaults;
        const existingIds = new Set(parsed.tests.map((t: any) => t.id));
        const missingDefaults = defaults.filter((d) => !existingIds.has(d.id));
        return [...parsed.tests, ...missingDefaults];
      })(),
      testAttempts: Array.isArray(parsed.testAttempts) ? parsed.testAttempts : [],
      lastUpdated: parsed.lastUpdated || Date.now(),
    };
  } catch (err) {
    console.error('Failed to load app state, resetting to defaults:', err);
    return getDefaultAppState();
  }
}

export function saveAppState(state: AppStateData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save app state to localStorage:', err);
  }
}

export function exportDataJSON(state: AppStateData): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `JEE_Journey_Tracker_Backup_${getTodayStr()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
