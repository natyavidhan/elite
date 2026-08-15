import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { MuscleMap } from '@/components/MuscleMap';
import { LinkButton } from '@/components/ui/Button';
import { today } from '@/db/schema';
import { getMuscleVolumesForDate, getSessionSummary, type SessionSummary } from '@/db/workoutDb';
import { getDailyTotals, type DailyTotals } from '@/db/foodDb';
import { getRecentCardioSessions } from '@/db/cardioDb';
import { getBodyWeightStats, type BodyWeightStats } from '@/db/bodyweightDb';
import { getSettings, type AppSettings } from '@/db/settingsDb';
import { formatWeight } from '@/utils/unitConversion';
import type { CardioSession } from '@/db/schema';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Home() {
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [workout, setWorkout] = useState<SessionSummary | undefined>();
  const [totals, setTotals] = useState<DailyTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [cardioToday, setCardioToday] = useState<CardioSession | undefined>();
  const [weightStats, setWeightStats] = useState<BodyWeightStats>({});
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const date = today();

  useEffect(() => {
    getMuscleVolumesForDate(date).then(setVolumes);
    getSessionSummary(date).then(setWorkout);
    getDailyTotals(date).then(setTotals);
    getRecentCardioSessions(5).then((sessions) => setCardioToday(sessions.find((s) => s.date === date)));
    getBodyWeightStats().then(setWeightStats);
    getSettings().then(setSettings);
  }, [date]);

  const bwUnit = settings?.bodyweightUnit ?? 'kg';

  return (
    <div className="space-y-6">
      <div>
        <p className="plate-caption text-xs text-ink-500">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h1 className="font-display text-3xl sm:text-4xl text-ink-900 mt-1">{greeting()}</h1>
      </div>

      <MuscleMap volumes={volumes} date={date} />

      <div className="bg-paper-100 border border-paper-400 shadow-plate rounded-[2px] divide-y divide-paper-400">
        <Row
          label="Calories"
          value={`${Math.round(totals.calories).toLocaleString()} kcal`}
          detail={settings ? `of ${settings.dailyCalorieGoal.toLocaleString()} goal` : undefined}
        />
        <Row
          label="Macros"
          value={`${Math.round(totals.protein)}P · ${Math.round(totals.carbs)}C · ${Math.round(totals.fat)}F`}
          detail="grams"
        />
        <Row
          label="Workout"
          value={workout ? `${workout.exerciseCount} exercises · ${workout.setCount} sets` : 'Nothing logged yet'}
          detail={workout ? `${Math.round(workout.totalVolume).toLocaleString()} kg·reps` : undefined}
        />
        <Row
          label="Cardio"
          value={cardioToday ? `${cardioToday.activityType} · ${Math.round(cardioToday.durationSeconds / 60)} min` : 'Nothing logged yet'}
          detail={cardioToday?.distanceKm ? `${cardioToday.distanceKm.toFixed(2)} km` : undefined}
        />
        <Row
          label="Body Weight"
          value={weightStats.current ? formatWeight(weightStats.current, bwUnit) : 'Not logged yet'}
          detail={
            weightStats.current && weightStats.sevenDayAverage
              ? `7-day avg ${formatWeight(weightStats.sevenDayAverage, bwUnit)}`
              : undefined
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <LinkButton to="/workout/log" variant="secondary" className="flex-1">
          Log Workout
        </LinkButton>
        <LinkButton to="/food/search" variant="secondary" className="flex-1">
          Log Meal
        </LinkButton>
        <LinkButton to="/cardio/log" variant="secondary" className="flex-1">
          Log Run
        </LinkButton>
        <LinkButton to="/bodyweight" variant="secondary" className="flex-1">
          Log Weight
        </LinkButton>
      </div>
    </div>
  );
}

function Row({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6">
      <span className="plate-caption text-xs text-ink-500">{label}</span>
      <div className="text-right">
        <div className="font-data text-sm text-ink-900">{value}</div>
        {detail && <div className="font-data text-xs text-ink-500">{detail}</div>}
      </div>
    </div>
  );
}
