import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color: 'cyan' | 'green' | 'violet';
  delay?: number;
}

const colorMap = {
  cyan: {
    iconBg: 'bg-cyan-500/10',
    iconText: 'text-cyan-400',
    glow: 'shadow-[0_8px_40px_rgba(34,211,238,0.06)]',
  },
  green: {
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-400',
    glow: 'shadow-[0_8px_40px_rgba(52,211,153,0.06)]',
  },
  violet: {
    iconBg: 'bg-violet-500/10',
    iconText: 'text-violet-400',
    glow: 'shadow-[0_8px_40px_rgba(139,92,246,0.06)]',
  },
};

export default function StatCard({ icon: Icon, label, value, color, delay = 0 }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
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
    let current = 0;
    let step = 0;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        step++;
        current = Math.min(Math.round(increment * step), value);
        setDisplayValue(current);
        if (step >= steps) clearInterval(interval);
      }, duration / steps);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const colors = colorMap[color];

  return (
    <div
      ref={ref}
      className={`
        glass rounded-2xl p-6 transition-all duration-300
        hover:bg-white/[0.06] ${colors.glow}
        animate-fade-in-scale
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">{label}</p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums">
            {displayValue.toLocaleString()}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.iconText}`} />
        </div>
      </div>
    </div>
  );
}
