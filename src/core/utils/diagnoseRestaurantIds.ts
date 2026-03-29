/**
 * Diagnostic script: counts documents WITHOUT restaurantId per collection.
 *
 * Run from browser console or integrate into admin tools.
 * Used to determine if canAccessDocument() legacy bypass (C-4) can be removed.
 *
 * Decision flow (from Aitor, Session #008):
 * - If few docs (test data) → migrate and close the bypass
 * - If many docs → migrate progressively + add logging
 *
 * Tracked in: docs/AUDITORIA_IMPLACABLE_POST_TURMIX.md (C-01)
 */

import {
  collection,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
import { getFirestoreInstance } from '../../config/firebase.config';
import { logger } from '../services/LoggerService';

/** Collections that should have restaurantId on every document */
const COLLECTIONS_REQUIRING_RESTAURANT_ID = [
  'cierres',
  'facturas',
  'albaranes',
  'inventarios',
  'delivery',
  'mermas',
  'orders',
  'transfers',
  'gastosFijos',
  'pnl_adjustments',
  'proveedores',
  'productos',
  'escandallos',
  'workers',
  'fichajes',
  'absences',
  'vacation_requests',
  'nominas',
] as const;

export interface DiagnosticResult {
  collection: string;
  totalDocs: number;
  withRestaurantId: number;
  withoutRestaurantId: number;
  percentage: string;
}

/**
 * Scans all restaurant-filtered collections and counts documents
 * missing the restaurantId field.
 *
 * @returns Array of results per collection + summary
 */
export async function diagnoseRestaurantIds(): Promise<{
  results: DiagnosticResult[];
  totalWithout: number;
  totalDocs: number;
  canRemoveBypass: boolean;
}> {
  const db = getFirestoreInstance();
  const results: DiagnosticResult[] = [];
  let totalWithout = 0;
  let totalDocs = 0;

  logger.info('=== DIAGNOSTIC: Documents without restaurantId ===');

  for (const col of COLLECTIONS_REQUIRING_RESTAURANT_ID) {
    try {
      const q = query(collection(db, col), limit(500));
      const snapshot = await getDocs(q);

      let withId = 0;
      let withoutId = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.restaurantId && data.restaurantId !== '') {
          withId++;
        } else {
          withoutId++;
          // Log first few for debugging
          if (withoutId <= 3) {
            logger.warn(
              `[DIAGNOSTIC] ${col}/${doc.id}: missing restaurantId`
            );
          }
        }
      }

      const total = withId + withoutId;
      const pct = total > 0 ? ((withoutId / total) * 100).toFixed(1) : '0.0';

      results.push({
        collection: col,
        totalDocs: total,
        withRestaurantId: withId,
        withoutRestaurantId: withoutId,
        percentage: `${pct}%`,
      });

      totalWithout += withoutId;
      totalDocs += total;

      if (withoutId > 0) {
        logger.warn(
          `[DIAGNOSTIC] ${col}: ${withoutId}/${total} docs sin restaurantId (${pct}%)`
        );
      } else {
        logger.info(`[DIAGNOSTIC] ${col}: OK (${total} docs, all have restaurantId)`);
      }
    } catch (error: unknown) {
      logger.error(`[DIAGNOSTIC] Error scanning ${col}:`, error);
      results.push({
        collection: col,
        totalDocs: 0,
        withRestaurantId: 0,
        withoutRestaurantId: 0,
        percentage: 'ERROR',
      });
    }
  }

  const canRemoveBypass = totalWithout === 0;

  logger.info('=== DIAGNOSTIC SUMMARY ===');
  logger.info(`Total collections scanned: ${results.length}`);
  logger.info(`Total documents: ${totalDocs}`);
  logger.info(`Documents without restaurantId: ${totalWithout}`);
  logger.info(`Can remove legacy bypass: ${canRemoveBypass ? 'YES' : 'NO'}`);

  return { results, totalWithout, totalDocs, canRemoveBypass };
}
