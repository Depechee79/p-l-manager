import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDatabase, useRestaurant } from '@core';

import type { Order } from '../orders.types';
import { useToast } from '@utils/toast';

export const useOrders = () => {
    const { db } = useDatabase();
    const { currentRestaurant } = useRestaurant();
    const { showToast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [error] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterEstado, setFilterEstado] = useState<string>('all');

    const refreshOrders = useCallback(() => {
        const loadedOrders = (db.orders || []) as Order[];
        if (currentRestaurant?.id) {
            // Ensure robust filtering
            const filtered = loadedOrders.filter(o => String(o.restaurantId) === String(currentRestaurant.id));
            setOrders(filtered);
        } else {
            setOrders([]);
        }
    }, [db, currentRestaurant]);

    // Initial Load and subsequent refreshes when db or restaurant changes
    useEffect(() => {
        const loadAndFilterOrders = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    db.ensureLoaded('orders'),
                    db.ensureLoaded('proveedores'), // Needed for create
                    db.ensureLoaded('productos')    // Needed for create
                ]);
            } catch (err) {
                console.error("Error loading orders data:", err);
            }
            refreshOrders();
            setLoading(false);
        };
        loadAndFilterOrders();
    }, [db, currentRestaurant, refreshOrders]);

    // Apply Filters (search and status)
    const filteredAndSearchedOrders = useMemo(() => {
        let result = [...orders];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(o =>
                (o.proveedorNombre || '').toLowerCase().includes(query) ||
                (o.notas || '').toLowerCase().includes(query)
            );
        }

        if (filterEstado !== 'all') {
            result = result.filter(o => o.estado === filterEstado);
        }

        result.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        return result;
    }, [orders, searchQuery, filterEstado]);

    const createOrder = useCallback(async (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>) => {
        if (!currentRestaurant?.id) {
            showToast({ type: 'error', title: 'Error', message: 'No se pudo crear el pedido: Restaurante no seleccionado.' });
            return false;
        }
        try {
            const orderData = {
                ...data,
                restaurantId: currentRestaurant.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            db.add('orders', orderData);
            showToast({ type: 'success', title: 'Pedido creado', message: 'El pedido se ha guardado correctamente' });
            refreshOrders();
            return true;
        } catch (err) {
            console.error("Error creating order:", err);
            showToast({ type: 'error', title: 'Error', message: 'No se pudo crear el pedido' });
            return false;
        }
    }, [db, refreshOrders, showToast, currentRestaurant]);

    const updateOrder = useCallback(async (id: string | number, data: Partial<Order>) => {
        try {
            db.update('orders', id, data);
            showToast({ type: 'success', title: 'Pedido actualizado', message: 'Los cambios se han guardado' });
            refreshOrders();
            return true;
        } catch (err) {
            showToast({ type: 'error', title: 'Error', message: 'No se pudo actualizar el pedido' });
            return false;
        }
    }, [db, refreshOrders, showToast]);

    const deleteOrder = useCallback(async (id: string | number) => {
        try {
            db.delete('orders', id);
            showToast({ type: 'success', title: 'Pedido eliminado', message: 'El pedido ha sido eliminado' });
            refreshOrders();
            return true;
        } catch (err) {
            showToast({ type: 'error', title: 'Error', message: 'No se pudo eliminar el pedido' });
            return false;
        }
    }, [db, refreshOrders, showToast]);

    const sendOrder = useCallback(async (order: Order) => {
        return updateOrder(order.id, { estado: 'enviado' });
    }, [updateOrder]);

    return {
        orders: filteredAndSearchedOrders,
        loading,
        error,
        searchQuery,
        setSearchQuery,
        filterEstado,
        setFilterEstado,
        refreshOrders,
        createOrder,
        updateOrder,
        deleteOrder,
        sendOrder
    };
};
