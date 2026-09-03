import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface TopBarProps {
  title: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

export default function TopBar({ title, onSearch, showSearch = true }: TopBarProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] animate-fade-in">
        {title}
      </h1>

      {showSearch && onSearch && (
        <div className="relative animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {isSearchOpen ? (
            <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 w-72 transition-all animate-fade-in-scale" style={{ animationDuration: '0.2s' }}>
              <Search className="w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                autoFocus
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search emails..."
                className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
              <button
                onClick={() => { setIsSearchOpen(false); handleSearch(''); }}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-10 h-10 rounded-xl glass glass-hover flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
