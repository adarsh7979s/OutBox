export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div
        className={`
          ${sizeClasses[size]} rounded-full animate-spin-slow
          border-[rgba(124,92,252,0.18)] border-t-[var(--color-violet)]
        `}
      />
    </div>
  );
}
