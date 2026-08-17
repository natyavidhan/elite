import { db, today, type BodyWeightLog } from './schema';
import { subDays, isAfter } from 'date-fns';
import { recordTombstone } from './tombstones';
import { scheduleSync } from './sync';

export async function upsertBodyWeight(input: { date?: string; weightKg: number; bodyFatPct?: number; notes?: string }): Promise<void> {
  const date = input.date ?? today();
  // Check-then-write runs in one transaction so two concurrent callers
  // serialize instead of both reading "no row yet" and both inserting.
  await db.transaction('rw', db.bodyWeightLogs, async () => {
    const existing = await db.bodyWeightLogs.where('date').equals(date).first();
    if (existing?.id) {
      await db.bodyWeightLogs.update(existing.id, { weightKg: input.weightKg, bodyFatPct: input.bodyFatPct, notes: input.notes });
      return;
    }
    try {
      await db.bodyWeightLogs.add({ date, weightKg: input.weightKg, bodyFatPct: input.bodyFatPct, notes: input.notes, createdAt: new Date().toISOString() });
    } catch {
      // `date` is uniquely indexed — a concurrent writer outside this transaction may have just inserted it first.
      const winner = await db.bodyWeightLogs.where('date').equals(date).first();
      if (winner?.id) await db.bodyWeightLogs.update(winner.id, { weightKg: input.weightKg, bodyFatPct: input.bodyFatPct, notes: input.notes });
    }
  });
  scheduleSync();
}

export async function deleteBodyWeightLog(id: number) {
  const row = await db.bodyWeightLogs.get(id);
  await db.transaction('rw', db.bodyWeightLogs, db.tombstones, async () => {
    await db.bodyWeightLogs.delete(id);
    await recordTombstone('bodyWeightLogs', row?.uuid);
  });
  scheduleSync();
}

export async function getTodayBodyWeight(): Promise<BodyWeightLog | undefined> {
  return db.bodyWeightLogs.where('date').equals(today()).first();
}

export async function getAllBodyWeightLogs(): Promise<BodyWeightLog[]> {
  return db.bodyWeightLogs.orderBy('date').toArray();
}

export type WeightRange = '1w' | '1m' | '3m' | 'all';

export async function getBodyWeightLogsInRange(range: WeightRange): Promise<BodyWeightLog[]> {
  const all = await getAllBodyWeightLogs();
  if (range === 'all') return all;
  const days = range === '1w' ? 7 : range === '1m' ? 30 : 90;
  const cutoff = subDays(new Date(), days);
  return all.filter((log) => isAfter(new Date(log.date), cutoff));
}

export interface BodyWeightStats {
  current?: number;
  starting?: number;
  changeKg?: number;
  sevenDayAverage?: number;
}

export async function getBodyWeightStats(): Promise<BodyWeightStats> {
  const all = await getAllBodyWeightLogs();
  if (all.length === 0) return {};
  const current = all[all.length - 1].weightKg;
  const starting = all[0].weightKg;
  const last7 = all.slice(-7);
  const sevenDayAverage = last7.reduce((sum, l) => sum + l.weightKg, 0) / last7.length;
  return { current, starting, changeKg: current - starting, sevenDayAverage };
}
