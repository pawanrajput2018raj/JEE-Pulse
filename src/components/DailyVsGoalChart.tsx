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
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Target,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Flame,
  Award,
  Calendar,
  Layers,
} from 'lucide-react';
import { AppStateData } from '../types';
import { getPastNDays, formatDateShort, formatDatePretty } from '../utils/dateUtils';

interface DailyVsGoalChartProps {
  state: AppStateData;
}

export const DailyVsGoalChart: React.FC<DailyVsGoalChartProps> = ({ state }) => {
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(14);
  const [displayMode, setDisplayMode] = useState<'comparison' | 'stacked'>('comparison');

  const physicsTarget = state.goals.physics || 25;
  const chemistryTarget = state.goals.chemistry || 25;
  const mathTarget = state.goals.math || 25;
  const defaultTotalGoal = physicsTarget + chemistryTarget + mathTarget;
  const dailyGoal = state.goals.total || defaultTotalGoal;

  const pastDates = useMemo(() => getPastNDays(rangeDays), [rangeDays]);

  const { chartData, stats } = useMemo(() => {
    let daysGoalMet = 0;
    let totalSolved = 0;
    let peakCount = 0;
    let peakDate = '';

    const data = pastDates.map((dateStr) => {
      const rec = state.records[dateStr] || { physics: 0, chemistry: 0, math: 0 };
      const phy = rec.physics || 0;
      const chem = rec.chemistry || 0;
      const math = rec.math || 0;
      const solved = phy + chem + math;
      const goal = dailyGoal;
      const isMet = solved >= goal;
      const diff = solved - goal;

      if (isMet) daysGoalMet++;
      totalSolved += solved;
      if (solved > peakCount) {
        peakCount = solved;
        peakDate = dateStr;
      }

      return {
        date: dateStr,
        dateLabel: formatDateShort(dateStr),
        fullDate: formatDatePretty(dateStr),
        solved,
        goal,
        physics: phy,
        chemistry: chem,
        math,
        diff,
        isMet,
      };
    });

    const avgDaily = rangeDays > 0 ? Math.round(totalSolved / rangeDays) : 0;
    const hitRate = rangeDays > 0 ? Math.round((daysGoalMet / rangeDays) * 100) : 0;

    return {
      chartData: data,
      stats: {
        daysGoalMet,
        totalSolved,
        avgDaily,
        hitRate,
        peakCount,
        peakDate,
      },
    };
  }, [pastDates, state.records, dailyGoal, rangeDays]);

  const maxVal = useMemo(() => {
    const highest = Math.max(
      ...chartData.map((d) => Math.max(d.solved, d.goal)),
      dailyGoal,
      10
    );
    return Math.ceil((highest + 5) / 10) * 10;
  }, [chartData, dailyGoal]);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
      {/* Header with Title and Range Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Daily Questions Solved vs. Daily Study Goals</span>
              </h3>
              <p className="text-xs text-slate-500">
                Compare daily practice questions against your defined study goal of{' '}
                <strong className="text-indigo-900 font-semibold">{dailyGoal} Qs/day</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Range Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setDisplayMode('comparison')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                displayMode === 'comparison'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Dual bars: Solved vs Goal side-by-side"
            >
              Dual Bars
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('stacked')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                displayMode === 'stacked'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Stacked subject breakdown with Goal target line"
            >
              PCM Stacked
            </button>
          </div>

          {/* Time range buttons */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setRangeDays(days as 7 | 14 | 30)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  rangeDays === days
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Goal Hit Rate */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
          <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-bold">
            <Target className="w-3.5 h-3.5 text-indigo-600" />
            <span>Goal Hit Rate</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-indigo-950">{stats.hitRate}%</span>
            <span className="text-[11px] text-indigo-700 font-medium">
              ({stats.daysGoalMet}/{rangeDays} days)
            </span>
          </div>
        </div>

        {/* Daily Average Solved */}
        <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100">
          <div className="flex items-center gap-1.5 text-sky-700 text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
            <span>Daily Average</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-sky-950">{stats.avgDaily}</span>
            <span className="text-[11px] text-sky-700 font-medium">
              Qs/day (Goal: {dailyGoal})
            </span>
          </div>
        </div>

        {/* Total Questions in Window */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Total Solved</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-950">{stats.totalSolved}</span>
            <span className="text-[11px] text-emerald-700 font-medium">
              questions in {rangeDays}d
            </span>
          </div>
        </div>

        {/* Peak Solved Day */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
          <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>Peak Day</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-amber-950">{stats.peakCount} Qs</span>
            <span className="text-[11px] text-amber-700 font-medium truncate">
              {stats.peakDate ? formatDateShort(stats.peakDate) : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Bar Chart Visualization */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 15, left: -15, bottom: 5 }}
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              domain={[0, maxVal]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomBarTooltip dailyGoal={dailyGoal} />} />

            {/* Target Reference Line across all days */}
            <ReferenceLine
              y={dailyGoal}
              stroke="#6366f1"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `Goal: ${dailyGoal} Qs`,
                fill: '#4f46e5',
                fontSize: 11,
                fontWeight: 700,
                position: 'top',
              }}
            />

            {displayMode === 'comparison' ? (
              <>
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={30}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingBottom: '8px' }}
                />
                {/* Daily Questions Solved Bar */}
                <Bar
                  dataKey="solved"
                  name="Questions Solved"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={rangeDays === 30 ? 12 : 24}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-solved-${index}`}
                      fill={entry.isMet ? '#059669' : '#0284c7'}
                    />
                  ))}
                </Bar>

                {/* Daily Study Goal Benchmark Bar */}
                <Bar
                  dataKey="goal"
                  name="Study Goal Benchmark"
                  fill="#cbd5e1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={rangeDays === 30 ? 10 : 20}
                />
              </>
            ) : (
              <>
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={30}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingBottom: '8px' }}
                />
                {/* Physics Stack */}
                <Bar
                  dataKey="physics"
                  name="Physics"
                  stackId="pcm"
                  fill="#0284c7"
                  maxBarSize={rangeDays === 30 ? 16 : 30}
                />
                {/* Chemistry Stack */}
                <Bar
                  dataKey="chemistry"
                  name="Chemistry"
                  stackId="pcm"
                  fill="#059669"
                  maxBarSize={rangeDays === 30 ? 16 : 30}
                />
                {/* Math Stack */}
                <Bar
                  dataKey="math"
                  name="Mathematics"
                  stackId="pcm"
                  fill="#7c3aed"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={rangeDays === 30 ? 16 : 30}
                />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Help Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span className="font-medium text-slate-700">Goal Met (Solved &ge; Goal)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" />
            <span className="font-medium text-slate-700">Under Target (Solved &lt; Goal)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-indigo-600 inline-block border-t border-dashed border-indigo-600" />
            <span className="font-medium text-slate-700">Daily Goal Target Line ({dailyGoal} Qs)</span>
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Showing past {rangeDays} days of consistency
        </span>
      </div>
    </div>
  );
};

// Custom Tooltip Component for Bar Chart
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  dailyGoal: number;
}

const CustomBarTooltip: React.FC<CustomTooltipProps> = ({ active, payload, dailyGoal }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const isMet = data.solved >= dailyGoal;
  const pct = Math.round((data.solved / Math.max(1, dailyGoal)) * 100);

  return (
    <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-2 border border-slate-800 min-w-[180px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <span className="font-bold text-slate-200">{data.fullDate}</span>
        <span
          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
            isMet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          {isMet ? '✓ Goal Met' : `${dailyGoal - data.solved} needed`}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Total Solved:</span>
          <span className="font-black text-white text-sm">{data.solved} Qs</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Target Goal:</span>
          <span className="font-bold text-indigo-400">{dailyGoal} Qs</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Completion:</span>
          <span className={`font-mono font-bold ${isMet ? 'text-emerald-400' : 'text-slate-300'}`}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Subject details */}
      <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span className="text-sky-400 font-semibold">Phy: {data.physics}</span>
        <span className="text-emerald-400 font-semibold">Chem: {data.chemistry}</span>
        <span className="text-violet-400 font-semibold">Math: {data.math}</span>
      </div>
    </div>
  );
};
