import { Router } from 'express';
import { db } from './db.js';

// Last-write-wins on updatedAt, scoped per (table, uuid) row — the `WHERE
// excluded... >=` clause makes a stale push a no-op instead of clobbering a
// newer write that arrived from another device first.
const upsertRecord = db.prepare(`
  INSERT INTO records (table_name, uuid, updated_at, data)
  VALUES (@table, @uuid, @updatedAt, @data)
  ON CONFLICT(table_name, uuid) DO UPDATE SET
    updated_at = excluded.updated_at,
    data = excluded.data
  WHERE excluded.updated_at >= records.updated_at
`);
const deleteRecord = db.prepare(`DELETE FROM records WHERE table_name = ? AND uuid = ?`);
const upsertTombstone = db.prepare(`
  INSERT INTO tombstones (table_name, uuid, deleted_at)
  VALUES (@table, @uuid, @deletedAt)
  ON CONFLICT(table_name, uuid) DO UPDATE SET
    deleted_at = excluded.deleted_at
  WHERE excluded.deleted_at >= tombstones.deleted_at
`);
const selectChangedRecords = db.prepare(`SELECT table_name, data FROM records WHERE updated_at > ?`);
const selectChangedTombstones = db.prepare(`SELECT table_name as "table", uuid, deleted_at as deletedAt FROM tombstones WHERE deleted_at > ?`);

const applyPush = db.transaction((changes, tombstones) => {
  for (const [table, rows] of Object.entries(changes)) {
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      const uuid = row?.uuid ?? row?.id ?? row?.key;
      if (!uuid || row.updatedAt == null) continue;
      upsertRecord.run({ table, uuid: String(uuid), updatedAt: row.updatedAt, data: JSON.stringify(row) });
    }
  }
  for (const t of tombstones) {
    if (!t?.table || !t?.uuid || t.deletedAt == null) continue;
    upsertTombstone.run({ table: t.table, uuid: t.uuid, deletedAt: t.deletedAt });
    deleteRecord.run(t.table, t.uuid);
  }
});

export function syncRouter() {
  const router = Router();

  // One round trip does both halves of the sync: the client's local
  // changes since its last cursor are merged in first, then everything
  // that's changed on the server since that same cursor (including what
  // another device pushed) comes back in the response.
  router.post('/sync', (req, res) => {
    const { since = 0, changes = {}, tombstones = [] } = req.body ?? {};
    const now = Date.now();

    applyPush(changes, tombstones);

    const grouped = {};
    for (const row of selectChangedRecords.all(since)) {
      (grouped[row.table_name] ??= []).push(JSON.parse(row.data));
    }
    const changedTombstones = selectChangedTombstones.all(since);

    res.json({ serverTime: now, changes: grouped, tombstones: changedTombstones });
  });

  return router;
}
