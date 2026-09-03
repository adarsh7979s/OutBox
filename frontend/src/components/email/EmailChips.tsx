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
      setError(`"${email}" is not a valid email address`);
      return;
    }

    if (emails.includes(email)) {
      setError(`"${email}" is already on the list`);
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
      if (!inputValue) return;
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
      onChange([...new Set([...emails, ...newEmails])]);
      setError('');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="
          field flex flex-wrap items-center gap-2 p-3 min-h-[52px] cursor-text
          focus-within:bg-white focus-within:border-[rgba(124,92,252,0.55)]
          focus-within:shadow-[0_0_0_4px_rgba(124,92,252,0.12)]
        "
        onClick={() => inputRef.current?.focus()}
      >
        {emails.map((email, i) => (
          <span
            key={email}
            className="
              pill gap-1.5 pl-3 pr-2 py-1.5
              bg-[var(--color-violet-soft)] text-[var(--color-violet-deep)]
              text-xs font-semibold animate-fade-in-scale
            "
            style={{ animationDuration: '0.2s' }}
          >
            {email}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeEmail(i);
              }}
              className="hover:text-[var(--color-violet)] transition-colors rounded-full"
              aria-label={`Remove ${email}`}
            >
              <X className="w-3.5 h-3.5" />
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
            flex-1 min-w-[140px] bg-transparent text-sm
            text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]
            focus:outline-none py-1
          "
        />
      </div>
      {error ? (
        <p className="text-xs font-medium text-[var(--color-error)]">{error}</p>
      ) : emails.length > 0 ? (
        <p className="text-xs text-[var(--color-ink-muted)]">
          <span className="font-data font-semibold text-[var(--color-ink-soft)]">{emails.length}</span> recipient{emails.length !== 1 ? 's' : ''} · press Enter or paste a list
        </p>
      ) : null}
    </div>
  );
}
