/**
 * useUserPermissions - Hook to get current user's permissions
 *
 * Session 002: Created for filtering navigation items by user permissions
 * Session 003: Simplified to use only SYSTEM_ROLES (removed legacy PREDEFINED_ROLES)
 */
import { useMemo } from 'react';
import { useApp } from '@core';
import { SYSTEM_ROLES } from '@shared/config/systemRoles';
import { logger } from '@core/services/LoggerService';
import type { Permission, Role, RoleId } from '@types';

/**
 * Get role object from roleId
 * Only uses SYSTEM_ROLES (6 predefined roles)
 * Returns undefined if role not found (no dangerous fallback)
 */
function getRoleById(roleId: string | number | undefined): Role | undefined {
    if (!roleId) return undefined;

    const roleIdStr = String(roleId).toLowerCase();

    // Only use SYSTEM_ROLES
    if (roleIdStr in SYSTEM_ROLES) {
        const systemRole = SYSTEM_ROLES[roleIdStr as RoleId];
        return {
            id: systemRole.id,
            nombre: systemRole.nombre,
            descripcion: systemRole.descripcion,
            nivel: systemRole.nivel,
            permisos: systemRole.permisos,
            accesoMultiRestaurante: systemRole.accesoMultiRestaurante,
        };
    }

    // No fallback - return undefined for unknown roles
    logger.warn(`[useUserPermissions] Unknown roleId: ${roleId}. Valid roles: ${Object.keys(SYSTEM_ROLES).join(', ')}`);
    return undefined;
}

export interface UseUserPermissionsResult {
    /** User's permissions array */
    permissions: Permission[];
    /** User's role object */
    role: Role | undefined;
    /** Check if user has a specific permission */
    hasPermission: (permission: Permission) => boolean;
    /** Check if user has any of the specified permissions */
    hasAnyPermission: (permissions: Permission[]) => boolean;
    /** Check if user has all of the specified permissions */
    hasAllPermissions: (permissions: Permission[]) => boolean;
    /** Whether user is authenticated */
    isAuthenticated: boolean;
}

/**
 * Hook to access current user's permissions
 *
 * @example
 * const { permissions, hasPermission } = useUserPermissions();
 * if (hasPermission('pnl.view')) { ... }
 */
export const useUserPermissions = (): UseUserPermissionsResult => {
    const { user, isAuthenticated } = useApp();

    const role = useMemo(() => {
        if (!user) return undefined;
        // Use rolId (Firestore field name)
        return getRoleById(user.roleId);
    }, [user]);

    const permissions = useMemo(() => {
        return role?.permisos || [];
    }, [role]);

    const hasPermission = (permission: Permission): boolean => {
        return permissions.includes(permission);
    };

    const hasAnyPermission = (perms: Permission[]): boolean => {
        return perms.some(p => permissions.includes(p));
    };

    const hasAllPermissions = (perms: Permission[]): boolean => {
        return perms.every(p => permissions.includes(p));
    };

    return {
        permissions,
        role,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isAuthenticated,
    };
};
