import { useState, useCallback } from 'react';
import { getCardioSessions, getWeeklyTotals } from '../db/cardioDb';

export function useCardioData() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [weeklyTotals, setWeeklyTotals] = useState({ totalKm: 0, totalSeconds: 0, sessionCount: 0 });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, w] = await Promise.all([getCardioSessions(), getWeeklyTotals()]);
      setSessions(s);
      setWeeklyTotals(w);
    } catch (e) {
      console.error('Failed to load cardio data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { sessions, weeklyTotals, loading, refresh };
}
