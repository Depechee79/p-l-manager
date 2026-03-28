import { useState, useEffect, useCallback } from 'react';
import { DatabaseService } from '@core';
import { useToast } from '@utils/toast';
import { logger } from '@core/services/LoggerService';
import type { AppUser, Role } from '../users.types';
import { getAllSystemRoles } from '@shared/config/systemRoles';

export const useUsers = (db: DatabaseService) => {
    const { showToast } = useToast();

    const [users, setUsers] = useState<AppUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<AppUser[]>([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');

    // Refresh data
    const refreshData = useCallback(() => {
        setUsers((db.usuarios || []) as AppUser[]);
        setRoles((db.roles || []) as Role[]);
    }, [db]);

    // Initial Load and Role Initialization
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    useEffect(() => {
        // Initialize roles if empty using SYSTEM_ROLES
        if (db.roles && db.roles.length === 0) {
            getAllSystemRoles().forEach((role) => {
                db.add('roles', role);
            });
            refreshData();
        }
    }, [db, refreshData]);

    // Apply Filters
    useEffect(() => {
        let result = [...users];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(u =>
                u.nombre.toLowerCase().includes(query) ||
                u.email?.toLowerCase().includes(query) ||
                u.telefono?.includes(query)
            );
        }

        setFilteredUsers(result);
    }, [users, searchQuery]);

    const createUser = useCallback(async (data: Omit<AppUser, 'id'>) => {
        try {
            db.add('usuarios', data);
            showToast({ type: 'success', title: 'Usuario creado', message: `El usuario "${data.nombre}" ha sido creado` });
            refreshData();
            return true;
        } catch (error: unknown) {
            logger.error('Error creando usuario', error instanceof Error ? error.message : String(error));
            showToast({ type: 'error', title: 'Error', message: 'No se pudo guardar el usuario' });
            return false;
        }
    }, [db, refreshData, showToast]);

    const updateUser = useCallback(async (id: number, data: Partial<AppUser>) => {
        try {
            db.update('usuarios', id, data);
            showToast({ type: 'success', title: 'Usuario actualizado', message: 'Los datos han sido guardados' });
            refreshData();
            return true;
        } catch (error: unknown) {
            logger.error('Error actualizando usuario', error instanceof Error ? error.message : String(error));
            showToast({ type: 'error', title: 'Error', message: 'No se pudo actualizar el usuario' });
            return false;
        }
    }, [db, refreshData, showToast]);

    const deleteUser = useCallback(async (user: AppUser) => {
        try {
            db.delete('usuarios', user.id);
            showToast({ type: 'success', title: 'Usuario eliminado', message: 'El usuario ha sido eliminado correctamente' });
            refreshData();
            return true;
        } catch (error: unknown) {
            logger.error('Error eliminando usuario', error instanceof Error ? error.message : String(error));
            showToast({ type: 'error', title: 'Error', message: 'No se pudo eliminar el usuario' });
            return false;
        }
    }, [db, refreshData, showToast]);

    const toggleUserActive = useCallback(async (user: AppUser) => {
        try {
            const newState = !user.activo;
            db.update('usuarios', user.id, { activo: newState } as Partial<AppUser>);
            showToast({
                type: 'success',
                title: newState ? 'Usuario activado' : 'Usuario desactivado',
                message: `El usuario "${user.nombre}" ha sido ${newState ? 'activado' : 'desactivado'}`
            });
            refreshData();
        } catch (error: unknown) {
            logger.error('Error cambiando estado usuario', error instanceof Error ? error.message : String(error));
            showToast({ type: 'error', title: 'Error', message: 'No se pudo actualizar el estado del usuario' });
        }
    }, [db, refreshData, showToast]);

    const getRoleName = useCallback((rolId: number | string) => {
        const role = roles.find(r => r.id === rolId);
        return role?.nombre || 'Sin rol';
    }, [roles]);

    const getRolePermissions = useCallback((rolId: number | string) => {
        const role = roles.find(r => r.id === rolId);
        return role?.permisos || [];
    }, [roles]);

    return {
        users: filteredUsers,
        roles,
        searchQuery,
        setSearchQuery,
        createUser,
        updateUser,
        deleteUser,
        toggleUserActive,
        getRoleName,
        getRolePermissions,
        refreshData
    };
};
