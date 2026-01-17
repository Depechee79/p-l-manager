import type { Restaurant, Worker } from '@types';
import { DatabaseService } from './DatabaseService';

export class RestaurantService {
  constructor(private db: DatabaseService) { }

  /**
   * Create a new restaurant
   */
  async createRestaurant(companyId: string, data: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>): Promise<Restaurant> {
    const restaurant: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      companyId,
      trabajadores: [],
      activo: data.activo !== undefined ? data.activo : true,
      configuracion: data.configuracion || {
        zonaHoraria: 'Europe/Madrid',
        moneda: 'EUR',
        ivaRestaurante: 10,
        ivaTakeaway: 21,
      },
    };
    return await this.db.add('restaurants', restaurant) as Restaurant;
  }

  /**
   * Get restaurant by ID
   */
  getRestaurant(id: string): Restaurant | null {
    const restaurants = this.db.restaurants as Restaurant[];
    return restaurants.find(r => r.id === id) || null;
  }

  /**
   * Update restaurant
   */
  async updateRestaurant(id: string, data: Partial<Restaurant>): Promise<Restaurant | null> {
    return await this.db.update('restaurants', id, data) as Restaurant | null;
  }

  /**
   * Assign worker to restaurant
   */
  async assignWorker(restaurantId: string, workerId: string): Promise<void> {
    const restaurant = this.getRestaurant(restaurantId);
    if (restaurant) {
      const trabajadores = restaurant.trabajadores || [];
      if (!trabajadores.includes(workerId)) {
        await this.updateRestaurant(restaurantId, {
          trabajadores: [...trabajadores, workerId],
        });
      }
    }
  }

  /**
   * Remove worker from restaurant
   */
  async removeWorker(restaurantId: string, workerId: string): Promise<void> {
    const restaurant = this.getRestaurant(restaurantId);
    if (restaurant) {
      const trabajadores = (restaurant.trabajadores || []).filter(id => id !== workerId);
      await this.updateRestaurant(restaurantId, {
        trabajadores,
      });
    }
  }

  /**
   * Get workers assigned to restaurant
   */
  getWorkers(restaurantId: string): Worker[] {
    const restaurant = this.getRestaurant(restaurantId);
    if (!restaurant) return [];

    const workers = this.db.workers as Worker[];
    return workers.filter(w =>
      restaurant.trabajadores.includes(String(w.id))
    );
  }

  /**
   * Get all restaurants
   */
  getAllRestaurants(): Restaurant[] {
    return this.db.restaurants as Restaurant[];
  }

  /**
   * Get restaurants by company
   */
  getRestaurantsByCompany(companyId: string): Restaurant[] {
    const restaurants = this.db.restaurants as Restaurant[];
    return restaurants.filter(r => r.companyId === companyId);
  }
}
