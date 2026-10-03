import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Atom,
  FlaskConical,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  Sparkles,
  CheckCircle2,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { DailyRecord, DailyGoals, SubjectType } from '../types';
import { formatDatePretty, addDays, getTodayStr } from '../utils/dateUtils';
import { StudyNotesEditor } from './StudyNotesEditor';
import { sounds } from '../utils/soundEffects';

interface DailyStudyTopicsPageProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  record: DailyRecord;
  goals: DailyGoals;
  onSaveRecord: (updated: DailyRecord) => void;
}

const COMMON_TOPICS: Record<SubjectType, string[]> = {
  physics: [
    'Kinematics & NLM',
    'Work, Power & Energy',
    'Rotational Motion',
    'Gravitation',
    'Thermodynamics (Physics)',
    'Electrostatics',
    'Current Electricity',
    'Magnetism & EMI',
    'Optics (Ray & Wave)',
    'Modern Physics',
  ],
  chemistry: [
    'Atomic Structure & Bonding',
    'Chemical Thermodynamics',
    'Equilibrium (Ionic & Chem)',
    'Solutions & Electrochemistry',
    'Periodic Table & Coordination',
    'GOC & Hydrocarbons',
    'Aldehydes, Ketones & Acids',
    'Polymers & Biomolecules',
    'Metallurgy & p-block',
  ],
  math: [
    'Quadratic & Complex Numbers',
    'Matrices & Determinants',
    'Permutations & Probability',
    'Limits, Continuity & Deriv.',
    'Definite & Indefinite Integrals',
    'Differential Equations',
    'Conic Sections (Parabola/Ellipse)',
    'Vectors & 3D Geometry',
    'Trigonometry',
  ],
};

export const DailyStudyTopicsPage: React.FC<DailyStudyTopicsPageProps> = ({
  selectedDate,
  setSelectedDate,
  record,
  goals,
  onSaveRecord,
}) => {
  const isToday = selectedDate === getTodayStr();

  // Topics state
  const topics = record.topics || {};
  const [physicsInput, setPhysicsInput] = useState('');
  const [chemInput, setChemInput] = useState('');
  const [mathInput, setMathInput] = useState('');

  const handlePrevDay = () => {
    setSelectedDate(addDays(selectedDate, -1));
    sounds.playClick();
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
    sounds.playClick();
  };

  const handleToday = () => {
    setSelectedDate(getTodayStr());
    sounds.playClick();
  };

  const handleAddTopic = (subject: SubjectType, topicName: string) => {
    const trimmed = topicName.trim();
    if (!trimmed) return;

    const currentSubjectTopics = topics[subject] || [];
    if (currentSubjectTopics.includes(trimmed)) return;

    const updatedTopics = {
      ...topics,
      [subject]: [...currentSubjectTopics, trimmed],
    };

    onSaveRecord({
      ...record,
      topics: updatedTopics,
      updatedAt: Date.now(),
    });
    sounds.playClick();
  };

  const handleRemoveTopic = (subject: SubjectType, topicName: string) => {
    const currentSubjectTopics = topics[subject] || [];
    const updatedTopics = {
      ...topics,
      [subject]: currentSubjectTopics.filter((t) => t !== topicName),
    };

    onSaveRecord({
      ...record,
      topics: updatedTopics,
      updatedAt: Date.now(),
    });
    sounds.playClick();
  };

  const handleNotesChange = (newNotes: string) => {
    onSaveRecord({
      ...record,
      notes: newNotes,
      updatedAt: Date.now(),
    });
  };

  const totalQuestions = (record.physics || 0) + (record.chemistry || 0) + (record.math || 0);
  const totalMinutes =
    (record.durationMinutes?.physics || 0) +
    (record.durationMinutes?.chemistry || 0) +
    (record.durationMinutes?.math || 0);

  const physicsTopics = topics.physics || [];
  const chemTopics = topics.chemistry || [];
  const mathTopics = topics.math || [];
  const allTopicsCount = physicsTopics.length + chemTopics.length + mathTopics.length;

  return (
    <div className="space-y-6">
      {/* Header & Date Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Daily Study &amp; Topics</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Record topics studied, formulas, mistake analysis, and checklists for any date.
              </p>
            </div>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-2xs">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                  sounds.playClick();
                }
              }}
              className="px-2.5 py-1 text-xs font-semibold bg-transparent border-none text-slate-800 focus:outline-hidden cursor-pointer"
            />
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-bold transition cursor-pointer"
            >
              Go to Today
            </button>
          )}
        </div>
      </div>

      {/* Daily Snapshot Overview Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Date Card */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Selected Day
          </span>
          <div className="text-base font-bold text-slate-900 truncate">
            {formatDatePretty(selectedDate)}
          </div>
          <span className="text-[11px] text-sky-600 font-semibold mt-0.5 inline-block">
            {isToday ? '● Today' : 'Archived Log'}
          </span>
        </div>

        {/* Questions Solved */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Questions Solved
          </span>
          <div className="text-2xl font-black text-slate-900">{totalQuestions}</div>
          <span className="text-[11px] text-slate-500">
            P:{record.physics || 0} C:{record.chemistry || 0} M:{record.math || 0}
          </span>
        </div>

        {/* Study Duration */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Study Time Logged
          </span>
          <div className="text-2xl font-black text-indigo-600">
            {totalMinutes > 0 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : '0m'}
          </div>
          <span className="text-[11px] text-slate-500">Across 3 subjects</span>
        </div>

        {/* Topics Logged */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Topics Covered
          </span>
          <div className="text-2xl font-black text-emerald-600">{allTopicsCount}</div>
          <span className="text-[11px] text-slate-500">Chapters tagged</span>
        </div>
      </div>

      {/* TOPICS STUDIED BY SUBJECT SECTION */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-sky-600" />
              Syllabus Topics &amp; Chapters Covered on this Date
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tag chapters and sub-topics you solved or revised today. Pick from JEE syllabus or add custom topics.
            </p>
          </div>
        </div>

        {/* Three Subject Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Physics Topics */}
          <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                  <Atom className="w-4 h-4 text-sky-600" />
                  Physics Topics ({physicsTopics.length})
                </span>
              </div>

              {/* Tag List */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] mb-3">
                {physicsTopics.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No Physics topics tagged yet.</span>
                ) : (
                  physicsTopics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-sky-800 border border-sky-300 shadow-2xs"
                    >
                      {topic}
                      <button
                        onClick={() => handleRemoveTopic('physics', topic)}
                        className="hover:text-rose-600 cursor-pointer ml-0.5"
                        title="Remove topic"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Custom Add Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTopic('physics', physicsInput);
                  setPhysicsInput('');
                }}
                className="flex gap-1.5 mb-3"
              >
                <input
                  type="text"
                  placeholder="Add Physics topic..."
                  value={physicsInput}
                  onChange={(e) => setPhysicsInput(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  disabled={!physicsInput.trim()}
                  className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Suggestions */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Common Syllabus Suggestions:
                </span>
                <div className="flex flex-wrap gap-1">
                  {COMMON_TOPICS.physics.map((t) => {
                    const isAdded = physicsTopics.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => (isAdded ? handleRemoveTopic('physics', t) : handleAddTopic('physics', t))}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition cursor-pointer border ${
                          isAdded
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white hover:bg-sky-100/70 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isAdded ? '✓ ' : '+ '}
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Chemistry Topics */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-emerald-600" />
                  Chemistry Topics ({chemTopics.length})
                </span>
              </div>

              {/* Tag List */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] mb-3">
                {chemTopics.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No Chemistry topics tagged yet.</span>
                ) : (
                  chemTopics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-emerald-800 border border-emerald-300 shadow-2xs"
                    >
                      {topic}
                      <button
                        onClick={() => handleRemoveTopic('chemistry', topic)}
                        className="hover:text-rose-600 cursor-pointer ml-0.5"
                        title="Remove topic"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Custom Add Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTopic('chemistry', chemInput);
                  setChemInput('');
                }}
                className="flex gap-1.5 mb-3"
              >
                <input
                  type="text"
                  placeholder="Add Chemistry topic..."
                  value={chemInput}
                  onChange={(e) => setChemInput(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!chemInput.trim()}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Suggestions */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Common Syllabus Suggestions:
                </span>
                <div className="flex flex-wrap gap-1">
                  {COMMON_TOPICS.chemistry.map((t) => {
                    const isAdded = chemTopics.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => (isAdded ? handleRemoveTopic('chemistry', t) : handleAddTopic('chemistry', t))}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition cursor-pointer border ${
                          isAdded
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white hover:bg-emerald-100/70 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isAdded ? '✓ ' : '+ '}
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Math Topics */}
          <div className="p-4 rounded-xl bg-violet-50/50 border border-violet-200/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-violet-600" />
                  Math Topics ({mathTopics.length})
                </span>
              </div>

              {/* Tag List */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] mb-3">
                {mathTopics.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No Math topics tagged yet.</span>
                ) : (
                  mathTopics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-violet-800 border border-violet-300 shadow-2xs"
                    >
                      {topic}
                      <button
                        onClick={() => handleRemoveTopic('math', topic)}
                        className="hover:text-violet-600 cursor-pointer ml-0.5"
                        title="Remove topic"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Custom Add Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTopic('math', mathInput);
                  setMathInput('');
                }}
                className="flex gap-1.5 mb-3"
              >
                <input
                  type="text"
                  placeholder="Add Math topic..."
                  value={mathInput}
                  onChange={(e) => setMathInput(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="submit"
                  disabled={!mathInput.trim()}
                  className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Suggestions */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Common Syllabus Suggestions:
                </span>
                <div className="flex flex-wrap gap-1">
                  {COMMON_TOPICS.math.map((t) => {
                    const isAdded = mathTopics.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => (isAdded ? handleRemoveTopic('math', t) : handleAddTopic('math', t))}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition cursor-pointer border ${
                          isAdded
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white hover:bg-violet-100/70 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isAdded ? '✓ ' : '+ '}
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Markdown Study Notes & Daily Checklists Editor */}
      <StudyNotesEditor
        notes={record.notes || ''}
        onNotesChange={handleNotesChange}
        selectedDate={selectedDate}
      />
    </div>
  );
};
