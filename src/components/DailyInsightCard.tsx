import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Quote, Lightbulb, CheckCircle2, Compass } from 'lucide-react';
import { DailyRecord } from '../types';
import { sounds } from '../utils/soundEffects';

interface DailyInsightData {
  quote: string;
  author: string;
  tip: string;
  pcmAssessment: string;
  badgeTag: string;
}

interface DailyInsightCardProps {
  selectedDate: string;
  record: DailyRecord;
  dailyGoal: number;
  streakTarget: number;
  currentStreak: number;
  isToday: boolean;
}

export const DailyInsightCard: React.FC<DailyInsightCardProps> = ({
  selectedDate,
  record,
  dailyGoal,
  streakTarget,
  currentStreak,
  isToday,
}) => {
  const [insight, setInsight] = useState<DailyInsightData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'both' | 'quote' | 'tip'>('both');
  const [error, setError] = useState<string | null>(null);

  const totalQuestions = (record.physics || 0) + (record.chemistry || 0) + (record.math || 0);

  // Fetch or retrieve cached insight for the selected date
  const fetchInsight = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = `jee_daily_insight_${selectedDate}`;
      if (!forceRefresh) {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.quote && parsed.tip) {
              setInsight(parsed);
              return;
            }
          }
        } catch {
          // ignore cache read error
        }
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/daily-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: selectedDate,
            physics: record.physics || 0,
            chemistry: record.chemistry || 0,
            math: record.math || 0,
            total: totalQuestions,
            dailyGoal,
            streakTarget,
            currentStreak,
            notes: record.notes || '',
            forceRefresh,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const json = await response.json();
        if (json.success && json.data) {
          setInsight(json.data);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(json.data));
          } catch {
            // ignore cache write error
          }
        } else {
          throw new Error('Could not parse insight data');
        }
      } catch (err: any) {
        console.warn('Failed to fetch AI daily insight:', err);
        setError('Could not load new insight. Tap refresh to retry.');
      } finally {
        setLoading(false);
      }
    },
    [selectedDate, record.physics, record.chemistry, record.math, record.notes, totalQuestions, dailyGoal, streakTarget, currentStreak]
  );

  // Fetch on mount or when date changes
  useEffect(() => {
    fetchInsight(false);
  }, [fetchInsight]);

  const handleRefresh = () => {
    sounds.playClick();
    fetchInsight(true);
  };

  return (
    <div className="relative rounded-2xl border border-indigo-100/90 bg-linear-to-br from-indigo-50/60 via-white to-sky-50/40 p-5 shadow-xs overflow-hidden transition-all duration-300">
      {/* Subtle Ambient Decorative Glow */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-linear-to-br from-indigo-400/10 to-sky-400/10 blur-2xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-linear-to-br from-indigo-500 to-sky-500 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>AI Daily Insight</span>
              </h3>
              {insight?.badgeTag && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 border border-indigo-200 text-indigo-800">
                  {insight.badgeTag}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Personalized mentor tip &amp; motivation for {isToday ? 'Today' : selectedDate}
            </p>
          </div>
        </div>

        {/* View Mode Switcher and Refresh Action */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <div className="inline-flex rounded-lg bg-slate-100/80 p-0.5 border border-slate-200/60 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setViewMode('both')}
              className={`px-2 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'both' ? 'bg-white text-indigo-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setViewMode('quote')}
              className={`px-2 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'quote' ? 'bg-white text-indigo-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quote
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tip')}
              className={`px-2 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'tip' ? 'bg-white text-indigo-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tip
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 border border-slate-200 transition cursor-pointer disabled:opacity-50"
            title="Generate fresh AI insight"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading && !insight ? (
        <div className="py-6 flex flex-col items-center justify-center gap-2 text-center text-slate-500 animate-pulse">
          <Sparkles className="w-6 h-6 text-indigo-500 animate-bounce" />
          <p className="text-xs font-medium">Generating your personalized study insight...</p>
        </div>
      ) : error && !insight ? (
        <div className="py-4 text-center">
          <p className="text-xs text-rose-600 mb-2">{error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      ) : insight ? (
        <div className="space-y-3.5 relative z-10">
          {/* Motivational Quote Block */}
          {(viewMode === 'both' || viewMode === 'quote') && (
            <div className="flex gap-3 items-start bg-white/90 p-3.5 rounded-xl border border-indigo-100/70 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                <Quote className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <blockquote className="text-xs sm:text-sm font-medium text-slate-800 italic leading-relaxed">
                  "{insight.quote}"
                </blockquote>
                <p className="text-[11px] font-bold text-indigo-700 mt-1 tracking-wide">
                  — {insight.author}
                </p>
              </div>
            </div>
          )}

          {/* Actionable Study Tip Block */}
          {(viewMode === 'both' || viewMode === 'tip') && (
            <div className="flex gap-3 items-start bg-linear-to-r from-amber-50/70 to-amber-50/30 p-3.5 rounded-xl border border-amber-200/70 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-0.5">
                  <span>Smart Study Tip</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {insight.tip}
                </p>
              </div>
            </div>
          )}

          {/* PCM Balance Appraisal Subtext */}
          {insight.pcmAssessment && viewMode === 'both' && (
            <div className="flex items-center gap-1.5 px-2 text-[11px] text-slate-500">
              <Compass className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>{insight.pcmAssessment}</span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
