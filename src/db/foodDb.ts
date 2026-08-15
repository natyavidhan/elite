import { db, today, type FoodItem, type FoodLog, type MealType } from './schema';

export async function searchLocalFoodItems(query: string): Promise<FoodItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return db.foodItems.filter((item) => item.name.toLowerCase().includes(q)).limit(25).toArray();
}

export async function getFoodItemByExternalId(externalId: string): Promise<FoodItem | undefined> {
  return db.foodItems.where('externalId').equals(externalId).first();
}

export async function upsertFoodItem(item: FoodItem): Promise<number> {
  if (item.externalId) {
    const existing = await getFoodItemByExternalId(item.externalId);
    if (existing?.id) {
      await db.foodItems.update(existing.id, item);
      return existing.id;
    }
    try {
      return await db.foodItems.add(item);
    } catch {
      // `externalId` is uniquely indexed — a concurrent caller may have just inserted it first.
      const winner = await getFoodItemByExternalId(item.externalId);
      if (winner?.id) return winner.id;
      throw new Error(`Failed to create or find food item ${item.externalId}`);
    }
  }
  return db.foodItems.add(item);
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
  return db.foodLogs.add({ ...input, createdAt: new Date().toISOString() });
}

export async function deleteFoodLog(id: number): Promise<void> {
  await db.foodLogs.delete(id);
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

export async function getFoodDatesWithLogs(limit = 60): Promise<string[]> {
  const dates = await db.foodLogs.orderBy('date').reverse().keys();
  const unique = [...new Set(dates as string[])];
  return unique.slice(0, limit);
}
