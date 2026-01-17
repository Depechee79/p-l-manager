// @ts-nocheck
import { DatabaseService } from '@core/services/DatabaseService';
import { CompanyService } from '@core/services/CompanyService';
import { RestaurantService } from '@core/services/RestaurantService';
import type { Company, Restaurant } from '@types';

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
    const companies = await this.companyService.getCompanies();
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
      const companyId = company.id;

      // Step 2: Create default restaurant
      const defaultRestaurant: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'> = {
        companyId: String(companyId),
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

      const restaurant = await this.restaurantService.createRestaurant(defaultRestaurant);
      const restaurantId = restaurant.id;

      // Step 3: Update company with restaurant reference
      await this.companyService.updateCompany(String(companyId), {
        restaurantes: [String(restaurantId)],
      });

      // Step 4: Add restaurantId to all existing data entities
      await this.migrateEntities(String(restaurantId));

      // Step 5: Set default restaurant in localStorage
      localStorage.setItem('current_restaurant_id', String(restaurantId));

      return {
        success: true,
        companyId: String(companyId),
        restaurantId: String(restaurantId),
      };
    } catch (error) {
      console.error('Migration error:', error);
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
    const collections: Array<keyof DatabaseService> = [
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
      const collection = this.db[collectionName] as any[];

      for (const entity of collection) {
        // Only add restaurantId if it doesn't already have one
        if (!entity.restaurantId) {
          entity.restaurantId = restaurantId;
          // Update in database
          try {
            await this.db.update(collectionName as any, entity.id, { restaurantId });
          } catch (err) {
            // If update fails, try to add directly
            console.warn(`Failed to update ${collectionName} entity ${entity.id}:`, err);
          }
        }
      }
    }

    // Migrate users
    const usuarios = this.db.usuarios as any[];
    for (const user of usuarios) {
      if (!user.companyId) {
        // Get company ID from restaurants
        const restaurants = await this.restaurantService.getRestaurants();
        if (restaurants.length > 0) {
          const companyId = restaurants[0].companyId;
          user.companyId = companyId;
          user.restaurantes = [String(restaurants[0].id)];
          try {
            await this.db.update('usuarios', user.id, {
              companyId,
              restaurantes: [String(restaurants[0].id)],
            });
          } catch (err) {
            console.warn(`Failed to update user ${user.id}:`, err);
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
      const collections: Array<keyof DatabaseService> = [
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
        const collection = this.db[collectionName] as any[];

        for (const entity of collection) {
          if (entity.restaurantId) {
            delete entity.restaurantId;
            try {
              const { restaurantId, ...entityWithoutRestaurantId } = entity;
              await this.db.update(collectionName as any, entity.id, entityWithoutRestaurantId);
            } catch (err) {
              console.warn(`Failed to rollback ${collectionName} entity ${entity.id}:`, err);
            }
          }
        }
      }

      // Delete companies and restaurants
      const companies = await this.companyService.getCompanies();
      for (const company of companies) {
        await this.companyService.deleteCompany(company.id);
      }

      const restaurants = await this.restaurantService.getRestaurants();
      for (const restaurant of restaurants) {
        await this.restaurantService.deleteRestaurant(restaurant.id);
      }

      localStorage.removeItem('current_restaurant_id');

      return { success: true };
    } catch (error) {
      console.error('Rollback error:', error);
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
    console.log('Running data migration...');
    const result = await migration.migrate();

    if (result.success) {
      console.log('Migration completed successfully', {
        companyId: result.companyId,
        restaurantId: result.restaurantId,
      });
    } else {
      console.error('Migration failed:', result.error);
    }
  } else {
    console.log('Data already migrated');
  }
}
