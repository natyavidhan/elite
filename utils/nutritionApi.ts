import { searchCachedFoods, cacheFoodItem } from '../db/foodDb';

const USDA_API_KEY = 'DEMO_KEY';

interface NutritionResult {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  source: string;
  externalId?: string;
}

export async function searchFood(query: string): Promise<NutritionResult[]> {
  const localResults = await searchCachedFoods(query);
  if (localResults.length > 0) {
    return localResults.map(r => ({
      name: r.name,
      caloriesPer100g: r.calories_per_100g,
      proteinPer100g: r.protein_per_100g,
      carbsPer100g: r.carbs_per_100g,
      fatPer100g: r.fat_per_100g,
      source: r.source,
      externalId: r.external_id ?? undefined,
    }));
  }

  try {
    const results = await searchUSDA(query);
    for (const r of results) {
      await cacheFoodItem({
        externalId: r.externalId,
        name: r.name,
        caloriesPer100g: r.caloriesPer100g,
        proteinPer100g: r.proteinPer100g,
        carbsPer100g: r.carbsPer100g,
        fatPer100g: r.fatPer100g,
        source: r.source,
      });
    }
    return results;
  } catch {
    return [];
  }
}

async function searchUSDA(query: string): Promise<NutritionResult[]> {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=${USDA_API_KEY}&pageSize=10`;
  const response = await fetch(url);
  const data = await response.json();

  return (data.foods ?? []).map((food: any) => {
    const nutrients = food.foodNutrients ?? [];
    const findNutrient = (id: number) => {
      const n = nutrients.find((n: any) => n.nutrientId === id);
      return n ? n.value ?? 0 : 0;
    };

    return {
      name: food.description ?? 'Unknown',
      caloriesPer100g: findNutrient(1008),
      proteinPer100g: findNutrient(1003),
      carbsPer100g: findNutrient(1005),
      fatPer100g: findNutrient(1004),
      source: 'usda',
      externalId: `fdc_${food.fdcId}`,
    };
  });
}

export async function lookupBarcode(barcode: string): Promise<NutritionResult | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 1) return null;

    const product = data.product;
    const nutriments = product.nutriments ?? {};

    await cacheFoodItem({
      externalId: barcode,
      name: product.product_name ?? 'Unknown Product',
      caloriesPer100g: nutriments['energy-kcal_100g'] ?? 0,
      proteinPer100g: nutriments.proteins_100g ?? 0,
      carbsPer100g: nutriments.carbohydrates_100g ?? 0,
      fatPer100g: nutriments.fat_100g ?? 0,
      source: 'openfoodfacts',
    });

    return {
      name: product.product_name ?? 'Unknown Product',
      caloriesPer100g: nutriments['energy-kcal_100g'] ?? 0,
      proteinPer100g: nutriments.proteins_100g ?? 0,
      carbsPer100g: nutriments.carbohydrates_100g ?? 0,
      fatPer100g: nutriments.fat_100g ?? 0,
      source: 'openfoodfacts',
      externalId: barcode,
    };
  } catch {
    return null;
  }
}
