/**
 * P&L Manager - Utils Index
 * 
 * Barrel export de utilidades de la aplicación.
 * 
 * @version 1.0.0
 * @date 2025-12-30
 */

export * from './calculations';
export * from './formatters';
export * from './imageUtils';
export * from './restaurantFilter';
export { useToast, ToastProvider } from './toast';
// databaseDiagnostics and migration are now in @core
export { runMigrationIfNeeded, DataMigration, checkDatabaseIntegrity } from '@core';
