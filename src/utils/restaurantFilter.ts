import type { BaseEntity } from '../types';

/**
 * Filter entities by restaurant ID
 * If restaurantId is not provided, returns all entities (backward compatibility)
 * If an entity doesn't have restaurantId, it's included (backward compatibility)
 */
export function filterByRestaurant<T extends BaseEntity>(
  entities: T[],
  restaurantId?: string | null
): T[] {
  if (!restaurantId) {
    // No restaurant filter - return all (backward compatibility)
    return entities;
  }

  return entities.filter(entity => {
    // Include if no restaurantId (backward compatibility) or if it matches
    const entityRestaurantId = (entity as any).restaurantId;
    return !entityRestaurantId || String(entityRestaurantId) === String(restaurantId);
  });
}

/**
 * Add restaurantId to an entity if not present
 */
export function addRestaurantId<T extends BaseEntity>(
  entity: T,
  restaurantId?: string | null
): T {
  if (!restaurantId) {
    return entity;
  }

  return {
    ...entity,
    restaurantId: String(restaurantId),
  } as T;
}

/**
 * Get restaurant ID from current restaurant context
 * Returns null if not available (for backward compatibility)
 */
export function getCurrentRestaurantId(): string | null {
  try {
    const savedRestaurantId = localStorage.getItem('current_restaurant_id');
    return savedRestaurantId || null;
  } catch {
    return null;
  }
}

