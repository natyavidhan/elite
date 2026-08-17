import { db, today, type FoodItem, type FoodLog, type MealType } from './schema';
import { recordTombstone } from './tombstones';
import { scheduleSync } from './sync';

export async function searchLocalFoodItems(query: string): Promise<FoodItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return db.foodItems.filter((item) => item.name.toLowerCase().includes(q)).limit(25).toArray();
}

export async function getFoodItemByExternalId(externalId: string): Promise<FoodItem | undefined> {
  return db.foodItems.where('externalId').equals(externalId).first();
}

export async function upsertFoodItem(item: FoodItem): Promise<number> {
  // Already a persisted record (e.g. a custom dish re-selected from search,
  // which has no externalId to key off) — inserting it again would collide
  // with its own primary key instead of just reusing it.
  if (item.id) return item.id;
  if (!item.externalId) {
    const id = await db.foodItems.add(item);
    scheduleSync();
    return id;
  }

  const externalId = item.externalId;
  // Check-then-write runs in one transaction so two concurrent callers
  // serialize instead of both reading "no row yet" and both inserting.
  const id = await db.transaction('rw', db.foodItems, async () => {
    const existing = await getFoodItemByExternalId(externalId);
    if (existing?.id) {
      await db.foodItems.update(existing.id, item);
      return existing.id;
    }
    try {
      return await db.foodItems.add(item);
    } catch {
      // `externalId` is uniquely indexed — a concurrent writer outside this transaction may have just inserted it first.
      const winner = await getFoodItemByExternalId(externalId);
      if (winner?.id) return winner.id;
      throw new Error(`Failed to create or find food item ${externalId}`);
    }
  });
  scheduleSync();
  return id;
}

export async function getFoodItem(id: number): Promise<FoodItem | undefined> {
  return db.foodItems.get(id);
}

export interface LogFoodInput {
  date: string;
  foodItemId: number;
  mealType: MealType;
  quantityG: number;
}

export async function logFood(input: LogFoodInput): Promise<number> {
  const id = await db.foodLogs.add({ ...input, createdAt: new Date().toISOString() });
  scheduleSync();
  return id;
}

export async function deleteFoodLog(id: number): Promise<void> {
  const row = await db.foodLogs.get(id);
  await db.transaction('rw', db.foodLogs, db.tombstones, async () => {
    await db.foodLogs.delete(id);
    await recordTombstone('foodLogs', row?.uuid);
  });
  scheduleSync();
}

export interface FoodLogEntry {
  log: FoodLog;
  item: FoodItem;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function computeMacros(item: FoodItem, quantityG: number) {
  const factor = quantityG / 100;
  return {
    calories: item.caloriesPer100g * factor,
    protein: item.proteinPer100g * factor,
    carbs: item.carbsPer100g * factor,
    fat: item.fatPer100g * factor,
  };
}

export async function getFoodLogsForDate(date: string = today()): Promise<FoodLogEntry[]> {
  const logs = await db.foodLogs.where('date').equals(date).toArray();
  const entries: FoodLogEntry[] = [];
  for (const log of logs) {
    const item = await db.foodItems.get(log.foodItemId);
    if (!item) continue;
    entries.push({ log, item, ...computeMacros(item, log.quantityG) });
  }
  return entries;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function getDailyTotals(date: string = today()): Promise<DailyTotals> {
  const entries = await getFoodLogsForDate(date);
  return entries.reduce(
    (totals, e) => ({
      calories: totals.calories + e.calories,
      protein: totals.protein + e.protein,
      carbs: totals.carbs + e.carbs,
      fat: totals.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export interface DishInput {
  name: string;
  servingG: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function dishToPer100g(input: DishInput): Omit<FoodItem, 'id'> {
  const factor = 100 / input.servingG;
  return {
    name: input.name,
    caloriesPer100g: input.calories * factor,
    proteinPer100g: input.protein * factor,
    carbsPer100g: input.carbs * factor,
    fatPer100g: input.fat * factor,
    source: 'manual',
    defaultServingG: input.servingG,
  };
}

export async function createCustomDish(input: DishInput): Promise<number> {
  const id = await db.foodItems.add(dishToPer100g(input));
  scheduleSync();
  return id;
}

export async function updateCustomDish(id: number, input: DishInput): Promise<void> {
  await db.foodItems.update(id, dishToPer100g(input));
  scheduleSync();
}

export async function deleteCustomDish(id: number): Promise<void> {
  const row = await db.foodItems.get(id);
  await db.transaction('rw', db.foodItems, db.tombstones, async () => {
    await db.foodItems.delete(id);
    await recordTombstone('foodItems', row?.uuid);
  });
  scheduleSync();
}

export async function getCustomDishes(): Promise<FoodItem[]> {
  return db.foodItems.filter((item) => item.source === 'manual').toArray();
}

export async function getFoodDatesWithLogs(limit = 60): Promise<string[]> {
  const dates = await db.foodLogs.orderBy('date').reverse().keys();
  const unique = [...new Set(dates as string[])];
  return unique.slice(0, limit);
}
