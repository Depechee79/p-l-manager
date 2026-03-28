import type { Company, Restaurant } from '@types';
import { DatabaseService } from '../services/DatabaseService';

export class CompanyService {
  constructor(private db: DatabaseService) { }

  /**
   * Create a new company
   */
  async createCompany(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    return await this.db.add('companies', data) as Company;
  }

  /**
   * Get company by ID
   */
  getCompany(id: string): Company | null {
    const companies = this.db.companies as Company[];
    return companies.find(c => c.id === id) || null;
  }

  /**
   * Update company
   */
  async updateCompany(id: string, data: Partial<Company>): Promise<Company | null> {
    return await this.db.update('companies', id, data) as Company | null;
  }

  /**
   * Get all restaurants for a company
   */
  getRestaurants(companyId: string): Restaurant[] {
    const restaurants = this.db.restaurants as Restaurant[];
    return restaurants.filter(r => r.companyId === companyId);
  }

  /**
   * Add restaurant to company
   */
  async addRestaurant(companyId: string, restaurant: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>): Promise<Restaurant> {
    const newRestaurant = {
      ...restaurant,
      companyId,
    };
    const created = await this.db.add('restaurants', newRestaurant as Omit<Restaurant, 'id'>) as Restaurant;

    // Update company's restaurant list
    const company = this.getCompany(companyId);
    if (company) {
      await this.updateCompany(companyId, {
        restaurantes: [...(company.restaurantes || []), String(created.id)],
      });
    }

    return created;
  }

  /**
   * Get all companies
   */
  getCompanies(): Company[] {
    return this.db.companies as Company[];
  }
}
