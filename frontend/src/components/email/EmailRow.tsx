import { Clock, X as XIcon } from 'lucide-react';
import Badge from '../ui/Badge';
import type { EmailListItem } from '../../api/types';

interface EmailRowProps {
  email: EmailListItem;
  onCancel?: (id: string) => void;
  showCancel?: boolean;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  // If within the next 24h, show relative
  if (diff > 0 && diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `in ${hours}h ${mins}m`;
    return `in ${mins}m`;
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function EmailRow({ email, onCancel, showCancel = false }: EmailRowProps) {
  const canCancel = showCancel && (email.status === 'SCHEDULED' || email.status === 'RATE_LIMITED');

  return (
    <div className="glass rounded-xl p-4 transition-all duration-300 hover:bg-white/[0.06] hover:shadow-[0_4px_24px_rgba(34,211,238,0.04)] group">
      <div className="flex items-center gap-4">
        {/* Recipient & Subject */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {email.recipientEmail}
            </p>
            <span className="text-[var(--color-text-muted)] text-xs">·</span>
            <p className="text-xs text-[var(--color-text-muted)] truncate">
              {email.senderEmail}
            </p>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] truncate">{email.subject}</p>
        </div>

        {/* Status */}
        <Badge status={email.status} />

        {/* Time */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
          <Clock className="w-3.5 h-3.5" />
          {formatTime(email.status === 'SENT' && email.sentAt ? email.sentAt : email.scheduledAt)}
        </div>

        {/* Cancel button */}
        {canCancel && onCancel && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel(email.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 transition-all"
            title="Cancel email"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
