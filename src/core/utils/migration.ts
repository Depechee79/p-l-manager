import { DatabaseService } from '@core/services/DatabaseService';
import { CompanyService } from '@core/services/CompanyService';
import { RestaurantService } from '@core/services/RestaurantService';
import { logger } from '@core/services/LoggerService';
import type { Company, Restaurant, BaseEntity, CollectionName } from '@types';
import { toRecord } from '@shared/utils';
import { migrateFichajesWorkerIds } from './migrateFichajesWorkerIds';
import { migrateRestaurantIds } from './migrateRestaurantIds';

/**
 * Migration script to convert existing single-restaurant data to multi-restaurant structure
 *
 * This migration:
 * 1. Creates a default company
 * 2. Creates a default restaurant linked to the company
 * 3. Adds restaurantId to all existing data entities
 * 4. Assigns existing users to the default company and restaurant
 */

export class DataMigration {
  private db: DatabaseService;
  private companyService: CompanyService;
  private restaurantService: RestaurantService;

  constructor(db: DatabaseService) {
    this.db = db;
    this.companyService = new CompanyService(db);
    this.restaurantService = new RestaurantService(db);
  }

  /**
   * Check if migration has already been run
   */
  async isMigrated(): Promise<boolean> {
    const companies = this.companyService.getCompanies();
    return companies.length > 0;
  }

  /**
   * Run the migration
   */
  async migrate(): Promise<{ success: boolean; companyId?: string; restaurantId?: string; error?: string }> {
    try {
      // Check if already migrated
      if (await this.isMigrated()) {
        return {
          success: true,
          error: 'Migration already completed',
        };
      }

      // Step 1: Create default company
      const defaultCompany: Omit<Company, 'id' | 'createdAt' | 'updatedAt'> = {
        nombre: 'Mi Empresa',
        cif: '',
        direccion: '',
        telefono: '',
        email: '',
        restaurantes: [],
      };

      const company = await this.companyService.createCompany(defaultCompany);
      const companyId = String(company.id);

      // Step 2: Create default restaurant
      const defaultRestaurantData: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt' | 'companyId'> = {
        nombre: 'Restaurante Principal',
        direccion: '',
        telefono: '',
        email: '',
        codigo: 'REST-001',
        activo: true,
        configuracion: {
          zonaHoraria: 'Europe/Madrid',
          moneda: 'EUR',
          ivaRestaurante: 10,
          ivaTakeaway: 21,
        },
        trabajadores: [],
      };

      const restaurant = await this.restaurantService.createRestaurant(companyId, defaultRestaurantData);
      const restaurantId = String(restaurant.id);

      // Step 3: Update company with restaurant reference
      await this.companyService.updateCompany(companyId, {
        restaurantes: [restaurantId],
      });

      // Step 4: Add restaurantId to all existing data entities
      await this.migrateEntities(restaurantId);

      // Step 5: Set default restaurant in sessionStorage (tab-scoped)
      try { sessionStorage.setItem('current_restaurant_id', restaurantId); } catch { /* private mode */ }

      return {
        success: true,
        companyId,
        restaurantId,
      };
    } catch (error: unknown) {
      logger.error('Migration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add restaurantId to all existing entities
   */
  private async migrateEntities(restaurantId: string): Promise<void> {
    const collections: CollectionName[] = [
      'cierres',
      'facturas',
      'albaranes',
      'productos',
      'escandallos',
      'inventarios',
      'delivery',
      'mermas',
      'orders',
    ];

    for (const collectionName of collections) {
      const collection = this.db[collectionName] as BaseEntity[];

      for (const entity of collection) {
        const record = toRecord(entity);
        // Only add restaurantId if it doesn't already have one
        if (!record['restaurantId']) {
          record['restaurantId'] = restaurantId;
          // Update in database
          try {
            await this.db.update(collectionName, entity.id, { restaurantId } as Partial<BaseEntity>);
          } catch (err: unknown) {
            // If update fails, try to add directly
            logger.warn(`Failed to update ${collectionName} entity ${entity.id}:`, err);
          }
        }
      }
    }

    // Migrate users
    const usuarios = this.db.usuarios;
    for (const user of usuarios) {
      const userRecord = toRecord(user);
      if (!userRecord['companyId']) {
        // Get company ID from restaurants
        const restaurants = this.restaurantService.getAllRestaurants();
        if (restaurants.length > 0) {
          const companyId = restaurants[0].companyId;
          userRecord['companyId'] = companyId;
          userRecord['restaurantes'] = [String(restaurants[0].id)];
          try {
            await this.db.update('usuarios', user.id, {
              companyId,
              restaurantes: [String(restaurants[0].id)],
            } as Partial<BaseEntity>);
          } catch (err: unknown) {
            logger.warn(`Failed to update user ${user.id}:`, err);
          }
        }
      }
    }
  }

  /**
   * Rollback migration (for testing purposes)
   */
  async rollback(): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove restaurantId from all entities
      const collections: CollectionName[] = [
        'cierres',
        'facturas',
        'albaranes',
        'productos',
        'escandallos',
        'inventarios',
        'delivery',
        'mermas',
        'orders',
      ];

      for (const collectionName of collections) {
        const collection = this.db[collectionName] as BaseEntity[];

        for (const entity of collection) {
          const record = toRecord(entity);
          if (record['restaurantId']) {
            delete record['restaurantId'];
            try {
              const { ...entityWithoutRestaurantId } = record;
              delete entityWithoutRestaurantId['restaurantId'];
              await this.db.update(collectionName, entity.id, entityWithoutRestaurantId as Partial<BaseEntity>);
            } catch (err: unknown) {
              logger.warn(`Failed to rollback ${collectionName} entity ${entity.id}:`, err);
            }
          }
        }
      }

      // Delete (deactivate) restaurants
      const restaurants = this.restaurantService.getAllRestaurants();
      for (const restaurant of restaurants) {
        await this.restaurantService.deleteRestaurant(String(restaurant.id));
      }

      try { sessionStorage.removeItem('current_restaurant_id'); } catch { /* private mode */ }

      return { success: true };
    } catch (error: unknown) {
      logger.error('Rollback error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Run migration on app startup if needed
 */
export async function runMigrationIfNeeded(db: DatabaseService): Promise<void> {
  const migration = new DataMigration(db);

  if (!(await migration.isMigrated())) {
    logger.info('Running data migration...');
    const result = await migration.migrate();

    if (result.success) {
      logger.info('Migration completed successfully', {
        companyId: result.companyId,
        restaurantId: result.restaurantId,
      });
    } else {
      logger.error('Migration failed:', result.error);
    }
  } else {
    logger.info('Data already migrated');
  }

  // Always run idempotent fichajes workerId migration (name → uid)
  try {
    await db.ensureLoaded('fichajes');
    await db.ensureLoaded('usuarios');
    const fichajesResult = await migrateFichajesWorkerIds(db);
    if (fichajesResult.migrated > 0) {
      logger.info('Fichajes workerId migration applied', fichajesResult);
    }
  } catch (error: unknown) {
    logger.error('Fichajes workerId migration error:', error);
  }

  // Always run idempotent restaurantId backfill migration
  // Ensures all documents have restaurantId so Firestore rules with canAccessDocument() work
  try {
    let restaurantId: string | null = null;
    try {
      restaurantId = sessionStorage.getItem('current_restaurant_id');
    } catch {
      // sessionStorage can throw in private/incognito mode
    }
    if (restaurantId) {
      const restaurantIdResult = await migrateRestaurantIds(db, restaurantId);
      if (restaurantIdResult.migrated > 0) {
        logger.info('RestaurantId backfill migration applied', restaurantIdResult);
      }
    }
  } catch (error: unknown) {
    logger.error('RestaurantId backfill migration error:', error);
  }
}
