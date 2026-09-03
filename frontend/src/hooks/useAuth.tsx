import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, logout as logoutApi } from '../api/auth';
import type { User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem('outbox_token'));
  const queryClient = useQueryClient();

  // Watch for token changes (e.g. after OAuth callback)
  useEffect(() => {
    const handler = () => setToken(localStorage.getItem('outbox_token'));
    window.addEventListener('storage', handler);
    // Also listen for custom event
    window.addEventListener('outbox:token-changed', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('outbox:token-changed', handler);
    };
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const logout = useCallback(async () => {
    await logoutApi();
    setToken(null);
    queryClient.clear();
    window.location.href = '/login';
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: !!token && isLoading,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
