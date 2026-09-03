import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color: 'cyan' | 'green' | 'violet' | 'lime';
  delay?: number;
  hint?: string;
}

const accentMap = {
  cyan: { chip: 'bg-[var(--color-violet-soft)] text-[var(--color-violet-deep)]' },
  violet: { chip: 'bg-[var(--color-violet-soft)] text-[var(--color-violet-deep)]' },
  green: { chip: 'bg-[var(--color-success-soft)] text-[var(--color-success)]' },
  lime: { chip: 'bg-[var(--color-lime-soft)] text-[var(--color-lime-ink)]' },
};

export default function StatCard({ icon: Icon, label, value, color, delay = 0, hint }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplayValue(value);
      return;
    }
    hasAnimated.current = true;

    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let step = 0;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        step++;
        setDisplayValue(Math.min(Math.round(increment * step), value));
        if (step >= steps) clearInterval(interval);
      }, duration / steps);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const accent = accentMap[color];

  return (
    <div
      className="card card-hover p-6 animate-fade-in-scale"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-ink-soft)] mb-2">{label}</p>
          <p className="font-data text-4xl font-semibold text-[var(--color-ink)] leading-none">
            {displayValue.toLocaleString()}
          </p>
          {hint && <p className="text-xs text-[var(--color-ink-muted)] mt-2.5">{hint}</p>}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${accent.chip}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
