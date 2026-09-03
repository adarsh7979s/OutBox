import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarClock, Send, PenLine, LogOut, Hash } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEmailCounts } from '../../hooks/useEmails';
import { API_BASE_URL } from '../../api/client';

const navItems = [
  { path: '/dashboard', icon: CalendarClock, label: 'Scheduled', countKey: 'scheduled' as const },
  { path: '/sent', icon: Send, label: 'Sent', countKey: 'sent' as const },
  { path: '/compose', icon: PenLine, label: 'Compose', countKey: null },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: counts } = useEmailCounts();

  return (
    <aside
      className="
        fixed z-40 bg-[var(--color-ink)] flex
        shadow-[0_20px_50px_-20px_rgba(23,19,32,0.5)]
        left-3 right-3 bottom-3 h-[68px] rounded-[24px]
        flex-row items-center justify-around px-2
        sm:left-4 sm:right-auto sm:top-4 sm:bottom-4
        sm:h-auto sm:w-16 sm:rounded-[26px]
        sm:flex-col sm:justify-start sm:px-0 sm:py-5
      "
    >
      {/* Brand mark — left rail only; the bottom bar needs the width for nav */}
      <button
        onClick={() => navigate('/dashboard')}
        className="hidden sm:block mb-6 group"
        aria-label="OutBox home"
      >
        <div className="w-11 h-11 rounded-2xl bg-[var(--color-lime)] flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95 shadow-[0_6px_18px_rgba(150,200,40,0.5)]">
          <Send className="w-5 h-5 text-[var(--color-lime-ink)] -translate-x-px translate-y-px" strokeWidth={2.5} />
        </div>
      </button>

      {/* Nav */}
      <nav className="flex flex-row sm:flex-col items-center gap-1 sm:gap-1.5 sm:flex-1">
        {navItems.map(({ path, icon: Icon, label, countKey }) => {
          const isActive = location.pathname === path;
          const count = countKey && counts ? counts[countKey] : 0;

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`
                relative w-11 h-11 rounded-2xl flex items-center justify-center
                transition-all duration-200 group
                ${isActive
                  ? 'bg-[var(--color-lime)] text-[var(--color-lime-ink)]'
                  : 'text-white/55 hover:text-white hover:bg-white/10'
                }
              `}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-[19px] h-[19px]" strokeWidth={2.1} />

              {/* Count badge */}
              {countKey && count > 0 && (
                <span
                  className={`
                    absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full
                    text-[10px] font-bold font-data flex items-center justify-center
                    ${isActive ? 'bg-[var(--color-ink)] text-[var(--color-lime)]' : 'bg-[var(--color-lime)] text-[var(--color-lime-ink)]'}
                  `}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}

              {/* Tooltip — left rail only */}
              <span className="
                hidden sm:inline-block
                absolute left-full ml-3 px-2.5 py-1.5 rounded-lg
                bg-[var(--color-ink)] text-xs text-white font-medium
                opacity-0 group-hover:opacity-100 pointer-events-none
                transition-opacity duration-200 whitespace-nowrap z-50
                shadow-lg
              ">
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-row sm:flex-col items-center gap-1 sm:gap-1.5 sm:mt-2">
        <button
          onClick={() => window.open(`${API_BASE_URL}/slack/connect`, '_self')}
          className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-white/55 hover:text-white hover:bg-white/10 transition-all group"
          aria-label="Connect Slack"
        >
          <Hash className="w-[18px] h-[18px]" strokeWidth={2.1} />
          <span className="hidden sm:inline-block absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[var(--color-ink)] text-xs text-white font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
            Connect Slack
          </span>
        </button>

        <button
          onClick={logout}
          className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-white/55 hover:text-[#ff9db0] hover:bg-white/10 transition-all group"
          aria-label="Log out"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={2.1} />
          <span className="hidden sm:inline-block absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[var(--color-ink)] text-xs text-white font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
            Log out
          </span>
        </button>

        <div className="mt-1">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-9 h-9 rounded-full ring-2 ring-white/15 hover:ring-[var(--color-lime)] transition-all cursor-pointer object-cover"
              title={user.name}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full bg-[var(--color-violet)] flex items-center justify-center text-white text-sm font-bold font-data ring-2 ring-white/15"
              title={user?.name ?? 'Account'}
            >
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
