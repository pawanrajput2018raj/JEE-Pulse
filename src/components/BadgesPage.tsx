import React, { useState, useMemo } from 'react';
import {
  Award,
  Flame,
  CalendarCheck,
  Crown,
  Target,
  ShieldCheck,
  Trophy,
  Gauge,
  Scale,
  Swords,
  Zap,
  Footprints,
  Sparkles,
  Check,
  Medal,
  BookOpen,
  Gem,
  Infinity as InfinityIcon,
  Rocket,
  Crosshair,
  Dumbbell,
  Compass,
  Atom,
  FlaskConical,
  CheckCircle2,
  Star,
  TrendingUp,
  Search,
  Filter,
  Lock,
  Volume2,
  ChevronRight,
  PartyPopper,
} from 'lucide-react';
import { UserBadge, BadgeTier } from '../types';
import { fireConfettiCelebration } from '../utils/badges';
import { sounds } from '../utils/soundEffects';

interface BadgesPageProps {
  badges: UserBadge[];
  currentStreak: number;
  totalQuestions: number;
}

export const BadgesPage: React.FC<BadgesPageProps> = ({
  badges,
  currentStreak,
  totalQuestions,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [justCelebratedId, setJustCelebratedId] = useState<string | null>(null);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;
  const progressPercent = Math.round((unlockedCount / (totalCount || 1)) * 100);

  // Compute Rank Title based on unlocks (scaled for 108 badges)
  const rankInfo = useMemo(() => {
    if (unlockedCount >= 80) return { title: '👑 Apex IIT Legend', color: 'from-amber-400 via-rose-500 to-indigo-600', level: 'Level 7 - Grand Immortal' };
    if (unlockedCount >= 55) return { title: '🏆 Top AIR 100 Aspirant', color: 'from-indigo-500 to-purple-600', level: 'Level 6 - Ultimate Elite' };
    if (unlockedCount >= 35) return { title: '💎 Advanced Master', color: 'from-sky-500 to-blue-600', level: 'Level 5 - Advanced' };
    if (unlockedCount >= 20) return { title: '🥇 JEE Challenger', color: 'from-amber-500 to-yellow-600', level: 'Level 4 - Pro Solver' };
    if (unlockedCount >= 10) return { title: '🥈 Consistent Grinder', color: 'from-slate-400 to-slate-600', level: 'Level 3 - Scholar' };
    if (unlockedCount >= 4) return { title: '🥉 Rising Aspirant', color: 'from-orange-500 to-amber-600', level: 'Level 2 - Explorer' };
    return { title: '🎖️ Novice Aspirant', color: 'from-amber-700 to-orange-800', level: 'Level 1 - Starter' };
  }, [unlockedCount]);

  // Find next closest badge to unlock
  const nextBadge = useMemo(() => {
    const lockedWithProgress = badges
      .filter((b) => !b.unlocked && b.maxProgress > 1)
      .map((b) => ({
        ...b,
        ratio: b.progress / b.maxProgress,
      }))
      .sort((a, b) => b.ratio - a.ratio);

    return lockedWithProgress[0] || null;
  }, [badges]);

  // Filtering
  const filteredBadges = useMemo(() => {
    return badges.filter((b) => {
      // Category filter
      if (selectedCategory !== 'all' && b.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus === 'unlocked' && !b.unlocked) return false;
      if (selectedStatus === 'locked' && b.unlocked) return false;

      // Tier filter
      if (selectedTier !== 'all' && b.tier !== selectedTier) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = b.title.toLowerCase().includes(query);
        const matchesDesc = b.description.toLowerCase().includes(query);
        const matchesCat = b.category.toLowerCase().includes(query);
        return matchesTitle || matchesDesc || matchesCat;
      }

      return true;
    });
  }, [badges, selectedCategory, selectedStatus, selectedTier, searchQuery]);

  const handleCelebrateBadge = (badge: UserBadge) => {
    if (badge.unlocked) {
      setJustCelebratedId(badge.id);
      sounds.playGoalCelebration();
      fireConfettiCelebration();
      setTimeout(() => setJustCelebratedId(null), 1200);
    }
  };

  const renderBadgeIcon = (iconName: string, unlocked: boolean, tier?: BadgeTier) => {
    const className = `w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:scale-110 ${
      unlocked ? 'text-white drop-shadow-sm' : 'text-slate-400'
    }`;

    switch (iconName) {
      case 'Footprints':
        return <Footprints className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'CalendarCheck':
        return <CalendarCheck className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      case 'Compass':
        return <Compass className={className} />;
      case 'Target':
        return <Target className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Medal':
        return <Medal className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Gem':
        return <Gem className={className} />;
      case 'Infinity':
        return <InfinityIcon className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Gauge':
        return <Gauge className={className} />;
      case 'Rocket':
        return <Rocket className={className} />;
      case 'Crosshair':
        return <Crosshair className={className} />;
      case 'Swords':
        return <Swords className={className} />;
      case 'Dumbbell':
        return <Dumbbell className={className} />;
      case 'Scale':
        return <Scale className={className} />;
      case 'Atom':
        return <Atom className={className} />;
      case 'FlaskConical':
        return <FlaskConical className={className} />;
      case 'CheckCircle2':
        return <CheckCircle2 className={className} />;
      case 'Star':
        return <Star className={className} />;
      case 'TrendingUp':
        return <TrendingUp className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  const getTierIconContainerStyle = (tier?: BadgeTier, unlocked?: boolean) => {
    if (!unlocked) {
      return 'bg-slate-200 text-slate-400 border border-slate-300/60';
    }
    switch (tier) {
      case 'apex':
        return 'bg-gradient-to-br from-rose-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-rose-500/40 border border-rose-300 ring-2 ring-rose-400/40';
      case 'diamond':
        return 'bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-600 text-white shadow-lg shadow-sky-500/40 border border-sky-300 ring-2 ring-sky-400/40';
      case 'platinum':
        return 'bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/40 border border-indigo-300 ring-2 ring-indigo-400/40';
      case 'gold':
        return 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-white shadow-lg shadow-amber-500/40 border border-amber-300 ring-2 ring-amber-400/40';
      case 'silver':
        return 'bg-gradient-to-br from-slate-400 via-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 border border-cyan-300 ring-2 ring-cyan-400/30';
      case 'bronze':
      default:
        return 'bg-gradient-to-br from-orange-500 via-amber-600 to-rose-600 text-white shadow-lg shadow-orange-500/30 border border-orange-300 ring-2 ring-orange-400/30';
    }
  };

  const getTierBadgeStyle = (tier?: BadgeTier, unlocked?: boolean) => {
    if (!unlocked) {
      return 'bg-slate-200 text-slate-500 border-slate-300 font-semibold';
    }
    switch (tier) {
      case 'apex':
        return 'bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 text-white font-black shadow-xs shadow-rose-500/30 border-none';
      case 'diamond':
        return 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black shadow-xs shadow-sky-500/30 border-none';
      case 'platinum':
        return 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black shadow-xs shadow-indigo-500/30 border-none';
      case 'gold':
        return 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-black shadow-xs shadow-amber-500/30 border-none';
      case 'silver':
        return 'bg-gradient-to-r from-slate-500 to-cyan-600 text-white font-black shadow-xs shadow-slate-500/30 border-none';
      case 'bronze':
      default:
        return 'bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black shadow-xs shadow-orange-500/30 border-none';
    }
  };

  const getCardBgStyle = (tier?: BadgeTier, unlocked?: boolean, isJustCelebrated?: boolean) => {
    if (isJustCelebrated) {
      return 'bg-gradient-to-br from-amber-100 via-yellow-100 to-amber-200 border-amber-400 shadow-xl ring-4 ring-amber-400/60 scale-[1.03] transition-all duration-300';
    }
    if (!unlocked) {
      return 'bg-slate-100/60 border-slate-200/80 hover:border-slate-300 text-slate-400 transition-all';
    }
    switch (tier) {
      case 'apex':
        return 'bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100/70 border-rose-300 shadow-md shadow-rose-500/10 hover:shadow-xl hover:shadow-rose-500/20 hover:border-rose-400 cursor-pointer ring-1 ring-rose-400/30 transition-all';
      case 'diamond':
        return 'bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100/70 border-sky-300 shadow-md shadow-sky-500/10 hover:shadow-xl hover:shadow-sky-500/20 hover:border-sky-400 cursor-pointer ring-1 ring-sky-400/30 transition-all';
      case 'platinum':
        return 'bg-gradient-to-br from-indigo-50 via-purple-50 to-fuchsia-100/70 border-indigo-300 shadow-md shadow-indigo-500/10 hover:shadow-xl hover:shadow-indigo-500/20 hover:border-indigo-400 cursor-pointer ring-1 ring-indigo-400/30 transition-all';
      case 'gold':
        return 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100/70 border-amber-300 shadow-md shadow-amber-500/10 hover:shadow-xl hover:shadow-amber-500/20 hover:border-amber-400 cursor-pointer ring-1 ring-amber-400/30 transition-all';
      case 'silver':
        return 'bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100/60 border-cyan-300 shadow-md shadow-cyan-500/10 hover:shadow-xl hover:shadow-cyan-500/20 hover:border-cyan-400 cursor-pointer ring-1 ring-cyan-400/30 transition-all';
      case 'bronze':
      default:
        return 'bg-gradient-to-br from-orange-50 via-amber-50 to-red-100/60 border-orange-300 shadow-md shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 hover:border-orange-400 cursor-pointer ring-1 ring-orange-400/30 transition-all';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Hero Showcase & Rank Level Banner */}
      <div className="relative rounded-3xl bg-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-slate-800">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Rank and Unlocks */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-amber-300 border border-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{rankInfo.level}</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
                {unlockedCount} of {totalCount} Badges Unlocked ({progressPercent}%)
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                <span>{rankInfo.title}</span>
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">
                Every milestone represents real problems solved in Physics, Chemistry, and Math. Keep pushing daily streaks and problem volume to achieve the Apex IIT Legend tier.
              </p>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-1.5 pt-2 max-w-lg">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Badge Collection Progress</span>
                <span className="font-bold text-amber-400">{unlockedCount} / {totalCount} Completed</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 border border-slate-700/80 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber-500 via-rose-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Next Badge & Quick Stats */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-xs flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Current Streak</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-400">{currentStreak}</span>
                <span className="text-xs text-slate-400">days</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Active Momentum</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-xs flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">All-Time Solved</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl sm:text-3xl font-black text-sky-400">{totalQuestions}</span>
                <span className="text-xs text-slate-400">problems</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-sky-400" />
                <span>PCM Practice</span>
              </div>
            </div>

            {/* Next badge spotlight */}
            {nextBadge && (
              <div className="col-span-2 p-3.5 rounded-2xl bg-slate-800/90 border border-indigo-500/40 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-slate-700/80 text-amber-400 shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Next Closest Badge</span>
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">{nextBadge.title}</h4>
                    <span className="text-[11px] text-slate-400">
                      {nextBadge.progress} of {nextBadge.maxProgress} ({Math.round((nextBadge.progress / nextBadge.maxProgress) * 100)}%)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const el = document.getElementById(`badge-${nextBadge.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>View</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search badges by name, syllabus topic or condition..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold self-start md:self-auto">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedStatus === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({badges.length})
            </button>
            <button
              onClick={() => setSelectedStatus('unlocked')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                selectedStatus === 'unlocked' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>✨ Colorful &amp; Completed ({unlockedCount})</span>
            </button>
            <button
              onClick={() => setSelectedStatus('locked')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                selectedStatus === 'locked' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>In Progress ({totalCount - unlockedCount})</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </span>

          {[
            { id: 'all', label: 'All Categories' },
            { id: 'streak', label: '🔥 Streaks' },
            { id: 'volume', label: '🎯 Question Volume' },
            { id: 'milestone', label: '⚡ Single-Day Blitz' },
            { id: 'balance', label: '⚖️ PCM Balance' },
            { id: 'subject', label: '🔬 Subject Specialists' },
            { id: 'discipline', label: '⭐ Goals & Discipline' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-xl whitespace-nowrap transition cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Badges Grid */}
      {filteredBadges.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-2">
          <Award className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No badges match your filter</h3>
          <p className="text-xs text-slate-500">Try changing your search keywords or resetting filters.</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedStatus('all');
              setSelectedTier('all');
              setSearchQuery('');
            }}
            className="mt-3 px-4 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => {
            const isJustCelebrated = justCelebratedId === badge.id;
            const progressRatio = Math.min(100, Math.round((badge.progress / (badge.maxProgress || 1)) * 100));

            return (
              <div
                key={badge.id}
                id={`badge-${badge.id}`}
                onClick={() => handleCelebrateBadge(badge)}
                className={`group relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between ${getCardBgStyle(
                  badge.tier,
                  badge.unlocked,
                  isJustCelebrated
                )}`}
              >
                <div>
                  {/* Top Bar: Icon, Title, Tier Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-2xl shrink-0 transition-transform ${getTierIconContainerStyle(
                          badge.tier,
                          badge.unlocked
                        )} group-hover:scale-105`}
                      >
                        {renderBadgeIcon(badge.icon, badge.unlocked, badge.tier)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className={`text-sm font-bold transition ${
                            badge.unlocked ? 'text-slate-900 font-extrabold' : 'text-slate-600'
                          }`}>
                            {badge.title}
                          </h3>
                        </div>
                        <span
                          className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${getTierBadgeStyle(
                            badge.tier,
                            badge.unlocked
                          )}`}
                        >
                          {badge.tier || 'bronze'}
                        </span>
                      </div>
                    </div>

                    {/* Unlocked / Locked status badge */}
                    {badge.unlocked ? (
                      <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-black flex items-center gap-1 shrink-0 shadow-sm shadow-emerald-500/30">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>COMPLETED</span>
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg bg-slate-200/90 text-slate-500 text-[10px] font-semibold flex items-center gap-1 shrink-0">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {badge.description}
                  </p>

                  {/* Hint for locked badges */}
                  {!badge.unlocked && badge.hint && (
                    <div className="mt-2 text-[11px] text-slate-500 bg-slate-100/80 rounded-lg p-2 flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{badge.hint}</span>
                    </div>
                  )}
                </div>

                {/* Bottom: Progress Bar & Celebrate action */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-medium">
                      {badge.unlocked ? 'Milestone Achieved' : 'Progress'}
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {badge.progress} / {badge.maxProgress} ({progressRatio}%)
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        badge.unlocked
                          ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-xs'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${progressRatio}%` }}
                    />
                  </div>

                  {badge.unlocked && (
                    <div className="pt-1 flex items-center justify-between text-[11px] font-bold text-emerald-800">
                      <span className="flex items-center gap-1.5">
                        <PartyPopper className="w-3.5 h-3.5 text-amber-500" />
                        <span>Completed! Tap to celebrate</span>
                      </span>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600 opacity-80" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
