import { getDb } from './schema';

export interface Settings {
  unit_system: 'metric' | 'imperial';
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carb_goal: number;
  daily_fat_goal: number;
  bodyweight_unit: 'kg' | 'lbs';
}

const DEFAULT_SETTINGS: Settings = {
  unit_system: 'metric',
  daily_calorie_goal: 2500,
  daily_protein_goal: 180,
  daily_carb_goal: 250,
  daily_fat_goal: 80,
  bodyweight_unit: 'kg',
};

export async function getSettings(): Promise<Settings> {
  const db = getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT * FROM settings');
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return {
    unit_system: (map.unit_system as 'metric' | 'imperial') ?? DEFAULT_SETTINGS.unit_system,
    daily_calorie_goal: parseInt(map.daily_calorie_goal ?? '', 10) || DEFAULT_SETTINGS.daily_calorie_goal,
    daily_protein_goal: parseInt(map.daily_protein_goal ?? '', 10) || DEFAULT_SETTINGS.daily_protein_goal,
    daily_carb_goal: parseInt(map.daily_carb_goal ?? '', 10) || DEFAULT_SETTINGS.daily_carb_goal,
    daily_fat_goal: parseInt(map.daily_fat_goal ?? '', 10) || DEFAULT_SETTINGS.daily_fat_goal,
    bodyweight_unit: (map.bodyweight_unit as 'kg' | 'lbs') ?? DEFAULT_SETTINGS.bodyweight_unit,
  };
}

export async function updateSetting(key: keyof Settings, value: string | number): Promise<void> {
  const db = getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    key,
    String(value)
  );
}

export async function updateSettings(updates: Partial<Settings>): Promise<void> {
  const db = getDb();
  await db.withExclusiveTransactionAsync(async () => {
    for (const [key, value] of Object.entries(updates)) {
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        key,
        String(value)
      );
    }
  });
}
