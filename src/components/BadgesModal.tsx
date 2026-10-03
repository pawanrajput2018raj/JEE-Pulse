import React from 'react';
import {
  X,
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
  ExternalLink,
} from 'lucide-react';
import { UserBadge } from '../types';
import { fireConfettiCelebration } from '../utils/badges';
import { sounds } from '../utils/soundEffects';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  badges: UserBadge[];
  onOpenFullPage?: () => void;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({
  isOpen,
  onClose,
  badges,
  onOpenFullPage,
}) => {
  if (!isOpen) return null;

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  const renderBadgeIcon = (iconName: string, unlocked: boolean) => {
    const className = `w-6 h-6 ${unlocked ? 'text-amber-500' : 'text-slate-400'}`;
    switch (iconName) {
      case 'Footprints':
        return <Footprints className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'CalendarCheck':
        return <CalendarCheck className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      case 'Target':
        return <Target className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Gauge':
        return <Gauge className={className} />;
      case 'Scale':
        return <Scale className={className} />;
      case 'Swords':
        return <Swords className={className} />;
      case 'Medal':
        return <Medal className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Gem':
        return <Gem className={className} />;
      case 'Infinity':
        return <InfinityIcon className={className} />;
      case 'Rocket':
        return <Rocket className={className} />;
      case 'Crosshair':
        return <Crosshair className={className} />;
      case 'Dumbbell':
        return <Dumbbell className={className} />;
      case 'Compass':
        return <Compass className={className} />;
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

  const handleCelebrateBadge = (badge: UserBadge) => {
    if (badge.unlocked) {
      sounds.playGoalCelebration();
      fireConfettiCelebration();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Consistency &amp; Milestone Badges
              </h2>
              <p className="text-xs text-slate-500">
                Unlocked {unlockedCount} of {badges.length} badges
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenFullPage && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFullPage();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200 cursor-pointer"
              >
                <span>Full Page View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {badges.map((badge) => {
              return (
                <div
                  key={badge.id}
                  onClick={() => handleCelebrateBadge(badge)}
                  className={`p-4 rounded-xl border transition-all ${
                    badge.unlocked
                      ? 'bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-emerald-50/80 border-amber-300 shadow-xs cursor-pointer hover:border-amber-400 hover:shadow-md ring-1 ring-amber-400/20'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        badge.unlocked
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xs'
                          : 'bg-slate-200 border border-slate-300 text-slate-400'
                      }`}
                    >
                      {renderBadgeIcon(badge.icon, badge.unlocked)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {badge.title}
                        </h4>
                        {badge.unlocked && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                            <Check className="w-3 h-3 stroke-[3]" /> Unlocked
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {badge.description}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Progress</span>
                          <span>
                            {badge.progress} / {badge.maxProgress}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              badge.unlocked
                                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400'
                                : 'bg-slate-400'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((badge.progress / (badge.maxProgress || 1)) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {onOpenFullPage ? (
            <button
              onClick={() => {
                onClose();
                onOpenFullPage();
              }}
              className="text-xs text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Explore all {badges.length} badges on dedicated page →</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500">
              Click any unlocked badge to celebrate! 🎉
            </span>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
