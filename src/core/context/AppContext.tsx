import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { onAuthStateChange, logoutUser } from '../services/AuthService';
import { isFirebaseConfigured } from '../../config/firebase.config';
import { logger } from '../services/LoggerService';
import type { Role, RoleId } from '@types';

export interface User {
  /** Firebase Auth UID — stable identifier */
  uid: string;
  /** Display name (alias for AppUser.nombre) */
  name: string;
  /** Email address */
  email: string;
  /** Role identifier (alias for AppUser.rolId) */
  roleId: RoleId | string | number;
  /** Restaurant IDs the user has access to */
  restaurantIds: string[];
  /** Company ID (for director_operaciones) */
  companyId?: string;
  /** Resolved role object (populated by useUserPermissions) */
  role?: Role;
}


interface AppContextValue {
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to Firebase Auth state changes
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      logger.warn('Firebase not configured — auth disabled');
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChange((appUser) => {
      try {
        if (appUser) {
          if (!appUser.restaurantIds || appUser.restaurantIds.length === 0) {
            logger.warn('User has no restaurantIds assigned', {
              uid: appUser.uid || appUser.id,
            });
          }
          const mappedUser: User = {
            uid: appUser.uid || appUser.id as string,
            name: appUser.nombre,
            email: appUser.email || '',
            roleId: appUser.rolId,
            restaurantIds: appUser.restaurantIds || [],
            companyId: appUser.companyId,
          };
          setUser(mappedUser);
        } else {
          setUser(null);
        }
      } catch (error: unknown) {
        logger.error('Error processing auth state change', error);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (error: unknown) {
      logger.error('Logout failed', error);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AppContextValue = {
    user,
    isAuthenticated: user !== null,
    authLoading,
    error,
    setError,
    clearError,
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
