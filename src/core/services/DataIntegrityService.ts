import type { BaseEntity, CollectionName } from '@types';
import type { DatabaseService } from './DatabaseService';
import { toRecord } from '@shared/utils';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface OrphanedRecord {
  collection: CollectionName;
  id: number | string;
  field: string;
  referencedId: number | string;
  referencedCollection: CollectionName;
}

export interface IntegrityReport {
  isValid: boolean;
  orphanedRecords: OrphanedRecord[];
  missingFields: Array<{ collection: CollectionName; id: number | string; field: string }>;
  typeMismatches: Array<{ collection: CollectionName; id: number | string; field: string; expected: string; actual: string }>;
  suggestions: string[];
}

/**
 * Data Integrity Service
 * Validates foreign key relationships and data integrity
 */
export class DataIntegrityService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Type-safe field accessor for BaseEntity items with dynamic field names
   */
  private getRecord(item: BaseEntity): Record<string, unknown> {
    return toRecord(item);
  }

  /**
   * Validate that a foreign key reference exists
   */
  validateForeignKey(
    collection: CollectionName,
    field: string,
    value: number | string | undefined | null,
    required: boolean = true
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (value === undefined || value === null || value === '') {
      if (required) {
        errors.push(`Field ${field} is required in ${collection}`);
      }
      return { valid: errors.length === 0, errors, warnings };
    }

    const relationships = this.db.getRelationshipsMap();
    const collectionRelations = relationships[collection];

    if (!collectionRelations || !collectionRelations[field]) {
      warnings.push(`No relationship defined for ${collection}.${field}`);
      return { valid: true, errors, warnings };
    }

    const relationship = collectionRelations[field];
    const targetCollection = this.db[relationship.target] as BaseEntity[];

    if (!targetCollection) {
      errors.push(`Target collection ${relationship.target} not found`);
      return { valid: false, errors, warnings };
    }

    const exists = targetCollection.some(item => {
      // Handle both number and string IDs
      if (typeof value === 'number' && typeof item.id === 'number') {
        return item.id === value;
      }
      return String(item.id) === String(value);
    });

    if (!exists) {
      errors.push(
        `Foreign key violation: ${collection}.${field} = ${value} does not exist in ${relationship.target}`
      );
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate all relationships in the database
   */
  validateAllRelationships(): IntegrityReport {
    const orphanedRecords: OrphanedRecord[] = [];
    const missingFields: Array<{ collection: CollectionName; id: number | string; field: string }> = [];
    const typeMismatches: Array<{ collection: CollectionName; id: number | string; field: string; expected: string; actual: string }> = [];
    const suggestions: string[] = [];

    const relationships = this.db.getRelationshipsMap();

    // Validate direct foreign keys
    for (const [collectionName, fields] of Object.entries(relationships)) {
      const collection = this.db[collectionName as CollectionName] as BaseEntity[];
      if (!collection) continue;

      for (const [field, config] of Object.entries(fields)) {
        const targetCollection = this.db[config.target] as BaseEntity[];

        for (const item of collection) {
          const value = this.getRecord(item)[field];

          if (value === undefined || value === null || value === '') {
            if (config.required) {
              missingFields.push({
                collection: collectionName as CollectionName,
                id: item.id,
                field,
              });
            }
            continue;
          }

          // Check type consistency
          const targetIds = targetCollection.map(t => t.id);
          const valueStr = String(value);
          const exists = targetIds.some(id => String(id) === valueStr);

          if (!exists) {
            orphanedRecords.push({
              collection: collectionName as CollectionName,
              id: item.id,
              field,
              referencedId: value as number | string,
              referencedCollection: config.target,
            });
          }
        }
      }
    }

    // Validate nested references (productos in inventarios, ingredientes in escandallos)
    this.validateNestedReferences(orphanedRecords);

    const isValid = orphanedRecords.length === 0 && missingFields.length === 0;

    if (orphanedRecords.length > 0) {
      suggestions.push(`Found ${orphanedRecords.length} orphaned records. Consider cleaning up or fixing references.`);
    }

    if (missingFields.length > 0) {
      suggestions.push(`Found ${missingFields.length} records with missing required fields.`);
    }

    return {
      isValid,
      orphanedRecords,
      missingFields,
      typeMismatches,
      suggestions,
    };
  }

  /**
   * Validate nested references (arrays with foreign keys)
   */
  private validateNestedReferences(
    orphanedRecords: OrphanedRecord[]
  ): void {
    // Validate inventarios.productos[].productoId
    const inventarios = this.db.inventarios as BaseEntity[];
    const productos = this.db.productos as BaseEntity[];
    const productoIds = new Set(productos.map(p => String(p.id)));

    for (const inventario of inventarios) {
      const invRecord = this.getRecord(inventario);
      const invProductos = invRecord['productos'];
      if (invProductos && Array.isArray(invProductos)) {
        for (const producto of invProductos as Record<string, unknown>[]) {
          if (producto['productoId'] && !productoIds.has(String(producto['productoId']))) {
            orphanedRecords.push({
              collection: 'inventarios',
              id: inventario.id,
              field: 'productos[].productoId',
              referencedId: producto['productoId'] as number | string,
              referencedCollection: 'productos',
            });
          }
        }
      }
    }

    // Validate escandallos.ingredientes[].productoId
    const escandallos = this.db.escandallos as BaseEntity[];
    for (const escandallo of escandallos) {
      const escRecord = this.getRecord(escandallo);
      const ingredientes = escRecord['ingredientes'];
      if (ingredientes && Array.isArray(ingredientes)) {
        for (const ingrediente of ingredientes as Record<string, unknown>[]) {
          if (ingrediente['productoId'] && !productoIds.has(String(ingrediente['productoId']))) {
            orphanedRecords.push({
              collection: 'escandallos',
              id: escandallo.id,
              field: 'ingredientes[].productoId',
              referencedId: ingrediente['productoId'] as number | string,
              referencedCollection: 'productos',
            });
          }
        }
      }
    }

    // Validate facturas.productos[].productoId (optional)
    const facturas = this.db.facturas as BaseEntity[];
    for (const factura of facturas) {
      const facRecord = this.getRecord(factura);
      const facProductos = facRecord['productos'];
      if (facProductos && Array.isArray(facProductos)) {
        for (const producto of facProductos as Record<string, unknown>[]) {
          if (producto['productoId'] && !productoIds.has(String(producto['productoId']))) {
            orphanedRecords.push({
              collection: 'facturas',
              id: factura.id,
              field: 'productos[].productoId',
              referencedId: producto['productoId'] as number | string,
              referencedCollection: 'productos',
            });
          }
        }
      }
    }

    // Validate albaranes.productos[].productoId (optional)
    const albaranes = this.db.albaranes as BaseEntity[];
    for (const albaran of albaranes) {
      const albRecord = this.getRecord(albaran);
      const albProductos = albRecord['productos'];
      if (albProductos && Array.isArray(albProductos)) {
        for (const producto of albProductos as Record<string, unknown>[]) {
          if (producto['productoId'] && !productoIds.has(String(producto['productoId']))) {
            orphanedRecords.push({
              collection: 'albaranes',
              id: albaran.id,
              field: 'productos[].productoId',
              referencedId: producto['productoId'] as number | string,
              referencedCollection: 'productos',
            });
          }
        }
      }
    }
  }

  /**
   * Find orphaned records (records with broken foreign key references)
   */
  findOrphanedRecords(): OrphanedRecord[] {
    const report = this.validateAllRelationships();
    return report.orphanedRecords;
  }

  /**
   * Check if a record can be safely deleted (no references to it)
   */
  canDelete(collection: CollectionName, id: number | string): {
    canDelete: boolean;
    blockingReferences: Array<{ collection: CollectionName; id: number | string; field: string }>;
  } {
    const blockingReferences: Array<{ collection: CollectionName; id: number | string; field: string }> = [];
    const reverseRelations = this.db.getReverseRelationships(collection);

    for (const rel of reverseRelations) {
      const collectionData = this.db[rel.collection] as BaseEntity[];

      for (const item of collectionData) {
        const itemRecord = this.getRecord(item);
        const value = itemRecord[rel.field];

        // Handle nested references
        if (rel.field.includes('[]')) {
          const [parentField, nestedField] = rel.field.split('[]');
          const array = itemRecord[parentField];

          if (Array.isArray(array)) {
            for (const element of array as Record<string, unknown>[]) {
              const nestedValue = element[nestedField.replace('.', '')];
              if (nestedValue !== undefined && String(nestedValue) === String(id)) {
                blockingReferences.push({
                  collection: rel.collection,
                  id: item.id,
                  field: rel.field,
                });
              }
            }
          }
        } else {
          if (value !== undefined && value !== null && String(value) === String(id)) {
            if (rel.required) {
              blockingReferences.push({
                collection: rel.collection,
                id: item.id,
                field: rel.field,
              });
            }
          }
        }
      }
    }

    return {
      canDelete: blockingReferences.length === 0,
      blockingReferences,
    };
  }

  /**
   * Suggest fixes for integrity issues
   */
  suggestFixes(report: IntegrityReport): string[] {
    const suggestions: string[] = [];

    if (report.orphanedRecords.length > 0) {
      suggestions.push(`Found ${report.orphanedRecords.length} orphaned records. Options:`);
      suggestions.push('  1. Delete orphaned records');
      suggestions.push('  2. Fix references to point to existing records');
      suggestions.push('  3. Create missing referenced records');
    }

    if (report.missingFields.length > 0) {
      suggestions.push(`Found ${report.missingFields.length} records with missing required fields.`);
      suggestions.push('  Consider adding default values or removing invalid records.');
    }

    // Group orphaned records by type
    const byType = new Map<string, number>();
    for (const orphan of report.orphanedRecords) {
      const key = `${orphan.collection}.${orphan.field}`;
      byType.set(key, (byType.get(key) || 0) + 1);
    }

    for (const [key, count] of byType.entries()) {
      suggestions.push(`  - ${key}: ${count} orphaned references`);
    }

    return suggestions;
  }
}

