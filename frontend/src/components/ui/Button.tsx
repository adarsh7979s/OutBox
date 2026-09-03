import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'lime' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'btn-ink',
  lime: 'btn-lime',
  secondary: 'btn-soft',
  danger: 'bg-[var(--color-error-soft)] text-[var(--color-error)] hover:brightness-95',
  ghost: 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-black/[0.04]',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-9 pl-2 pr-4 text-sm gap-2',
  md: 'h-11 pl-2.5 pr-5 text-sm gap-2.5',
  lg: 'h-13 pl-3 pr-7 text-base gap-3',
};

// When there's no icon badge, use symmetric padding.
const plainSizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-9 px-4 text-sm gap-2',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
};

const badgeSize: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'w-6 h-6 [&_svg]:w-3.5 [&_svg]:h-3.5',
  md: 'w-7 h-7 [&_svg]:w-4 [&_svg]:h-4',
  lg: 'w-9 h-9 [&_svg]:w-[18px] [&_svg]:h-[18px]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  // Primary & lime variants render the icon inside the signature circular badge.
  const useBadge = !!icon && (variant === 'primary' || variant === 'lime');
  const badgeTone = variant === 'lime' ? 'bg-[var(--color-ink)] text-white' : 'arrow-badge';

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold rounded-full
        cursor-pointer select-none whitespace-nowrap
        transition-all duration-200
        disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none
        ${variantClasses[variant]}
        ${useBadge ? sizeClasses[size] : plainSizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className={`inline-flex items-center justify-center rounded-full ${useBadge ? badgeSize[size] : ''}`}>
          <Loader2 className="w-4 h-4 animate-spin" />
        </span>
      ) : useBadge ? (
        <span className={`${badgeTone} ${badgeSize[size]}`}>{icon}</span>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
