import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

interface InAppPdfViewerProps {
  onClose: () => void;
}

export const InAppPdfViewer: React.FC<InAppPdfViewerProps> = ({ onClose }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setPdfName(file.name);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setPdfName(file.name);
    }
  };

  const handleRemove = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);
    setPdfName(null);
  };

  return (
    <div
      className={`rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 ${
        isFullScreen ? 'fixed inset-4 z-40 flex flex-col bg-white shadow-2xl' : 'mt-6'
      }`}
    >
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>In-App Question PDF Practice</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                No app switching needed
              </span>
            </h3>
            {pdfName && <p className="text-xs text-sky-300 font-medium truncate max-w-xs">{pdfName}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pdfUrl && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Replace PDF"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Change PDF</span>
            </button>
          )}

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={isFullScreen ? 'Exit Full Screen' : 'Expand Full Screen'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
            title="Close PDF Viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* PDF Content or Upload Drop Area */}
      {!pdfUrl ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-b-3xl bg-slate-50/60 transition flex flex-col items-center justify-center gap-3 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
            <FileText className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">
              Click to select or drop your Question PDF here
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Open your JEE module, PYQ paper, or question sheet right in this window. The <strong>Flow timer stays on screen</strong> so you never lose sight of your question time!
            </p>
          </div>

          <button
            type="button"
            className="mt-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Select Question PDF File</span>
          </button>
        </div>
      ) : (
        <div className={`relative ${isFullScreen ? 'flex-1 h-full' : 'h-[650px]'} bg-slate-100`}>
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0`}
            className="w-full h-full border-none"
            title="Question PDF Document"
          />
        </div>
      )}
    </div>
  );
};
