import { getDb } from './schema';

export interface FoodItem {
  id: number;
  external_id: string | null;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  source: string;
}

export interface FoodLog {
  id: number;
  date: string;
  food_item_id: number;
  meal_type: string;
  quantity_g: number;
  created_at: string;
}

export interface FoodLogWithItem extends FoodLog {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function cacheFoodItem(item: {
  externalId?: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  source: string;
}): Promise<number> {
  const db = getDb();
  const existing = item.externalId
    ? await db.getFirstAsync<FoodItem>('SELECT * FROM food_items WHERE external_id = ?', item.externalId)
    : null;
  if (existing) return existing.id;

  const result = await db.runAsync(
    'INSERT INTO food_items (external_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, source) VALUES (?, ?, ?, ?, ?, ?, ?)',
    item.externalId ?? null,
    item.name,
    item.caloriesPer100g,
    item.proteinPer100g,
    item.carbsPer100g,
    item.fatPer100g,
    item.source
  );
  return result.lastInsertRowId;
}

export async function searchCachedFoods(query: string): Promise<FoodItem[]> {
  const db = getDb();
  return db.getAllAsync<FoodItem>(
    'SELECT * FROM food_items WHERE name LIKE ? LIMIT 20',
    `%${query}%`
  );
}

export async function logFood(
  date: string,
  foodItemId: number,
  mealType: string,
  quantityG: number
): Promise<number> {
  const db = getDb();
  const result = await db.runAsync(
    'INSERT INTO food_logs (date, food_item_id, meal_type, quantity_g) VALUES (?, ?, ?, ?)',
    date,
    foodItemId,
    mealType,
    quantityG
  );
  return result.lastInsertRowId;
}

export async function getFoodLogsForDate(date: string): Promise<FoodLogWithItem[]> {
  const db = getDb();
  return db.getAllAsync<FoodLogWithItem>(
    `SELECT fl.*, fi.name, fi.calories_per_100g, fi.protein_per_100g, fi.carbs_per_100g, fi.fat_per_100g,
            (fi.calories_per_100g / 100.0 * fl.quantity_g) as calories,
            (fi.protein_per_100g / 100.0 * fl.quantity_g) as protein,
            (fi.carbs_per_100g / 100.0 * fl.quantity_g) as carbs,
            (fi.fat_per_100g / 100.0 * fl.quantity_g) as fat
     FROM food_logs fl
     JOIN food_items fi ON fl.food_item_id = fi.id
     WHERE fl.date = ?
     ORDER BY fl.created_at`,
    date
  );
}

export async function getDailyTotals(date: string): Promise<{ calories: number; protein: number; carbs: number; fat: number }> {
  const db = getDb();
  const result = await db.getFirstAsync<{ calories: number; protein: number; carbs: number; fat: number }>(
    `SELECT
       COALESCE(SUM(fi.calories_per_100g / 100.0 * fl.quantity_g), 0) as calories,
       COALESCE(SUM(fi.protein_per_100g / 100.0 * fl.quantity_g), 0) as protein,
       COALESCE(SUM(fi.carbs_per_100g / 100.0 * fl.quantity_g), 0) as carbs,
       COALESCE(SUM(fi.fat_per_100g / 100.0 * fl.quantity_g), 0) as fat
     FROM food_logs fl
     JOIN food_items fi ON fl.food_item_id = fi.id
     WHERE fl.date = ?`,
    date
  );
  return result ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export async function deleteFoodLog(logId: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM food_logs WHERE id = ?', logId);
}
