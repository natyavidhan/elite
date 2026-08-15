import Dexie, { type Table } from 'dexie';

export interface WorkoutSession {
  id?: number;
  date: string; // 'YYYY-MM-DD'
  notes?: string;
  createdAt: string;
}

export interface WorkoutSet {
  id?: number;
  sessionId: number;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe?: number;
  createdAt: string;
}

export type ExerciseCategory = 'strength' | 'bodyweight' | 'machine' | 'cable';

export interface CustomExercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  category: ExerciseCategory;
}

export type FoodSource = 'openfoodfacts' | 'usda' | 'manual';

export interface FoodItem {
  id?: number;
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
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodLog {
  id?: number;
  date: string;
  foodItemId: number;
  mealType: MealType;
  quantityG: number;
  createdAt: string;
}

export type ActivityType = 'run' | 'walk' | 'cycle' | 'swim' | 'other';

export interface CardioSession {
  id?: number;
  date: string;
  activityType: ActivityType;
  durationSeconds: number;
  distanceKm?: number;
  avgHeartRate?: number;
  caloriesBurned?: number;
  notes?: string;
  createdAt: string;
}

export interface BodyWeightLog {
  id?: number;
  date: string; // unique
  weightKg: number;
  bodyFatPct?: number;
  notes?: string;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface WorkoutPresetExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  weightKg: number;
}

export interface WorkoutPreset {
  id?: number;
  name: string;
  exercises: WorkoutPresetExercise[];
  createdAt: string;
}

export interface CardioPreset {
  id?: number;
  name: string;
  activityType: ActivityType;
  baseDurationSeconds: number;
  baseDistanceKm?: number;
  baseCaloriesBurned?: number;
  createdAt: string;
}

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
  }
}

export const db = new EliteDB();

export function today(): string {
  return new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD' in local time
}
