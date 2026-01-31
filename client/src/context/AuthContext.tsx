import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserPublic } from '@shared/types/auth';
import { loginApi, registerApi, getMeApi } from '@/api/auth.api';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

interface AuthState {
  user: UserPublic | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem(AUTH_TOKEN_KEY),
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    getMeApi()
      .then((user) => {
        setState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      })
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user, token } = await loginApi({ email, password });
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
      navigate('/dashboard');
    },
    [navigate]
  );

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      const { user, token } = await registerApi({ email, username, password });
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
      navigate('/dashboard');
    },
    [navigate]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
