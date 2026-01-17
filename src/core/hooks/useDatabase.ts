import { useDatabaseContext } from '../context/DatabaseContext';

/**
 * Hook to access the database service
 * Provides a singleton instance of DatabaseService via DatabaseProvider
 */
export const useDatabase = () => {
  const { db } = useDatabaseContext();
  return { db };
};
