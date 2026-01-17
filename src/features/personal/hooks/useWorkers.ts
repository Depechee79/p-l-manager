import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@core';
import { WorkerService } from '../services/WorkerService';
import type { Worker } from '@types';

export const useWorkers = (companyId: string, restaurantId?: string) => {
    const { db } = useDatabase();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const workerService = new WorkerService(db);

    useEffect(() => {
        const allWorkers = workerService.getWorkers(companyId, restaurantId);
        setWorkers(allWorkers);
    }, [db, companyId, restaurantId]);

    const createWorker = useCallback((data: Omit<Worker, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>) => {
        const worker = workerService.createWorker(companyId, data);
        // Refresh list
        const allWorkers = workerService.getWorkers(companyId, restaurantId);
        setWorkers(allWorkers);
        return worker;
    }, [companyId, restaurantId, workerService]);

    const assignToRestaurant = useCallback((workerId: string, restaurantId: string, roles: string[] = []) => {
        workerService.assignToRestaurant(workerId, restaurantId, roles);
        // Refresh list
        const allWorkers = workerService.getWorkers(companyId, restaurantId);
        setWorkers(allWorkers);
    }, [companyId, restaurantId, workerService]);

    const getWorkersByRestaurant = useCallback((restaurantId: string): Worker[] => {
        return workerService.getWorkers(companyId, restaurantId);
    }, [companyId, workerService]);

    return {
        workers,
        createWorker,
        assignToRestaurant,
        getWorkersByRestaurant,
    };
};
