import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@core';
import { TransferService } from '../services/TransferService';
import type { Transfer } from '../types';

export const useTransfers = (restaurantId?: string) => {
  const { db } = useDatabase();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<Transfer[]>([]);
  const transferService = new TransferService(db);

  useEffect(() => {
    if (restaurantId) {
      const allTransfers = transferService.getTransfers(restaurantId);
      setTransfers(allTransfers);

      const pending = transferService.getPendingTransfers(restaurantId);
      setPendingTransfers(pending);
    } else {
      const allTransfers = transferService.getTransfers();
      setTransfers(allTransfers);
      setPendingTransfers([]);
    }
  }, [db, restaurantId]);

  const createTransfer = useCallback((data: Omit<Transfer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const transfer = transferService.createTransfer(data);
    // Refresh list
    if (restaurantId) {
      const allTransfers = transferService.getTransfers(restaurantId);
      setTransfers(allTransfers);
      const pending = transferService.getPendingTransfers(restaurantId);
      setPendingTransfers(pending);
    }
    return transfer;
  }, [restaurantId, transferService]);

  const approveTransfer = useCallback((transferId: string, restaurantId: string) => {
    const transfer = transferService.approveTransfer(transferId, restaurantId);
    // Refresh list
    if (restaurantId) {
      const allTransfers = transferService.getTransfers(restaurantId);
      setTransfers(allTransfers);
      const pending = transferService.getPendingTransfers(restaurantId);
      setPendingTransfers(pending);
    }
    return transfer;
  }, [transferService]);

  const completeTransfer = useCallback((transferId: string) => {
    const transfer = transferService.completeTransfer(transferId);
    // Refresh list
    if (restaurantId) {
      const allTransfers = transferService.getTransfers(restaurantId);
      setTransfers(allTransfers);
      const pending = transferService.getPendingTransfers(restaurantId);
      setPendingTransfers(pending);
    }
    return transfer;
  }, [restaurantId, transferService]);

  return {
    transfers,
    pendingTransfers,
    createTransfer,
    approveTransfer,
    completeTransfer,
  };
};

