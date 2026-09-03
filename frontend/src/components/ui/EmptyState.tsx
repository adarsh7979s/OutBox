import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 px-8 text-center animate-fade-in-scale">
      <div className="relative mb-6">
        <div className="absolute inset-0 -m-3 rounded-full bg-[var(--color-lime-soft)] blur-lg opacity-70" />
        <div className="relative w-16 h-16 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-violet)]">
          {icon ?? <Inbox className="w-7 h-7" />}
        </div>
      </div>
      <h3 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--color-ink-soft)] max-w-sm mb-7 leading-relaxed">{description}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
