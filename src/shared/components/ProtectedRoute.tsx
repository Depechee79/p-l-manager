/**
 * ProtectedRoute - Route guard component for permission-based access control
 * 
 * Protects routes by checking user permissions against required permissions.
 * Redirects to fallback route if user lacks required permissions.
 * 
 * @example
 * <ProtectedRoute 
 *   element={<PnLPage />} 
 *   requiredPermissions={['pnl.view']} 
 * />
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '@core';
import { hasAllPermissions, hasAnyPermission, PREDEFINED_ROLES } from '@shared/config/roles';
import type { Permission, Role } from '@types';

export interface ProtectedRouteProps {
    /** The element to render if user has permission */
    element: React.ReactNode;
    /** Required permissions to access this route */
    requiredPermissions: Permission[];
    /** Route to redirect to if access denied. Default: "/" */
    fallback?: string;
    /** If true, user must have ALL permissions. If false, ANY permission is enough. Default: true */
    requireAll?: boolean;
}

/**
 * Get role object from roleId by looking up in predefined roles
 */
function getRoleByName(roleName: string | undefined): Role | undefined {
    if (!roleName) return undefined;

    const normalizedName = roleName.toLowerCase();
    const roleData = PREDEFINED_ROLES.find(
        r => r.nombre.toLowerCase() === normalizedName
    );

    if (!roleData) return undefined;

    // Convert to Role type (add missing id fields)
    return {
        id: normalizedName,
        nombre: roleData.nombre,
        descripcion: roleData.descripcion,
        permisos: roleData.permisos,
        zonasInventario: roleData.zonasInventario,
    };
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    element,
    requiredPermissions,
    fallback = '/',
    requireAll = true,
}) => {
    const { user, isAuthenticated } = useApp();
    const location = useLocation();

    // If not authenticated, redirect to dashboard
    if (!isAuthenticated || !user) {
        return <Navigate to={fallback} state={{ from: location }} replace />;
    }

    // Get user's role - use roleId if available, otherwise default to most restrictive
    const roleName = user.roleId?.toString() || 'camarero';
    const userRole = getRoleByName(roleName);

    // If no valid role found, deny access
    if (!userRole) {
        console.warn(`[ProtectedRoute] Unknown role: ${roleName}. Access denied to ${location.pathname}`);
        return <Navigate to={fallback} state={{ from: location, reason: 'unknown_role' }} replace />;
    }

    // Check permissions based on requireAll flag
    const hasAccess = requireAll
        ? hasAllPermissions(userRole, requiredPermissions)
        : hasAnyPermission(userRole, requiredPermissions);

    if (!hasAccess) {
        console.warn(
            `[ProtectedRoute] Access denied to ${location.pathname}. ` +
            `User role: ${userRole.nombre}, Required: ${requiredPermissions.join(', ')}`
        );
        return <Navigate to={fallback} state={{ from: location, reason: 'insufficient_permissions' }} replace />;
    }

    // User has permission - render the protected element
    return <>{element}</>;
};

export default ProtectedRoute;
