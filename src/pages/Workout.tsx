import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { MuscleMap } from '@/components/MuscleMap';
import { LinkButton } from '@/components/ui/Button';
import { today } from '@/db/schema';
import { getMuscleVolumesForDate, getSessionSummary, type SessionSummary } from '@/db/workoutDb';

export function Workout() {
  const date = today();
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<SessionSummary | undefined>();

  useEffect(() => {
    getMuscleVolumesForDate(date).then(setVolumes);
    getSessionSummary(date).then(setSummary);
  }, [date]);

  return (
    <div className="space-y-5">
      <div>
        <p className="plate-caption text-xs text-ink-500">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h1 className="font-display text-3xl sm:text-4xl text-ink-900 mt-1">Workout</h1>
      </div>

      <div className="md:flex md:gap-6 md:items-start">
        <div className="md:flex-none">
          <MuscleMap volumes={volumes} date={date} />
        </div>

        <div className="mt-5 md:mt-0 md:flex-1 space-y-5">
          <div className="bg-paper-100 border border-paper-400 shadow-plate rounded-lg px-4 py-3 sm:px-6 flex items-center justify-between">
            <span className="plate-caption text-xs text-ink-500">Today&apos;s session</span>
            <span className="font-data text-sm text-ink-900">
              {summary ? `${summary.exerciseCount} exercises · ${summary.setCount} sets · ${Math.round(summary.totalVolume).toLocaleString()} kg·reps` : 'Nothing logged yet'}
            </span>
          </div>

          <div className="flex gap-2">
            <LinkButton to="/workout/log" className="flex-1">
              {summary && summary.setCount > 0 ? 'Continue Workout' : 'Start Workout'}
            </LinkButton>
            <LinkButton to="/workout/history" variant="secondary" className="flex-1">
              View History
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
