import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Check,
  Calendar,
  Atom,
  FlaskConical,
  Calculator,
  Search,
  Trash2,
  Edit2,
  ChevronRight,
  Sparkles,
  BookMarked,
  X,
  ArrowLeft,
  RotateCcw,
  CheckCheck,
  TrendingUp,
  Bookmark,
  Award,
} from 'lucide-react';
import { SubjectBook, ChapterItem, SubjectType } from '../types';
import { sounds } from '../utils/soundEffects';
import { fireSubtleGoalConfetti, fireConfettiCelebration } from '../utils/badges';
import { getTodayStr, formatDateShort, formatDatePretty } from '../utils/dateUtils';

interface BooksChaptersPageProps {
  books: SubjectBook[];
  onSaveBooks: (updatedBooks: SubjectBook[]) => void;
}

export const BooksChaptersPage: React.FC<BooksChaptersPageProps> = ({
  books,
  onSaveBooks,
}) => {
  // Selected Book for detailed progress page (when null, displays grid of book boxes)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  // Filters for book boxes shelf
  const [selectedSubject, setSelectedSubject] = useState<'all' | SubjectType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in-progress'>('all');

  // Filter for chapters inside detailed book view
  const [chapterSearchQuery, setChapterSearchQuery] = useState('');
  const [chapterStatusFilter, setChapterStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Modal / Form state for Adding a New Book
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookSubject, setNewBookSubject] = useState<SubjectType>('physics');
  const [newBookTargetDate, setNewBookTargetDate] = useState('');
  const [newBookNotes, setNewBookNotes] = useState('');
  const [newBookChaptersText, setNewBookChaptersText] = useState('');

  // Edit Book Modal state
  const [isEditBookModalOpen, setIsEditBookModalOpen] = useState(false);
  const [editBookTitle, setEditBookTitle] = useState('');
  const [editBookAuthor, setEditBookAuthor] = useState('');
  const [editBookSubject, setEditBookSubject] = useState<SubjectType>('physics');
  const [editBookTargetDate, setEditBookTargetDate] = useState('');
  const [editBookNotes, setEditBookNotes] = useState('');

  // Add Chapter state inside detailed view
  const [newChapterName, setNewChapterName] = useState('');
  const [isAddingChapter, setIsAddingChapter] = useState(false);

  // Active selected book
  const selectedBook = useMemo(() => {
    if (!selectedBookId) return null;
    return books.find((b) => b.id === selectedBookId) || null;
  }, [books, selectedBookId]);

  // Toggle chapter completion (clean, direct chapter toggle - no theory or pyq clutter)
  const handleToggleChapter = (bookId: string, chapterId: string) => {
    const updatedBooks = books.map((book) => {
      if (book.id !== bookId) return book;

      const allPreviouslyCompleted =
        book.chapters.length > 0 && book.chapters.every((c) => c.isCompleted);

      const updatedChapters = book.chapters.map((ch) => {
        if (ch.id !== chapterId) return ch;
        const nextState = !ch.isCompleted;
        return {
          ...ch,
          isCompleted: nextState,
          completedAt: nextState ? getTodayStr() : undefined,
        };
      });

      const allNowCompleted =
        updatedChapters.length > 0 && updatedChapters.every((c) => c.isCompleted);

      if (!allPreviouslyCompleted && allNowCompleted) {
        sounds.playGoalCelebration();
        fireConfettiCelebration();
      } else {
        sounds.playClick();
      }

      return {
        ...book,
        chapters: updatedChapters,
      };
    });

    onSaveBooks(updatedBooks);
  };

  // Mark all chapters complete in a book
  const handleMarkAllComplete = (bookId: string) => {
    const updatedBooks = books.map((book) => {
      if (book.id !== bookId) return book;
      const today = getTodayStr();
      const updatedChapters = book.chapters.map((ch) => ({
        ...ch,
        isCompleted: true,
        completedAt: ch.completedAt || today,
      }));
      return { ...book, chapters: updatedChapters };
    });
    sounds.playGoalCelebration();
    fireConfettiCelebration();
    onSaveBooks(updatedBooks);
  };

  // Reset all chapters in a book
  const handleResetAllChapters = (bookId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Reset all chapters in this book to uncompleted?')) {
      return;
    }
    const updatedBooks = books.map((book) => {
      if (book.id !== bookId) return book;
      const updatedChapters = book.chapters.map((ch) => ({
        ...ch,
        isCompleted: false,
        completedAt: undefined,
      }));
      return { ...book, chapters: updatedChapters };
    });
    sounds.playClick();
    onSaveBooks(updatedBooks);
  };

  // Add chapter to existing book
  const handleAddChapter = (bookId: string) => {
    if (!newChapterName.trim()) return;

    const updatedBooks = books.map((book) => {
      if (book.id !== bookId) return book;
      const newCh: ChapterItem = {
        id: `ch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: newChapterName.trim(),
        isCompleted: false,
      };
      return {
        ...book,
        chapters: [...book.chapters, newCh],
      };
    });

    sounds.playClick();
    onSaveBooks(updatedBooks);
    setNewChapterName('');
    setIsAddingChapter(false);
  };

  // Delete chapter
  const handleDeleteChapter = (bookId: string, chapterId: string) => {
    const updatedBooks = books.map((book) => {
      if (book.id !== bookId) return book;
      return {
        ...book,
        chapters: book.chapters.filter((c) => c.id !== chapterId),
      };
    });
    sounds.playClick();
    onSaveBooks(updatedBooks);
  };

  // Delete entire book
  const handleDeleteBook = (bookId: string, title: string) => {
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${title}" and all its chapters?`)) {
      return;
    }
    const updatedBooks = books.filter((b) => b.id !== bookId);
    sounds.playClick();
    onSaveBooks(updatedBooks);
    if (selectedBookId === bookId) {
      setSelectedBookId(null);
    }
  };

  // Open Edit Book Modal
  const handleOpenEditBookModal = (book: SubjectBook) => {
    setEditBookTitle(book.title);
    setEditBookAuthor(book.author || '');
    setEditBookSubject(book.subject);
    setEditBookTargetDate(book.targetDate || '');
    setEditBookNotes(book.notes || '');
    setIsEditBookModalOpen(true);
  };

  // Save Edited Book Details
  const handleSaveEditedBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !editBookTitle.trim()) return;

    const updatedBooks = books.map((b) => {
      if (b.id !== selectedBook.id) return b;
      return {
        ...b,
        title: editBookTitle.trim(),
        author: editBookAuthor.trim() || undefined,
        subject: editBookSubject,
        targetDate: editBookTargetDate || undefined,
        notes: editBookNotes.trim() || undefined,
      };
    });

    sounds.playClick();
    onSaveBooks(updatedBooks);
    setIsEditBookModalOpen(false);
  };

  // Create new book
  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;

    // Parse chapters from textarea (one per line)
    const parsedChapters: ChapterItem[] = newBookChaptersText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, idx) => ({
        id: `ch-${Date.now()}-${idx}`,
        name: line,
        isCompleted: false,
      }));

    const newBook: SubjectBook = {
      id: `book-${Date.now()}`,
      title: newBookTitle.trim(),
      author: newBookAuthor.trim() || undefined,
      subject: newBookSubject,
      targetDate: newBookTargetDate || undefined,
      notes: newBookNotes.trim() || undefined,
      chapters: parsedChapters,
      createdAt: Date.now(),
    };

    const updated = [newBook, ...books];
    onSaveBooks(updated);
    sounds.playTimerStart();
    fireSubtleGoalConfetti();

    // Reset and open new book
    setNewBookTitle('');
    setNewBookAuthor('');
    setNewBookTargetDate('');
    setNewBookNotes('');
    setNewBookChaptersText('');
    setIsAddBookModalOpen(false);
    setSelectedBookId(newBook.id);
  };

  // Filtered books for the shelf
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      // Subject filter
      if (selectedSubject !== 'all' && book.subject !== selectedSubject) {
        return false;
      }

      // Status filter
      const totalCh = book.chapters.length;
      const completedCh = book.chapters.filter((c) => c.isCompleted).length;
      if (statusFilter === 'completed' && (totalCh === 0 || completedCh < totalCh)) {
        return false;
      }
      if (statusFilter === 'in-progress' && (completedCh === totalCh && totalCh > 0)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = book.title.toLowerCase().includes(query);
        const matchesAuthor = book.author?.toLowerCase().includes(query);
        const matchesChapter = book.chapters.some((c) => c.name.toLowerCase().includes(query));
        if (!matchesTitle && !matchesAuthor && !matchesChapter) {
          return false;
        }
      }

      return true;
    });
  }, [books, selectedSubject, statusFilter, searchQuery]);

  // Overall Statistics across all books
  const overallStats = useMemo(() => {
    let totalChapters = 0;
    let completedChapters = 0;

    const subjectStats: Record<SubjectType, { total: number; completed: number; books: number }> = {
      physics: { total: 0, completed: 0, books: 0 },
      chemistry: { total: 0, completed: 0, books: 0 },
      math: { total: 0, completed: 0, books: 0 },
    };

    books.forEach((book) => {
      subjectStats[book.subject].books++;
      book.chapters.forEach((ch) => {
        totalChapters++;
        subjectStats[book.subject].total++;
        if (ch.isCompleted) {
          completedChapters++;
          subjectStats[book.subject].completed++;
        }
      });
    });

    const percent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    return {
      totalBooks: books.length,
      totalChapters,
      completedChapters,
      percent,
      subjectStats,
    };
  }, [books]);

  // Subject Theme Configuration (Physics: Sky Blue, Chemistry: Emerald Green, Mathematics: Royal Violet/Purple)
  const subjectThemes = {
    physics: {
      name: 'Physics',
      icon: Atom,
      accent: 'text-sky-600',
      bgLight: 'bg-sky-50',
      border: 'border-sky-200',
      borderHover: 'hover:border-sky-400',
      ring: 'ring-sky-300',
      bar: 'bg-sky-600',
      stroke: '#0284c7',
      badge: 'bg-sky-100 text-sky-800 border-sky-200',
      gradient: 'from-sky-500 to-blue-600',
      cardGlow: 'hover:shadow-sky-500/10',
    },
    chemistry: {
      name: 'Chemistry',
      icon: FlaskConical,
      accent: 'text-emerald-600',
      bgLight: 'bg-emerald-50',
      border: 'border-emerald-200',
      borderHover: 'hover:border-emerald-400',
      ring: 'ring-emerald-300',
      bar: 'bg-emerald-600',
      stroke: '#059669',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      gradient: 'from-emerald-500 to-teal-600',
      cardGlow: 'hover:shadow-emerald-500/10',
    },
    math: {
      name: 'Mathematics',
      icon: Calculator,
      accent: 'text-violet-600',
      bgLight: 'bg-violet-50',
      border: 'border-violet-200',
      borderHover: 'hover:border-violet-400',
      ring: 'ring-violet-300',
      bar: 'bg-violet-600',
      stroke: '#7c3aed',
      badge: 'bg-violet-100 text-violet-900 border-violet-200',
      gradient: 'from-violet-600 to-purple-600',
      cardGlow: 'hover:shadow-violet-500/10',
    },
  };

  // Filtered chapters for the detailed book view
  const bookChaptersFiltered = useMemo(() => {
    if (!selectedBook) return [];
    return selectedBook.chapters.filter((ch) => {
      if (chapterStatusFilter === 'completed' && !ch.isCompleted) return false;
      if (chapterStatusFilter === 'pending' && ch.isCompleted) return false;
      if (chapterSearchQuery.trim()) {
        return ch.name.toLowerCase().includes(chapterSearchQuery.toLowerCase());
      }
      return true;
    });
  }, [selectedBook, chapterStatusFilter, chapterSearchQuery]);

  // =========================================================================
  // VIEW 2: DEDICATED BOOK PROGRESS & CHAPTERS DATA PAGE ("Page of data about its progress")
  // =========================================================================
  if (selectedBook) {
    const theme = subjectThemes[selectedBook.subject];
    const totalChapters = selectedBook.chapters.length;
    const completedChapters = selectedBook.chapters.filter((c) => c.isCompleted).length;
    const remainingChapters = Math.max(0, totalChapters - completedChapters);
    const percent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    const isFinished = totalChapters > 0 && completedChapters === totalChapters;

    // Last completed chapter
    const completedList = selectedBook.chapters.filter((c) => c.isCompleted);
    const lastCompleted = completedList[completedList.length - 1];

    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
        {/* Navigation Breadcrumb & Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setSelectedBookId(null);
            }}
            className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 shadow-2xs transition cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>← Back to Books Library</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className="cursor-pointer hover:underline text-slate-600"
              onClick={() => setSelectedBookId(null)}
            >
              Library Books
            </span>
            <span>/</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${theme.badge}`}>
              {theme.name}
            </span>
            <span>/</span>
            <span className="font-semibold text-slate-800 truncate max-w-[220px]">
              {selectedBook.title}
            </span>
          </div>
        </div>

        {/* Hero Book Progress Banner */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 relative overflow-hidden">
          {/* Subtle background subject accent tint */}
          <div
            className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none -mr-20 -mt-20 ${
              selectedBook.subject === 'physics'
                ? 'bg-sky-400'
                : selectedBook.subject === 'chemistry'
                ? 'bg-emerald-400'
                : 'bg-violet-400'
            }`}
          />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            {/* Book Meta & Cover */}
            <div className="flex items-start gap-4 sm:gap-6">
              {/* 3D Realistic Book Cover Card */}
              <div
                className={`w-20 h-28 sm:w-24 sm:h-32 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white p-3.5 flex flex-col justify-between shadow-md shrink-0 border border-white/25 relative overflow-hidden`}
              >
                {/* Book spine border effect */}
                <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/20 border-r border-white/20" />
                <div className="flex justify-between items-start pl-2">
                  <theme.icon className="w-5 h-5 text-white/90" />
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/80">
                    JEE
                  </span>
                </div>
                <div className="pl-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider line-clamp-1 opacity-80">
                    {theme.name}
                  </div>
                  <div className="text-xs font-black line-clamp-2 leading-tight drop-shadow-xs">
                    {selectedBook.title}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${theme.badge}`}>
                    {theme.name}
                  </span>
                  {isFinished ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                      <Sparkles className="w-3 h-3" /> Book 100% Completed!
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      In Progress
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {selectedBook.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {selectedBook.author && (
                    <span className="font-medium text-slate-700">Author: {selectedBook.author}</span>
                  )}
                  {selectedBook.targetDate && (
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Target Date: {formatDatePretty(selectedBook.targetDate)}
                    </span>
                  )}
                </div>

                {selectedBook.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-xl">
                    <span className="font-bold text-slate-700">Strategy / Notes: </span>
                    {selectedBook.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Circular Progress Gauge */}
            <div className="flex items-center gap-6 self-start lg:self-center p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 shrink-0">
              <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={isFinished ? '#059669' : theme.stroke}
                    strokeWidth="3.5"
                    strokeDasharray="87.96"
                    strokeDashoffset={87.96 - (87.96 * percent) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-mono text-base font-black text-slate-900 leading-none">
                    {percent}%
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                    Done
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Chapter Progress
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {completedChapters} <span className="text-slate-400 font-normal">/ {totalChapters}</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  {remainingChapters === 0 ? (
                    <span className="text-emerald-700 font-bold">All chapters finished! 🔥</span>
                  ) : (
                    <span><strong>{remainingChapters}</strong> chapters remaining</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4 Data Cards about this book's progress */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Completed
              </span>
              <div className="text-lg font-black text-slate-900">
                {completedChapters} Chapters
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">
                {percent}% of syllabus
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Remaining
              </span>
              <div className="text-lg font-black text-slate-900">
                {remainingChapters} Chapters
              </div>
              <span className="text-[11px] text-slate-500">
                {remainingChapters === 0 ? 'Fully completed' : 'Pending practice'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Target Deadline
              </span>
              <div className="text-sm font-bold text-slate-900 truncate">
                {selectedBook.targetDate ? formatDateShort(selectedBook.targetDate) : 'No Date Set'}
              </div>
              <span className="text-[11px] text-indigo-600 font-semibold">
                {isFinished ? 'Milestone met! 🎯' : 'On Track'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Last Studied Chapter
              </span>
              <div className="text-xs font-bold text-slate-800 truncate" title={lastCompleted?.name || 'None'}>
                {lastCompleted ? lastCompleted.name : 'None yet'}
              </div>
              <span className="text-[11px] text-slate-500">
                {lastCompleted?.completedAt ? `Finished ${formatDateShort(lastCompleted.completedAt)}` : 'Tap to start'}
              </span>
            </div>
          </div>

          {/* Quick Action Toolbar for This Book */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingChapter(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Chapter</span>
              </button>

              <button
                type="button"
                onClick={() => handleMarkAllComplete(selectedBook.id)}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                title="Mark all chapters as completed"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark All Complete</span>
              </button>

              <button
                type="button"
                onClick={() => handleResetAllChapters(selectedBook.id)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                title="Reset completion status of all chapters"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset All</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenEditBookModal(selectedBook)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                title="Edit book details, author, target date, or notes"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Book Info</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleDeleteBook(selectedBook.id, selectedBook.title)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ml-auto"
              title="Delete this book and its chapters"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Book</span>
            </button>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 space-y-5">
          {/* Section Header with Search and Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Chapters &amp; Completion Status</span>
                <span className="text-xs font-bold text-slate-500 font-mono">
                  ({bookChaptersFiltered.length} / {totalChapters})
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any chapter to toggle completion. Progress saves automatically.
              </p>
            </div>

            {/* Filter & Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search chapter..."
                  value={chapterSearchQuery}
                  onChange={(e) => setChapterSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:bg-white focus:border-indigo-500 w-44"
                />
              </div>

              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setChapterStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    chapterStatusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setChapterStatusFilter('pending')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    chapterStatusFilter === 'pending'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setChapterStatusFilter('completed')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    chapterStatusFilter === 'completed'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Done
                </button>
              </div>
            </div>
          </div>

          {/* Inline Add Chapter Form */}
          {isAddingChapter && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center gap-2 animate-in fade-in duration-150">
              <input
                type="text"
                placeholder="Enter new chapter name (e.g., Electromagnetic Waves)..."
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChapter(selectedBook.id)}
                autoFocus
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-indigo-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleAddChapter(selectedBook.id)}
                  disabled={!newChapterName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer"
                >
                  Save Chapter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingChapter(false);
                    setNewChapterName('');
                  }}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-indigo-100/70 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Chapters List (Simple, clean, no theory/pyq clutter) */}
          <div className="space-y-2">
            {bookChaptersFiltered.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-400 italic">
                {chapterSearchQuery
                  ? `No chapters matched "${chapterSearchQuery}".`
                  : 'No chapters match the selected filter.'}
              </div>
            ) : (
              bookChaptersFiltered.map((chapter, idx) => {
                return (
                  <div
                    key={chapter.id}
                    onClick={() => handleToggleChapter(selectedBook.id, chapter.id)}
                    className={`p-3.5 sm:px-5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group select-none ${
                      chapter.isCompleted
                        ? 'bg-emerald-50/40 hover:bg-emerald-50/70 border-emerald-200/80'
                        : 'bg-white hover:bg-slate-50/90 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Chapter Name & Checkbox */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0 ${
                          chapter.isCompleted
                            ? 'bg-emerald-600 text-white shadow-2xs ring-2 ring-emerald-300'
                            : 'border-2 border-slate-300 group-hover:border-emerald-500 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400 font-semibold shrink-0">
                            {String(idx + 1).padStart(2, '0')}.
                          </span>
                          <span
                            className={`text-xs sm:text-sm font-semibold truncate ${
                              chapter.isCompleted
                                ? 'text-slate-800 line-through decoration-emerald-400 font-medium'
                                : 'text-slate-900 group-hover:text-indigo-900'
                            }`}
                          >
                            {chapter.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      {chapter.isCompleted ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Done</span>
                          {chapter.completedAt && (
                            <span className="opacity-75 hidden sm:inline">
                              · {formatDateShort(chapter.completedAt)}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 group-hover:bg-slate-200/70">
                          Pending
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChapter(selectedBook.id, chapter.id);
                        }}
                        className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-slate-100 transition cursor-pointer"
                        title="Delete this chapter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Edit Book Modal */}
        {isEditBookModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">Edit Book Information</h3>
                    <p className="text-xs text-slate-500">Update title, author, subject, or deadlines</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditBookModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'physics', label: 'Physics', icon: Atom, color: 'text-sky-600' },
                        { id: 'chemistry', label: 'Chemistry', icon: FlaskConical, color: 'text-emerald-600' },
                        { id: 'math', label: 'Math', icon: Calculator, color: 'text-violet-600' },
                      ] as const
                    ).map((s) => {
                      const Icon = s.icon;
                      const isSelected = editBookSubject === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setEditBookSubject(s.id)}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : s.color}`} />
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Book Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editBookTitle}
                      onChange={(e) => setEditBookTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Author / Publisher</label>
                    <input
                      type="text"
                      value={editBookAuthor}
                      onChange={(e) => setEditBookAuthor(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={editBookTargetDate}
                    onChange={(e) => setEditBookTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Target Strategy</label>
                  <input
                    type="text"
                    value={editBookNotes}
                    onChange={(e) => setEditBookNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditBookModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editBookTitle.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: BOOK BOXES SHELF / GALLERY ("Boxes of book")
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Google-style Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Study Library
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Syllabus Tracking
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-indigo-600" />
            <span>Books &amp; Chapter Completion Tracker</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Click on any book box below to open its dedicated progress dashboard, view chapter syllabus, and track your completions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddBookModalOpen(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Overview Progress Cards (Material 3 Surface Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Completion Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-700">Overall Syllabus Done</span>
            <span className="font-bold text-indigo-600">{overallStats.percent}%</span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-black text-slate-900">
              {overallStats.completedChapters}
            </span>
            <span className="text-xs text-slate-500">
              / {overallStats.totalChapters} chapters ({overallStats.totalBooks} books)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-3 border border-slate-200/60">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-700"
              style={{ width: `${overallStats.percent}%` }}
            />
          </div>
        </div>

        {/* Physics Progress */}
        <div className="p-4 rounded-2xl bg-white border border-sky-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-sky-900 flex items-center gap-1.5">
              <Atom className="w-4 h-4 text-sky-600" /> Physics
            </span>
            <span className="font-bold text-sky-700">
              {overallStats.subjectStats.physics.total > 0
                ? Math.round(
                    (overallStats.subjectStats.physics.completed /
                      overallStats.subjectStats.physics.total) *
                      100
                  )
                : 0}
              %
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-2xl font-black text-sky-950">
              {overallStats.subjectStats.physics.completed}
            </span>
            <span className="text-xs text-slate-500">
              / {overallStats.subjectStats.physics.total} chapters ({overallStats.subjectStats.physics.books} books)
            </span>
          </div>
          <div className="w-full bg-sky-50 rounded-full h-2 overflow-hidden mt-3 border border-sky-100">
            <div
              className="h-full bg-sky-600 rounded-full transition-all duration-700"
              style={{
                width: `${
                  overallStats.subjectStats.physics.total > 0
                    ? (overallStats.subjectStats.physics.completed /
                        overallStats.subjectStats.physics.total) *
                      100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Chemistry Progress */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-emerald-600" /> Chemistry
            </span>
            <span className="font-bold text-emerald-700">
              {overallStats.subjectStats.chemistry.total > 0
                ? Math.round(
                    (overallStats.subjectStats.chemistry.completed /
                      overallStats.subjectStats.chemistry.total) *
                      100
                  )
                : 0}
              %
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-2xl font-black text-emerald-950">
              {overallStats.subjectStats.chemistry.completed}
            </span>
            <span className="text-xs text-slate-500">
              / {overallStats.subjectStats.chemistry.total} chapters ({overallStats.subjectStats.chemistry.books} books)
            </span>
          </div>
          <div className="w-full bg-emerald-50 rounded-full h-2 overflow-hidden mt-3 border border-emerald-100">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-700"
              style={{
                width: `${
                  overallStats.subjectStats.chemistry.total > 0
                    ? (overallStats.subjectStats.chemistry.completed /
                        overallStats.subjectStats.chemistry.total) *
                      100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Mathematics Progress (Royal Violet Theme - Changed from red/amber to violet) */}
        <div className="p-4 rounded-2xl bg-white border border-violet-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-violet-900 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-violet-600" /> Mathematics
            </span>
            <span className="font-bold text-violet-700">
              {overallStats.subjectStats.math.total > 0
                ? Math.round(
                    (overallStats.subjectStats.math.completed /
                      overallStats.subjectStats.math.total) *
                      100
                  )
                : 0}
              %
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-2xl font-black text-violet-950">
              {overallStats.subjectStats.math.completed}
            </span>
            <span className="text-xs text-slate-500">
              / {overallStats.subjectStats.math.total} chapters ({overallStats.subjectStats.math.books} books)
            </span>
          </div>
          <div className="w-full bg-violet-50 rounded-full h-2 overflow-hidden mt-3 border border-violet-100">
            <div
              className="h-full bg-violet-600 rounded-full transition-all duration-700"
              style={{
                width: `${
                  overallStats.subjectStats.math.total > 0
                    ? (overallStats.subjectStats.math.completed /
                        overallStats.subjectStats.math.total) *
                      100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        {/* Subject Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedSubject('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedSubject === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Subjects ({books.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedSubject('physics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedSubject === 'physics'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-sky-800 hover:bg-sky-50'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>Physics ({overallStats.subjectStats.physics.books})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSubject('chemistry')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedSubject === 'chemistry'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Chemistry ({overallStats.subjectStats.chemistry.books})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSubject('math')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedSubject === 'math'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-violet-800 hover:bg-violet-50'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Mathematics ({overallStats.subjectStats.math.books})</span>
          </button>
        </div>

        {/* Search & Completion Filter */}
        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search book or chapter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:outline-hidden"
          >
            <option value="all">All Status</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📚 BOOK BOXES GRID ("Boxes of book when clicked open page of data")      */}
      {/* ========================================================================= */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-700">No books found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No books matched "${searchQuery}". Try a different search.`
              : 'No books matching the selected filter. Click "Add New Book" to start tracking.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedSubject('all');
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBooks.map((book) => {
            const theme = subjectThemes[book.subject];
            const totalChapters = book.chapters.length;
            const completedCount = book.chapters.filter((c) => c.isCompleted).length;
            const percent = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;
            const isAllCompleted = totalChapters > 0 && completedCount === totalChapters;

            return (
              <div
                key={book.id}
                onClick={() => {
                  sounds.playClick();
                  setSelectedBookId(book.id);
                }}
                className={`group rounded-3xl bg-white border p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg cursor-pointer relative overflow-hidden ${
                  isAllCompleted
                    ? 'border-emerald-300 ring-2 ring-emerald-300/40 shadow-xs'
                    : `border-slate-200/90 ${theme.borderHover} shadow-xs ${theme.cardGlow}`
                }`}
              >
                {/* Top Subject Banner & Progress Pill */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase flex items-center gap-1.5 ${theme.badge}`}>
                      <theme.icon className="w-3.5 h-3.5" />
                      <span>{theme.name}</span>
                    </span>

                    {isAllCompleted ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                        <Sparkles className="w-3 h-3" /> 100% Done!
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {completedCount}/{totalChapters} Ch ({percent}%)
                      </span>
                    )}
                  </div>

                  {/* Book Card Visual & Spine presentation */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div
                      className={`w-12 h-16 rounded-xl bg-gradient-to-br ${theme.gradient} text-white p-2 flex flex-col justify-between shrink-0 shadow-sm relative overflow-hidden border border-white/20`}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/25" />
                      <theme.icon className="w-4 h-4 ml-1 opacity-90" />
                      <span className="text-[8px] font-black tracking-widest uppercase ml-1 opacity-80">
                        JEE
                      </span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <h3 className="text-base font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {book.title}
                      </h3>
                      {book.author && (
                        <p className="text-xs text-slate-500 font-medium truncate">By {book.author}</p>
                      )}
                    </div>
                  </div>

                  {/* Target Date Chip if set */}
                  {book.targetDate && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium mb-3">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Target: {formatDateShort(book.targetDate)}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Progress Bar & Click affordance */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>Completion</span>
                      <span className="font-mono font-bold text-slate-800">{percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                      <div
                        className={`h-full ${theme.bar} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1 transition-transform group-hover:translate-x-1">
                      <span>Open Book Progress</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBook(book.id, book.title);
                      }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-slate-100 transition cursor-pointer"
                      title="Delete book"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Book Modal Dialog */}
      {isAddBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Add Subject Book</h3>
                  <p className="text-xs text-slate-500">Track a new syllabus reference or problem set</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBookModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="space-y-4">
              {/* Subject Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject</label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'physics', label: 'Physics', icon: Atom, color: 'text-sky-600' },
                      { id: 'chemistry', label: 'Chemistry', icon: FlaskConical, color: 'text-emerald-600' },
                      { id: 'math', label: 'Math', icon: Calculator, color: 'text-violet-600' },
                    ] as const
                  ).map((s) => {
                    const Icon = s.icon;
                    const isSelected = newBookSubject === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setNewBookSubject(s.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : s.color}`} />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Book Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Problems in General Physics"
                    value={newBookTitle}
                    onChange={(e) => setNewBookTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Author / Publisher</label>
                  <input
                    type="text"
                    placeholder="e.g. I.E. Irodov"
                    value={newBookAuthor}
                    onChange={(e) => setNewBookAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Completion Date (Optional)</label>
                <input
                  type="date"
                  value={newBookTargetDate}
                  onChange={(e) => setNewBookTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white cursor-pointer"
                />
              </div>

              {/* Chapters List */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Chapters (One chapter per line)
                  </label>
                  <span className="text-[10px] text-slate-400">Paste your syllabus chapters</span>
                </div>
                <textarea
                  rows={4}
                  placeholder={`1. Kinematics\n2. Laws of Motion\n3. Work Energy Power\n4. Rotational Motion`}
                  value={newBookChaptersText}
                  onChange={(e) => setNewBookChaptersText(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Target Strategy</label>
                <input
                  type="text"
                  placeholder="e.g. Complete before November mock tests"
                  value={newBookNotes}
                  onChange={(e) => setNewBookNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newBookTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Create Book Box
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
