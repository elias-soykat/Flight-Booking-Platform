import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole } from '@travel-platform/shared';
import { setAuthToken, getAuthToken } from '../lib/api-client';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  agencyId?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (params: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    agencyName?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('travelhub_user');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return getAuthToken();
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('travelhub_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('travelhub_user');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Login failed');
      }

      const receivedUser: AuthUser = {
        id: data.data.user.id,
        email: data.data.user.email,
        fullName: data.data.user.fullName,
        role: data.data.user.role,
        agencyId: data.data.user.agencyId
      };
      const receivedToken = data.data.tokens.accessToken;

      setUser(receivedUser);
      setToken(receivedToken);
      setAuthToken(receivedToken);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (params: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    agencyName?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      const receivedUser: AuthUser = {
        id: data.data.user.id,
        email: data.data.user.email,
        fullName: data.data.user.fullName,
        role: data.data.user.role,
        agencyId: data.data.user.agencyId
      };
      const receivedToken = data.data.tokens.accessToken;

      setUser(receivedUser);
      setToken(receivedToken);
      setAuthToken(receivedToken);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem('travelhub_user');
    localStorage.removeItem('travelhub_access_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
