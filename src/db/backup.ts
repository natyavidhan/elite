import { db } from './schema';

interface BackupPayload {
  version: 1;
  exportedAt: string;
  tables: {
    workoutSessions: unknown[];
    workoutSets: unknown[];
    customExercises: unknown[];
    foodItems: unknown[];
    foodLogs: unknown[];
    cardioSessions: unknown[];
    bodyWeightLogs: unknown[];
    settings: unknown[];
  };
}

export async function exportBackup(): Promise<void> {
  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      workoutSessions: await db.workoutSessions.toArray(),
      workoutSets: await db.workoutSets.toArray(),
      customExercises: await db.customExercises.toArray(),
      foodItems: await db.foodItems.toArray(),
      foodLogs: await db.foodLogs.toArray(),
      cardioSessions: await db.cardioSessions.toArray(),
      bodyWeightLogs: await db.bodyWeightLogs.toArray(),
      settings: await db.settings.toArray(),
    },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `elite-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<void> {
  const text = await file.text();
  const payload = JSON.parse(text) as BackupPayload;
  if (payload.version !== 1 || !payload.tables) {
    throw new Error('This file is not a recognized Elite backup.');
  }
  await db.transaction(
    'rw',
    [db.workoutSessions, db.workoutSets, db.customExercises, db.foodItems, db.foodLogs, db.cardioSessions, db.bodyWeightLogs, db.settings],
    async () => {
      await Promise.all([
        db.workoutSessions.clear(),
        db.workoutSets.clear(),
        db.customExercises.clear(),
        db.foodItems.clear(),
        db.foodLogs.clear(),
        db.cardioSessions.clear(),
        db.bodyWeightLogs.clear(),
        db.settings.clear(),
      ]);
      await db.workoutSessions.bulkAdd(payload.tables.workoutSessions as never[]);
      await db.workoutSets.bulkAdd(payload.tables.workoutSets as never[]);
      await db.customExercises.bulkAdd(payload.tables.customExercises as never[]);
      await db.foodItems.bulkAdd(payload.tables.foodItems as never[]);
      await db.foodLogs.bulkAdd(payload.tables.foodLogs as never[]);
      await db.cardioSessions.bulkAdd(payload.tables.cardioSessions as never[]);
      await db.bodyWeightLogs.bulkAdd(payload.tables.bodyWeightLogs as never[]);
      await db.settings.bulkAdd(payload.tables.settings as never[]);
    },
  );
}
