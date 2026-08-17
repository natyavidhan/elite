import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, 'elite.sqlite'));
db.pragma('journal_mode = WAL');

// One generic table for every synced Dexie table, keyed by (table_name,
// uuid) with the full row stored as a JSON blob. The server never needs to
// know a WorkoutSet's shape from a FoodLog's — the client's Dexie schema is
// the single source of truth for field shapes, so an app-side schema change
// never needs a server migration.
db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    table_name TEXT NOT NULL,
    uuid TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    data TEXT NOT NULL,
    PRIMARY KEY (table_name, uuid)
  );
  CREATE INDEX IF NOT EXISTS idx_records_updated_at ON records (updated_at);

  CREATE TABLE IF NOT EXISTS tombstones (
    table_name TEXT NOT NULL,
    uuid TEXT NOT NULL,
    deleted_at INTEGER NOT NULL,
    PRIMARY KEY (table_name, uuid)
  );
  CREATE INDEX IF NOT EXISTS idx_tombstones_deleted_at ON tombstones (deleted_at);
`);

const selectTableRows = db.prepare(`SELECT data FROM records WHERE table_name = ?`);

/** Every synced Dexie table's current (non-deleted) rows, parsed from the
 * generic JSON blob store — the same rows the client would see, since a
 * delete already removes its row from `records` at sync time. */
export function getTableRows(tableName) {
  return selectTableRows.all(tableName).map((row) => JSON.parse(row.data));
}
