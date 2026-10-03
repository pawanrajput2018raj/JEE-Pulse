import React, { useState, useMemo } from 'react';
import { Calendar, Search, ArrowUpDown, Filter, Edit3, CheckCircle2, ChevronLeft, ChevronRight, FileDown, Atom, FlaskConical, Calculator } from 'lucide-react';
import { AppStateData, DailyRecord } from '../types';
import { formatDatePretty, getDayName, getTodayStr } from '../utils/dateUtils';
import { extractTagsFromNotes } from '../utils/quickTags';

interface HistorySectionProps {
  state: AppStateData;
  onSelectDateToEdit: (date: string) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ state, onSelectDateToEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [subjectFilter, setSubjectFilter] = useState<'all' | 'physics' | 'chemistry' | 'math'>('all');

  const recordsList = useMemo(() => {
    const list: DailyRecord[] = Object.values(state.records);
    return list.filter((r) => {
      const total = (r.physics || 0) + (r.chemistry || 0) + (r.math || 0);
      if (total === 0 && r.date !== getTodayStr()) return false;

      // Search match
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const dateMatch = r.date.toLowerCase().includes(q) || formatDatePretty(r.date).toLowerCase().includes(q);
        const noteMatch = (r.notes || '').toLowerCase().includes(q);
        if (!dateMatch && !noteMatch) return false;
      }

      // Subject filter
      if (subjectFilter === 'physics' && (r.physics || 0) === 0) return false;
      if (subjectFilter === 'chemistry' && (r.chemistry || 0) === 0) return false;
      if (subjectFilter === 'math' && (r.math || 0) === 0) return false;

      return true;
    }).sort((a, b) => {
      return sortOrder === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    });
  }, [state.records, searchTerm, sortOrder, subjectFilter]);

  // Aggregate stats for filtered records
  const aggregates = useMemo(() => {
    let p = 0, c = 0, m = 0;
    recordsList.forEach((r) => {
      p += r.physics || 0;
      c += r.chemistry || 0;
      m += r.math || 0;
    });
    return {
      physics: p,
      chemistry: c,
      math: m,
      total: p + c + m,
      daysCount: recordsList.length,
    };
  }, [recordsList]);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              Date-wise Practice History
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Detailed breakdown of questions solved on each date across Physics, Chemistry, and Math.
            </p>
          </div>

          {/* Quick totals badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <span className="text-slate-500">Total in view: </span>
              <span className="font-bold text-slate-800">{aggregates.total} qs</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800">
              P: <span className="font-bold">{aggregates.physics}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              C: <span className="font-bold">{aggregates.chemistry}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-800">
              M: <span className="font-bold">{aggregates.math}</span>
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by date or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-500"
            />
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setSubjectFilter('all')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                subjectFilter === 'all' ? 'bg-sky-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSubjectFilter('physics')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                subjectFilter === 'physics' ? 'bg-sky-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Physics
            </button>
            <button
              onClick={() => setSubjectFilter('chemistry')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                subjectFilter === 'chemistry' ? 'bg-emerald-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chemistry
            </button>
            <button
              onClick={() => setSubjectFilter('math')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                subjectFilter === 'math' ? 'bg-violet-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Math
            </button>
          </div>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Records Table / Cards */}
      <div className="space-y-3">
        {recordsList.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No practice records match your filter</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or log new questions.</p>
          </div>
        ) : (
          recordsList.map((r) => {
            const dayTotal = (r.physics || 0) + (r.chemistry || 0) + (r.math || 0);
            const isToday = r.date === getTodayStr();
            const goalMet = dayTotal >= (state.goals.total || 75);
            const streakMet = dayTotal >= (state.goals.streakTarget || 30);

            return (
              <div
                key={r.date}
                className="p-4 rounded-2xl bg-white hover:bg-slate-50/90 border border-slate-200/80 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Date & Note Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {formatDatePretty(r.date)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-600">
                      {getDayName(r.date)}
                    </span>
                    {isToday && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-bold">
                        Today
                      </span>
                    )}
                    {streakMet && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
                        🔥 Streak Met
                      </span>
                    )}
                  </div>
                  {r.notes && (() => {
                    const { matchedTags, customText } = extractTagsFromNotes(r.notes);
                    return (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {matchedTags.map((tag) => (
                          <span
                            key={tag.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${tag.badgeClass}`}
                          >
                            <span>{tag.emoji}</span>
                            <span>{tag.label}</span>
                          </span>
                        ))}
                        {customText && (
                          <div
                            onClick={() => onSelectDateToEdit(r.date)}
                            className="w-full text-xs text-slate-600 bg-slate-50/90 px-3 py-1.5 rounded-lg border border-slate-200/70 whitespace-pre-line line-clamp-3 hover:line-clamp-none transition-all cursor-pointer hover:bg-slate-100/80"
                            title="Click to view or edit full notes for this date"
                          >
                            {customText}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Subject Counts */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Physics */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 min-w-[90px]">
                    <Atom className="w-4 h-4 text-sky-600" />
                    <div>
                      <div className="text-[10px] text-slate-500">Physics</div>
                      <div className="text-sm font-bold text-sky-700">{r.physics || 0} qs</div>
                    </div>
                  </div>

                  {/* Chemistry */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 min-w-[90px]">
                    <FlaskConical className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-[10px] text-slate-500">Chemistry</div>
                      <div className="text-sm font-bold text-emerald-700">{r.chemistry || 0} qs</div>
                    </div>
                  </div>

                  {/* Math */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200 min-w-[90px]">
                    <Calculator className="w-4 h-4 text-violet-600" />
                    <div>
                      <div className="text-[10px] text-slate-500">Math</div>
                      <div className="text-sm font-bold text-violet-700">{r.math || 0} qs</div>
                    </div>
                  </div>

                  {/* Day Total */}
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 min-w-[100px]">
                    <div>
                      <div className="text-[10px] text-slate-500">Day Total</div>
                      <div className="text-sm font-extrabold text-slate-900">{dayTotal} qs</div>
                    </div>
                  </div>

                  {/* Edit Date Button */}
                  <button
                    onClick={() => onSelectDateToEdit(r.date)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer border border-slate-200"
                    title={`Edit questions for ${r.date}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
