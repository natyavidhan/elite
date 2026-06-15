import { getDb } from './schema';

export interface CardioSession {
  id: number;
  date: string;
  activity_type: string;
  duration_seconds: number;
  distance_km: number | null;
  avg_heart_rate: number | null;
  calories_burned: number | null;
  notes: string | null;
  created_at: string;
}

export async function logCardioSession(session: {
  date: string;
  activityType: string;
  durationSeconds: number;
  distanceKm?: number;
  avgHeartRate?: number;
  caloriesBurned?: number;
  notes?: string;
}): Promise<number> {
  const db = getDb();
  const result = await db.runAsync(
    'INSERT INTO cardio_sessions (date, activity_type, duration_seconds, distance_km, avg_heart_rate, calories_burned, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    session.date,
    session.activityType,
    session.durationSeconds,
    session.distanceKm ?? null,
    session.avgHeartRate ?? null,
    session.caloriesBurned ?? null,
    session.notes ?? null
  );
  return result.lastInsertRowId;
}

export async function getCardioSessions(limit = 50): Promise<CardioSession[]> {
  const db = getDb();
  return db.getAllAsync<CardioSession>(
    'SELECT * FROM cardio_sessions ORDER BY date DESC, created_at DESC LIMIT ?',
    limit
  );
}

export async function getWeeklyTotals(): Promise<{ totalKm: number; totalSeconds: number; sessionCount: number }> {
  const db = getDb();
  const result = await db.getFirstAsync<{ totalKm: number; totalSeconds: number; sessionCount: number }>(
    `SELECT
       COALESCE(SUM(distance_km), 0) as totalKm,
       COALESCE(SUM(duration_seconds), 0) as totalSeconds,
       COUNT(*) as sessionCount
     FROM cardio_sessions
     WHERE date >= date('now', 'weekday 1', '-7 days')`
  );
  return result ?? { totalKm: 0, totalSeconds: 0, sessionCount: 0 };
}

export async function deleteCardioSession(sessionId: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM cardio_sessions WHERE id = ?', sessionId);
}

export async function getPersonalBests(): Promise<{
  longestDistance: number;
  fastestPace: number;
  longestDuration: number;
}> {
  const db = getDb();
  const longestDistance = await db.getFirstAsync<{ val: number }>(
    "SELECT MAX(distance_km) as val FROM cardio_sessions WHERE activity_type = 'run'"
  );
  const longestDuration = await db.getFirstAsync<{ val: number }>(
    'SELECT MAX(duration_seconds) as val FROM cardio_sessions'
  );
  const fastestPace = await db.getFirstAsync<{ val: number }>(
    "SELECT MIN(duration_seconds / 60.0 / distance_km) as val FROM cardio_sessions WHERE activity_type = 'run' AND distance_km > 0"
  );
  return {
    longestDistance: longestDistance?.val ?? 0,
    fastestPace: fastestPace?.val ?? 0,
    longestDuration: longestDuration?.val ?? 0,
  };
}
