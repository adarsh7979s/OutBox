import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'cyan' | 'violet' | 'green' | 'lime' | 'none';
  padding?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  onClick?: () => void;
}

const paddingMap = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function GlassCard({
  children,
  className = '',
  hover = true,
  padding = 'md',
  animate = true,
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        card
        ${paddingMap[padding]}
        ${hover ? 'card-hover' : ''}
        ${animate ? 'animate-fade-in-scale' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
