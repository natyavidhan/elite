import { getDb } from './schema';

export interface WorkoutSession {
  id: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface WorkoutSet {
  id: number;
  session_id: number;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  rpe: number | null;
  created_at: string;
}

export interface WorkoutSessionWithSets extends WorkoutSession {
  sets: WorkoutSet[];
}

export async function createSession(date: string, notes?: string): Promise<number> {
  const db = getDb();
  const result = await db.runAsync(
    'INSERT INTO workout_sessions (date, notes) VALUES (?, ?)',
    date,
    notes ?? null
  );
  return result.lastInsertRowId;
}

export async function getSessionById(id: number): Promise<WorkoutSession | null> {
  const db = getDb();
  return db.getFirstAsync<WorkoutSession>('SELECT * FROM workout_sessions WHERE id = ?', id);
}

export async function getSessionWithSets(id: number): Promise<WorkoutSessionWithSets | null> {
  const db = getDb();
  const session = await db.getFirstAsync<WorkoutSession>('SELECT * FROM workout_sessions WHERE id = ?', id);
  if (!session) return null;
  const sets = await db.getAllAsync<WorkoutSet>(
    'SELECT * FROM workout_sets WHERE session_id = ? ORDER BY exercise_id, set_number',
    id
  );
  return { ...session, sets };
}

export async function getAllSessions(limit = 50): Promise<WorkoutSession[]> {
  const db = getDb();
  return db.getAllAsync<WorkoutSession>(
    'SELECT * FROM workout_sessions ORDER BY date DESC, created_at DESC LIMIT ?',
    limit
  );
}

export async function getSessionForDate(date: string): Promise<WorkoutSession | null> {
  const db = getDb();
  return db.getFirstAsync<WorkoutSession>(
    'SELECT * FROM workout_sessions WHERE date = ? ORDER BY created_at DESC LIMIT 1',
    date
  );
}

export async function addSet(
  sessionId: number,
  exerciseId: string,
  setNumber: number,
  reps: number,
  weightKg: number,
  rpe?: number
): Promise<number> {
  const db = getDb();
  const result = await db.runAsync(
    'INSERT INTO workout_sets (session_id, exercise_id, set_number, reps, weight_kg, rpe) VALUES (?, ?, ?, ?, ?, ?)',
    sessionId,
    exerciseId,
    setNumber,
    reps,
    weightKg,
    rpe ?? null
  );
  return result.lastInsertRowId;
}

export async function updateSet(
  setId: number,
  reps: number,
  weightKg: number,
  rpe?: number
): Promise<void> {
  const db = getDb();
  await db.runAsync(
    'UPDATE workout_sets SET reps = ?, weight_kg = ?, rpe = ? WHERE id = ?',
    reps,
    weightKg,
    rpe ?? null,
    setId
  );
}

export async function deleteSet(setId: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM workout_sets WHERE id = ?', setId);
}

export async function saveSessionWithSets(
  date: string,
  exercises: { exerciseId: string; sets: { reps: number; weightKg: number; rpe?: number }[] }[],
  notes?: string
): Promise<number> {
  const db = getDb();
  let sessionId = 0;
  await db.withExclusiveTransactionAsync(async () => {
    const result = await db.runAsync(
      'INSERT INTO workout_sessions (date, notes) VALUES (?, ?)',
      date,
      notes ?? null
    );
    sessionId = result.lastInsertRowId;

    for (const exercise of exercises) {
      for (let i = 0; i < exercise.sets.length; i++) {
        const set = exercise.sets[i];
        await db.runAsync(
          'INSERT INTO workout_sets (session_id, exercise_id, set_number, reps, weight_kg, rpe) VALUES (?, ?, ?, ?, ?, ?)',
          sessionId,
          exercise.exerciseId,
          i + 1,
          set.reps,
          set.weightKg,
          set.rpe ?? null
        );
      }
    }
  });
  return sessionId;
}

export async function deleteSession(sessionId: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM workout_sessions WHERE id = ?', sessionId);
}

export async function clearSessionSets(sessionId: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM workout_sets WHERE session_id = ?', sessionId);
}

export async function getTodayVolumeByMuscle(
  date: string,
  exerciseMuscleMap: Record<string, string[]>
): Promise<Record<string, number>> {
  const db = getDb();
  const rows = await db.getAllAsync<{ exercise_id: string; total_volume: number }>(
    `SELECT ws.exercise_id, SUM(ws.weight_kg * ws.reps) as total_volume
     FROM workout_sets ws
     JOIN workout_sessions sess ON ws.session_id = sess.id
     WHERE sess.date = ?
     GROUP BY ws.exercise_id`,
    date
  );

  const volumes: Record<string, number> = {};
  for (const row of rows) {
    const muscles = exerciseMuscleMap[row.exercise_id];
    if (muscles) {
      for (const muscle of muscles) {
        volumes[muscle] = (volumes[muscle] || 0) + row.total_volume;
      }
    }
  }
  return volumes;
}

export async function getExercisePR(
  exerciseId: string
): Promise<{ maxWeight: number; maxVolume: number }> {
  const db = getDb();
  const maxWeight = await db.getFirstAsync<{ val: number }>(
    'SELECT MAX(weight_kg) as val FROM workout_sets WHERE exercise_id = ?',
    exerciseId
  );
  const maxVolume = await db.getFirstAsync<{ val: number }>(
    'SELECT MAX(weight_kg * reps) as val FROM workout_sets WHERE exercise_id = ?',
    exerciseId
  );
  return {
    maxWeight: maxWeight?.val ?? 0,
    maxVolume: maxVolume?.val ?? 0,
  };
}

export async function getCustomExercises(): Promise<{ id: string; name: string; primary_muscles: string; secondary_muscles: string; category: string }[]> {
  const db = getDb();
  return db.getAllAsync('SELECT * FROM custom_exercises');
}

export async function addCustomExercise(
  id: string,
  name: string,
  primaryMuscles: string[],
  secondaryMuscles: string[],
  category: string
): Promise<void> {
  const db = getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO custom_exercises (id, name, primary_muscles, secondary_muscles, category) VALUES (?, ?, ?, ?, ?)',
    id,
    name,
    JSON.stringify(primaryMuscles),
    JSON.stringify(secondaryMuscles),
    category
  );
}
