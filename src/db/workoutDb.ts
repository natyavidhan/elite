import { db, today, type WorkoutSession, type WorkoutSet, type WorkoutPreset, type WorkoutPresetExercise } from './schema';
import { findExerciseById } from '@/constants/exercises';
import { recordTombstone } from './tombstones';
import { scheduleSync } from './sync';

export async function getSessionByDate(date: string): Promise<WorkoutSession | undefined> {
  return db.workoutSessions.where('date').equals(date).first();
}

/** The `date` field carries a unique index. The check-then-write below runs
 * inside one Dexie transaction so two concurrent callers (React StrictMode's
 * double effect invocation, a second tab, a fast click racing the initial
 * load) serialize against each other instead of both reading "no session
 * yet" and both trying to insert — the second transaction simply sees the
 * first one's row once it's its turn. The catch is a last-resort fallback
 * for the rare case a duplicate insert still lands (e.g. a concurrent
 * writer outside this transaction entirely, such as a second browser tab's
 * own independent transaction) — it re-reads rather than throwing. */
export async function getOrCreateSession(date: string = today()): Promise<WorkoutSession> {
  return db.transaction('rw', db.workoutSessions, async () => {
    const existing = await getSessionByDate(date);
    if (existing) return existing;
    const createdAt = new Date().toISOString();
    try {
      const id = await db.workoutSessions.add({ date, createdAt });
      scheduleSync();
      return { id, date, createdAt };
    } catch (e) {
      const winner = await getSessionByDate(date);
      if (winner) return winner;
      console.error(`getOrCreateSession(${date}) insert failed and no row was found on retry:`, e);
      throw new Error(`Failed to create or find a workout session for ${date}`);
    }
  });
}

export async function getSetsForSession(sessionId: number): Promise<WorkoutSet[]> {
  return db.workoutSets.where('sessionId').equals(sessionId).sortBy('id');
}

async function resolveExercise(exerciseId: string) {
  const builtIn = findExerciseById(exerciseId);
  if (builtIn) return builtIn;
  return db.customExercises.get(exerciseId);
}

export async function getExerciseBestWeight(exerciseId: string, excludeSessionId?: number): Promise<number> {
  const sets = await db.workoutSets.where('exerciseId').equals(exerciseId).toArray();
  const relevant = excludeSessionId ? sets.filter((s) => s.sessionId !== excludeSessionId) : sets;
  return relevant.reduce((max, s) => Math.max(max, s.weightKg), 0);
}

export interface AddSetInput {
  sessionId: number;
  exerciseId: string;
  reps: number;
  weightKg: number;
  rpe?: number;
}

export interface AddSetResult {
  set: WorkoutSet;
  isPR: boolean;
}

export async function addSet(input: AddSetInput): Promise<AddSetResult> {
  const priorBest = await getExerciseBestWeight(input.exerciseId);
  const existingSets = await db.workoutSets
    .where('sessionId')
    .equals(input.sessionId)
    .filter((s) => s.exerciseId === input.exerciseId)
    .toArray();
  const setNumber = existingSets.length + 1;
  const createdAt = new Date().toISOString();
  const id = await db.workoutSets.add({
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    setNumber,
    reps: input.reps,
    weightKg: input.weightKg,
    rpe: input.rpe,
    createdAt,
  });
  scheduleSync();
  return {
    set: { id, setNumber, createdAt, ...input },
    isPR: input.weightKg > priorBest && priorBest > 0,
  };
}

export async function updateSet(id: number, changes: Partial<Pick<WorkoutSet, 'reps' | 'weightKg' | 'rpe'>>) {
  await db.workoutSets.update(id, changes);
  scheduleSync();
}

export async function deleteSet(id: number) {
  const row = await db.workoutSets.get(id);
  await db.transaction('rw', db.workoutSets, db.tombstones, async () => {
    await db.workoutSets.delete(id);
    await recordTombstone('workoutSets', row?.uuid);
  });
  scheduleSync();
}

export async function deleteSession(id: number) {
  await db.transaction('rw', db.workoutSessions, db.workoutSets, db.tombstones, async () => {
    const session = await db.workoutSessions.get(id);
    const sets = await db.workoutSets.where('sessionId').equals(id).toArray();
    await db.workoutSets.where('sessionId').equals(id).delete();
    await db.workoutSessions.delete(id);
    await recordTombstone('workoutSessions', session?.uuid);
    for (const s of sets) await recordTombstone('workoutSets', s.uuid);
  });
  scheduleSync();
}

/** Volume for a muscle counts full credit from primary movers, half credit
 * from secondary/assisting muscles — a set doesn't train an assist as hard
 * as its target. */
export async function getMuscleVolumesForDate(date: string): Promise<Record<string, number>> {
  const session = await getSessionByDate(date);
  if (!session?.id) return {};
  const sets = await getSetsForSession(session.id);
  const volumes: Record<string, number> = {};
  for (const set of sets) {
    const exercise = await resolveExercise(set.exerciseId);
    if (!exercise) continue;
    const load = set.weightKg * set.reps;
    for (const m of exercise.primaryMuscles) volumes[m] = (volumes[m] ?? 0) + load;
    for (const m of exercise.secondaryMuscles) volumes[m] = (volumes[m] ?? 0) + load * 0.5;
  }
  return volumes;
}

export interface SessionSummary {
  session: WorkoutSession;
  exerciseCount: number;
  setCount: number;
  totalVolume: number;
}

export async function getSessionSummary(date: string = today()): Promise<SessionSummary | undefined> {
  const session = await getSessionByDate(date);
  if (!session?.id) return undefined;
  const sets = await getSetsForSession(session.id);
  const exerciseIds = new Set(sets.map((s) => s.exerciseId));
  const totalVolume = sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
  return { session, exerciseCount: exerciseIds.size, setCount: sets.length, totalVolume };
}

export async function getAllSessionsHistory(): Promise<SessionSummary[]> {
  const sessions = await db.workoutSessions.orderBy('date').reverse().toArray();
  const results: SessionSummary[] = [];
  for (const session of sessions) {
    if (!session.id) continue;
    const sets = await getSetsForSession(session.id);
    const exerciseIds = new Set(sets.map((s) => s.exerciseId));
    const totalVolume = sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
    results.push({ session, exerciseCount: exerciseIds.size, setCount: sets.length, totalVolume });
  }
  return results;
}

export interface ExercisePR {
  exerciseId: string;
  bestWeightKg: number;
  bestVolume: number;
}

export async function getExercisePRs(): Promise<ExercisePR[]> {
  const allSets = await db.workoutSets.toArray();
  const byExercise = new Map<string, WorkoutSet[]>();
  for (const s of allSets) {
    const arr = byExercise.get(s.exerciseId) ?? [];
    arr.push(s);
    byExercise.set(s.exerciseId, arr);
  }
  const prs: ExercisePR[] = [];
  for (const [exerciseId, sets] of byExercise) {
    const bestWeightKg = Math.max(...sets.map((s) => s.weightKg));
    const bestVolume = Math.max(...sets.map((s) => s.weightKg * s.reps));
    prs.push({ exerciseId, bestWeightKg, bestVolume });
  }
  return prs.sort((a, b) => b.bestWeightKg - a.bestWeightKg);
}

/** Top weight lifted per session for an exercise, most recent `limit` sessions, chronological. */
export async function getExerciseWeightTrend(exerciseId: string, limit = 10): Promise<Array<{ date: string; weightKg: number }>> {
  const sets = await db.workoutSets.where('exerciseId').equals(exerciseId).toArray();
  const sessionIds = [...new Set(sets.map((s) => s.sessionId))];
  const sessions = await db.workoutSessions.bulkGet(sessionIds);
  const sessionDateById = new Map(sessions.filter(Boolean).map((s) => [s!.id!, s!.date]));
  const bestBySession = new Map<number, number>();
  for (const s of sets) {
    bestBySession.set(s.sessionId, Math.max(bestBySession.get(s.sessionId) ?? 0, s.weightKg));
  }
  return [...bestBySession.entries()]
    .map(([sessionId, weightKg]) => ({ date: sessionDateById.get(sessionId) ?? '', weightKg }))
    .filter((e) => e.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit);
}

export interface MuscleExerciseBreakdown {
  exerciseId: string;
  exerciseName: string;
  role: 'primary' | 'secondary';
  sets: WorkoutSet[];
}

export async function getMuscleBreakdownForDate(date: string, muscleId: string): Promise<MuscleExerciseBreakdown[]> {
  const session = await getSessionByDate(date);
  if (!session?.id) return [];
  const sets = await getSetsForSession(session.id);
  const byExercise = new Map<string, WorkoutSet[]>();
  for (const s of sets) {
    const arr = byExercise.get(s.exerciseId) ?? [];
    arr.push(s);
    byExercise.set(s.exerciseId, arr);
  }
  const results: MuscleExerciseBreakdown[] = [];
  for (const [exerciseId, exerciseSets] of byExercise) {
    const exercise = await resolveExercise(exerciseId);
    if (!exercise) continue;
    if (exercise.primaryMuscles.includes(muscleId)) {
      results.push({ exerciseId, exerciseName: exercise.name, role: 'primary', sets: exerciseSets });
    } else if (exercise.secondaryMuscles.includes(muscleId)) {
      results.push({ exerciseId, exerciseName: exercise.name, role: 'secondary', sets: exerciseSets });
    }
  }
  return results.sort((a, b) => (a.role === b.role ? 0 : a.role === 'primary' ? -1 : 1));
}

export interface SessionExerciseDetail {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export async function getSessionDetail(sessionId: number): Promise<SessionExerciseDetail[]> {
  const sets = await getSetsForSession(sessionId);
  const byExercise = new Map<string, WorkoutSet[]>();
  const order: string[] = [];
  for (const s of sets) {
    if (!byExercise.has(s.exerciseId)) {
      byExercise.set(s.exerciseId, []);
      order.push(s.exerciseId);
    }
    byExercise.get(s.exerciseId)!.push(s);
  }
  const results: SessionExerciseDetail[] = [];
  for (const exerciseId of order) {
    const exercise = await resolveExercise(exerciseId);
    results.push({ exerciseId, exerciseName: exercise?.name ?? exerciseId, sets: byExercise.get(exerciseId)! });
  }
  return results;
}

export async function getWorkoutPresets(): Promise<WorkoutPreset[]> {
  return db.workoutPresets.toArray();
}

export async function createWorkoutPreset(name: string, exercises: WorkoutPresetExercise[]): Promise<number> {
  const id = await db.workoutPresets.add({ name, exercises, createdAt: new Date().toISOString() });
  scheduleSync();
  return id;
}

export async function updateWorkoutPreset(id: number, name: string, exercises: WorkoutPresetExercise[]): Promise<void> {
  await db.workoutPresets.update(id, { name, exercises });
  scheduleSync();
}

export async function deleteWorkoutPreset(id: number): Promise<void> {
  const row = await db.workoutPresets.get(id);
  await db.transaction('rw', db.workoutPresets, db.tombstones, async () => {
    await db.workoutPresets.delete(id);
    await recordTombstone('workoutPresets', row?.uuid);
  });
  scheduleSync();
}

export interface ApplyPresetResult {
  sets: WorkoutSet[];
  prSetIds: number[];
}

/** Logs every set from a preset's exercises in order, going through the
 * same addSet path (and therefore the same PR detection) as logging by
 * hand — a preset is a shortcut for typing, not a different data path. */
export async function applyWorkoutPreset(sessionId: number, preset: WorkoutPreset): Promise<ApplyPresetResult> {
  const sets: WorkoutSet[] = [];
  const prSetIds: number[] = [];
  for (const exercise of preset.exercises) {
    for (let i = 0; i < exercise.sets; i++) {
      const { set, isPR } = await addSet({
        sessionId,
        exerciseId: exercise.exerciseId,
        reps: exercise.reps,
        weightKg: exercise.weightKg,
      });
      sets.push(set);
      if (isPR && set.id) prSetIds.push(set.id);
    }
  }
  return { sets, prSetIds };
}

export async function addCustomExercise(exercise: { id: string; name: string; primaryMuscles: string[]; secondaryMuscles: string[]; category: string }) {
  await db.customExercises.put(exercise as never);
  scheduleSync();
}

export async function getCustomExercises() {
  return db.customExercises.toArray();
}
