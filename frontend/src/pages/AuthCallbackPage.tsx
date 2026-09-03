import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('outbox_token', token);
      window.dispatchEvent(new Event('outbox:token-changed'));
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <div className="app-wash" />
      <div className="relative z-10 text-center animate-fade-in-scale">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-ink)] flex items-center justify-center mx-auto mb-5 shadow-[0_10px_30px_-8px_rgba(23,19,32,0.4)]">
          <Send className="w-6 h-6 text-[var(--color-lime)] -translate-x-px translate-y-px" strokeWidth={2.5} />
        </div>
        <div className="w-8 h-8 mx-auto rounded-full border-[3px] border-[rgba(124,92,252,0.18)] border-t-[var(--color-violet)] animate-spin-slow" />
        <p className="text-[var(--color-ink-soft)] mt-4 font-medium">Signing you in…</p>
      </div>
    </div>
  );
}
