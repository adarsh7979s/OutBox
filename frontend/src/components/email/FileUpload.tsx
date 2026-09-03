import { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface FileUploadProps {
  onEmailsParsed: (emails: string[]) => void;
}

export default function FileUpload({ onEmailsParsed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseEmails = (text: string): string[] => {
    const emailRegex = /[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+/g;
    const matches = text.match(emailRegex) || [];
    return [...new Set(matches.map((e) => e.toLowerCase()))];
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const emails = parseEmails(text);
      onEmailsParsed(emails);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`
          flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed
          cursor-pointer transition-all duration-200
          ${isDragging
            ? 'border-cyan-400/40 bg-cyan-500/5'
            : 'border-[var(--color-border)] hover:border-white/20 hover:bg-white/[0.02]'
          }
        `}
      >
        <Upload className={`w-5 h-5 ${isDragging ? 'text-cyan-400' : 'text-[var(--color-text-muted)]'}`} />
        <span className="text-sm text-[var(--color-text-secondary)]">
          Drop CSV/TXT or <span className="text-cyan-400 font-medium">browse</span>
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.txt,.text"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {fileName && (
        <div className="flex items-center gap-2 px-3 py-2 glass rounded-lg text-xs">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[var(--color-text-secondary)] flex-1 truncate">{fileName}</span>
          <button
            onClick={() => { setFileName(null); if (fileRef.current) fileRef.current.value = ''; }}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
