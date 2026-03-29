import { logger } from '@core/services/LoggerService';
import type { DatabaseService } from '@core/services/DatabaseService';
import type { AppUser, BaseEntity } from '@types';

interface FichajeRecord extends BaseEntity {
  workerId: string;
  [key: string]: unknown;
}

/**
 * Migrates fichajes workerId from name-based to uid-based.
 *
 * Background: FichajesPage.tsx now writes `workerId: user.uid` but old fichajes
 * records have `workerId: "Juan García"` (name). Reports and filters by workerId
 * are broken silently — same person appears as 2 different workers.
 *
 * Safe to run multiple times (idempotent).
 */
export async function migrateFichajesWorkerIds(
  db: DatabaseService
): Promise<{ migrated: number; skipped: number; failed: number }> {
  const fichajes = db.fichajes as FichajeRecord[];
  const usuarios = db.usuarios as AppUser[];

  if (fichajes.length === 0 || usuarios.length === 0) {
    return { migrated: 0, skipped: 0, failed: 0 };
  }

  // Build uid lookup from usuarios
  const uidSet = new Set(
    usuarios.map((u) => u.uid || String(u.id))
  );

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const fichaje of fichajes) {
    // Skip if workerId is already a uid (exists in uidSet)
    if (uidSet.has(fichaje.workerId)) {
      skipped++;
      continue;
    }

    // workerId is a name — find matching user
    const matchingUser = usuarios.find((u) => u.nombre === fichaje.workerId);
    if (!matchingUser) {
      logger.warn(
        'migrateFichajesWorkerIds: no user found for workerId',
        { workerId: fichaje.workerId, fichajeId: fichaje.id }
      );
      failed++;
      continue;
    }

    const newWorkerId = matchingUser.uid || String(matchingUser.id);
    try {
      await db.update('fichajes', fichaje.id, { workerId: newWorkerId } as Partial<BaseEntity>);
      migrated++;
    } catch (error: unknown) {
      logger.error('migrateFichajesWorkerIds: failed to update fichaje', error);
      failed++;
    }
  }

  logger.info('migrateFichajesWorkerIds complete', { migrated, skipped, failed });
  return { migrated, skipped, failed };
}
