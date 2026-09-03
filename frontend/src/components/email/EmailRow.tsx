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
  const monogram = email.recipientEmail.charAt(0).toUpperCase();

  // Status + time travel together; they sit inline on wide screens and
  // stack under the subject on narrow ones so the address stays readable.
  const meta = (
    <>
      <Badge status={email.status} />
      <span className="flex items-center gap-1.5 text-xs font-data text-[var(--color-ink-muted)] whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
        {formatTime(email.status === 'SENT' && email.sentAt ? email.sentAt : email.scheduledAt)}
      </span>
    </>
  );

  return (
    <div className="card card-hover p-4 group">
      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
        {/* Recipient monogram */}
        <div className="hidden sm:flex w-11 h-11 rounded-full bg-[var(--color-violet-soft)] text-[var(--color-violet-deep)] items-center justify-center font-data font-semibold text-base flex-shrink-0">
          {monogram}
        </div>

        {/* Recipient & Subject */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
              {email.recipientEmail}
            </p>
            <span className="hidden md:inline text-[var(--color-ink-muted)] text-xs">·</span>
            <p className="hidden md:block text-xs text-[var(--color-ink-muted)] truncate">
              {email.senderEmail}
            </p>
          </div>
          <p className="text-sm text-[var(--color-ink-soft)] truncate">{email.subject}</p>

          {/* Stacked meta — narrow screens */}
          <div className="flex sm:hidden items-center flex-wrap gap-x-3 gap-y-1.5 mt-2.5">
            {meta}
          </div>
        </div>

        {/* Inline meta — wide screens */}
        <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
          {meta}
        </div>

        {/* Cancel button */}
        {canCancel && onCancel && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel(email.id);
            }}
            className="flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-error-soft)] text-[var(--color-ink-muted)] hover:text-[var(--color-error)] transition-all"
            title="Cancel this email"
            aria-label="Cancel this email"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
