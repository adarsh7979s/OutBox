import { useState, useRef, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface EmailChipsProps {
  emails: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function EmailChips({ emails, onChange, placeholder = 'Add recipient...' }: EmailChipsProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmail = (raw: string) => {
    const email = raw.trim().toLowerCase();
    if (!email) return;

    if (!isValidEmail(email)) {
      setError(`"${email}" is not a valid email`);
      return;
    }

    if (emails.includes(email)) {
      setError(`"${email}" already added`);
      return;
    }

    setError('');
    onChange([...emails, email]);
    setInputValue('');
  };

  const removeEmail = (index: number) => {
    onChange(emails.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      removeEmail(emails.length - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const newEmails = pasted
      .split(/[,;\s\n]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s && isValidEmail(s) && !emails.includes(s));

    if (newEmails.length > 0) {
      onChange([...emails, ...newEmails]);
      setError('');
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="
          flex flex-wrap items-center gap-2 p-3
          bg-white/[0.04] border border-[var(--color-border)] rounded-xl
          focus-within:border-[var(--color-border-focus)] focus-within:ring-1 focus-within:ring-[var(--color-border-focus)]
          transition-all duration-200 min-h-[46px] cursor-text
        "
        onClick={() => inputRef.current?.focus()}
      >
        {emails.map((email, i) => (
          <span
            key={email}
            className="
              inline-flex items-center gap-1 px-2.5 py-1
              bg-cyan-500/10 border border-cyan-500/20 rounded-lg
              text-xs text-cyan-300 font-medium
              animate-fade-in-scale
            "
            style={{ animationDuration: '0.2s' }}
          >
            {email}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeEmail(i);
              }}
              className="hover:text-cyan-100 transition-colors ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => { if (inputValue) addEmail(inputValue); }}
          placeholder={emails.length === 0 ? placeholder : ''}
          className="
            flex-1 min-w-[120px] bg-transparent text-sm
            text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
            focus:outline-none
          "
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {emails.length > 0 && (
        <p className="text-xs text-[var(--color-text-muted)]">{emails.length} recipient{emails.length !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
