import type { FoodItem } from '@/db/schema';

const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY';

export async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  const p = data.product;
  const n = p.nutriments ?? {};
  if (n['energy-kcal_100g'] == null) return null;
  return {
    externalId: `off:${barcode}`,
    name: p.product_name || p.generic_name || 'Unknown product',
    caloriesPer100g: n['energy-kcal_100g'] ?? 0,
    proteinPer100g: n['proteins_100g'] ?? 0,
    carbsPer100g: n['carbohydrates_100g'] ?? 0,
    fatPer100g: n['fat_100g'] ?? 0,
    source: 'openfoodfacts',
  };
}

interface UsdaFoodNutrient {
  nutrientId: number;
  value: number;
}

interface UsdaFood {
  fdcId: number;
  description: string;
  foodNutrients: UsdaFoodNutrient[];
}

const NUTRIENT_IDS = { calories: 1008, protein: 1003, carbs: 1005, fat: 1004 };

function extractNutrient(nutrients: UsdaFoodNutrient[], id: number): number {
  return nutrients.find((n) => n.nutrientId === id)?.value ?? 0;
}

export async function searchUsda(query: string): Promise<FoodItem[]> {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=15&api_key=${USDA_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const foods: UsdaFood[] = data.foods ?? [];
  return foods.map((f) => ({
    externalId: `usda:${f.fdcId}`,
    name: f.description,
    caloriesPer100g: extractNutrient(f.foodNutrients, NUTRIENT_IDS.calories),
    proteinPer100g: extractNutrient(f.foodNutrients, NUTRIENT_IDS.protein),
    carbsPer100g: extractNutrient(f.foodNutrients, NUTRIENT_IDS.carbs),
    fatPer100g: extractNutrient(f.foodNutrients, NUTRIENT_IDS.fat),
    source: 'usda' as const,
  }));
}
