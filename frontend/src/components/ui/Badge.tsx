import type { EmailStatus } from '../../api/types';

interface BadgeProps {
  status: EmailStatus;
}

const statusConfig: Record<EmailStatus, { label: string; classes: string }> = {
  SCHEDULED: {
    label: 'Scheduled',
    classes: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  PROCESSING: {
    label: 'Processing',
    classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  SENT: {
    label: 'Sent',
    classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  FAILED: {
    label: 'Failed',
    classes: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  RATE_LIMITED: {
    label: 'Rate Limited',
    classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  CANCELLED: {
    label: 'Cancelled',
    classes: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  },
};

export default function Badge({ status }: BadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-1 text-xs font-medium
        rounded-full border ${config.classes}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'SENT' ? 'bg-emerald-400' :
        status === 'SCHEDULED' ? 'bg-cyan-400' :
        status === 'PROCESSING' ? 'bg-blue-400 animate-pulse' :
        status === 'FAILED' ? 'bg-red-400' :
        status === 'RATE_LIMITED' ? 'bg-amber-400' :
        'bg-gray-400'
      }`} />
      {config.label}
    </span>
  );
}
