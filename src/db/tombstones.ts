import { db, type SyncedTable } from './schema';

/** Records a delete so it propagates to the server (and other devices) on
 * the next sync, instead of just disappearing locally. Call this — inside
 * the same transaction as the real delete — from every function that
 * removes a row from a synced table. */
export async function recordTombstone(table: SyncedTable, uuid: string | undefined): Promise<void> {
  if (!uuid) return;
  await db.tombstones.add({ table, uuid, deletedAt: Date.now() });
}
