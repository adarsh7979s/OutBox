import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'cyan' | 'violet' | 'green' | 'none';
  padding?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  onClick?: () => void;
}

const glowMap = {
  cyan: 'hover:shadow-[0_8px_40px_rgba(34,211,238,0.08)]',
  violet: 'hover:shadow-[0_8px_40px_rgba(139,92,246,0.08)]',
  green: 'hover:shadow-[0_8px_40px_rgba(52,211,153,0.08)]',
  none: '',
};

const paddingMap = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function GlassCard({
  children,
  className = '',
  hover = true,
  glow = 'cyan',
  padding = 'md',
  animate = true,
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        glass rounded-2xl transition-all duration-300
        ${paddingMap[padding]}
        ${hover ? 'glass-hover cursor-pointer' : ''}
        ${glowMap[glow]}
        ${animate ? 'animate-fade-in-scale' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
