import { db, type CardioSession, type CardioPreset } from './schema';
import { startOfWeek, isWithinInterval } from 'date-fns';

export async function addCardioSession(input: Omit<CardioSession, 'id' | 'createdAt'>): Promise<number> {
  return db.cardioSessions.add({ ...input, createdAt: new Date().toISOString() });
}

export async function updateCardioSession(id: number, changes: Partial<CardioSession>) {
  await db.cardioSessions.update(id, changes);
}

export async function deleteCardioSession(id: number) {
  await db.cardioSessions.delete(id);
}

export async function getRecentCardioSessions(limit = 20): Promise<CardioSession[]> {
  return db.cardioSessions.orderBy('date').reverse().limit(limit).toArray();
}

export async function getAllCardioSessions(): Promise<CardioSession[]> {
  return db.cardioSessions.orderBy('date').reverse().toArray();
}

export interface WeeklyCardioTotals {
  totalKm: number;
  totalSeconds: number;
  sessionCount: number;
}

export async function getWeeklyCardioTotals(): Promise<WeeklyCardioTotals> {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const all = await db.cardioSessions.toArray();
  const thisWeek = all.filter((s) => isWithinInterval(new Date(s.date), { start: weekStart, end: new Date() }));
  return {
    totalKm: thisWeek.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0),
    totalSeconds: thisWeek.reduce((sum, s) => sum + s.durationSeconds, 0),
    sessionCount: thisWeek.length,
  };
}

export function paceMinPerKm(durationSeconds: number, distanceKm?: number): string | null {
  if (!distanceKm || distanceKm <= 0) return null;
  const paceSeconds = durationSeconds / distanceKm;
  const min = Math.floor(paceSeconds / 60);
  const sec = Math.round(paceSeconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')} /km`;
}

export async function getCardioPresets(): Promise<CardioPreset[]> {
  return db.cardioPresets.toArray();
}

export type CardioPresetInput = Omit<CardioPreset, 'id' | 'createdAt'>;

export async function createCardioPreset(input: CardioPresetInput): Promise<number> {
  return db.cardioPresets.add({ ...input, createdAt: new Date().toISOString() });
}

export async function updateCardioPreset(id: number, input: CardioPresetInput): Promise<void> {
  await db.cardioPresets.update(id, input);
}

export async function deleteCardioPreset(id: number): Promise<void> {
  await db.cardioPresets.delete(id);
}

export interface CardioPersonalBests {
  longestRunKm?: number;
  fastestPace?: { seconds: number; label: string };
  longestDurationSeconds?: number;
}

export async function getCardioPersonalBests(activityType?: string): Promise<CardioPersonalBests> {
  const all = await db.cardioSessions.toArray();
  const sessions = activityType ? all.filter((s) => s.activityType === activityType) : all;
  if (sessions.length === 0) return {};
  const longestRunKm = Math.max(...sessions.map((s) => s.distanceKm ?? 0));
  const longestDurationSeconds = Math.max(...sessions.map((s) => s.durationSeconds));
  const withPace = sessions
    .filter((s) => s.distanceKm && s.distanceKm > 0)
    .map((s) => ({ seconds: s.durationSeconds / s.distanceKm!, session: s }))
    .sort((a, b) => a.seconds - b.seconds);
  const fastest = withPace[0];
  return {
    longestRunKm: longestRunKm > 0 ? longestRunKm : undefined,
    longestDurationSeconds,
    fastestPace: fastest ? { seconds: fastest.seconds, label: paceMinPerKm(fastest.session.durationSeconds, fastest.session.distanceKm)! } : undefined,
  };
}
