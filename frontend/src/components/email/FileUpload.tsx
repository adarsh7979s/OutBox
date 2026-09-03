import { useRef, useState } from 'react';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';

interface FileUploadProps {
  onEmailsParsed: (emails: string[]) => void;
}

export default function FileUpload({ onEmailsParsed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [foundCount, setFoundCount] = useState(0);
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
      setFoundCount(emails.length);
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
          flex items-center justify-center gap-3 px-4 py-5 rounded-2xl border-2 border-dashed
          cursor-pointer transition-all duration-200
          ${isDragging
            ? 'border-[var(--color-violet)] bg-[var(--color-violet-soft)]'
            : 'border-[var(--color-border-strong)] hover:border-[var(--color-violet)] hover:bg-[var(--color-surface-2)]'
          }
        `}
      >
        <Upload className={`w-5 h-5 ${isDragging ? 'text-[var(--color-violet)]' : 'text-[var(--color-ink-muted)]'}`} />
        <span className="text-sm text-[var(--color-ink-soft)]">
          Drop a CSV or TXT file, or <span className="text-[var(--color-violet-deep)] font-semibold">browse</span>
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
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs">
          <FileText className="w-4 h-4 text-[var(--color-violet)] flex-shrink-0" />
          <span className="text-[var(--color-ink-soft)] flex-1 truncate font-medium">{fileName}</span>
          {foundCount > 0 && (
            <span className="flex items-center gap-1 text-[var(--color-success)] font-semibold whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-data">{foundCount}</span> found
            </span>
          )}
          <button
            onClick={() => { setFileName(null); setFoundCount(0); if (fileRef.current) fileRef.current.value = ''; }}
            className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded-full p-0.5"
            aria-label="Remove file"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
