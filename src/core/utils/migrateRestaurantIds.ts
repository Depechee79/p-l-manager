import { logger } from '@core/services/LoggerService';
import type { DatabaseService } from '@core/services/DatabaseService';
import type { BaseEntity, CollectionName } from '@types';

/**
 * Collections that require restaurantId for Firestore rules enforcement.
 * Must stay in sync with firestore.rules canAccessDocument() checks.
 */
const COLLECTIONS_REQUIRING_RESTAURANT_ID: CollectionName[] = [
  'cierres',
  'facturas',
  'albaranes',
  'inventarios',
  'delivery',
  'mermas',
  'orders',
  'transfers',
  'gastosFijos',
  'pnl_adjustments',
  'workers',
  'fichajes',
  'absences',
  'vacation_requests',
  'nominas',
  'productos',
  'proveedores',
  'escandallos',
];

interface MigrationResult {
  migrated: number;
  skipped: number;
  failed: number;
}

/**
 * Backfills restaurantId on all documents that are missing it.
 *
 * This ensures Firestore rules with canAccessDocument() work correctly
 * for legacy data created before multi-restaurant support.
 *
 * Safe to run multiple times (idempotent):
 * - Documents that already have restaurantId are skipped.
 * - Only updates documents belonging to the current user's restaurant.
 */
export async function migrateRestaurantIds(
  db: DatabaseService,
  restaurantId: string
): Promise<MigrationResult> {
  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const collectionName of COLLECTIONS_REQUIRING_RESTAURANT_ID) {
    try {
      await db.ensureLoaded(collectionName);
    } catch (error: unknown) {
      logger.warn(`migrateRestaurantIds: could not load ${collectionName}`, error);
      continue;
    }

    const items = db[collectionName] as BaseEntity[];

    for (const item of items) {
      const record = item as unknown as Record<string, unknown>;

      if (record['restaurantId']) {
        totalSkipped++;
        continue;
      }

      try {
        await db.update(collectionName, item.id, { restaurantId } as Partial<BaseEntity>);
        totalMigrated++;
      } catch (error: unknown) {
        logger.warn(
          `migrateRestaurantIds: failed to update ${collectionName}/${String(item.id)}`,
          error
        );
        totalFailed++;
      }
    }
  }

  if (totalMigrated > 0) {
    logger.info('migrateRestaurantIds complete', {
      migrated: totalMigrated,
      skipped: totalSkipped,
      failed: totalFailed,
    });
  }

  return { migrated: totalMigrated, skipped: totalSkipped, failed: totalFailed };
}
