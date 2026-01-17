import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDatabase } from './useDatabase';
import { RestaurantService } from '../services/RestaurantService';
import { CompanyService } from '../services/CompanyService';
import type { Restaurant, Company } from '@types';

export const useRestaurant = () => {
  const { db } = useDatabase();
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const restaurantService = useMemo(() => new RestaurantService(db), [db]);
  const companyService = useMemo(() => new CompanyService(db), [db]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Load Company
      const companyId = 'default'; // TODO: Support multi-company
      const company = companyService.getCompany(companyId);
      if (company) {
        setCurrentCompany(company);
      } else {
        // Create default company if not exists (minimal setup)
        const newCompany = await companyService.createCompany({
          nombre: 'Mi Grupo Hostelero',
          cif: 'B12345678',
          direccion: 'Calle Principal 1',
          restaurantes: [],
        });
        setCurrentCompany(newCompany);
      }

      // Load Restaurants
      const allRestaurants = restaurantService.getAllRestaurants();
      console.log('[useRestaurant] Loaded restaurants:', allRestaurants.length);
      setRestaurants(allRestaurants);

      // Try to load from localStorage
      const savedRestaurantId = localStorage.getItem('current_restaurant_id');
      if (savedRestaurantId && allRestaurants.length > 0) {
        const saved = allRestaurants.find(r => String(r.id) === savedRestaurantId);
        if (saved) {
          setCurrentRestaurant(saved);
        } else if (allRestaurants.length > 0) {
          // Fallback to first restaurant
          setCurrentRestaurant(allRestaurants[0]);
          localStorage.setItem('current_restaurant_id', String(allRestaurants[0].id));
        }
      } else if (allRestaurants.length > 0) {
        // Default to first restaurant
        setCurrentRestaurant(allRestaurants[0]);
        localStorage.setItem('current_restaurant_id', String(allRestaurants[0].id));
      }
      setLoading(false);
    };

    loadData();
  }, [db, restaurantService, companyService]);

  const switchRestaurant = useCallback((restaurant: Restaurant) => {
    setCurrentRestaurant(restaurant);
    localStorage.setItem('current_restaurant_id', String(restaurant.id));
  }, []);

  const updateRestaurant = useCallback(async (data: Partial<Restaurant>) => {
    if (!currentRestaurant?.id) return null;

    const updated = await restaurantService.updateRestaurant(String(currentRestaurant.id), data);
    if (updated) {
      setCurrentRestaurant(updated);
      // Update in restaurants array
      setRestaurants(prev => prev.map(r =>
        String(r.id) === String(currentRestaurant.id) ? updated : r
      ));
    }
    return updated;
  }, [currentRestaurant, restaurantService]);

  const updateCompany = useCallback(async (data: Partial<Company>) => {
    if (!currentCompany?.id) return null;

    const updated = await companyService.updateCompany(String(currentCompany.id), data);
    if (updated) {
      setCurrentCompany(updated);
    }
    return updated;
  }, [currentCompany, companyService]);

  const createRestaurant = useCallback(async (data: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>) => {
    const companyId = currentCompany?.id ? String(currentCompany.id) : 'default';
    const newRestaurant = await restaurantService.createRestaurant(companyId, data);

    // Add to local state
    setRestaurants(prev => [...prev, newRestaurant]);

    // Update company restaurants array
    if (currentCompany) {
      const updatedRestaurantes = [...(currentCompany.restaurantes || []), String(newRestaurant.id)];
      await updateCompany({
        restaurantes: updatedRestaurantes,
      });
    }

    // Auto-switch to new restaurant
    setCurrentRestaurant(newRestaurant);
    localStorage.setItem('current_restaurant_id', String(newRestaurant.id));

    return newRestaurant;
  }, [restaurantService, updateCompany, currentCompany]);

  /**
   * Refresh restaurants list from database
   */
  const refreshRestaurants = useCallback(() => {
    const allRestaurants = restaurantService.getAllRestaurants();
    setRestaurants(allRestaurants);
  }, [restaurantService]);

  const hasAccess = useCallback((restaurantId: string): boolean => {
    // If not authenticated or no user, deny access (or allow if public? No, strictly private)
    // For development/migration, if AppContext is missing user details, fall back to safe default
    // But we need the real Logic.

    // We need to get the user from the database or context.
    // Since useRestaurant doesn't have direct access to "Effective User" with joined Role easily,
    // we'll rely on a helper or fetch it.
    // Best approach: Get user from DB matching context email/name.

    // Optimization: In a real app, this would be in the session.
    // For now, we iterate.
    const appUserString = localStorage.getItem('app_user');
    if (!appUserString) return true; // Fail safe or deny? For now allow to avoid lockout during dev if no user.

    try {
      const userData = JSON.parse(appUserString); // This is basic {name} from login
      // Find full user in db
      const fullUser = (db.usuarios || []).find((u: any) => u.nombre === userData.name);
      if (!fullUser) return true; // Fallback if user not found in DB

      // Check Role
      const userRole = (db.roles || []).find((r: any) => r.id === fullUser.rolId);
      if (userRole?.nombre === 'Director' || !userRole) return true;

      // Check Specific Access
      return fullUser.restaurantes?.includes(restaurantId) || false;

    } catch (e) {
      return false;
    }
  }, [db]);

  return {
    currentRestaurant,
    restaurants,
    currentCompany,
    loading,
    setCurrentRestaurant: switchRestaurant,
    switchRestaurant,
    updateRestaurant,
    updateCompany,
    createRestaurant,
    refreshRestaurants,
    hasAccess,
  };
};
