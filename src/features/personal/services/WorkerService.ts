import type { Worker } from '@types';
import { DatabaseService } from '@services/DatabaseService';

export interface WorkerActivity {
    id: string;
    workerId: string;
    restaurantId?: string;
    type: string;
    date: string;
    description: string;
}

export class WorkerService {
    constructor(private db: DatabaseService) { }

    /**
     * Create a new worker
     */
    async createWorker(companyId: string, data: Omit<Worker, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>): Promise<Worker> {
        const worker: Omit<Worker, 'id' | 'createdAt' | 'updatedAt'> = {
            ...data,
            companyId,
            restaurantes: data.restaurantes || [],
            roles: data.roles || [],
            activo: data.activo !== undefined ? data.activo : true,
        };
        return await this.db.add('workers', worker) as Worker;
    }

    /**
     * Get worker by ID
     */
    getWorker(id: string): Worker | null {
        const workers = this.db.workers;
        return workers.find(w => w.id === id) || null;
    }

    /**
     * Update worker
     */
    async updateWorker(id: string, data: Partial<Worker>): Promise<Worker | null> {
        return await this.db.update('workers', id, data) as Worker | null;
    }

    /**
     * Assign worker to restaurant
     */
    async assignToRestaurant(workerId: string, restaurantId: string, roles: string[] = []): Promise<void> {
        const worker = this.getWorker(workerId);
        if (worker) {
            const restaurantes = worker.restaurantes || [];
            if (!restaurantes.includes(restaurantId)) {
                await this.updateWorker(workerId, {
                    restaurantes: [...restaurantes, restaurantId],
                    roles: [...(worker.roles || []), ...roles],
                });
            }
        }
    }

    /**
     * Remove worker from restaurant
     */
    async removeFromRestaurant(workerId: string, restaurantId: string): Promise<void> {
        const worker = this.getWorker(workerId);
        if (worker) {
            const restaurantes = (worker.restaurantes || []).filter(id => id !== restaurantId);
            await this.updateWorker(workerId, {
                restaurantes,
            });
        }
    }

    /**
     * Get workers by company
     */
    getWorkers(companyId: string, restaurantId?: string): Worker[] {
        let workers = this.db.workers;
        workers = workers.filter((w: Worker) => w.companyId === companyId);

        if (restaurantId) {
            workers = workers.filter((w: Worker) =>
                (w.restaurantes || []).includes(restaurantId)
            );
        }

        return workers;
    }

    /**
     * Get worker activity (placeholder for future implementation)
     */
    getWorkerActivity(_workerId: string, _restaurantId?: string): WorkerActivity[] {
        // TODO: Implement activity tracking
        return [];
    }

    /**
     * Get all workers
     */
    getAllWorkers(): Worker[] {
        return this.db.workers;
    }
}
