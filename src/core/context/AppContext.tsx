import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { logger } from '../services/LoggerService';
import type { Role } from '@types';

export interface User {
  name: string;
  roleId?: string | number;
  role?: Role;
}


interface AppContextValue {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  login: (userName: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('app_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error: unknown) {
        logger.error('Failed to parse stored user data', error);
        localStorage.removeItem('app_user');
      }
    }
  }, []);

  const login = (userName: string) => {
    const newUser: User = { name: userName };
    setUser(newUser);
    localStorage.setItem('app_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('app_user');
  };

  const clearError = () => {
    setError(null);
  };

  const value: AppContextValue = {
    user,
    isAuthenticated: user !== null,
    error,
    setError,
    clearError,
    login,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
