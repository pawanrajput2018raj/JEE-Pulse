import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Atom,
  FlaskConical,
  Calculator,
  Sigma,
  Eye,
  EyeOff,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AppStateData } from '../types';
import { getPastNDays, formatDateShort, formatDatePretty, getDayName } from '../utils/dateUtils';

interface SubjectTrendsChartProps {
  state: AppStateData;
}

export const SubjectTrendsChart: React.FC<SubjectTrendsChartProps> = ({ state }) => {
  // Line visibility toggles
  const [showPhysics, setShowPhysics] = useState(true);
  const [showChemistry, setShowChemistry] = useState(true);
  const [showMath, setShowMath] = useState(true);
  const [showTotal, setShowTotal] = useState(false);

  // View mode: Daily count vs Cumulative growth
  const [viewMode, setViewMode] = useState<'daily' | 'cumulative'>('daily');

  // Curve smoothing type
  const [curveType, setCurveType] = useState<'monotone' | 'linear'>('monotone');

  // 30 days dataset
  const past30Dates = useMemo(() => getPastNDays(30), []);

  const { chartData, totals30Days, maxVal } = useMemo(() => {
    let cumPhysics = 0;
    let cumChemistry = 0;
    let cumMath = 0;
    let cumTotal = 0;

    let totP = 0;
    let totC = 0;
    let totM = 0;

    const data = past30Dates.map((dateStr) => {
      const rec = state.records[dateStr] || { physics: 0, chemistry: 0, math: 0 };
      const p = rec.physics || 0;
      const c = rec.chemistry || 0;
      const m = rec.math || 0;
      const t = p + c + m;

      totP += p;
      totC += c;
      totM += m;

      cumPhysics += p;
      cumChemistry += c;
      cumMath += m;
      cumTotal += t;

      return {
        date: dateStr,
        formattedDate: formatDateShort(dateStr),
        dayName: getDayName(dateStr),
        fullDate: formatDatePretty(dateStr),
        // Daily values
        physics: p,
        chemistry: c,
        math: m,
        total: t,
        // Cumulative values
        cumPhysics,
        cumChemistry,
        cumMath,
        cumTotal,
      };
    });

    const activeMax = data.reduce((max, d) => {
      if (viewMode === 'cumulative') {
        const vals = [
          showPhysics ? d.cumPhysics : 0,
          showChemistry ? d.cumChemistry : 0,
          showMath ? d.cumMath : 0,
          showTotal ? d.cumTotal : 0,
        ];
        return Math.max(max, ...vals);
      } else {
        const vals = [
          showPhysics ? d.physics : 0,
          showChemistry ? d.chemistry : 0,
          showMath ? d.math : 0,
          showTotal ? d.total : 0,
        ];
        return Math.max(max, ...vals);
      }
    }, 10);

    return {
      chartData: data,
      totals30Days: {
        physics: totP,
        chemistry: totC,
        math: totM,
        total: totP + totC + totM,
      },
      maxVal: activeMax,
    };
  }, [past30Dates, state.records, viewMode, showPhysics, showChemistry, showMath, showTotal]);

  // Color constants
  const COLORS = {
    physics: '#0284c7', // Sky-600
    chemistry: '#059669', // Emerald-600
    math: '#7c3aed', // Violet-600
    total: '#d97706', // Amber-600
  };

  // Custom Recharts Tooltip
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const dataPoint = payload[0].payload;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700/60 text-xs min-w-[210px] space-y-2 pointer-events-none">
        <div className="border-b border-slate-700/80 pb-1.5 flex items-center justify-between">
          <span className="font-bold text-slate-100">{dataPoint.fullDate}</span>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            {dataPoint.dayName}
          </span>
        </div>

        <div className="space-y-1.5">
          {showPhysics && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-sky-400 font-medium">
                <Atom className="w-3.5 h-3.5" />
                Physics
              </span>
              <span className="font-bold text-white">
                {viewMode === 'cumulative' ? dataPoint.cumPhysics : dataPoint.physics} qs
              </span>
            </div>
          )}

          {showChemistry && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <FlaskConical className="w-3.5 h-3.5" />
                Chemistry
              </span>
              <span className="font-bold text-white">
                {viewMode === 'cumulative' ? dataPoint.cumChemistry : dataPoint.chemistry} qs
              </span>
            </div>
          )}

          {showMath && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-violet-400 font-medium">
                <Calculator className="w-3.5 h-3.5" />
                Math
              </span>
              <span className="font-bold text-white">
                {viewMode === 'cumulative' ? dataPoint.cumMath : dataPoint.math} qs
              </span>
            </div>
          )}

          {showTotal && (
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Sigma className="w-3.5 h-3.5" />
                Total
              </span>
              <span className="font-extrabold text-amber-200">
                {viewMode === 'cumulative' ? dataPoint.cumTotal : dataPoint.total} qs
              </span>
            </div>
          )}
        </div>

        {viewMode === 'daily' && dataPoint.total > 0 && (
          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Day Total</span>
            <span className="font-semibold text-slate-200">{dataPoint.total} questions</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              30-Day Subject Progress Trends
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 rounded-full">
              Multi-Line Recharts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking independent trajectory for Physics, Chemistry, and Math over the last 30 days.
          </p>
        </div>

        {/* View Mode & Curve Switchers */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Daily vs Cumulative switch */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 rounded-md transition cursor-pointer font-medium ${
                viewMode === 'daily'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Solved
            </button>
            <button
              onClick={() => setViewMode('cumulative')}
              className={`px-3 py-1 rounded-md transition cursor-pointer font-medium ${
                viewMode === 'cumulative'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cumulative Growth
            </button>
          </div>

          {/* Curve smoothness */}
          <button
            onClick={() => setCurveType((prev) => (prev === 'monotone' ? 'linear' : 'monotone'))}
            title="Toggle line smoothing"
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer font-medium flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>{curveType === 'monotone' ? 'Smooth' : 'Linear'}</span>
          </button>
        </div>
      </div>

      {/* 30-Day Quick Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Physics 30D */}
        <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-200/70 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800">
            <Atom className="w-3.5 h-3.5 text-sky-600" />
            <span>Physics</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-sky-900">{totals30Days.physics}</span>
            <span className="text-[10px] text-slate-500 ml-1 font-medium">
              (~{(totals30Days.physics / 30).toFixed(1)}/d)
            </span>
          </div>
        </div>

        {/* Chemistry 30D */}
        <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
            <span>Chemistry</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-emerald-900">{totals30Days.chemistry}</span>
            <span className="text-[10px] text-slate-500 ml-1 font-medium">
              (~{(totals30Days.chemistry / 30).toFixed(1)}/d)
            </span>
          </div>
        </div>

        {/* Math 30D */}
        <div className="p-2.5 rounded-xl bg-violet-50/60 border border-violet-200/70 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-800">
            <Calculator className="w-3.5 h-3.5 text-violet-600" />
            <span>Math</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-violet-900">{totals30Days.math}</span>
            <span className="text-[10px] text-slate-500 ml-1 font-medium">
              (~{(totals30Days.math / 30).toFixed(1)}/d)
            </span>
          </div>
        </div>

        {/* Total 30D */}
        <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
            <Sigma className="w-3.5 h-3.5 text-amber-600" />
            <span>30D Total</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-amber-900">{totals30Days.total}</span>
            <span className="text-[10px] text-slate-500 ml-1 font-medium">
              (~{(totals30Days.total / 30).toFixed(1)}/d)
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Subject Filters / Toggles */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-1 pb-1 border-b border-slate-100">
        <span className="text-slate-500 font-medium">Toggle lines:</span>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Physics toggle */}
          <button
            onClick={() => setShowPhysics(!showPhysics)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              showPhysics
                ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-2xs'
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-70'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS.physics }}
            />
            <span>Physics</span>
            {showPhysics ? <Eye className="w-3 h-3 ml-0.5 opacity-70" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
          </button>

          {/* Chemistry toggle */}
          <button
            onClick={() => setShowChemistry(!showChemistry)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              showChemistry
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-70'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS.chemistry }}
            />
            <span>Chemistry</span>
            {showChemistry ? <Eye className="w-3 h-3 ml-0.5 opacity-70" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
          </button>

          {/* Math toggle */}
          <button
            onClick={() => setShowMath(!showMath)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              showMath
                ? 'bg-violet-50 text-violet-700 border-violet-300 shadow-2xs'
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-70'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS.math }}
            />
            <span>Math</span>
            {showMath ? <Eye className="w-3 h-3 ml-0.5 opacity-70" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
          </button>

          {/* Total toggle */}
          <button
            onClick={() => setShowTotal(!showTotal)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              showTotal
                ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-2xs'
                : 'bg-slate-50 text-slate-400 border-slate-200 opacity-70'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS.total }}
            />
            <span>Total Trend</span>
            {showTotal ? <Eye className="w-3 h-3 ml-0.5 opacity-70" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* The Recharts Multi-Line Chart */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 16, left: -16, bottom: 6 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[0, Math.ceil(maxVal * 1.15)]}
            />
            <Tooltip content={renderCustomTooltip} />

            {/* Streak shield reference threshold for daily view */}
            {viewMode === 'daily' && state.goals.streakTarget && (
              <ReferenceLine
                y={Math.round(state.goals.streakTarget / 3)}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={1.2}
                label={{
                  value: `Subj Target (~${Math.round(state.goals.streakTarget / 3)})`,
                  fill: '#d97706',
                  fontSize: 10,
                  position: 'insideTopLeft',
                }}
              />
            )}

            {/* Physics Line */}
            {showPhysics && (
              <Line
                type={curveType}
                dataKey={viewMode === 'cumulative' ? 'cumPhysics' : 'physics'}
                name="Physics"
                stroke={COLORS.physics}
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: COLORS.physics, strokeWidth: 1, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: COLORS.physics, stroke: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={600}
              />
            )}

            {/* Chemistry Line */}
            {showChemistry && (
              <Line
                type={curveType}
                dataKey={viewMode === 'cumulative' ? 'cumChemistry' : 'chemistry'}
                name="Chemistry"
                stroke={COLORS.chemistry}
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: COLORS.chemistry, strokeWidth: 1, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: COLORS.chemistry, stroke: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={600}
              />
            )}

            {/* Math Line */}
            {showMath && (
              <Line
                type={curveType}
                dataKey={viewMode === 'cumulative' ? 'cumMath' : 'math'}
                name="Math"
                stroke={COLORS.math}
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: COLORS.math, strokeWidth: 1, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: COLORS.math, stroke: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={600}
              />
            )}

            {/* Total Line (Optional toggle) */}
            {showTotal && (
              <Line
                type={curveType}
                dataKey={viewMode === 'cumulative' ? 'cumTotal' : 'total'}
                name="Total"
                stroke={COLORS.total}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 2, fill: COLORS.total }}
                activeDot={{ r: 5, fill: COLORS.total, stroke: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={600}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Note / Insight */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Covering 30 consecutive days ({past30Dates[0]} to {past30Dates[past30Dates.length - 1]})</span>
        </span>
        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Hover or tap any date on the lines to inspect individual subject volumes</span>
        </span>
      </div>
    </div>
  );
};
