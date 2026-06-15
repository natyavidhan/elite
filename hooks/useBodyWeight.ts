import { useState, useCallback } from 'react';
import { getAllWeights, getWeightStats } from '../db/bodyweightDb';

export function useBodyWeight() {
  const [weights, setWeights] = useState<any[]>([]);
  const [stats, setStats] = useState({ current: null, starting: null, change: null, sevenDayAvg: null } as any);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [w, s] = await Promise.all([getAllWeights(), getWeightStats()]);
      setWeights(w);
      setStats(s);
    } catch (e) {
      console.error('Failed to load weight data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { weights, stats, loading, refresh };
}
