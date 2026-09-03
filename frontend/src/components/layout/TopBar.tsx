import { useState, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  right?: ReactNode;
}

export default function TopBar({ title, subtitle, onSearch, showSearch = true, right }: TopBarProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  return (
    <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
      <div className="animate-rise min-w-0">
        <h1 className="font-display text-3xl sm:text-[2.1rem] font-bold text-[var(--color-ink)] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[var(--color-ink-soft)] mt-1.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0 animate-rise" style={{ animationDelay: '0.08s' }}>
        {showSearch && onSearch && (
          isSearchOpen ? (
            <div className="flex items-center gap-2 card !shadow-none px-4 h-11 w-64 sm:w-72 animate-fade-in-scale" style={{ animationDuration: '0.2s' }}>
              <Search className="w-4 h-4 text-[var(--color-ink-muted)] flex-shrink-0" />
              <input
                autoFocus
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search recipients or subjects…"
                className="flex-1 min-w-0 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none"
              />
              <button
                onClick={() => { setIsSearchOpen(false); handleSearch(''); }}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] flex-shrink-0"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-11 h-11 rounded-full btn-soft flex items-center justify-center"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
          )
        )}
        {right}
      </div>
    </div>
  );
}
