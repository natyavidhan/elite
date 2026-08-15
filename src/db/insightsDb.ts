import { format, subDays } from 'date-fns';
import { db } from './schema';

function dateRangeStrings(days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) dates.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  return dates;
}

function buildDayRange(days: number, valueFor: (date: string) => number): DayValue[] {
  return dateRangeStrings(days).map((date) => ({ date, value: valueFor(date) }));
}

export interface DayValue {
  date: string;
  value: number;
}

export interface DailyActivity {
  date: string;
  workout: boolean;
  food: boolean;
  cardio: boolean;
  bodyweight: boolean;
  score: number; // 0-4, count of modules touched that day
}

/** A workout_sessions row can exist with zero sets (created the moment the
 * log-session screen is opened), so "workout happened" is measured by real
 * sets existing for that date, not by session-row presence. */
async function getWorkoutDates(startStr: string): Promise<Set<string>> {
  const sessions = await db.workoutSessions.where('date').aboveOrEqual(startStr).toArray();
  const dateBySessionId = new Map(sessions.map((s) => [s.id!, s.date]));
  const sets = await db.workoutSets.where('sessionId').anyOf(sessions.map((s) => s.id!)).toArray();
  return new Set(sets.map((s) => dateBySessionId.get(s.sessionId)).filter((d): d is string => !!d));
}

export async function getDailyActivity(days: number): Promise<DailyActivity[]> {
  const startStr = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');

  const [workoutDates, foodLogs, cardioSessions, weightLogs] = await Promise.all([
    getWorkoutDates(startStr),
    db.foodLogs.where('date').aboveOrEqual(startStr).toArray(),
    db.cardioSessions.where('date').aboveOrEqual(startStr).toArray(),
    db.bodyWeightLogs.where('date').aboveOrEqual(startStr).toArray(),
  ]);
  const foodDates = new Set(foodLogs.map((f) => f.date));
  const cardioDates = new Set(cardioSessions.map((c) => c.date));
  const weightDates = new Set(weightLogs.map((w) => w.date));

  return dateRangeStrings(days).map((date) => {
    const workout = workoutDates.has(date);
    const food = foodDates.has(date);
    const cardio = cardioDates.has(date);
    const bodyweight = weightDates.has(date);
    return { date, workout, food, cardio, bodyweight, score: [workout, food, cardio, bodyweight].filter(Boolean).length };
  });
}

export async function getWorkoutVolumeTrend(days: number): Promise<DayValue[]> {
  const startStr = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
  const sessions = await db.workoutSessions.where('date').aboveOrEqual(startStr).toArray();
  const dateBySessionId = new Map(sessions.map((s) => [s.id!, s.date]));
  const sets = await db.workoutSets.where('sessionId').anyOf(sessions.map((s) => s.id!)).toArray();
  const volumeByDate = new Map<string, number>();
  for (const s of sets) {
    const date = dateBySessionId.get(s.sessionId);
    if (!date) continue;
    volumeByDate.set(date, (volumeByDate.get(date) ?? 0) + s.weightKg * s.reps);
  }
  return buildDayRange(days, (d) => volumeByDate.get(d) ?? 0);
}

export async function getCalorieTrend(days: number): Promise<DayValue[]> {
  const startStr = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
  const logs = await db.foodLogs.where('date').aboveOrEqual(startStr).toArray();
  const items = await db.foodItems.bulkGet([...new Set(logs.map((l) => l.foodItemId))]);
  const itemById = new Map(items.filter(Boolean).map((i) => [i!.id!, i!]));
  const caloriesByDate = new Map<string, number>();
  for (const log of logs) {
    const item = itemById.get(log.foodItemId);
    if (!item) continue;
    const calories = (item.caloriesPer100g / 100) * log.quantityG;
    caloriesByDate.set(log.date, (caloriesByDate.get(log.date) ?? 0) + calories);
  }
  return buildDayRange(days, (d) => caloriesByDate.get(d) ?? 0);
}

export async function getCardioDistanceTrend(days: number): Promise<DayValue[]> {
  const startStr = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
  const sessions = await db.cardioSessions.where('date').aboveOrEqual(startStr).toArray();
  const kmByDate = new Map<string, number>();
  for (const s of sessions) kmByDate.set(s.date, (kmByDate.get(s.date) ?? 0) + (s.distanceKm ?? 0));
  return buildDayRange(days, (d) => kmByDate.get(d) ?? 0);
}
