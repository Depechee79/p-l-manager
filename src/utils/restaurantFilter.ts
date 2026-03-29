import type { BaseEntity } from '../types';

interface WithRestaurantId {
  restaurantId?: string | number;
}

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
    const entityRestaurantId = 'restaurantId' in entity
      ? (entity as WithRestaurantId).restaurantId
      : undefined;
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

const CURRENT_RESTAURANT_ID_KEY = 'current_restaurant_id';

/**
 * Get restaurant ID from current restaurant context
 * Returns null if not available (for backward compatibility)
 */
export function getCurrentRestaurantId(): string | null {
  try {
    const savedRestaurantId = sessionStorage.getItem(CURRENT_RESTAURANT_ID_KEY);
    return savedRestaurantId || null;
  } catch {
    // sessionStorage can throw in private/incognito mode — returning null is intentional
    return null;
  }
}

