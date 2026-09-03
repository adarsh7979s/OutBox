import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-sm font-medium text-[var(--color-ink-soft)]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              field w-full px-4 py-3 text-sm
              ${icon ? 'pl-11' : ''}
              ${error ? '!border-[var(--color-error)] focus:!ring-[rgba(225,29,72,0.15)]' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-xs font-medium text-[var(--color-error)]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
