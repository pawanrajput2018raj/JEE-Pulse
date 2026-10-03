import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  GitCompare,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Atom,
  FlaskConical,
  Calculator,
  Flame,
  CheckCircle2,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { AppStateData } from '../types';
import { getTodayStr, addDays, getDatesBetween, formatDateShort, getCurrentWeekDates, getCurrentMonthDates } from '../utils/dateUtils';

interface RangeComparisonViewProps {
  state: AppStateData;
}

export const RangeComparisonView: React.FC<RangeComparisonViewProps> = ({ state }) => {
  const today = getTodayStr();

  // Presets setup
  const thisWeek = getCurrentWeekDates();
  const thisWeekStart = thisWeek[0];
  const thisWeekEnd = thisWeek[thisWeek.length - 1];

  const lastWeekStart = addDays(thisWeekStart, -7);
  const lastWeekEnd = addDays(thisWeekEnd, -7);

  const last7DaysStart = addDays(today, -6);
  const last7DaysEnd = today;
  const prior7DaysStart = addDays(today, -13);
  const prior7DaysEnd = addDays(today, -7);

  const last14DaysStart = addDays(today, -13);
  const last14DaysEnd = today;
  const prior14DaysStart = addDays(today, -27);
  const prior14DaysEnd = addDays(today, -14);

  // State for Range A and Range B
  const [rangeAStart, setRangeAStart] = useState(last7DaysStart);
  const [rangeAEnd, setRangeAEnd] = useState(last7DaysEnd);
  const [rangeALabel, setRangeALabel] = useState('Recent 7 Days');

  const [rangeBStart, setRangeBStart] = useState(prior7DaysStart);
  const [rangeBEnd, setRangeBEnd] = useState(prior7DaysEnd);
  const [rangeBLabel, setRangeBLabel] = useState('Prior 7 Days');

  // Quick preset applicator
  const applyPreset = (presetName: string) => {
    if (presetName === '7days') {
      setRangeAStart(last7DaysStart);
      setRangeAEnd(last7DaysEnd);
      setRangeALabel('Last 7 Days');

      setRangeBStart(prior7DaysStart);
      setRangeBEnd(prior7DaysEnd);
      setRangeBLabel('Prior 7 Days');
    } else if (presetName === 'weeks') {
      setRangeAStart(thisWeekStart);
      setRangeAEnd(thisWeekEnd);
      setRangeALabel('This Week');

      setRangeBStart(lastWeekStart);
      setRangeBEnd(lastWeekEnd);
      setRangeBLabel('Last Week');
    } else if (presetName === '14days') {
      setRangeAStart(last14DaysStart);
      setRangeAEnd(last14DaysEnd);
      setRangeALabel('Last 14 Days');

      setRangeBStart(prior14DaysStart);
      setRangeBEnd(prior14DaysEnd);
      setRangeBLabel('Prior 14 Days');
    } else if (presetName === '30days') {
      const l30Start = addDays(today, -29);
      const p30Start = addDays(today, -59);
      const p30End = addDays(today, -30);

      setRangeAStart(l30Start);
      setRangeAEnd(today);
      setRangeALabel('Past 30 Days');

      setRangeBStart(p30Start);
      setRangeBEnd(p30End);
      setRangeBLabel('Previous 30 Days');
    }
  };

  // Compute stats for Range A
  const statsA = useMemo(() => {
    const dates = getDatesBetween(rangeAStart, rangeAEnd);
    let physics = 0;
    let chemistry = 0;
    let math = 0;
    let activeDays = 0;

    dates.forEach((d) => {
      const rec = state.records[d];
      if (rec) {
        const p = rec.physics || 0;
        const c = rec.chemistry || 0;
        const m = rec.math || 0;
        physics += p;
        chemistry += c;
        math += m;
        if (p + c + m > 0) activeDays++;
      }
    });

    const total = physics + chemistry + math;
    const daysCount = dates.length || 1;
    const dailyAvg = Number((total / daysCount).toFixed(1));

    return {
      physics,
      chemistry,
      math,
      total,
      activeDays,
      daysCount,
      dailyAvg,
    };
  }, [rangeAStart, rangeAEnd, state.records]);

  // Compute stats for Range B
  const statsB = useMemo(() => {
    const dates = getDatesBetween(rangeBStart, rangeBEnd);
    let physics = 0;
    let chemistry = 0;
    let math = 0;
    let activeDays = 0;

    dates.forEach((d) => {
      const rec = state.records[d];
      if (rec) {
        const p = rec.physics || 0;
        const c = rec.chemistry || 0;
        const m = rec.math || 0;
        physics += p;
        chemistry += c;
        math += m;
        if (p + c + m > 0) activeDays++;
      }
    });

    const total = physics + chemistry + math;
    const daysCount = dates.length || 1;
    const dailyAvg = Number((total / daysCount).toFixed(1));

    return {
      physics,
      chemistry,
      math,
      total,
      activeDays,
      daysCount,
      dailyAvg,
    };
  }, [rangeBStart, rangeBEnd, state.records]);

  // Comparison metrics (A vs B)
  const diffTotal = statsA.total - statsB.total;
  const pctTotal = statsB.total > 0 ? Math.round((diffTotal / statsB.total) * 100) : statsA.total > 0 ? 100 : 0;

  const diffPhysics = statsA.physics - statsB.physics;
  const diffChemistry = statsA.chemistry - statsB.chemistry;
  const diffMath = statsA.math - statsB.math;
  const diffDailyAvg = Number((statsA.dailyAvg - statsB.dailyAvg).toFixed(1));

  // Chart data: Side-by-side grouped bars for each subject and total
  const barComparisonData = [
    {
      category: 'Physics',
      [rangeALabel || 'Period A']: statsA.physics,
      [rangeBLabel || 'Period B']: statsB.physics,
    },
    {
      category: 'Chemistry',
      [rangeALabel || 'Period A']: statsA.chemistry,
      [rangeBLabel || 'Period B']: statsB.chemistry,
    },
    {
      category: 'Math',
      [rangeALabel || 'Period A']: statsA.math,
      [rangeBLabel || 'Period B']: statsB.math,
    },
    {
      category: 'Total Solved',
      [rangeALabel || 'Period A']: statsA.total,
      [rangeBLabel || 'Period B']: statsB.total,
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-indigo-600" />
            Date Range Comparison View
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select two custom date intervals to view your study velocity and subject growth side-by-side.
          </p>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => applyPreset('7days')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            Last 7d vs Prior 7d
          </button>
          <button
            onClick={() => applyPreset('weeks')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            This Week vs Last Week
          </button>
          <button
            onClick={() => applyPreset('14days')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            14 Days vs Prior 14
          </button>
          <button
            onClick={() => applyPreset('30days')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            Past 30d vs Prior 30d
          </button>
        </div>
      </div>

      {/* Date Pickers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Period A Picker */}
        <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
              Period A (Target / Recent)
            </span>
            <span className="text-[11px] font-semibold text-indigo-700">
              {statsA.daysCount} days
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                value={rangeAStart}
                max={rangeAEnd}
                onChange={(e) => {
                  setRangeAStart(e.target.value);
                  setRangeALabel('Period A');
                }}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                value={rangeAEnd}
                min={rangeAStart}
                onChange={(e) => {
                  setRangeAEnd(e.target.value);
                  setRangeALabel('Period A');
                }}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Period B Picker */}
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Period B (Baseline / Prior)
            </span>
            <span className="text-[11px] font-semibold text-amber-700">
              {statsB.daysCount} days
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                value={rangeBStart}
                max={rangeBEnd}
                onChange={(e) => {
                  setRangeBStart(e.target.value);
                  setRangeBLabel('Period B');
                }}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                value={rangeBEnd}
                min={rangeBStart}
                onChange={(e) => {
                  setRangeBEnd(e.target.value);
                  setRangeBLabel('Period B');
                }}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delta KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Questions Solved */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[11px] font-bold text-slate-600 mb-1">Total Solved</div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-indigo-700">{statsA.total}</span>
            <span className="text-xs font-semibold text-slate-400">vs {statsB.total}</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold">
            {diffTotal > 0 ? (
              <span className="text-emerald-600 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" /> +{diffTotal} (+{pctTotal}%)
              </span>
            ) : diffTotal < 0 ? (
              <span className="text-rose-600 flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" /> {diffTotal} ({pctTotal}%)
              </span>
            ) : (
              <span className="text-slate-500 flex items-center">
                <Minus className="w-3 h-3 mr-0.5 inline" /> Even
              </span>
            )}
          </div>
        </div>

        {/* Physics Comparison */}
        <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-200">
          <div className="text-[11px] font-bold text-sky-800 mb-1 flex items-center gap-1">
            <Atom className="w-3 h-3 text-sky-600" /> Physics
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-sky-900">{statsA.physics}</span>
            <span className="text-xs font-semibold text-sky-600">vs {statsB.physics}</span>
          </div>
          <div className="mt-1 text-[11px] font-bold">
            {diffPhysics > 0 ? (
              <span className="text-emerald-600">+{diffPhysics} questions</span>
            ) : diffPhysics < 0 ? (
              <span className="text-rose-600">{diffPhysics} questions</span>
            ) : (
              <span className="text-slate-500">Same pace</span>
            )}
          </div>
        </div>

        {/* Chemistry Comparison */}
        <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
          <div className="text-[11px] font-bold text-emerald-800 mb-1 flex items-center gap-1">
            <FlaskConical className="w-3 h-3 text-emerald-600" /> Chemistry
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-900">{statsA.chemistry}</span>
            <span className="text-xs font-semibold text-emerald-600">vs {statsB.chemistry}</span>
          </div>
          <div className="mt-1 text-[11px] font-bold">
            {diffChemistry > 0 ? (
              <span className="text-emerald-600">+{diffChemistry} questions</span>
            ) : diffChemistry < 0 ? (
              <span className="text-rose-600">{diffChemistry} questions</span>
            ) : (
              <span className="text-slate-500">Same pace</span>
            )}
          </div>
        </div>

        {/* Math Comparison */}
        <div className="p-3.5 rounded-xl bg-violet-50/50 border border-violet-200">
          <div className="text-[11px] font-bold text-violet-800 mb-1 flex items-center gap-1">
            <Calculator className="w-3 h-3 text-violet-600" /> Mathematics
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-violet-900">{statsA.math}</span>
            <span className="text-xs font-semibold text-violet-600">vs {statsB.math}</span>
          </div>
          <div className="mt-1 text-[11px] font-bold">
            {diffMath > 0 ? (
              <span className="text-emerald-600">+{diffMath} questions</span>
            ) : diffMath < 0 ? (
              <span className="text-rose-600">{diffMath} questions</span>
            ) : (
              <span className="text-slate-500">Same pace</span>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side Chart */}
      <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-600" />
            Side-by-Side Subject &amp; Total Solved
          </h4>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-indigo-700">
              <span className="w-3 h-3 rounded-xs bg-indigo-600 inline-block" />
              {rangeALabel || 'Period A'}
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" />
              {rangeBLabel || 'Period B'}
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey={rangeALabel || 'Period A'} fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey={rangeBLabel || 'Period B'} fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
