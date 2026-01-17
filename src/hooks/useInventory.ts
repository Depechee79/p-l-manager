import { useState, useEffect, useCallback } from 'react';
import { DatabaseService } from '@core';
import { InventoryService } from '@/features/inventarios/services/InventoryService';
import type { Product, InventoryItem } from '../types';
import { filterByRestaurant, getCurrentRestaurantId } from '../utils/restaurantFilter';

/**
 * Hook to manage inventory
 */
export const useInventory = (db: DatabaseService) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryItem[]>([]);
  const [isCountingInventory, setIsCountingInventory] = useState(false);
  const [inventory, setInventory] = useState<InventoryService | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Load products and inventory history - wait for Firebase sync
  useEffect(() => {
    const loadData = async () => {
      // Wait for Firebase sync to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      const loadedProducts = (db.productos as Product[]) || [];
      // Only show products that are actually synced from Firebase
      const firebaseProducts = loadedProducts.filter(p => {
        return p._synced === true || (p.id && typeof p.id === 'string' && p.id.length > 10);
      });
      // Filter by current restaurant (products can be shared, but we filter for consistency)
      const restaurantId = getCurrentRestaurantId();
      const filteredProducts = filterByRestaurant(firebaseProducts, restaurantId);
      setProducts(filteredProducts);
      setFilteredProducts(filteredProducts);

      const loadedInventories = (db.inventarios as InventoryItem[]) || [];
      // Only show inventories that are actually synced from Firebase
      const firebaseInventories = loadedInventories.filter(inv => {
        return inv._synced === true || (inv.id && typeof inv.id === 'string' && inv.id.length > 10);
      });
      // Filter inventories by current restaurant
      const filteredInventories = filterByRestaurant(firebaseInventories, restaurantId);
      setInventoryHistory(filteredInventories);
    };
    loadData();
  }, [db]);

  // Get unique categories
  const categories = Array.from(new Set(products.map((p) => p.categoria)));

  // Filter products by category
  const filterByCategory = useCallback(
    (category: string) => {
      setSelectedCategory(category);
      if (category === 'Todos') {
        setFilteredProducts(products);
      } else {
        setFilteredProducts(products.filter((p) => p.categoria === category));
      }
    },
    [products]
  );

  // Start new inventory count
  const startInventory = useCallback(() => {
    const inventoryService = new InventoryService(db);
    setInventory(inventoryService);
    setIsCountingInventory(true);
    setError(null);
  }, [db]);

  // Record product count
  const recordCount = useCallback(
    (productId: string | number, quantity: number) => {
      if (!inventory) {
        setError('No active inventory');
        return;
      }

      try {
        inventory.setProductCount(productId, quantity);
      } catch (err) {
        setError('Error recording count');
      }
    },
    [inventory]
  );

  // Complete inventory
  const completeInventory = useCallback(async () => {
    if (!inventory) {
      setError('No active inventory');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await inventory.saveInventory(today);

      if (!result.success) {
        setError(result.error || 'Error saving inventory');
        return;
      }

      setInventory(null);
      setIsCountingInventory(false);

      // Refresh inventory history
      const loadedInventories = db.inventarios as InventoryItem[];
      setInventoryHistory(loadedInventories);
    } catch (err) {
      setError('Error saving inventory');
    }
  }, [inventory, db]);

  // Cancel inventory
  const cancelInventory = useCallback(() => {
    setInventory(null);
    setIsCountingInventory(false);
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    products,
    filteredProducts,
    inventoryHistory,
    categories,
    selectedCategory,
    isCountingInventory,
    inventory,
    error,
    startInventory,
    recordCount,
    completeInventory,
    cancelInventory,
    filterByCategory,
    setError,
    clearError,
  };
};
