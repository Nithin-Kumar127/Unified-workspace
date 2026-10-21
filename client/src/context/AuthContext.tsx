// client/src/context/AuthContext.tsx
import { createContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true until localStorage is read
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setIsLoading(false);
          return;
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      const oauthCallback =
        new URLSearchParams(window.location.search).has('code') ||
        new URLSearchParams(window.location.hash.slice(1)).has('access_token');

      try {
        if (oauthCallback) {
          const { getSupabaseClient } = await import('../services/supabase');
          const { data, error } = await getSupabaseClient().auth.getSession();
          if (error) throw error;

          if (data.session) {
            if (cancelled) return;
            const response = await api.post('/auth/google', {
              accessToken: data.session.access_token,
            });
            if (cancelled) return;

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setUser(response.data.user);
          }
        }
      } catch (error) {
        console.error('Google authentication error:', error);
        if (!cancelled) {
          const message = isAxiosError<{ error?: string }>(error)
            ? error.response?.data?.error
            : undefined;
          sessionStorage.setItem(
            'googleAuthError',
            message || 'Google sign-in could not be completed. Please try again.'
          );
          localStorage.removeItem('token');
          localStorage.removeItem('user');

          try {
            const { getSupabaseClient } = await import('../services/supabase');
            const { error: signOutError } = await getSupabaseClient().auth.signOut();
            if (signOutError) console.error('Supabase sign-out error:', signOutError);
          } catch (signOutError) {
            console.error('Supabase sign-out error:', signOutError);
          }

          navigate('/login', { replace: true });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    navigate('/dashboard');
  };

  const logout = async () => {
    try {
      const { getSupabaseClient, isSupabaseConfigured } = await import('../services/supabase');
      if (isSupabaseConfigured) {
        const { error } = await getSupabaseClient().auth.signOut();
        if (error) console.error('Supabase sign-out error:', error);
      }
    } catch (error) {
      console.error('Supabase sign-out error:', error);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};