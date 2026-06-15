import { useState, useCallback } from 'react';
import { getDailyTotals } from '../db/foodDb';

export function useFoodData() {
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(false);

  const refreshTotals = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const totals = await getDailyTotals(date);
      setDailyTotals(totals);
    } catch (e) {
      console.error('Failed to load totals:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { dailyTotals, loading, refreshTotals };
}
