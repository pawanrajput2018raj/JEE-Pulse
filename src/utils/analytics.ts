import { AnalyticsSummary, AppStateData, DailyGoals, DailyRecord, SubjectStats, SubjectStreakInfo, SubjectStreaks, SubjectType } from '../types';
import { addDays, getCurrentMonthDates, getCurrentWeekDates, getPastNDays, getTodayStr } from './dateUtils';

export function getSubjectStreakTarget(goals: DailyGoals, subject: SubjectType): number {
  if (
    goals.subjectStreakTargets &&
    typeof goals.subjectStreakTargets[subject] === 'number' &&
    goals.subjectStreakTargets[subject]! > 0
  ) {
    return goals.subjectStreakTargets[subject]!;
  }
  const overallTarget = goals.streakTarget || 30;
  const balanced = Math.max(1, Math.round(overallTarget / 3));
  const subGoal = goals[subject] || balanced;
  return Math.max(1, Math.min(subGoal, balanced));
}

export function calculateSubjectStreak(
  records: Record<string, DailyRecord>,
  subject: SubjectType,
  target: number,
  todayStr: string,
  todayCount: number
): SubjectStreakInfo {
  const safeTarget = Math.max(1, target);
  const targetMetToday = todayCount >= safeTarget;
  let currentStreak = 0;
  let checkDate = todayStr;

  if (targetMetToday) {
    currentStreak++;
    checkDate = addDays(checkDate, -1);
  } else {
    // If today hasn't met target yet, check if yesterday met it so streak is intact waiting for today's session
    checkDate = addDays(checkDate, -1);
  }

  while (true) {
    const rec = records[checkDate];
    if (rec) {
      const val = Number(rec[subject]) || 0;
      if (val >= safeTarget) {
        currentStreak++;
        checkDate = addDays(checkDate, -1);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  // Calculate longest streak across history
  const sortedDates = Object.keys(records).sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate = '';

  for (const d of sortedDates) {
    const rec = records[d];
    const val = Number(rec[subject]) || 0;
    if (val >= safeTarget) {
      if (prevDate && addDays(prevDate, 1) === d) {
        runningStreak++;
      } else {
        runningStreak = 1;
      }
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
    prevDate = d;
  }
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const todayProgress = Math.min(100, Math.round((todayCount / safeTarget) * 100));

  return {
    subject,
    currentStreak,
    longestStreak,
    todayCount,
    target: safeTarget,
    todayProgress,
    targetMetToday,
  };
}

export function calculateSubjectStats(records: DailyRecord[]): SubjectStats {
  let physics = 0;
  let chemistry = 0;
  let math = 0;

  for (const r of records) {
    physics += Number(r.physics) || 0;
    chemistry += Number(r.chemistry) || 0;
    math += Number(r.math) || 0;
  }

  return {
    physics,
    chemistry,
    math,
    total: physics + chemistry + math,
  };
}

export function computeAnalytics(state: AppStateData): AnalyticsSummary {
  const { records, goals } = state;
  const todayStr = getTodayStr();

  // Today stats
  const todayRecord = records[todayStr] || {
    date: todayStr,
    physics: 0,
    chemistry: 0,
    math: 0,
    updatedAt: Date.now(),
  };
  const todayStats: SubjectStats = {
    physics: todayRecord.physics || 0,
    chemistry: todayRecord.chemistry || 0,
    math: todayRecord.math || 0,
    total: (todayRecord.physics || 0) + (todayRecord.chemistry || 0) + (todayRecord.math || 0),
  };

  // This Week stats
  const weekDates = getCurrentWeekDates();
  const weekRecords: DailyRecord[] = weekDates
    .map((date) => records[date])
    .filter((r): r is DailyRecord => !!r);
  const thisWeekStats = calculateSubjectStats(weekRecords);

  // This Month stats
  const monthDates = getCurrentMonthDates();
  const monthRecords: DailyRecord[] = monthDates
    .map((date) => records[date])
    .filter((r): r is DailyRecord => !!r);
  const thisMonthStats = calculateSubjectStats(monthRecords);

  // All-time stats
  const allRecords = Object.values(records);
  const allTimeStats = calculateSubjectStats(allRecords);

  // Determine favorite/most practiced subject
  let favoriteSubject: SubjectType = 'physics';
  const { physics, chemistry, math } = allTimeStats;
  if (chemistry > physics && chemistry >= math) {
    favoriteSubject = 'chemistry';
  } else if (math > physics && math >= chemistry) {
    favoriteSubject = 'math';
  }

  // Peak day
  let peakDay: { date: string; total: number } | null = null;
  for (const r of allRecords) {
    const total = (r.physics || 0) + (r.chemistry || 0) + (r.math || 0);
    if (!peakDay || total > peakDay.total) {
      peakDay = { date: r.date, total };
    }
  }

  // Days logged with >0 questions
  const activeDays = allRecords.filter((r) => (r.physics || 0) + (r.chemistry || 0) + (r.math || 0) > 0);
  const totalDaysLogged = activeDays.length;
  const dailyAverage = totalDaysLogged > 0 ? Math.round(allTimeStats.total / totalDaysLogged) : 0;

  // Streak calculation based on goals.streakTarget
  const streakTarget = goals.streakTarget || 30;

  let currentStreak = 0;
  let checkDate = todayStr;
  const todayTotal = todayStats.total;
  const todayMetStreakTarget = todayTotal >= streakTarget;

  if (todayMetStreakTarget) {
    currentStreak++;
    checkDate = addDays(checkDate, -1);
  } else {
    // Check if yesterday met it so streak is intact waiting for today's session
    checkDate = addDays(checkDate, -1);
  }

  while (true) {
    const rec = records[checkDate];
    if (rec) {
      const dayTotal = (rec.physics || 0) + (rec.chemistry || 0) + (rec.math || 0);
      if (dayTotal >= streakTarget) {
        currentStreak++;
        checkDate = addDays(checkDate, -1);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  // Calculate longest streak across history
  const sortedDates = Object.keys(records).sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate = '';

  for (const d of sortedDates) {
    const rec = records[d];
    const dayTotal = (rec.physics || 0) + (rec.chemistry || 0) + (rec.math || 0);
    if (dayTotal >= streakTarget) {
      if (prevDate && addDays(prevDate, 1) === d) {
        runningStreak++;
      } else {
        runningStreak = 1;
      }
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
    prevDate = d;
  }
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Calculate separate consistency streaks for Physics, Chemistry, and Math
  const physicsTarget = getSubjectStreakTarget(goals, 'physics');
  const chemistryTarget = getSubjectStreakTarget(goals, 'chemistry');
  const mathTarget = getSubjectStreakTarget(goals, 'math');

  const subjectStreaks: SubjectStreaks = {
    physics: calculateSubjectStreak(records, 'physics', physicsTarget, todayStr, todayStats.physics),
    chemistry: calculateSubjectStreak(records, 'chemistry', chemistryTarget, todayStr, todayStats.chemistry),
    math: calculateSubjectStreak(records, 'math', mathTarget, todayStr, todayStats.math),
  };

  return {
    today: todayStats,
    thisWeek: thisWeekStats,
    thisMonth: thisMonthStats,
    allTime: allTimeStats,
    currentStreak,
    longestStreak,
    subjectStreaks,
    totalDaysLogged,
    dailyAverage,
    peakDay,
    favoriteSubject,
    todayGoalMet: todayStats.total >= (goals.total || 60),
    streakTargetMet: todayMetStreakTarget,
  };
}
