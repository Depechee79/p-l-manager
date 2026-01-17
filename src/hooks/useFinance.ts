import { useState, useEffect, useCallback, useMemo } from 'react';
import { DatabaseService } from '@core';
import { FinanceService, ClosingData } from '../services/FinanceService';
import type { Cierre, CashBreakdown } from '../types';
import { filterByRestaurant, getCurrentRestaurantId } from '../utils/restaurantFilter';

/**
 * Hook to manage cash register closings
 */
export const useFinance = (db: DatabaseService) => {
  const [closings, setClosings] = useState<Cierre[]>([]);
  const [filteredClosings, setFilteredClosings] = useState<Cierre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const financeService = new FinanceService(db);

  // Load closings - wait for Firebase sync
  useEffect(() => {
    const loadClosings = async () => {
      // AUDIT-FIX: Ensure data is loaded (R-14)
      await db.ensureLoaded('cierres');

      const loadedClosings = (db.cierres as Cierre[]) || [];
      // Only show closings that are actually synced from Firebase
      const firebaseClosings = loadedClosings.filter(c => {
        return c._synced === true || (c.id && typeof c.id === 'string' && c.id.length > 10);
      });
      // Filter by current restaurant
      const restaurantId = getCurrentRestaurantId();
      const filtered = filterByRestaurant(firebaseClosings, restaurantId);
      setClosings(filtered);
      setFilteredClosings(filtered);
    };
    loadClosings();
  }, [db]);

  // Apply period filter
  useEffect(() => {
    if (startDate && endDate) {
      const filtered = closings.filter(
        (c) => c.fecha >= startDate && c.fecha <= endDate
      );
      setFilteredClosings(filtered);
    } else {
      setFilteredClosings(closings);
    }
  }, [closings, startDate, endDate]);

  // Refresh closings list
  const refreshClosings = useCallback(() => {
    const loadedClosings = db.cierres as Cierre[];
    const restaurantId = getCurrentRestaurantId();
    const filtered = filterByRestaurant(loadedClosings, restaurantId);
    setClosings(filtered);
    setFilteredClosings(filtered);
  }, [db]);

  // Calculate cash total from breakdown
  const calculateCashTotal = useCallback(
    (breakdown: CashBreakdown) => {
      return financeService.calculateCashTotal(breakdown);
    },
    [financeService]
  );

  // Create closing
  const createClosing = useCallback(
    async (data: ClosingData) => {
      setLoading(true);
      setError(null);

      try {
        const result = await financeService.saveClosing(data);
        if (result.success) {
          refreshClosings();
        } else {
          setError(result.error || 'Failed to create closing');
        }
      } catch (err) {
        setError('An error occurred while creating closing');
      } finally {
        setLoading(false);
      }
    },
    [financeService, refreshClosings]
  );

  // Update closing
  const updateClosing = useCallback(
    async (id: number, data: ClosingData) => {
      setLoading(true);
      setError(null);

      try {
        const result = await financeService.saveClosing(data, id);
        if (result.success) {
          refreshClosings();
        } else {
          setError(result.error || 'Failed to update closing');
        }
      } catch (err) {
        setError('An error occurred while updating closing');
      } finally {
        setLoading(false);
      }
    },
    [financeService, refreshClosings]
  );

  // Delete closing
  const deleteClosing = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);

      try {
        financeService.deleteClosing(id);
        refreshClosings();
      } catch (err) {
        setError('An error occurred while deleting closing');
      } finally {
        setLoading(false);
      }
    },
    [financeService, refreshClosings]
  );

  // Filter by period
  const filterByPeriod = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  // Clear period filter
  const clearPeriodFilter = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
  }, []);

  // Calculate total cash from filtered closings
  const totalCash = useMemo(() => {
    return filteredClosings.reduce((sum, closing) => sum + (closing.totalReal || 0), 0);
  }, [filteredClosings]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    closings,
    filteredClosings,
    loading,
    error,
    totalCash,
    calculateCashTotal,
    createClosing,
    updateClosing,
    deleteClosing,
    filterByPeriod,
    clearPeriodFilter,
    refreshClosings,
    setError,
    clearError,
  };
};
