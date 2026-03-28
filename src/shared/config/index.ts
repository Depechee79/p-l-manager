/**
 * P&L Manager - Shared Config Index
 * 
 * Barrel export for shared configuration files.
 */

export {
    // PREDEFINED_ROLES removed - use SYSTEM_ROLES instead
    PERMISSION_GROUPS,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getZoneName,
} from './roles';

export type { PermissionGroup } from './roles';

export {
    SYSTEM_ROLES,
    ALL_PERMISSIONS,
    getSystemRole,
    getAllSystemRoles,
    canManageRole,
    getInvitableRoles,
    isValidPermission,
    roleHasPermission,
} from './systemRoles';

export {
    OCR_CONFIG,
    OCR_LANGUAGES,
    OCR_PAGE_SEG_MODE,
    OCR_CHAR_WHITELIST,
    CIF_PATTERNS,
    INVOICE_PATTERNS,
    DATE_PATTERNS,
    TOTAL_PATTERNS,
    CONFIDENCE_THRESHOLDS,
} from './ocr.config';

// Route Metadata for AppShellV2
export { routeMeta, getRouteMeta } from './routeMeta';
export type { RouteMeta } from './routeMeta';
