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
import { useUserPermissions } from '@shared/hooks';
import { logger } from '@core/services/LoggerService';
import type { Permission } from '@types';

export interface ProtectedRouteProps {
    /** The element to render if user has permission */
    element: React.ReactNode;
    /** Required permissions to access this route */
    requiredPermissions: Permission[];
    /** Route to redirect to if access denied. Default: "/" */
    fallback?: string;
    /** If true, user must have ALL permissions. If false, ANY permission is enough. Default: false */
    requireAll?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    element,
    requiredPermissions,
    fallback = '/',
    requireAll = false,
}) => {
    const { isAuthenticated, hasAllPermissions, hasAnyPermission, role } = useUserPermissions();
    const location = useLocation();

    // If not authenticated, redirect to fallback
    if (!isAuthenticated) {
        return <Navigate to={fallback} state={{ from: location }} replace />;
    }

    // Check permissions based on requireAll flag
    const hasAccess = requireAll
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
        logger.warn(
            `[ProtectedRoute] Access denied to ${location.pathname}. ` +
            `User role: ${role?.nombre || 'unknown'}, Required: ${requiredPermissions.join(', ')}`
        );
        return <Navigate to={fallback} state={{ from: location, reason: 'insufficient_permissions' }} replace />;
    }

    // User has permission - render the protected element
    return <>{element}</>;
};
