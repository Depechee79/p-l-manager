/**
 * P&L Manager - Services Index
 * 
 * Barrel export de todos los servicios de la aplicación.
 * Centraliza el acceso a la lógica de negocio y APIs.
 * 
 * @version 1.0.0
 * @date 2025-12-30
 */

// =============================================================================
// DOMAIN SERVICES
// =============================================================================

export * from '@core';
export * from './FinanceService';
// FirestoreService is now in core
// InventoryService is now in features/inventarios
// ItemsService is now in core
// ProviderService is now in features/providers
// RestaurantService is now in core
export * from './TransferService';
export * from '@features/personal';

// =============================================================================
// SPECIALIZED SERVICES
// =============================================================================

export * from './delivery-service';
export * from './escandallo-service';
export * from './ocr-service';
export * from './pnl-service';
