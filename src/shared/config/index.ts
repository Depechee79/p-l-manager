/**
 * P&L Manager - Shared Config Index
 * 
 * Barrel export for shared configuration files.
 */

export {
    PREDEFINED_ROLES,
    PERMISSION_GROUPS,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getZoneName,
} from './roles';

export type { PermissionGroup } from './roles';

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
