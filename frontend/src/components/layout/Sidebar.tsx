import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, Send, PenSquare, LogOut, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEmailCounts } from '../../hooks/useEmails';

const navItems = [
  { path: '/dashboard', icon: Clock, label: 'Scheduled', countKey: 'scheduled' as const },
  { path: '/sent', icon: Send, label: 'Sent', countKey: 'sent' as const },
  { path: '/compose', icon: PenSquare, label: 'Compose', countKey: null },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: counts } = useEmailCounts();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[72px] glass-strong z-40 flex flex-col items-center py-6 gap-2">
      {/* Logo */}
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-6 group"
      >
        <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center transition-transform group-hover:scale-110">
          <span className="text-white font-bold text-lg">O</span>
        </div>
      </button>

      {/* Nav Items */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map(({ path, icon: Icon, label, countKey }) => {
          const isActive = location.pathname === path;
          const count = countKey && counts ? counts[countKey] : 0;

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`
                relative w-12 h-12 rounded-xl flex items-center justify-center
                transition-all duration-200 group
                ${isActive
                  ? 'bg-white/10 text-[var(--color-text-primary)] shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
                }
              `}
              title={label}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-gradient-to-b from-cyan-400 to-violet-500" />
              )}
              <Icon className="w-5 h-5" />

              {/* Count badge */}
              {countKey && count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {count > 99 ? '99+' : count}
                </span>
              )}

              {/* Tooltip */}
              <div className="
                absolute left-full ml-3 px-2.5 py-1.5 rounded-lg
                bg-gray-900 text-xs text-white font-medium
                opacity-0 group-hover:opacity-100 pointer-events-none
                transition-opacity duration-200 whitespace-nowrap
                shadow-lg
              ">
                {label}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-2">
        {/* Slack Connect */}
        <button
          onClick={() => window.open('/api/slack/connect', '_self')}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all group"
          title="Connect Slack"
        >
          <MessageSquare className="w-5 h-5" />
          <div className="
            absolute left-full ml-3 px-2.5 py-1.5 rounded-lg
            bg-gray-900 text-xs text-white font-medium
            opacity-0 group-hover:opacity-100 pointer-events-none
            transition-opacity duration-200 whitespace-nowrap
            shadow-lg
          ">
            Slack
          </div>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/5 transition-all group"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
          <div className="
            absolute left-full ml-3 px-2.5 py-1.5 rounded-lg
            bg-gray-900 text-xs text-white font-medium
            opacity-0 group-hover:opacity-100 pointer-events-none
            transition-opacity duration-200 whitespace-nowrap
            shadow-lg
          ">
            Logout
          </div>
        </button>

        {/* Avatar */}
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-9 h-9 rounded-full ring-2 ring-white/10 hover:ring-cyan-400/30 transition-all cursor-pointer"
            title={user.name}
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0) ?? '?'}
          </div>
        )}
      </div>
    </aside>
  );
}
