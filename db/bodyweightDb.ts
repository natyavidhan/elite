import { getDb } from './schema';

export interface BodyWeightLog {
  id: number;
  date: string;
  weight_kg: number;
  body_fat_pct: number | null;
  notes: string | null;
  created_at: string;
}

export async function upsertWeight(entry: {
  date: string;
  weightKg: number;
  bodyFatPct?: number;
  notes?: string;
}): Promise<void> {
  const db = getDb();
  const existing = await db.getFirstAsync<BodyWeightLog>(
    'SELECT * FROM body_weight_logs WHERE date = ?',
    entry.date
  );
  if (existing) {
    await db.runAsync(
      'UPDATE body_weight_logs SET weight_kg = ?, body_fat_pct = ?, notes = ? WHERE id = ?',
      entry.weightKg,
      entry.bodyFatPct ?? null,
      entry.notes ?? null,
      existing.id
    );
  } else {
    await db.runAsync(
      'INSERT INTO body_weight_logs (date, weight_kg, body_fat_pct, notes) VALUES (?, ?, ?, ?)',
      entry.date,
      entry.weightKg,
      entry.bodyFatPct ?? null,
      entry.notes ?? null
    );
  }
}

export async function getWeightForDate(date: string): Promise<BodyWeightLog | null> {
  const db = getDb();
  return db.getFirstAsync<BodyWeightLog>(
    'SELECT * FROM body_weight_logs WHERE date = ?',
    date
  );
}

export async function getAllWeights(limit = 100): Promise<BodyWeightLog[]> {
  const db = getDb();
  return db.getAllAsync<BodyWeightLog>(
    'SELECT * FROM body_weight_logs ORDER BY date DESC LIMIT ?',
    limit
  );
}

export async function deleteWeight(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM body_weight_logs WHERE id = ?', id);
}

export async function getWeightStats(): Promise<{
  current: number | null;
  starting: number | null;
  change: number | null;
  sevenDayAvg: number | null;
}> {
  const db = getDb();
  const first = await db.getFirstAsync<{ weight_kg: number }>(
    'SELECT weight_kg FROM body_weight_logs ORDER BY date ASC LIMIT 1'
  );
  const latest = await db.getFirstAsync<{ weight_kg: number }>(
    'SELECT weight_kg FROM body_weight_logs ORDER BY date DESC LIMIT 1'
  );
  const avg7 = await db.getFirstAsync<{ avg: number }>(
    'SELECT AVG(weight_kg) as avg FROM body_weight_logs WHERE date >= date("now", "-7 days")'
  );
  return {
    current: latest?.weight_kg ?? null,
    starting: first?.weight_kg ?? null,
    change: latest && first ? latest.weight_kg - first.weight_kg : null,
    sevenDayAvg: avg7?.avg ?? null,
  };
}
