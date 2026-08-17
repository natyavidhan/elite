import Dexie, { type Table } from 'dexie';
import { generateUuid } from '@/utils/uuid';

// Every synced table carries `uuid` (the sync identity — stable across
// devices, unlike the local autoincrement `id`) and `updatedAt` (epoch ms,
// for last-write-wins). Both are optional on the interface, same as `id`,
// because callers never set them directly — a Dexie hook registered below
// stamps them in on create/update. See src/db/sync.ts for how they're used.

export interface WorkoutSession {
  id?: number;
  uuid?: string;
  date: string; // 'YYYY-MM-DD'
  notes?: string;
  createdAt: string;
  updatedAt?: number;
}

export interface WorkoutSet {
  id?: number;
  uuid?: string;
  sessionId: number;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe?: number;
  createdAt: string;
  updatedAt?: number;
}

export type ExerciseCategory = 'strength' | 'bodyweight' | 'machine' | 'cable';

export interface CustomExercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  category: ExerciseCategory;
  updatedAt?: number;
}

export type FoodSource = 'openfoodfacts' | 'usda' | 'manual';

export interface FoodItem {
  id?: number;
  uuid?: string;
  externalId?: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  source: FoodSource;
  /** Only set on manually-created dishes — lets logging default to "one
   * serving" instead of a bare 100g, since a home-cooked dish is usually
   * thought of by serving, not per 100g. */
  defaultServingG?: number;
  updatedAt?: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodLog {
  id?: number;
  uuid?: string;
  date: string;
  foodItemId: number;
  mealType: MealType;
  quantityG: number;
  createdAt: string;
  updatedAt?: number;
}

export type ActivityType = 'run' | 'walk' | 'cycle' | 'swim' | 'other';

export interface CardioSession {
  id?: number;
  uuid?: string;
  date: string;
  activityType: ActivityType;
  durationSeconds: number;
  distanceKm?: number;
  avgHeartRate?: number;
  caloriesBurned?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: number;
}

export interface BodyWeightLog {
  id?: number;
  uuid?: string;
  date: string; // unique
  weightKg: number;
  bodyFatPct?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: number;
}

export interface Setting {
  key: string;
  value: string;
  updatedAt?: number;
}

export interface WorkoutPresetExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  weightKg: number;
}

export interface WorkoutPreset {
  id?: number;
  uuid?: string;
  name: string;
  exercises: WorkoutPresetExercise[];
  createdAt: string;
  updatedAt?: number;
}

export interface CardioPreset {
  id?: number;
  uuid?: string;
  name: string;
  activityType: ActivityType;
  baseDurationSeconds: number;
  baseDistanceKm?: number;
  baseCaloriesBurned?: number;
  createdAt: string;
  updatedAt?: number;
}

/** A record of a delete on a synced table, keyed by the deleted row's
 * uuid — propagated to the server (and other devices) alongside ordinary
 * changes so a delete isn't just a local hole nothing else finds out about. */
export interface Tombstone {
  id?: number;
  table: string;
  uuid: string;
  deletedAt: number;
}

/** Tables with a separate uuid field, standing in for the local
 * autoincrement `id` as the identity that survives across devices. */
export const UUID_SYNCED_TABLES = [
  'workoutSessions',
  'workoutSets',
  'foodItems',
  'foodLogs',
  'cardioSessions',
  'bodyWeightLogs',
  'workoutPresets',
  'cardioPresets',
] as const;

/** Tables whose existing string primary key is already a stable,
 * globally-meaningful identity — no separate uuid field needed. */
export const KEY_SYNCED_TABLES = ['customExercises', 'settings'] as const;

export const SYNCED_TABLES = [...UUID_SYNCED_TABLES, ...KEY_SYNCED_TABLES] as const;
export type SyncedTable = (typeof SYNCED_TABLES)[number];

class EliteDB extends Dexie {
  workoutSessions!: Table<WorkoutSession, number>;
  workoutSets!: Table<WorkoutSet, number>;
  customExercises!: Table<CustomExercise, string>;
  foodItems!: Table<FoodItem, number>;
  foodLogs!: Table<FoodLog, number>;
  cardioSessions!: Table<CardioSession, number>;
  bodyWeightLogs!: Table<BodyWeightLog, number>;
  settings!: Table<Setting, string>;
  workoutPresets!: Table<WorkoutPreset, number>;
  cardioPresets!: Table<CardioPreset, number>;
  tombstones!: Table<Tombstone, number>;

  constructor() {
    super('EliteDB');
    this.version(1).stores({
      workoutSessions: '++id, &date',
      workoutSets: '++id, sessionId, exerciseId',
      customExercises: 'id, name',
      foodItems: '++id, &externalId, name',
      foodLogs: '++id, date, foodItemId, mealType',
      cardioSessions: '++id, date, activityType',
      bodyWeightLogs: '++id, &date',
      settings: '&key',
    });
    this.version(2).stores({
      workoutPresets: '++id, name',
      cardioPresets: '++id, name',
    });
    // Adds sync identity (uuid + updatedAt) to every existing table, plus a
    // tombstones log for deletes. Additive indexes only — the upgrade
    // callback backfills existing rows so the new indexes have values.
    this.version(3)
      .stores({
        workoutSessions: '++id, &date, uuid, updatedAt',
        workoutSets: '++id, sessionId, exerciseId, uuid, updatedAt',
        customExercises: 'id, name, updatedAt',
        foodItems: '++id, &externalId, name, uuid, updatedAt',
        foodLogs: '++id, date, foodItemId, mealType, uuid, updatedAt',
        cardioSessions: '++id, date, activityType, uuid, updatedAt',
        bodyWeightLogs: '++id, &date, uuid, updatedAt',
        settings: '&key, updatedAt',
        workoutPresets: '++id, name, uuid, updatedAt',
        cardioPresets: '++id, name, uuid, updatedAt',
        tombstones: '++id, table, uuid, deletedAt',
      })
      .upgrade(async (tx) => {
        const now = Date.now();
        for (const name of UUID_SYNCED_TABLES) {
          await tx
            .table(name)
            .toCollection()
            .modify((row: { uuid?: string; updatedAt?: number }) => {
              if (!row.uuid) row.uuid = generateUuid();
              if (!row.updatedAt) row.updatedAt = now;
            });
        }
        for (const name of KEY_SYNCED_TABLES) {
          await tx
            .table(name)
            .toCollection()
            .modify((row: { updatedAt?: number }) => {
              if (!row.updatedAt) row.updatedAt = now;
            });
        }
      });
  }
}

export const db = new EliteDB();

// Stamps sync metadata on every write so no call site has to remember to.
// `creating` fills in a uuid (once, if missing) and a fresh updatedAt;
// `updating` bumps updatedAt unless the caller already set one explicitly.
function stampUpdatedAt(mods: any): { updatedAt: number } | undefined {
  if (!('updatedAt' in mods)) return { updatedAt: Date.now() };
}

for (const name of UUID_SYNCED_TABLES) {
  const table = db.table(name);
  table.hook('creating', (_pk: unknown, obj: any) => {
    if (!obj.uuid) obj.uuid = generateUuid();
    // A row arriving from sync already carries its true updatedAt — only
    // locally-originated creates (which never set this field) get stamped.
    if (obj.updatedAt == null) obj.updatedAt = Date.now();
  });
  table.hook('updating', stampUpdatedAt);
}
for (const name of KEY_SYNCED_TABLES) {
  const table = db.table(name);
  table.hook('creating', (_pk: unknown, obj: any) => {
    if (obj.updatedAt == null) obj.updatedAt = Date.now();
  });
  table.hook('updating', stampUpdatedAt);
}

export function today(): string {
  return new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD' in local time
}

/** Narrows a URL search param to a real 'YYYY-MM-DD' date string — used
 * anywhere a page reads its working date from `?date=` instead of always
 * assuming today, so a malformed or missing param falls back safely. */
export function isValidDateParam(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
