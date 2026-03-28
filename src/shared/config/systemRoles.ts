/**
 * P&L Manager - System Roles Configuration
 *
 * Defines the 6 predefined system roles with their permissions.
 * These roles are seeded to Firestore on first app initialization.
 */

import type { Role, RoleId, Permission } from '@types';

/**
 * All available permissions grouped by module
 */
export const ALL_PERMISSIONS: Record<string, Permission[]> = {
    dashboard: ['dashboard.view'],
    ocr: ['ocr.view', 'ocr.create', 'ocr.edit', 'ocr.delete'],
    cierres: ['cierres.view', 'cierres.create', 'cierres.edit', 'cierres.delete'],
    proveedores: ['proveedores.view', 'proveedores.create', 'proveedores.edit', 'proveedores.delete'],
    almacen: ['almacen.view', 'almacen.create', 'almacen.edit', 'almacen.delete'],
    inventarios: ['inventarios.view', 'inventarios.create', 'inventarios.edit', 'inventarios.delete'],
    escandallos: ['escandallos.view', 'escandallos.create', 'escandallos.edit', 'escandallos.delete'],
    pnl: ['pnl.view', 'pnl.export'],
    usuarios: ['usuarios.view', 'usuarios.create', 'usuarios.edit', 'usuarios.delete'],
    configuracion: ['configuracion.view', 'configuracion.edit'],
    personal: ['personal.view', 'personal.edit'],
    nominas: ['nominas.view', 'nominas.create', 'nominas.edit', 'nominas.delete'],
    gastos: ['gastos.view', 'gastos.create', 'gastos.edit', 'gastos.delete'],
    mermas: ['mermas.view', 'mermas.create', 'mermas.edit', 'mermas.delete'],
    pedidos: ['pedidos.view', 'pedidos.create', 'pedidos.edit', 'pedidos.delete'],
    transferencias: ['transferencias.view', 'transferencias.create', 'transferencias.edit', 'transferencias.delete'],
    invitaciones: ['invitaciones.view', 'invitaciones.create', 'invitaciones.delete'],
    restaurantes: ['restaurantes.view', 'restaurantes.create', 'restaurantes.edit', 'restaurantes.delete'],
};

/**
 * Helper to get all permissions from specified modules
 */
function getPermissionsFromModules(modules: string[]): Permission[] {
    return modules.flatMap(module => ALL_PERMISSIONS[module] || []);
}

/**
 * The 6 System Roles
 *
 * Level 1: Director de Operaciones - Full access, all restaurants
 * Level 2: Director de Restaurante - Full access, own restaurant
 * Level 3: Encargado - Daily operations
 * Level 3: Jefe de Cocina - Kitchen, purchases, inventory
 * Level 4: Camarero - Basic front-of-house tasks
 * Level 5: Cocinero - Minimal: recipes, own inventory
 */
export const SYSTEM_ROLES: Record<RoleId, Omit<Role, 'createdAt' | 'updatedAt'>> = {
    director_operaciones: {
        id: 'director_operaciones',
        nombre: 'Director de Operaciones',
        descripcion: 'Acceso completo a todas las funcionalidades y todos los restaurantes del grupo',
        nivel: 1,
        accesoMultiRestaurante: true,
        permisos: getPermissionsFromModules([
            'dashboard', 'ocr', 'cierres', 'proveedores', 'almacen',
            'inventarios', 'escandallos', 'pnl', 'usuarios', 'configuracion',
            'personal', 'nominas', 'gastos', 'mermas',
            'pedidos', 'transferencias', 'invitaciones', 'restaurantes'
        ]),
    },

    director_restaurante: {
        id: 'director_restaurante',
        nombre: 'Director de Restaurante',
        descripcion: 'Acceso completo a todas las funcionalidades de su restaurante asignado',
        nivel: 2,
        accesoMultiRestaurante: false,
        permisos: getPermissionsFromModules([
            'dashboard', 'ocr', 'cierres', 'proveedores', 'almacen',
            'inventarios', 'escandallos', 'pnl', 'usuarios', 'configuracion',
            'personal', 'nominas', 'gastos', 'mermas',
            'pedidos', 'transferencias', 'invitaciones'
        ]),
    },

    encargado: {
        id: 'encargado',
        nombre: 'Encargado',
        descripcion: 'Gestión operativa diaria: cierres, inventarios, pedidos y personal',
        nivel: 3,
        accesoMultiRestaurante: false,
        permisos: [
            // Dashboard
            'dashboard.view',
            // Cierres - Full access
            'cierres.view', 'cierres.create', 'cierres.edit',
            // Inventarios - Full access
            'inventarios.view', 'inventarios.create', 'inventarios.edit',
            // Mermas - Can report
            'mermas.view', 'mermas.create',
            // Pedidos - Can manage
            'pedidos.view', 'pedidos.create', 'pedidos.edit',
            // Personal - Can view
            'personal.view',
            // Escandallos - View only
            'escandallos.view',
            // Almacen - View
            'almacen.view',
            // Proveedores - View
            'proveedores.view',
        ],
    },

    jefe_cocina: {
        id: 'jefe_cocina',
        nombre: 'Jefe de Cocina',
        descripcion: 'Gestión de cocina: recetas, inventarios, pedidos y control de costes',
        nivel: 3,
        accesoMultiRestaurante: false,
        zonasInventario: ['cocina', 'camara', 'almacen'],
        permisos: [
            // Dashboard
            'dashboard.view',
            // Escandallos - Full access
            'escandallos.view', 'escandallos.create', 'escandallos.edit', 'escandallos.delete',
            // Inventarios - Full access (cocina zones)
            'inventarios.view', 'inventarios.create', 'inventarios.edit',
            // Mermas - Can report
            'mermas.view', 'mermas.create', 'mermas.edit',
            // Pedidos - Can create for kitchen
            'pedidos.view', 'pedidos.create',
            // Almacen - View and edit
            'almacen.view', 'almacen.edit',
            // Proveedores - View
            'proveedores.view',
            // OCR/Facturas - View for cost control
            'ocr.view',
        ],
    },

    camarero: {
        id: 'camarero',
        nombre: 'Camarero',
        descripcion: 'Tareas básicas de sala: inventarios de barra y consulta de información',
        nivel: 4,
        accesoMultiRestaurante: false,
        zonasInventario: ['bar'],
        permisos: [
            // Dashboard
            'dashboard.view',
            // Inventarios - Only bar zone
            'inventarios.view', 'inventarios.create',
            // Escandallos - View only (for menu knowledge)
            'escandallos.view',
            // Almacen - View only
            'almacen.view',
        ],
    },

    cocinero: {
        id: 'cocinero',
        nombre: 'Cocinero',
        descripcion: 'Acceso mínimo: consulta de recetas e inventario de su partida',
        nivel: 5,
        accesoMultiRestaurante: false,
        zonasInventario: ['cocina'],
        permisos: [
            // Dashboard
            'dashboard.view',
            // Escandallos - View only (for recipes)
            'escandallos.view',
            // Inventarios - View and create (own station)
            'inventarios.view', 'inventarios.create',
            // Mermas - Can report own mermas
            'mermas.view', 'mermas.create',
        ],
    },
};

/**
 * Get role configuration by ID
 */
export function getSystemRole(roleId: RoleId): Omit<Role, 'createdAt' | 'updatedAt'> | undefined {
    return SYSTEM_ROLES[roleId];
}

/**
 * Get all system roles as array
 */
export function getAllSystemRoles(): Omit<Role, 'createdAt' | 'updatedAt'>[] {
    return Object.values(SYSTEM_ROLES);
}

/**
 * Check if a role can manage another role (for invitations)
 * A user can only invite users with a higher level number (lower access)
 */
export function canManageRole(managerRoleId: RoleId, targetRoleId: RoleId): boolean {
    const managerRole = SYSTEM_ROLES[managerRoleId];
    const targetRole = SYSTEM_ROLES[targetRoleId];

    if (!managerRole || !targetRole) return false;
    if (managerRole.nivel === undefined || targetRole.nivel === undefined) return false;

    // Can only manage roles with higher level number (lower access)
    return managerRole.nivel < targetRole.nivel;
}

/**
 * Get roles that a user can invite
 */
export function getInvitableRoles(managerRoleId: RoleId): RoleId[] {
    const managerRole = SYSTEM_ROLES[managerRoleId];
    if (!managerRole || managerRole.nivel === undefined) return [];

    const managerLevel = managerRole.nivel;
    return (Object.keys(SYSTEM_ROLES) as RoleId[]).filter(roleId => {
        const role = SYSTEM_ROLES[roleId];
        return role.nivel !== undefined && role.nivel > managerLevel;
    });
}

/**
 * Validate if a permission is valid
 */
export function isValidPermission(permission: string): permission is Permission {
    const allPerms = Object.values(ALL_PERMISSIONS).flat();
    return allPerms.includes(permission as Permission);
}

/**
 * Check if role has a specific permission
 */
export function roleHasPermission(roleId: RoleId, permission: Permission): boolean {
    const role = SYSTEM_ROLES[roleId];
    if (!role) return false;
    return role.permisos.includes(permission);
}
