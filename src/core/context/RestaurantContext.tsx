import React, { createContext, useContext, ReactNode } from 'react';
import { useRestaurant } from '@core/hooks/useRestaurant';
import type { Restaurant } from '@types';

interface RestaurantContextType {
  currentRestaurant: Restaurant | null;
  restaurants: Restaurant[];
  setCurrentRestaurant: (restaurant: Restaurant) => void;
  switchRestaurant: (restaurant: Restaurant) => void;
  createRestaurant: (data: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>) => Promise<Restaurant>;
  refreshRestaurants: () => void;
  hasAccess: (restaurantId: string) => boolean;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

interface RestaurantProviderProps {
  children: ReactNode;
}

export const RestaurantProvider: React.FC<RestaurantProviderProps> = ({ children }) => {
  const restaurantData = useRestaurant();

  return (
    <RestaurantContext.Provider value={restaurantData}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurantContext = (): RestaurantContextType => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurantContext must be used within a RestaurantProvider');
  }
  return context;
};

/**
 * Safe version that returns null when used outside RestaurantProvider.
 * Use this in components that may render with or without the provider.
 */
export const useOptionalRestaurantContext = (): RestaurantContextType | null => {
  return useContext(RestaurantContext) ?? null;
};

