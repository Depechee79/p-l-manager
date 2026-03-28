import type { BaseEntity, CollectionName } from '@types';
import type { DatabaseService } from '../services/DatabaseService';
import { DataIntegrityService, type IntegrityReport } from '../services/DataIntegrityService';
import { logger } from '../services/LoggerService';

export interface DiagnosticReport {
  timestamp: string;
  collections: CollectionDiagnostic[];
  orphanedRecords: number;
  missingFields: number;
  typeMismatches: number;
  syncStatus: SyncStatus;
  suggestions: string[];
}

export interface CollectionDiagnostic {
  name: CollectionName;
  localCount: number;
  cloudCount?: number;
  syncedCount: number;
  unsyncedCount: number;
  orphanedRecords: number;
  missingFields: number;
  issues: string[];
}

export interface SyncStatus {
  totalItems: number;
  syncedItems: number;
  unsyncedItems: number;
  syncPercentage: number;
}

export interface DeadField {
  collection: CollectionName;
  field: string;
  reason: string;
  recommendation: string;
}

export interface DeadFieldReport {
  deadFields: DeadField[];
  suspiciousFields: DeadField[];
  totalDead: number;
  totalSuspicious: number;
}

/**
 * Type-safe accessor for dynamic collection names on DatabaseService.
 */
function getCollection(db: DatabaseService, name: CollectionName): BaseEntity[] {
  return (db as unknown as Record<string, BaseEntity[]>)[name] || [];
}

/**
 * Database Diagnostics Utility
 * Analyzes database health, integrity, and sync status
 */
export class DatabaseDiagnostics {
  private db: DatabaseService;
  private integrityService: DataIntegrityService;

  constructor(db: DatabaseService) {
    this.db = db;
    this.integrityService = new DataIntegrityService(db);
  }

  /**
   * Run full diagnostic analysis
   */
  async diagnoseDatabase(): Promise<DiagnosticReport> {
    logger.info('[DIAGNOSTICS] Starting database analysis...');

    const collections: CollectionDiagnostic[] = [];
    let totalOrphaned = 0;
    let totalMissing = 0;
    let totalTypeMismatches = 0;

    const collectionNames: CollectionName[] = [
      'cierres', 'facturas', 'albaranes', 'proveedores',
      'productos', 'escandallos', 'inventarios', 'delivery',
      'usuarios', 'roles'
    ];

    // Analyze each collection
    for (const collectionName of collectionNames) {
      const diagnostic = await this.analyzeCollection(collectionName);
      collections.push(diagnostic);
      totalOrphaned += diagnostic.orphanedRecords;
      totalMissing += diagnostic.missingFields;
    }

    // Get integrity report
    const integrityReport = this.integrityService.validateAllRelationships();
    totalOrphaned = integrityReport.orphanedRecords.length;
    totalMissing = integrityReport.missingFields.length;
    totalTypeMismatches = integrityReport.typeMismatches.length;

    // Calculate sync status
    const syncStatus = this.calculateSyncStatus(collections);

    // Generate suggestions
    const suggestions = this.generateSuggestions(
      collections,
      integrityReport,
      syncStatus
    );

    const report: DiagnosticReport = {
      timestamp: new Date().toISOString(),
      collections,
      orphanedRecords: totalOrphaned,
      missingFields: totalMissing,
      typeMismatches: totalTypeMismatches,
      syncStatus,
      suggestions,
    };

    this.printReport(report);
    return report;
  }

  /**
   * Analyze a single collection
   */
  private async analyzeCollection(collectionName: CollectionName): Promise<CollectionDiagnostic> {
    const localData = getCollection(this.db, collectionName);
    const localCount = localData.length;

    // Count synced vs unsynced
    const syncedCount = localData.filter(item => item._synced !== false).length;
    const unsyncedCount = localCount - syncedCount;

    // Get cloud count (optional, may fail)
    let cloudCount: number | undefined;
    try {
      const cloudResponse = await this.db.cloudService.getAll(collectionName);
      if (cloudResponse.success && cloudResponse.data) {
        cloudCount = cloudResponse.data.length;
      }
    } catch (error: unknown) {
      logger.debug('[DIAGNOSTICS] Cloud count unavailable for ' + collectionName, error);
    }

    // Check for orphaned records in this collection
    const integrityReport = this.integrityService.validateAllRelationships();
    const orphanedInCollection = integrityReport.orphanedRecords.filter(
      orphan => orphan.collection === collectionName
    ).length;

    const missingInCollection = integrityReport.missingFields.filter(
      missing => missing.collection === collectionName
    ).length;

    // Collect issues
    const issues: string[] = [];

    if (orphanedInCollection > 0) {
      issues.push(`${orphanedInCollection} orphaned record(s)`);
    }

    if (missingInCollection > 0) {
      issues.push(`${missingInCollection} record(s) with missing required fields`);
    }

    if (unsyncedCount > 0) {
      issues.push(`${unsyncedCount} unsynced item(s)`);
    }

    if (cloudCount !== undefined && cloudCount !== localCount) {
      issues.push(`Count mismatch: local=${localCount}, cloud=${cloudCount}`);
    }

    return {
      name: collectionName,
      localCount,
      cloudCount,
      syncedCount,
      unsyncedCount,
      orphanedRecords: orphanedInCollection,
      missingFields: missingInCollection,
      issues,
    };
  }

  /**
   * Calculate overall sync status
   */
  private calculateSyncStatus(collections: CollectionDiagnostic[]): SyncStatus {
    let totalItems = 0;
    let syncedItems = 0;

    for (const collection of collections) {
      totalItems += collection.localCount;
      syncedItems += collection.syncedCount;
    }

    const unsyncedItems = totalItems - syncedItems;
    const syncPercentage = totalItems > 0 ? (syncedItems / totalItems) * 100 : 100;

    return {
      totalItems,
      syncedItems,
      unsyncedItems,
      syncPercentage: Math.round(syncPercentage * 100) / 100,
    };
  }

  /**
   * Generate suggestions based on diagnostics
   */
  private generateSuggestions(
    collections: CollectionDiagnostic[],
    integrityReport: IntegrityReport,
    syncStatus: SyncStatus
  ): string[] {
    const suggestions: string[] = [];

    // Sync status suggestions
    if (syncStatus.unsyncedItems > 0) {
      suggestions.push(
        `${syncStatus.unsyncedItems} items are not synced to Firebase. ` +
        `Consider running a manual sync or checking your connection.`
      );
    }

    // Orphaned records suggestions
    if (integrityReport.orphanedRecords.length > 0) {
      suggestions.push(
        `Found ${integrityReport.orphanedRecords.length} orphaned records. ` +
        `These have broken foreign key references. Consider fixing or removing them.`
      );
    }

    // Missing fields suggestions
    if (integrityReport.missingFields.length > 0) {
      suggestions.push(
        `Found ${integrityReport.missingFields.length} records with missing required fields. ` +
        `These may cause validation errors.`
      );
    }

    // Collection-specific suggestions
    for (const collection of collections) {
      if (collection.issues.length > 0) {
        suggestions.push(
          `${collection.name}: ${collection.issues.join(', ')}`
        );
      }
    }

    // General health check
    if (suggestions.length === 0) {
      suggestions.push('Database health check passed! No issues detected.');
    }

    return suggestions;
  }

  /**
   * Print diagnostic report via logger
   */
  private printReport(report: DiagnosticReport): void {
    logger.info('[DIAGNOSTICS] Database Health Report');
    logger.info(`Timestamp: ${new Date(report.timestamp).toLocaleString()}`);
    logger.info(`Sync Status: Total=${report.syncStatus.totalItems}, Synced=${report.syncStatus.syncedItems} (${report.syncStatus.syncPercentage}%), Unsynced=${report.syncStatus.unsyncedItems}`);
    logger.info(`Integrity Issues: Orphaned=${report.orphanedRecords}, Missing=${report.missingFields}, TypeMismatches=${report.typeMismatches}`);

    for (const collection of report.collections) {
      const status = collection.issues.length === 0 ? 'OK' : 'WARN';
      logger.info(
        `  [${status}] ${collection.name}: ` +
        `${collection.localCount} items ` +
        `(${collection.syncedCount} synced, ${collection.unsyncedCount} unsynced)`
      );
      if (collection.issues.length > 0) {
        collection.issues.forEach(issue => {
          logger.warn(`    - ${issue}`);
        });
      }
    }

    logger.info('Suggestions:');
    report.suggestions.forEach((suggestion, index) => {
      logger.info(`  ${index + 1}. ${suggestion}`);
    });
  }

  /**
   * Detect dead fields (fields defined in types but never used)
   */
  detectDeadFields(): DeadFieldReport {
    logger.info('[DIAGNOSTICS] Analyzing field usage...');

    const deadFields: DeadField[] = [];
    const suspiciousFields: DeadField[] = [];

    // Analyze Product fields
    const productFields = this.analyzeProductFields();
    deadFields.push(...productFields.dead);
    suspiciousFields.push(...productFields.suspicious);

    // Analyze Provider fields
    const providerFields = this.analyzeProviderFields();
    deadFields.push(...providerFields.dead);
    suspiciousFields.push(...providerFields.suspicious);

    // Analyze Invoice fields
    const invoiceFields = this.analyzeInvoiceFields();
    deadFields.push(...invoiceFields.dead);
    suspiciousFields.push(...invoiceFields.suspicious);

    const report: DeadFieldReport = {
      deadFields,
      suspiciousFields,
      totalDead: deadFields.length,
      totalSuspicious: suspiciousFields.length,
    };

    this.printDeadFieldsReport(report);
    return report;
  }

  /**
   * Analyze Product fields usage
   */
  private analyzeProductFields(): { dead: DeadField[]; suspicious: DeadField[] } {
    const dead: DeadField[] = [];
    const suspicious: DeadField[] = [];

    if (!this.isFieldUsed('productos', 'stockMinimoUnidades')) {
      suspicious.push({
        collection: 'productos',
        field: 'stockMinimoUnidades',
        reason: 'Defined but rarely checked/used',
        recommendation: 'Consider removing if not needed for stock alerts',
      });
    }

    if (!this.isFieldUsed('productos', 'alertaStock')) {
      suspicious.push({
        collection: 'productos',
        field: 'alertaStock',
        reason: 'Defined but not actively used in alerts',
        recommendation: 'Implement stock alert system or remove',
      });
    }

    if (!this.isFieldUsed('productos', 'ultimoPrecio')) {
      suspicious.push({
        collection: 'productos',
        field: 'ultimoPrecio',
        reason: 'Defined but precioCompra is used instead',
        recommendation: 'Consider using ultimoPrecio for price history or remove',
      });
    }

    suspicious.push({
      collection: 'productos',
      field: 'unidadesPorPack',
      reason: 'Alias for unidadesPorEmpaque - may cause confusion',
      recommendation: 'Standardize on one field name',
    });

    return { dead, suspicious };
  }

  /**
   * Analyze Provider fields usage
   */
  private analyzeProviderFields(): { dead: DeadField[]; suspicious: DeadField[] } {
    const dead: DeadField[] = [];
    const suspicious: DeadField[] = [];

    if (!this.isFieldUsed('proveedores', 'fechaAlta')) {
      suspicious.push({
        collection: 'proveedores',
        field: 'fechaAlta',
        reason: 'Defined but may not be set on creation',
        recommendation: 'Ensure it is set when creating providers',
      });
    }

    if (!this.isFieldUsed('proveedores', 'fechaModificacion')) {
      suspicious.push({
        collection: 'proveedores',
        field: 'fechaModificacion',
        reason: 'Defined but updatedAt is used instead',
        recommendation: 'Use updatedAt consistently or remove fechaModificacion',
      });
    }

    return { dead, suspicious };
  }

  /**
   * Analyze Invoice fields usage
   */
  private analyzeInvoiceFields(): { dead: DeadField[]; suspicious: DeadField[] } {
    const dead: DeadField[] = [];
    const suspicious: DeadField[] = [];

    if (!this.isFieldUsed('facturas', 'categoria')) {
      suspicious.push({
        collection: 'facturas',
        field: 'categoria',
        reason: 'Optional field that may not be consistently used',
        recommendation: 'Use for expense categorization or remove',
      });
    }

    if (!this.isFieldUsed('facturas', 'archivo')) {
      suspicious.push({
        collection: 'facturas',
        field: 'archivo',
        reason: 'Defined but may not store file references',
        recommendation: 'Implement file storage or remove',
      });
    }

    return { dead, suspicious };
  }

  /**
   * Check if a field is used in the codebase (simplified check)
   */
  private isFieldUsed(collection: CollectionName, field: string): boolean {
    const data = getCollection(this.db, collection);

    if (data.length === 0) {
      return false;
    }

    // Check if field exists and has non-null values in at least some records
    const hasValues = data.some((item: BaseEntity) => {
      const record = item as unknown as Record<string, unknown>;
      const value = record[field];
      return value !== undefined && value !== null && value !== '';
    });

    return hasValues;
  }

  /**
   * Print dead fields report via logger
   */
  private printDeadFieldsReport(report: DeadFieldReport): void {
    logger.info('[DIAGNOSTICS] Dead Fields Analysis');

    if (report.deadFields.length === 0 && report.suspiciousFields.length === 0) {
      logger.info('No dead or suspicious fields detected!');
      return;
    }

    if (report.deadFields.length > 0) {
      logger.warn(`Dead Fields (${report.deadFields.length}):`);
      report.deadFields.forEach(field => {
        logger.warn(`  - ${field.collection}.${field.field}: ${field.reason} | ${field.recommendation}`);
      });
    }

    if (report.suspiciousFields.length > 0) {
      logger.warn(`Suspicious Fields (${report.suspiciousFields.length}):`);
      report.suspiciousFields.forEach(field => {
        logger.warn(`  - ${field.collection}.${field.field}: ${field.reason} | ${field.recommendation}`);
      });
    }
  }

  /**
   * Compare local structure with Firebase structure
   */
  async compareStructures(): Promise<void> {
    logger.info('[DIAGNOSTICS] Comparing local vs Firebase structures...');

    const collectionNames: CollectionName[] = [
      'cierres', 'facturas', 'albaranes', 'proveedores',
      'productos', 'escandallos', 'inventarios', 'delivery',
      'usuarios', 'roles'
    ];

    for (const collectionName of collectionNames) {
      const localData = getCollection(this.db, collectionName);

      try {
        const cloudResponse = await this.db.cloudService.getAll(collectionName);
        if (cloudResponse.success && cloudResponse.data) {
          const cloudData = cloudResponse.data;

          if (localData.length !== cloudData.length) {
            logger.warn(
              `[STRUCTURE] ${collectionName}: ` +
              `Local=${localData.length}, Cloud=${cloudData.length}`
            );
          }

          // Check for documents in cloud but not in local
          const cloudIds = new Set((cloudData as BaseEntity[]).map(item => String(item.id)));
          const localIds = new Set(localData.map(item => String(item.id)));

          const onlyInCloud = Array.from(cloudIds).filter(id => !localIds.has(id));
          const onlyInLocal = Array.from(localIds).filter(id => !cloudIds.has(id));

          if (onlyInCloud.length > 0) {
            logger.warn(
              `[STRUCTURE] ${collectionName}: ${onlyInCloud.length} documents only in cloud`
            );
          }

          if (onlyInLocal.length > 0) {
            logger.warn(
              `[STRUCTURE] ${collectionName}: ${onlyInLocal.length} documents only in local (unsynced)`
            );
          }
        }
      } catch (error: unknown) {
        logger.error(`[STRUCTURE] ${collectionName}: Failed to compare`, error);
      }
    }
  }
}

/**
 * Convenience function to run diagnostics
 */
export async function diagnoseDatabase(db: DatabaseService): Promise<DiagnosticReport> {
  const diagnostics = new DatabaseDiagnostics(db);
  return diagnostics.diagnoseDatabase();
}

/**
 * Convenience function to check database integrity
 */
export function checkDatabaseIntegrity(db: DatabaseService): Promise<DiagnosticReport> {
  const diagnostics = new DatabaseDiagnostics(db);
  return diagnostics.diagnoseDatabase();
}
