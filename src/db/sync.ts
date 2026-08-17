import type { Table } from 'dexie';
import { db, SYNCED_TABLES, KEY_SYNCED_TABLES, type SyncedTable, type Tombstone } from './schema';

type AnyTable = Table<Record<string, unknown>, unknown>;

const LAST_SYNCED_KEY = 'elite:lastSyncedAt';

const RAW_API_URL = import.meta.env.VITE_API_URL as string | undefined;
const SYNC_TOKEN = import.meta.env.VITE_SYNC_TOKEN as string | undefined;

/** Sync is entirely opt-in: without a configured server this app is exactly
 * what it always was — local-only, no network calls, nothing to configure.
 * The special value "same-origin" (what the Dockerfile bakes in by default)
 * targets a relative /api/sync instead of an absolute origin — the bundled
 * deploy serves the frontend and the API from the same process and port,
 * so there's no server URL to configure at all. */
export const isSyncEnabled = Boolean(RAW_API_URL);
const API_URL = RAW_API_URL === 'same-origin' ? '' : RAW_API_URL?.replace(/\/$/, '');

function getLastSyncedAt(): number {
  return Number(localStorage.getItem(LAST_SYNCED_KEY) ?? 0);
}
function setLastSyncedAt(t: number): void {
  localStorage.setItem(LAST_SYNCED_KEY, String(t));
}

export type SyncStatus = 'disabled' | 'idle' | 'syncing' | 'offline' | 'error';

let status: SyncStatus = isSyncEnabled ? 'idle' : 'disabled';
const listeners = new Set<(s: SyncStatus) => void>();

function setStatus(next: SyncStatus): void {
  status = next;
  for (const fn of listeners) fn(status);
}

export function getSyncStatus(): SyncStatus {
  return status;
}

export function subscribeSyncStatus(fn: (s: SyncStatus) => void): () => void {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

type ChangesPayload = Partial<Record<SyncedTable, Array<Record<string, unknown>>>>;

async function collectLocalChanges(since: number): Promise<{ changes: ChangesPayload; tombstones: Tombstone[] }> {
  const changes: ChangesPayload = {};
  for (const table of SYNCED_TABLES) {
    const rows = await (db.table(table) as AnyTable)
      .filter((row) => Number(row.updatedAt ?? 0) > since)
      .toArray();
    if (rows.length > 0) changes[table] = rows;
  }
  const tombstones = await db.tombstones.where('deletedAt').above(since).toArray();
  return { changes, tombstones };
}

function isKeyTable(table: string): table is (typeof KEY_SYNCED_TABLES)[number] {
  return (KEY_SYNCED_TABLES as readonly string[]).includes(table);
}

/** Upserts an incoming row by its sync identity, not by local autoincrement
 * id — the server has no idea what numeric id this device assigned, and two
 * devices independently autoincrementing would collide constantly. A
 * uuid-keyed table looks up the local row by uuid and preserves whatever
 * local id it already has (or lets Dexie assign a fresh one for a row this
 * device has never seen); a key-keyed table's primary key already IS its
 * sync identity, so a plain put suffices. */
async function applyIncomingRow(table: SyncedTable, row: Record<string, unknown>): Promise<void> {
  const t = db.table(table) as AnyTable;
  if (isKeyTable(table)) {
    await t.put(row);
    return;
  }
  const uuid = row.uuid as string | undefined;
  if (!uuid) return;
  const existing = await t.where('uuid').equals(uuid).first();
  if (existing) {
    await t.update(existing.id as never, { ...row, id: existing.id });
  } else {
    await t.add({ ...row, id: undefined });
  }
}

async function applyIncomingTombstone(tomb: Tombstone): Promise<void> {
  const table = tomb.table as SyncedTable;
  if (!SYNCED_TABLES.includes(table)) return;
  const t = db.table(table) as AnyTable;
  if (isKeyTable(table)) {
    await t.delete(tomb.uuid);
    return;
  }
  const existing = await t.where('uuid').equals(tomb.uuid).first();
  if (existing) await t.delete(existing.id as never);
}

async function applyIncoming(changes: ChangesPayload, tombstones: Tombstone[]): Promise<void> {
  for (const [table, rows] of Object.entries(changes) as [SyncedTable, Array<Record<string, unknown>>][]) {
    for (const row of rows) await applyIncomingRow(table, row);
  }
  for (const tomb of tombstones) await applyIncomingTombstone(tomb);
}

let syncing = false;
let debounceHandle: ReturnType<typeof setTimeout> | null = null;

export async function runSync(): Promise<void> {
  if (!isSyncEnabled || syncing) return;
  if (!navigator.onLine) {
    setStatus('offline');
    return;
  }
  syncing = true;
  setStatus('syncing');
  try {
    const since = getLastSyncedAt();
    const { changes, tombstones } = await collectLocalChanges(since);
    const res = await fetch(`${API_URL}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SYNC_TOKEN ? { Authorization: `Bearer ${SYNC_TOKEN}` } : {}),
      },
      body: JSON.stringify({ since, changes, tombstones }),
    });
    if (!res.ok) throw new Error(`Sync request failed: ${res.status}`);
    const payload = (await res.json()) as { serverTime: number; changes: ChangesPayload; tombstones: Tombstone[] };
    await applyIncoming(payload.changes ?? {}, payload.tombstones ?? []);
    setLastSyncedAt(payload.serverTime);
    setStatus('idle');
  } catch (e) {
    console.error('Elite sync failed:', e);
    setStatus('error');
  } finally {
    syncing = false;
  }
}

/** Debounced so a burst of writes (e.g. applying a workout preset, which
 * logs several sets in a row) collapses into one sync round instead of one
 * per row. */
export function scheduleSync(delayMs = 800): void {
  if (!isSyncEnabled) return;
  if (debounceHandle) clearTimeout(debounceHandle);
  debounceHandle = setTimeout(() => void runSync(), delayMs);
}

export function initSync(): void {
  if (!isSyncEnabled) return;
  window.addEventListener('online', () => void runSync());
  window.addEventListener('offline', () => setStatus('offline'));
  void runSync();
}
