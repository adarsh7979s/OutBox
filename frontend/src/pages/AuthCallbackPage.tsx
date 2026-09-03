import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('outbox_token', token);
      // Notify auth context
      window.dispatchEvent(new Event('outbox:token-changed'));
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <Spinner size="lg" />
        <p className="text-[var(--color-text-secondary)] mt-4">Signing you in...</p>
      </div>
    </div>
  );
}
