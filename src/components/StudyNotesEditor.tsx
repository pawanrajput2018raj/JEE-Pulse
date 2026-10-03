import React, { useState, useRef } from 'react';
import {
  BookOpen,
  Bold,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Heading3,
  Clock,
  Eye,
  Edit3,
  Copy,
  Check,
  X,
  Tag,
  Square,
  Sparkles,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { QUICK_TAGS, QuickNoteTag, isTagInNotes, toggleTagInNotes } from '../utils/quickTags';
import { sounds } from '../utils/soundEffects';

interface StudyNotesEditorProps {
  notes: string;
  onNotesChange: (updatedNotes: string) => void;
  selectedDate: string;
}

interface TemplateOption {
  id: string;
  name: string;
  icon: string;
  template: string;
}

const STUDY_TEMPLATES: TemplateOption[] = [
  {
    id: 'checklist',
    name: 'Daily Checklist',
    icon: '🎯',
    template: `### 🎯 Daily Checklist\n- [ ] Review formula flashcards\n- [ ] Solve 25 PYQs with timer\n- [ ] Analyze incorrect answers\n- [ ] 15-min speed drill`,
  },
  {
    id: 'topics',
    name: 'Topics Studied',
    icon: '📚',
    template: `### 📚 Topics Studied\n- **Physics**: \n- **Chemistry**: \n- **Math**: `,
  },
  {
    id: 'mistakes',
    name: 'Mistakes & Doubts',
    icon: '⚠️',
    template: `### ⚠️ Mistake Analysis & Doubts\n- **Mistake**: \n- **Doubt to clarify**: \n- **Key Formula**: \`\``,
  },
];

export const StudyNotesEditor: React.FC<StudyNotesEditorProps> = ({
  notes,
  onNotesChange,
  selectedDate,
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [copied, setCopied] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update notes and track save timestamp
  const handleTextChange = (text: string) => {
    onNotesChange(text);
    const now = new Date();
    setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  // Insert formatting around selected text or at cursor
  const insertFormatting = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = notes || '';
    const selected = current.substring(start, end);
    const toInsert = selected || defaultPlaceholder;

    const updated = current.substring(0, start) + prefix + toInsert + suffix + current.substring(end);
    handleTextChange(updated);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + prefix.length + toInsert.length + (selected ? suffix.length : 0);
      textarea.setSelectionRange(
        selected ? start + prefix.length : start + prefix.length,
        selected ? start + prefix.length + toInsert.length : start + prefix.length + toInsert.length
      );
    }, 10);
  };

  // Insert line prefix (bullet, checklist, header, etc.)
  const insertLinePrefix = (prefix: string, placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const current = notes || '';

    // If starting on a non-empty text without trailing newline, prepend newline
    const before = current.substring(0, start);
    const after = current.substring(start);
    const needsNewline = before.length > 0 && !before.endsWith('\n');
    const insertion = (needsNewline ? '\n' : '') + prefix + placeholder;
    const updated = before + insertion + after;

    handleTextChange(updated);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + insertion.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 10);
  };

  // Insert current timestamp
  const insertTimestamp = () => {
    const timeStr = `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] `;
    insertFormatting(timeStr, '');
  };

  // Insert structured study template
  const handleApplyTemplate = (template: string) => {
    setShowTemplateMenu(false);
    if (!notes.trim()) {
      handleTextChange(template);
    } else {
      handleTextChange(`${notes.trim()}\n\n${template}`);
    }
    sounds.playClick();
  };

  // Toggle quick tag in notes
  const handleToggleTag = (tag: QuickNoteTag) => {
    const updated = toggleTagInNotes(notes, tag);
    handleTextChange(updated);
    sounds.playClick();
  };

  // Clear all notes
  const handleClear = () => {
    if (!notes.trim()) return;
    if (window.confirm('Clear study notes for this day?')) {
      handleTextChange('');
      sounds.playClick();
    }
  };

  // Copy notes to clipboard
  const handleCopy = async () => {
    if (!notes) return;
    try {
      await navigator.clipboard.writeText(notes);
      setCopied(true);
      sounds.playClick();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Toggle task checkbox right inside preview mode
  const handleToggleTaskCheckbox = (lineIndex: number, originalLine: string) => {
    const lines = notes.split('\n');
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const line = lines[lineIndex];
    let updatedLine = line;

    if (line.includes('- [ ]')) {
      updatedLine = line.replace('- [ ]', '- [x]');
    } else if (line.includes('- [x]') || line.includes('- [X]')) {
      updatedLine = line.replace(/- \[[xX]\]/, '- [ ]');
    }

    lines[lineIndex] = updatedLine;
    handleTextChange(lines.join('\n'));
    sounds.playClick();
  };

  // Word & character stats
  const charCount = notes.length;
  const wordCount = notes.trim() ? notes.trim().split(/\s+/).filter(Boolean).length : 0;

  // Simple rich-text / markdown rendering function
  const renderMarkdownPreview = (text: string) => {
    if (!text.trim()) {
      return (
        <div className="py-10 text-center text-slate-400 text-sm">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="font-medium">No study notes recorded yet for this date.</p>
          <p className="text-xs text-slate-400 mt-1">
            Switch to the "Write" tab to record topics, checklists, formulas, and insights.
          </p>
        </div>
      );
    }

    const lines = text.split('\n');

    return (
      <div className="space-y-2 text-sm text-slate-800 leading-relaxed font-sans">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          // Header 3 or 2 or 1
          if (trimmed.startsWith('### ')) {
            return (
              <h4
                key={idx}
                className="text-sm font-bold text-slate-900 mt-3 mb-1.5 pb-1 border-b border-slate-200/80 flex items-center gap-1.5"
              >
                {renderInlineFormatted(trimmed.replace(/^###\s+/, ''))}
              </h4>
            );
          }
          if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
            return (
              <h3
                key={idx}
                className="text-base font-extrabold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200 flex items-center gap-1.5"
              >
                {renderInlineFormatted(trimmed.replace(/^#+\s+/, ''))}
              </h3>
            );
          }

          // Interactive Task Checkbox: - [ ] or - [x]
          const isUncheckedTask = /^- \[\s\]\s+(.*)$/.exec(trimmed);
          const isCheckedTask = /^- \[[xX]\]\s+(.*)$/.exec(trimmed);

          if (isUncheckedTask) {
            return (
              <div
                key={idx}
                onClick={() => handleToggleTaskCheckbox(idx, line)}
                className="flex items-start gap-2.5 py-1 px-2 rounded-lg hover:bg-slate-100/80 cursor-pointer group transition-colors"
                title="Click to mark completed"
              >
                <Square className="w-4 h-4 text-slate-400 group-hover:text-sky-600 mt-0.5 shrink-0 transition" />
                <span className="text-slate-800 select-none">
                  {renderInlineFormatted(isUncheckedTask[1])}
                </span>
              </div>
            );
          }

          if (isCheckedTask) {
            return (
              <div
                key={idx}
                onClick={() => handleToggleTaskCheckbox(idx, line)}
                className="flex items-start gap-2.5 py-1 px-2 rounded-lg hover:bg-slate-100/80 cursor-pointer group transition-colors"
                title="Click to uncheck"
              >
                <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-slate-400 line-through select-none">
                  {renderInlineFormatted(isCheckedTask[1])}
                </span>
              </div>
            );
          }

          // Bullet list item
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 py-0.5 pl-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                <span>{renderInlineFormatted(trimmed.replace(/^[-*]\s+/, ''))}</span>
              </div>
            );
          }

          // Numbered list item
          const numberedMatch = /^(\d+)\.\s+(.*)$/.exec(trimmed);
          if (numberedMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 py-0.5 pl-2">
                <span className="text-xs font-bold text-sky-600 font-mono mt-0.5 shrink-0">
                  {numberedMatch[1]}.
                </span>
                <span>{renderInlineFormatted(numberedMatch[2])}</span>
              </div>
            );
          }

          // Empty line
          if (!trimmed) {
            return <div key={idx} className="h-2" />;
          }

          // Regular paragraph
          return (
            <p key={idx} className="py-0.5">
              {renderInlineFormatted(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Helper to format inline bold, italic, code, formulas, and timestamps
  const renderInlineFormatted = (content: string) => {
    // Regex splits by bold (**...**), italic (*...*), and code (`...`)
    const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-slate-700">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded-md bg-slate-100 text-sky-700 font-mono text-xs border border-slate-200"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
      {/* Header bar: Title, Tabs & Action Icons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label htmlFor="daily-study-textarea" className="text-sm font-bold text-slate-900">
                Daily Study Notes &amp; Topics
              </label>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                Markdown &amp; Checklist
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Record formulas, mistakes, chapters studied, or use quick checklists &amp; tags
            </p>
          </div>
        </div>

        {/* Tab switcher: Write vs Preview & Utilities */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {/* Write / Preview Tab Group */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'write'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
              {notes.includes('- [ ]') && (
                <span className="w-2 h-2 rounded-full bg-amber-500" title="Checklist items pending" />
              )}
            </button>
          </div>

          {/* Copy Button */}
          {notes && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 transition cursor-pointer text-xs flex items-center gap-1"
              title="Copy notes to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Clear Button */}
          {notes && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-200 text-slate-400 hover:text-rose-600 transition cursor-pointer"
              title="Clear all notes"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Sentiment & Practice Tags */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-500" />
            <span>Quick Sentiment &amp; Practice Tags:</span>
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Click to toggle tags into your notes
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty sentiments */}
          <div className="flex items-center gap-1 bg-slate-50/80 p-1 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5 hidden xs:inline">
              Difficulty
            </span>
            {QUICK_TAGS.filter((t) => t.category === 'difficulty').map((tag) => {
              const active = isTagInNotes(tag.label, notes);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    active ? tag.activeClass : tag.inactiveClass
                  }`}
                  title={active ? `Remove ${tag.label} tag` : `Add ${tag.label} tag`}
                >
                  <span>{tag.emoji}</span>
                  <span>{tag.label}</span>
                  {active && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Practice & Revision sentiments */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-50/80 p-1 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5 hidden xs:inline">
              Practice
            </span>
            {QUICK_TAGS.filter((t) => t.category === 'sentiment').map((tag) => {
              const active = isTagInNotes(tag.label, notes);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    active ? tag.activeClass : tag.inactiveClass
                  }`}
                  title={active ? `Remove ${tag.label} tag` : `Add ${tag.label} tag`}
                >
                  <span>{tag.emoji}</span>
                  <span>{tag.label}</span>
                  {active && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Editor or Preview Pane */}
      {activeTab === 'write' ? (
        <div className="space-y-2">
          {/* Rich Text / Markdown Helper Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-600">
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**', 'bold text')}
                className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition cursor-pointer text-xs"
                title="Bold (**text**)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*', 'italic text')}
                className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition cursor-pointer text-xs"
                title="Italic (*text*)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
              <button
                type="button"
                onClick={() => insertLinePrefix('### ', 'Section Title')}
                className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition cursor-pointer text-xs"
                title="Heading (### Title)"
              >
                <Heading3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertLinePrefix('- ', 'Study item')}
                className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition cursor-pointer text-xs"
                title="Bullet List (- item)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertLinePrefix('1. ', 'First step')}
                className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition cursor-pointer text-xs"
                title="Numbered List (1. item)"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertLinePrefix('- [ ] ', 'Task to complete')}
                className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition cursor-pointer text-xs"
                title="Checklist Task (- [ ] task)"
              >
                <CheckSquare className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('`', '`', 'E = mc^2')}
                className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition cursor-pointer text-xs"
                title="Inline Code / Formula (`code`)"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={insertTimestamp}
                className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition cursor-pointer text-xs"
                title="Insert Current Timestamp"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Template Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Templates</span>
              </button>

              {showTemplateMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowTemplateMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-56 p-1.5 bg-white rounded-xl shadow-lg border border-slate-200 z-30 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Study Templates
                    </div>
                    {STUDY_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl.template)}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-900 text-xs text-slate-700 transition cursor-pointer flex items-center gap-2"
                      >
                        <span className="text-sm">{tmpl.icon}</span>
                        <span className="font-medium">{tmpl.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Simple & Rich Textarea Field */}
          <div className="relative">
            <textarea
              id="daily-study-textarea"
              ref={textareaRef}
              rows={5}
              placeholder="Record chapters covered, formulas memorized, mistake analysis, or tasks...
Tip: Use markdown syntax like **bold**, `formula`, or - [ ] checklist items"
              value={notes}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-slate-50/70 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white transition resize-y min-h-[120px] max-h-[380px] leading-relaxed font-sans"
            />
          </div>
        </div>
      ) : (
        /* Preview Tab */
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 min-h-[140px] max-h-[380px] overflow-y-auto">
          {renderMarkdownPreview(notes)}
        </div>
      )}

      {/* Footer bar: Stats (words, characters) & Auto-Save status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>
              <strong className="text-slate-700">{wordCount}</strong> words •{' '}
              <strong className="text-slate-700">{charCount}</strong> characters
            </span>
          </span>
          {notes.includes('- [ ]') && (
            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
              <CheckSquare className="w-3 h-3" /> Checklist active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lastSaved ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <Check className="w-3 h-3" /> Auto-saved to record ({lastSaved})
            </span>
          ) : (
            <span className="text-slate-400">All edits saved automatically to date record</span>
          )}
        </div>
      </div>
    </div>
  );
};
