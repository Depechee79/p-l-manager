/**
 * P&L Manager - Roles and Permissions Configuration
 * 
 * Centralized configuration for user roles and permissions.
 * Used by UsersPage and auth guards throughout the application.
 * 
 * @example
 * import { PREDEFINED_ROLES, PERMISSION_GROUPS, hasPermission } from '@shared/config/roles';
 */

import type { Role, Permission } from '@types';

// =============================================================================
// PREDEFINED ROLES
// =============================================================================

/**
 * Predefined roles for the application.
 * These are automatically created when the roles collection is empty.
 */
export const PREDEFINED_ROLES: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        nombre: 'Director',
        descripcion: 'Acceso completo a todas las funcionalidades y configuración',
        permisos: [
            'dashboard.view',
            'ocr.view', 'ocr.create', 'ocr.edit', 'ocr.delete',
            'cierres.view', 'cierres.create', 'cierres.edit', 'cierres.delete',
            'proveedores.view', 'proveedores.create', 'proveedores.edit', 'proveedores.delete',
            'almacen.view', 'almacen.create', 'almacen.edit', 'almacen.delete',
            'inventarios.view', 'inventarios.create', 'inventarios.edit', 'inventarios.delete',
            'escandallos.view', 'escandallos.create', 'escandallos.edit', 'escandallos.delete',
            'pnl.view', 'pnl.export',
            'usuarios.view', 'usuarios.create', 'usuarios.edit', 'usuarios.delete',
        ],
    },
    {
        nombre: 'Encargado',
        descripcion: 'Gestión operativa: cierres, inventarios y escandallos',
        permisos: [
            'dashboard.view',
            'cierres.view', 'cierres.create', 'cierres.edit',
            'inventarios.view', 'inventarios.create', 'inventarios.edit',
            'escandallos.view', 'escandallos.create', 'escandallos.edit',
            'almacen.view',
        ],
    },
    {
        nombre: 'Cocinero',
        descripcion: 'Inventarios de cocina y cámara, escandallos',
        permisos: [
            'dashboard.view',
            'inventarios.view', 'inventarios.create', 'inventarios.edit',
            'escandallos.view', 'escandallos.create', 'escandallos.edit',
            'almacen.view',
        ],
        zonasInventario: ['cocina', 'camara'],
    },
    {
        nombre: 'Bartender',
        descripcion: 'Inventarios de barra y bebidas',
        permisos: [
            'dashboard.view',
            'inventarios.view', 'inventarios.create', 'inventarios.edit',
            'almacen.view',
        ],
        zonasInventario: ['bar'],
    },
    {
        nombre: 'Camarero',
        descripcion: 'Inventarios básicos de barra',
        permisos: [
            'dashboard.view',
            'inventarios.view', 'inventarios.create', 'inventarios.edit',
        ],
        zonasInventario: ['bar'],
    },
];

// =============================================================================
// PERMISSION GROUPS
// =============================================================================

/**
 * Permission groups for displaying permissions in the UI.
 * Groups related permissions together under a label.
 */
export interface PermissionGroup {
    label: string;
    permissions: Permission[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
    {
        label: 'Dashboard',
        permissions: ['dashboard.view'],
    },
    {
        label: 'Escáner OCR',
        permissions: ['ocr.view', 'ocr.create', 'ocr.edit', 'ocr.delete'],
    },
    {
        label: 'Cierres',
        permissions: ['cierres.view', 'cierres.create', 'cierres.edit', 'cierres.delete'],
    },
    {
        label: 'Proveedores',
        permissions: ['proveedores.view', 'proveedores.create', 'proveedores.edit', 'proveedores.delete'],
    },
    {
        label: 'Almacén',
        permissions: ['almacen.view', 'almacen.create', 'almacen.edit', 'almacen.delete'],
    },
    {
        label: 'Inventarios',
        permissions: ['inventarios.view', 'inventarios.create', 'inventarios.edit', 'inventarios.delete'],
    },
    {
        label: 'Escandallos',
        permissions: ['escandallos.view', 'escandallos.create', 'escandallos.edit', 'escandallos.delete'],
    },
    {
        label: 'P&L',
        permissions: ['pnl.view', 'pnl.export'],
    },
    {
        label: 'Usuarios',
        permissions: ['usuarios.view', 'usuarios.create', 'usuarios.edit', 'usuarios.delete'],
    },
];

// =============================================================================
// PERMISSION HELPERS
// =============================================================================

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role | undefined, permission: Permission): boolean {
    if (!role) return false;
    return role.permisos.includes(permission);
}

/**
 * Check if a role has any of the specified permissions.
 */
export function hasAnyPermission(role: Role | undefined, permissions: Permission[]): boolean {
    if (!role) return false;
    return permissions.some(p => role.permisos.includes(p));
}

/**
 * Check if a role has all of the specified permissions.
 */
export function hasAllPermissions(role: Role | undefined, permissions: Permission[]): boolean {
    if (!role) return false;
    return permissions.every(p => role.permisos.includes(p));
}

/**
 * Get human-readable zone name.
 */
export function getZoneName(zoneKey: string): string {
    const zoneNames: Record<string, string> = {
        bar: 'Barra',
        cocina: 'Cocina',
        camara: 'Cámara',
        almacen: 'Almacén',
    };
    return zoneNames[zoneKey] || zoneKey;
}
