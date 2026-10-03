import React from 'react';
import { Code, Terminal } from 'lucide-react';

interface QuestionRendererProps {
  text: string;
  className?: string;
}

/**
 * QuestionRenderer
 * Ensures coding and programming language questions are rendered cleanly
 * with formatted English syntax highlighting and code containers.
 */
export const QuestionRenderer: React.FC<QuestionRendererProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Check if text contains markdown code block: ```[language]?\n<code>\n```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  const hasCodeBlocks = codeBlockRegex.test(text);

  // If there are explicit markdown code blocks
  if (hasCodeBlocks) {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    const re = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;

    while ((match = re.exec(text)) !== null) {
      const precedingText = text.substring(lastIndex, match.index);
      if (precedingText) {
        parts.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-line">
            {precedingText}
          </span>
        );
      }

      const rawLang = match[1]?.trim() || '';
      const displayLang = rawLang ? rawLang.toUpperCase() : 'CODE (ENGLISH)';
      const codeSnippet = match[2];

      parts.push(
        <div
          key={`code-${match.index}`}
          className="my-3 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-md font-mono text-xs select-text"
        >
          {/* English Code Header */}
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              <span>{displayLang}</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
              English Syntax
            </span>
          </div>

          {/* Code Body */}
          <pre className="p-4 overflow-x-auto text-sky-200 leading-relaxed font-mono whitespace-pre text-xs sm:text-[13px]">
            {codeSnippet}
          </pre>
        </div>
      );

      lastIndex = re.lastIndex;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(
        <span key={`text-end`} className="whitespace-pre-line">
          {remainingText}
        </span>
      );
    }

    return <div className={`leading-relaxed ${className}`}>{parts}</div>;
  }

  // Detect raw code without triple backticks (e.g. #include, def mystery, int main, for (...))
  const isCodingQuestion =
    text.includes('#include') ||
    text.includes('int main') ||
    text.includes('def ') ||
    text.includes('print(') ||
    text.includes('cout <<') ||
    text.includes('public static void') ||
    text.includes('class Solution');

  if (isCodingQuestion) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1">
          <Code className="w-3.5 h-3.5 text-indigo-600" />
          <span>Programming Problem (English)</span>
        </div>
        <div className="whitespace-pre-line font-medium leading-relaxed">
          {text}
        </div>
      </div>
    );
  }

  // Standard question text
  return <div className={`whitespace-pre-line leading-relaxed ${className}`}>{text}</div>;
};
