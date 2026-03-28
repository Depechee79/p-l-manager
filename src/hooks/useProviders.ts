import { useState, useEffect, useCallback } from 'react';
import { DatabaseService } from '@core';
import { logger } from '@core/services/LoggerService';
import { ProviderService, ProviderData } from '@/features/providers/services/ProviderService';
import type { Provider } from '../types';

/**
 * Hook to manage providers
 */
export const useProviders = (db: DatabaseService) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerService = new ProviderService(db);

  // Load providers - wait for Firebase sync
  useEffect(() => {
    const loadProviders = async () => {
      // Wait for Firebase sync to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      const loadedProviders = providerService.getAll();
      // Only show providers that are actually synced from Firebase
      const firebaseProviders = loadedProviders.filter(p => {
        // Only include providers that have been synced from Firebase
        // Exclude any test/example data
        return p._synced === true || (p.id && typeof p.id === 'string' && p.id.length > 10);
      });
      setProviders(firebaseProviders);
      setFilteredProviders(firebaseProviders);
    };
    loadProviders();
  }, [db]);

  // Refresh providers list
  const refreshProviders = useCallback(() => {
    const loadedProviders = providerService.getAll();
    setProviders(loadedProviders);
    setFilteredProviders(loadedProviders);
  }, [providerService]);

  // Create provider
  const createProvider = useCallback(
    async (data: ProviderData) => {
      setLoading(true);
      setError(null);

      try {
        const result = await providerService.save(data);
        if (result.success) {
          refreshProviders();
        } else {
          setError(result.error || 'Failed to create provider');
        }
      } catch (error: unknown) {
        logger.error('Error creating provider', error);
        setError('An error occurred while creating provider');
      } finally {
        setLoading(false);
      }
    },
    [providerService, refreshProviders]
  );

  // Update provider
  const updateProvider = useCallback(
    async (id: number | string, data: ProviderData) => {
      setLoading(true);
      setError(null);

      try {
        const result = await providerService.save(data, id);
        if (result.success) {
          refreshProviders();
        } else {
          setError(result.error || 'Failed to update provider');
        }
      } catch (error: unknown) {
        logger.error('Error updating provider', error);
        setError('An error occurred while updating provider');
      } finally {
        setLoading(false);
      }
    },
    [providerService, refreshProviders]
  );

  // Delete provider
  const deleteProvider = useCallback(
    async (id: number | string) => {
      setLoading(true);
      setError(null);

      try {
        providerService.delete(id);
        refreshProviders();
      } catch (error: unknown) {
        logger.error('Error deleting provider', error);
        setError('An error occurred while deleting provider');
      } finally {
        setLoading(false);
      }
    },
    [providerService, refreshProviders]
  );

  // Search providers
  const searchProviders = useCallback(
    (query: string) => {
      const results = providerService.search(query);
      setFilteredProviders(results);
    },
    [providerService]
  );

  // Get statistics
  const stats = providerService.getStats();

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    providers,
    filteredProviders,
    loading,
    error,
    createProvider,
    updateProvider,
    deleteProvider,
    searchProviders,
    refreshProviders,
    stats,
    setError,
    clearError,
  };
};
