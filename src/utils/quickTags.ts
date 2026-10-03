export interface QuickNoteTag {
  id: string;
  label: string;
  emoji: string;
  category: 'difficulty' | 'sentiment';
  activeClass: string;
  inactiveClass: string;
  badgeClass: string;
}

export const QUICK_TAGS: QuickNoteTag[] = [
  // Difficulty sentiments
  {
    id: 'easy',
    label: 'Easy',
    emoji: '🟢',
    category: 'difficulty',
    activeClass: 'bg-emerald-600 text-white shadow-xs border-emerald-600 font-bold',
    inactiveClass: 'bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 border border-emerald-200',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    emoji: '🟡',
    category: 'difficulty',
    activeClass: 'bg-amber-600 text-white shadow-xs border-amber-600 font-bold',
    inactiveClass: 'bg-amber-50/80 text-amber-800 hover:bg-amber-100 border border-amber-200',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'hard',
    label: 'Hard',
    emoji: '🔴',
    category: 'difficulty',
    activeClass: 'bg-rose-600 text-white shadow-xs border-rose-600 font-bold',
    inactiveClass: 'bg-rose-50/80 text-rose-800 hover:bg-rose-100 border border-rose-200',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  // Practice sentiments & action tags
  {
    id: 'revision-needed',
    label: 'Revision Needed',
    emoji: '🔁',
    category: 'sentiment',
    activeClass: 'bg-violet-600 text-white shadow-xs border-violet-600 font-bold',
    inactiveClass: 'bg-violet-50/80 text-violet-800 hover:bg-violet-100 border border-violet-200',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  {
    id: 'pyqs-solved',
    label: 'PYQs Solved',
    emoji: '🎯',
    category: 'sentiment',
    activeClass: 'bg-sky-600 text-white shadow-xs border-sky-600 font-bold',
    inactiveClass: 'bg-sky-50/80 text-sky-800 hover:bg-sky-100 border border-sky-200',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  {
    id: 'silly-mistakes',
    label: 'Silly Mistakes',
    emoji: '⚠️',
    category: 'sentiment',
    activeClass: 'bg-orange-600 text-white shadow-xs border-orange-600 font-bold',
    inactiveClass: 'bg-orange-50/80 text-orange-800 hover:bg-orange-100 border border-orange-200',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  {
    id: 'formula-review',
    label: 'Formula Review',
    emoji: '💡',
    category: 'sentiment',
    activeClass: 'bg-teal-600 text-white shadow-xs border-teal-600 font-bold',
    inactiveClass: 'bg-teal-50/80 text-teal-800 hover:bg-teal-100 border border-teal-200',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    id: 'speed-drill',
    label: 'Speed Drill',
    emoji: '⚡',
    category: 'sentiment',
    activeClass: 'bg-indigo-600 text-white shadow-xs border-indigo-600 font-bold',
    inactiveClass: 'bg-indigo-50/80 text-indigo-800 hover:bg-indigo-100 border border-indigo-200',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
];

/**
 * Checks if a tag's label exists in the notes string
 */
export const isTagInNotes = (tagLabel: string, notes: string): boolean => {
  if (!notes) return false;
  const escaped = tagLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(notes);
};

/**
 * Removes a tag label cleanly from a notes string along with commas
 */
export const removeTagFromNotes = (notes: string, tagLabel: string): string => {
  if (!notes) return '';
  const escaped = tagLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let updated = notes
    .replace(new RegExp(`,\\s*${escaped}\\b`, 'gi'), '')
    .replace(new RegExp(`\\b${escaped}\\b\\s*,?`, 'gi'), '')
    .replace(new RegExp(`\\[${escaped}\\]`, 'gi'), '')
    .trim();
  // Clean up dangling or doubled commas
  updated = updated.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim();
  return updated;
};

/**
 * Toggles a tag in notes:
 * - If present: removes it
 * - If not present: appends it (and replaces conflicting difficulty tags if applicable)
 */
export const toggleTagInNotes = (notes: string, tag: QuickNoteTag): string => {
  let updated = notes || '';
  const active = isTagInNotes(tag.label, updated);

  if (active) {
    return removeTagFromNotes(updated, tag.label);
  }

  // If adding a difficulty tag, remove any existing difficulty tags
  if (tag.category === 'difficulty') {
    QUICK_TAGS.filter((t) => t.category === 'difficulty').forEach((t) => {
      updated = removeTagFromNotes(updated, t.label);
    });
  }

  return updated.trim() ? `${updated.trim()}, ${tag.label}` : tag.label;
};

/**
 * Extracts recognized quick tags and returns the remaining custom notes text
 */
export const extractTagsFromNotes = (
  notes?: string
): { matchedTags: QuickNoteTag[]; customText: string } => {
  if (!notes) return { matchedTags: [], customText: '' };
  const matchedTags: QuickNoteTag[] = [];
  let remaining = notes;

  QUICK_TAGS.forEach((tag) => {
    if (isTagInNotes(tag.label, remaining)) {
      matchedTags.push(tag);
      remaining = removeTagFromNotes(remaining, tag.label);
    }
  });

  return { matchedTags, customText: remaining.trim() };
};
