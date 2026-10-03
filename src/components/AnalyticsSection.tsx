import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Award, Calendar, Atom, FlaskConical, Calculator, Flame, Target, Sparkles } from 'lucide-react';
import { AnalyticsSummary, AppStateData } from '../types';
import { formatDatePretty, formatDateShort, getDayName, getPastNDays } from '../utils/dateUtils';
import { SubjectTrendsChart } from './SubjectTrendsChart';
import { RangeComparisonView } from './RangeComparisonView';
import { DailyVsGoalChart } from './DailyVsGoalChart';

interface AnalyticsSectionProps {
  state: AppStateData;
  analytics: AnalyticsSummary;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ state, analytics }) => {
  const [chartDays, setChartDays] = useState<7 | 14 | 30>(14);
  const [hoveredBar, setHoveredBar] = useState<{
    date: string;
    physics: number;
    chemistry: number;
    math: number;
    total: number;
  } | null>(null);

  const pastDates = getPastNDays(chartDays);
  const chartData = pastDates.map((d) => {
    const rec = state.records[d] || { physics: 0, chemistry: 0, math: 0 };
    const p = rec.physics || 0;
    const c = rec.chemistry || 0;
    const m = rec.math || 0;
    return {
      date: d,
      physics: p,
      chemistry: c,
      math: m,
      total: p + c + m,
    };
  });

  const maxDailyTotal = Math.max(...chartData.map((d) => d.total), state.goals.total || 60, 10);

  // Subject percentage helper
  const getPercentage = (subjectCount: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.round((subjectCount / total) * 100);
  };

  const { thisWeek, thisMonth, allTime } = analytics;

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-sky-600" />
          Progress Tracking &amp; Analytical Summaries
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Complete weekly and monthly breakdowns for Physics, Chemistry, and Math questions.
        </p>
      </div>

      {/* TOP CARDS: THIS WEEK & THIS MONTH (User's primary requirement) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* THIS WEEK BREAKDOWN */}
        <div className="p-5 rounded-2xl bg-white border border-sky-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">
                  Weekly Summary
                </span>
                <h3 className="text-lg font-bold text-slate-900">This Week</h3>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-slate-900">{thisWeek.total}</div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Questions</div>
            </div>
          </div>

          {/* Three Subject Mini Cards */}
          <div className="grid grid-cols-3 gap-3 my-4">
            {/* Physics */}
            <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-sky-700 text-xs font-semibold">
                <Atom className="w-3.5 h-3.5 text-sky-600" />
                <span>Physics</span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-extrabold text-sky-900">{thisWeek.physics}</div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {getPercentage(thisWeek.physics, thisWeek.total)}% of week
                </div>
              </div>
            </div>

            {/* Chemistry */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chemistry</span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-extrabold text-emerald-900">{thisWeek.chemistry}</div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {getPercentage(thisWeek.chemistry, thisWeek.total)}% of week
                </div>
              </div>
            </div>

            {/* Math */}
            <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-200 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-violet-700 text-xs font-semibold">
                <Calculator className="w-3.5 h-3.5 text-violet-600" />
                <span>Math</span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-extrabold text-violet-900">{thisWeek.math}</div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {getPercentage(thisWeek.math, thisWeek.total)}% of week
                </div>
              </div>
            </div>
          </div>

          {/* Segmented Weekly Progress Bar */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Weekly Subject Ratio</span>
              <span>P : C : M</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden border border-slate-200/60">
              <div
                title={`Physics: ${thisWeek.physics} (${getPercentage(thisWeek.physics, thisWeek.total)}%)`}
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${getPercentage(thisWeek.physics, thisWeek.total)}%` }}
              />
              <div
                title={`Chemistry: ${thisWeek.chemistry} (${getPercentage(thisWeek.chemistry, thisWeek.total)}%)`}
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${getPercentage(thisWeek.chemistry, thisWeek.total)}%` }}
              />
              <div
                title={`Math: ${thisWeek.math} (${getPercentage(thisWeek.math, thisWeek.total)}%)`}
                className="h-full bg-violet-500 transition-all duration-300"
                style={{ width: `${getPercentage(thisWeek.math, thisWeek.total)}%` }}
              />
            </div>
          </div>
        </div>

        {/* THIS MONTH BREAKDOWN */}
        <div className="p-5 rounded-2xl bg-white border border-indigo-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                  Monthly Summary
                </span>
                <h3 className="text-lg font-bold text-slate-900">This Month</h3>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-slate-900">{thisMonth.total}</div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Questions</div>
            </div>
          </div>

          {/* Three Subject Mini Cards */}
          <div className="grid grid-cols-3 gap-3 my-4">
            {/* Physics */}
            <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-sky-700 text-xs font-semibold">
                <Atom className="w-3.5 h-3.5 text-sky-600" />
                <span>Physics</span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-extrabold text-sky-900">{thisMonth.physics}</div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {getPercentage(thisMonth.physics, thisMonth.total)}% of month
                </div>
              </div>
            </div>

            {/* Chemistry */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chemistry</span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-extrabold text-emerald-900">{thisMonth.chemistry}</div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {getPercentage(thisMonth.chemistry, thisMonth.total)}% of month
                </div>
              </div>
            </div>

            {/* Math */}
            <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-200 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-violet-700 text-xs font-semibold">
                <Calculator className="w-3.5 h-3.5 text-violet-600" />
                <span>Math</span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-extrabold text-violet-900">{thisMonth.math}</div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {getPercentage(thisMonth.math, thisMonth.total)}% of month
                </div>
              </div>
            </div>
          </div>

          {/* Segmented Monthly Progress Bar */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Monthly Subject Ratio</span>
              <span>P : C : M</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden border border-slate-200/60">
              <div
                title={`Physics: ${thisMonth.physics} (${getPercentage(thisMonth.physics, thisMonth.total)}%)`}
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${getPercentage(thisMonth.physics, thisMonth.total)}%` }}
              />
              <div
                title={`Chemistry: ${thisMonth.chemistry} (${getPercentage(thisMonth.chemistry, thisMonth.total)}%)`}
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${getPercentage(thisMonth.chemistry, thisMonth.total)}%` }}
              />
              <div
                title={`Math: ${thisMonth.math} (${getPercentage(thisMonth.math, thisMonth.total)}%)`}
                className="h-full bg-violet-500 transition-all duration-300"
                style={{ width: `${getPercentage(thisMonth.math, thisMonth.total)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* DAILY QUESTIONS SOLVED VS. DAILY STUDY GOALS (BAR CHART) */}
      <DailyVsGoalChart state={state} />

      {/* 30-DAY RECHARTS MULTI-LINE SUBJECT PROGRESS TRENDS */}
      <SubjectTrendsChart state={state} />

      {/* TWO DATE RANGES SIDE-BY-SIDE COMPARISON VIEW */}
      <RangeComparisonView state={state} />

      {/* VISUAL STACKED DAILY CHART */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              Daily Solved Questions Trend
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hover over any day to see the exact subject breakdown.
            </p>
          </div>

          {/* Time frame selector & Chart Legends */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-xs text-slate-600 mr-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Physics
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Chemistry
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span> Math
              </span>
            </div>

            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
              <button
                onClick={() => setChartDays(7)}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                  chartDays === 7 ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setChartDays(14)}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                  chartDays === 14 ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                14 Days
              </button>
              <button
                onClick={() => setChartDays(30)}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                  chartDays === 30 ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>
        </div>

        {/* Hovered Bar Inspection Callout */}
        <div className="min-h-12 flex items-center mb-3">
          {hoveredBar ? (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800 flex items-center gap-3 animate-fade-in">
              <span className="font-bold text-slate-900">{formatDatePretty(hoveredBar.date)}:</span>
              <span className="text-sky-700 font-semibold">P: {hoveredBar.physics}</span>
              <span className="text-emerald-700 font-semibold">C: {hoveredBar.chemistry}</span>
              <span className="text-violet-700 font-semibold">M: {hoveredBar.math}</span>
              <span className="font-extrabold text-slate-900">Total: {hoveredBar.total} qs</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">
              Hover over bars to inspect detailed daily question counts.
            </span>
          )}
        </div>

        {/* Chart Canvas / SVG Container */}
        <div className="h-64 w-full flex items-end gap-1 sm:gap-2 pt-6 pb-2 px-1 border-b border-slate-200 overflow-x-auto">
          {chartData.map((d) => {
            const pHeight = maxDailyTotal > 0 ? (d.physics / maxDailyTotal) * 100 : 0;
            const cHeight = maxDailyTotal > 0 ? (d.chemistry / maxDailyTotal) * 100 : 0;
            const mHeight = maxDailyTotal > 0 ? (d.math / maxDailyTotal) * 100 : 0;
            const totalHeight = pHeight + cHeight + mHeight;
            const meetsStreak = d.total >= (state.goals.streakTarget || 30);

            return (
              <div
                key={d.date}
                onMouseEnter={() => setHoveredBar(d)}
                onMouseLeave={() => setHoveredBar(null)}
                className="flex-1 min-w-[20px] h-full flex flex-col justify-end items-center group cursor-pointer transition-all"
              >
                {/* Total label on top */}
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 mb-1">
                  {d.total > 0 ? d.total : ''}
                </span>

                {/* Stacked Bar */}
                <div
                  className={`w-full max-w-[28px] rounded-t-md overflow-hidden flex flex-col-reverse transition-all ${
                    meetsStreak ? 'ring-1 ring-amber-400/80' : ''
                  }`}
                  style={{ height: `${Math.max(totalHeight, d.total > 0 ? 4 : 0)}%` }}
                >
                  {/* Physics (bottom) */}
                  <div
                    style={{ height: `${(d.physics / (d.total || 1)) * 100}%` }}
                    className="w-full bg-sky-500 hover:brightness-110"
                  />
                  {/* Chemistry (middle) */}
                  <div
                    style={{ height: `${(d.chemistry / (d.total || 1)) * 100}%` }}
                    className="w-full bg-emerald-500 hover:brightness-110"
                  />
                  {/* Math (top) */}
                  <div
                    style={{ height: `${(d.math / (d.total || 1)) * 100}%` }}
                    className="w-full bg-violet-500 hover:brightness-110"
                  />
                </div>

                {/* Date label */}
                <span className="text-[10px] text-slate-500 group-hover:text-slate-900 mt-2 truncate max-w-full">
                  {formatDateShort(d.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ANALYTICAL SUMMARY TILES (Peak day, Avg, All time, Favorite subject) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Daily Average */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold mb-2">
            <Target className="w-4 h-4 text-sky-600" />
            <span>Daily Average</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{analytics.dailyAverage}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">questions/active day</div>
        </div>

        {/* Peak Record Day */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold mb-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Peak Day Record</span>
          </div>
          <div className="text-2xl font-black text-amber-600">
            {analytics.peakDay ? analytics.peakDay.total : 0} qs
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {analytics.peakDay ? formatDatePretty(analytics.peakDay.date) : 'No data yet'}
          </div>
        </div>

        {/* Best Streak */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold mb-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Best Streak</span>
          </div>
          <div className="text-2xl font-black text-orange-600">{analytics.longestStreak} Days</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Target: {state.goals.streakTarget || 30} qs/day
          </div>
        </div>

        {/* All-Time Solved */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold mb-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>All-Time Solved</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">{allTime.total} qs</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            P:{allTime.physics} C:{allTime.chemistry} M:{allTime.math}
          </div>
        </div>
      </div>
    </div>
  );
};
