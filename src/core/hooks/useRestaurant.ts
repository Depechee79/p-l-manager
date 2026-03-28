import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useDatabase } from './useDatabase';
import { RestaurantService } from '../services/RestaurantService';
import { CompanyService } from '../services/CompanyService';
import { logger } from '../services/LoggerService';
import type { Restaurant, Company, AppUser, Role } from '@types';

export const useRestaurant = () => {
  const { db } = useDatabase();
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  // Use useRef to ensure services are created only once per db instance
  const restaurantService = useMemo(() => new RestaurantService(db), [db]);
  const companyService = useMemo(() => new CompanyService(db), [db]);

  // Track if we've already initialized to prevent duplicate calls from StrictMode
  const hasInitialized = useRef(false);

  // Load data on mount - use ref to prevent double-loading in StrictMode
  useEffect(() => {
    // Prevent duplicate initialization (React StrictMode double-mounts in dev)
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const deleteRestaurant = useCallback(async (id: string) => {
    const success = await restaurantService.deleteRestaurant(id);
    if (success) {
      setRestaurants(prev => prev.filter(r => String(r.id) !== id));
      if (String(currentRestaurant?.id) === id) {
        setCurrentRestaurant(null);
        localStorage.removeItem('current_restaurant_id');
      }
    }
    return success;
  }, [restaurantService, currentRestaurant]);

  /**
   * Refresh restaurants list from database
   */
  const refreshRestaurants = useCallback(() => {
    const allRestaurants = restaurantService.getAllRestaurants();
    setRestaurants(allRestaurants);
  }, [restaurantService]);

  const hasAccess = useCallback((restaurantId: string): boolean => {
    const appUserString = localStorage.getItem('app_user');
    if (!appUserString) return false;

    try {
      const userData: { name?: string } = JSON.parse(appUserString);
      if (!userData.name) return false;

      const usuarios = (db.usuarios ?? []) as AppUser[];
      const fullUser = usuarios.find((u) => u.nombre === userData.name);
      if (!fullUser) return false;

      const roles = (db.roles ?? []) as Role[];
      const userRole = roles.find((r) => String(r.id) === String(fullUser.rolId));

      if (userRole?.nombre === 'Director' || userRole?.nombre === 'director_operaciones' || userRole?.nombre === 'director_restaurante') {
        return true;
      }

      const userRestaurants: string[] = fullUser.restaurantIds ?? fullUser.restaurantes ?? [];
      return userRestaurants.includes(restaurantId);
    } catch (error: unknown) {
      logger.error('Error checking restaurant access', error);
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
    deleteRestaurant,
    refreshRestaurants,
    hasAccess,
  };
};
