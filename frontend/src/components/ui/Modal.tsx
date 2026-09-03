import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(23,19,32,0.28)] backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        style={{ animationDuration: '0.2s' }}
      />

      {/* Modal */}
      <div
        className={`
          relative w-full ${sizeClasses[size]}
          card !shadow-lg p-6 animate-fade-in-scale
        `}
        style={{ animationDuration: '0.3s' }}
      >
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-semibold text-[var(--color-ink)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/[0.05] transition-colors text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
