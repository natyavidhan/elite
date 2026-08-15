import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { LinkButton } from '@/components/ui/Button';
import { Plate } from '@/components/ui/Plate';
import { ContributionHeatmap } from '@/components/ContributionHeatmap';
import { getDailyActivity, type DailyActivity } from '@/db/insightsDb';

const HomeInsights = lazy(() => import('./HomeInsights'));

const HEATMAP_DAYS = 371; // 53 weeks — full year, GitHub-style

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function computeStreak(days: DailyActivity[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].score > 0) streak++;
    else break;
  }
  return streak;
}

export function Home() {
  const [activity, setActivity] = useState<DailyActivity[]>([]);

  useEffect(() => {
    getDailyActivity(HEATMAP_DAYS).then(setActivity);
  }, []);

  const { streak, activeDays } = useMemo(
    () => ({ streak: computeStreak(activity), activeDays: activity.filter((d) => d.score > 0).length }),
    [activity],
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="plate-caption text-xs text-ink-500">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h1 className="font-display text-3xl sm:text-4xl text-ink-900 mt-1">{greeting()}</h1>
      </div>

      <Plate className="p-4 sm:p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="plate-caption text-xs sm:text-sm">Consistency</h2>
          <span className="font-data text-xs text-ink-500">
            {activeDays} tracked days {streak > 0 && `· ${streak} day streak`}
          </span>
        </div>
        <ContributionHeatmap data={activity} />
      </Plate>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Plate key={i} className="p-4 sm:p-5 h-32 animate-pulse" />
            ))}
          </div>
        }
      >
        <HomeInsights />
      </Suspense>

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
