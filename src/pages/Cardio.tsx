import { useEffect, useState } from 'react';
import { CardioCard } from '@/components/CardioCard';
import { LinkButton } from '@/components/ui/Button';
import { getRecentCardioSessions, getWeeklyCardioTotals, getCardioPersonalBests, deleteCardioSession, type WeeklyCardioTotals, type CardioPersonalBests } from '@/db/cardioDb';
import type { CardioSession } from '@/db/schema';

export function Cardio() {
  const [sessions, setSessions] = useState<CardioSession[]>([]);
  const [weekly, setWeekly] = useState<WeeklyCardioTotals>({ totalKm: 0, totalSeconds: 0, sessionCount: 0 });
  const [bests, setBests] = useState<CardioPersonalBests>({});

  async function refresh() {
    setSessions(await getRecentCardioSessions());
    setWeekly(await getWeeklyCardioTotals());
    setBests(await getCardioPersonalBests());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(id: number) {
    await deleteCardioSession(id);
    refresh();
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl sm:text-4xl text-ink-900">Cardio</h1>

      <div className="bg-paper-100 border border-paper-400 shadow-plate rounded-lg divide-y divide-paper-400">
        <RowStat label="This Week" value={`${weekly.totalKm.toFixed(1)} km · ${Math.round(weekly.totalSeconds / 60)} min · ${weekly.sessionCount} sessions`} />
        {bests.longestRunKm !== undefined && <RowStat label="Longest Run" value={`${bests.longestRunKm.toFixed(2)} km`} />}
        {bests.fastestPace && <RowStat label="Fastest Pace" value={bests.fastestPace.label} />}
      </div>

      <LinkButton to="/cardio/log" className="w-full">
        Log Session
      </LinkButton>

      <div className="bg-paper-100 border border-paper-400 rounded-lg px-4 sm:px-6 divide-y divide-paper-300">
        {sessions.length === 0 ? (
          <p className="text-sm text-ink-500 py-8 text-center">No cardio sessions yet.</p>
        ) : (
          sessions.map((s) => <CardioCard key={s.id} session={s} onDelete={() => s.id && handleDelete(s.id)} />)
        )}
      </div>
    </div>
  );
}

function RowStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6">
      <span className="plate-caption text-xs text-ink-500">{label}</span>
      <span className="font-data text-sm text-ink-900">{value}</span>
    </div>
  );
}
