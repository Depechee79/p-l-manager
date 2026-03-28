import { useState, useEffect, useCallback, useMemo } from 'react';
import { DatabaseService } from '@core';
import { logger } from '@core/services/LoggerService';
import type { Invoice } from '../types';
import { filterByRestaurant, getCurrentRestaurantId } from '../utils/restaurantFilter';

/**
 * Hook to manage invoices
 */
export const useInvoices = (db: DatabaseService) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<number | string | null>(
    null
  );
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Load invoices - wait for Firebase sync
  useEffect(() => {
    const loadInvoices = async () => {
      // AUDIT-FIX: Ensure data is loaded (R-14)
      await Promise.all([
        db.ensureLoaded('facturas'),
        db.ensureLoaded('proveedores')
      ]);

      const loadedInvoices = (db.facturas as Invoice[]) || [];
      // Only show invoices that are actually synced from Firebase
      const firebaseInvoices = loadedInvoices.filter(inv => {
        return inv._synced === true || (inv.id && typeof inv.id === 'string' && inv.id.length > 10);
      });
      // Filter by current restaurant
      const restaurantId = getCurrentRestaurantId();
      const filtered = filterByRestaurant(firebaseInvoices, restaurantId);
      setInvoices(filtered);
      setFilteredInvoices(filtered);
    };
    loadInvoices();
  }, [db]);

  // Apply filters whenever invoices or filters change
  useEffect(() => {
    let filtered = [...invoices];

    // Filter by provider
    if (selectedProviderId !== null) {
      filtered = filtered.filter((inv) => inv.proveedorId === selectedProviderId);
    }

    // Filter by period
    if (startDate && endDate) {
      filtered = filtered.filter(
        (inv) => inv.fecha >= startDate && inv.fecha <= endDate
      );
    }

    setFilteredInvoices(filtered);
  }, [invoices, selectedProviderId, startDate, endDate]);

  // Refresh invoices list
  const refreshInvoices = useCallback(() => {
    const loadedInvoices = db.facturas as Invoice[];
    const restaurantId = getCurrentRestaurantId();
    const filtered = filterByRestaurant(loadedInvoices, restaurantId);
    setInvoices(filtered);
    setFilteredInvoices(filtered);
  }, [db]);

  // Create invoice
  const createInvoice = useCallback(
    async (data: Omit<Invoice, 'id'>) => {
      setLoading(true);
      setError(null);

      try {
        db.add<Invoice>('facturas', data);
        refreshInvoices();
      } catch (error: unknown) {
        logger.error('Error creating invoice', error);
        setError('An error occurred while creating invoice');
      } finally {
        setLoading(false);
      }
    },
    [db, refreshInvoices]
  );

  // Update invoice
  const updateInvoice = useCallback(
    async (id: number | string, data: Omit<Invoice, 'id'>) => {
      setLoading(true);
      setError(null);

      try {
        db.update<Invoice>('facturas', id, data);
        refreshInvoices();
      } catch (error: unknown) {
        logger.error('Error updating invoice', error);
        setError('An error occurred while updating invoice');
      } finally {
        setLoading(false);
      }
    },
    [db, refreshInvoices]
  );

  // Delete invoice
  const deleteInvoice = useCallback(
    async (id: number | string) => {
      setLoading(true);
      setError(null);

      try {
        db.delete('facturas', id);
        refreshInvoices();
      } catch (error: unknown) {
        logger.error('Error deleting invoice', error);
        setError('An error occurred while deleting invoice');
      } finally {
        setLoading(false);
      }
    },
    [db, refreshInvoices]
  );

  // Filter by provider
  const filterByProvider = useCallback((providerId: number | string | null) => {
    setSelectedProviderId(providerId);
  }, []);

  // Filter by period
  const filterByPeriod = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  }, [filteredInvoices]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    invoices,
    filteredInvoices,
    loading,
    error,
    selectedProviderId,
    totalAmount,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    filterByProvider,
    filterByPeriod,
    refreshInvoices,
    setError,
    clearError,
  };
};
