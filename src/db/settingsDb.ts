import { db } from './schema';
import { scheduleSync } from './sync';

export interface AppSettings {
  unitSystem: 'metric' | 'imperial';
  bodyweightUnit: 'kg' | 'lbs';
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  dailyCarbGoal: number;
  dailyFatGoal: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  unitSystem: 'metric',
  bodyweightUnit: 'kg',
  dailyCalorieGoal: 2200,
  dailyProteinGoal: 150,
  dailyCarbGoal: 220,
  dailyFatGoal: 70,
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await db.settings.toArray();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    unitSystem: (map.unitSystem as AppSettings['unitSystem']) ?? DEFAULT_SETTINGS.unitSystem,
    bodyweightUnit: (map.bodyweightUnit as AppSettings['bodyweightUnit']) ?? DEFAULT_SETTINGS.bodyweightUnit,
    dailyCalorieGoal: map.dailyCalorieGoal ? Number(map.dailyCalorieGoal) : DEFAULT_SETTINGS.dailyCalorieGoal,
    dailyProteinGoal: map.dailyProteinGoal ? Number(map.dailyProteinGoal) : DEFAULT_SETTINGS.dailyProteinGoal,
    dailyCarbGoal: map.dailyCarbGoal ? Number(map.dailyCarbGoal) : DEFAULT_SETTINGS.dailyCarbGoal,
    dailyFatGoal: map.dailyFatGoal ? Number(map.dailyFatGoal) : DEFAULT_SETTINGS.dailyFatGoal,
  };
}

export async function updateSettings(changes: Partial<AppSettings>): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    for (const [key, value] of Object.entries(changes)) {
      await db.settings.put({ key, value: String(value) });
    }
  });
  scheduleSync();
}
