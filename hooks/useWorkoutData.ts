import { useState, useCallback } from 'react';
import { getTodayVolumeByMuscle } from '../db/workoutDb';
import { EXERCISES } from '../constants/exercises';

const exerciseMuscleMap: Record<string, string[]> = {};
for (const ex of EXERCISES) {
  exerciseMuscleMap[ex.id] = [...ex.primaryMuscles, ...ex.secondaryMuscles];
}

export function useWorkoutData() {
  const [todayVolume, setTodayVolume] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const refreshTodayVolume = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const volume = await getTodayVolumeByMuscle(date, exerciseMuscleMap);
      setTodayVolume(volume);
    } catch (e) {
      console.error('Failed to load volume:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { todayVolume, loading, refreshTodayVolume };
}
