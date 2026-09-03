import type { EmailStatus } from '../../api/types';

interface BadgeProps {
  status: EmailStatus;
}

const statusConfig: Record<EmailStatus, { label: string; classes: string; dot: string; pulse?: boolean }> = {
  SCHEDULED: {
    label: 'Scheduled',
    classes: 'bg-[var(--color-violet-soft)] text-[var(--color-violet-deep)]',
    dot: 'bg-[var(--color-violet)]',
  },
  PROCESSING: {
    label: 'Sending',
    classes: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
    dot: 'bg-[var(--color-info)]',
    pulse: true,
  },
  SENT: {
    label: 'Sent',
    classes: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
    dot: 'bg-[var(--color-success)]',
  },
  FAILED: {
    label: 'Failed',
    classes: 'bg-[var(--color-error-soft)] text-[var(--color-error)]',
    dot: 'bg-[var(--color-error)]',
  },
  RATE_LIMITED: {
    label: 'Rate limited',
    classes: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
    dot: 'bg-[var(--color-warning)]',
  },
  CANCELLED: {
    label: 'Cancelled',
    classes: 'bg-black/[0.05] text-[var(--color-ink-muted)]',
    dot: 'bg-[var(--color-ink-muted)]',
  },
};

export default function Badge({ status }: BadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`pill px-2.5 py-1 text-xs font-semibold gap-1.5 ${config.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${config.pulse ? 'animate-[pulse-soft_1.4s_ease-in-out_infinite]' : ''}`} />
      {config.label}
    </span>
  );
}
