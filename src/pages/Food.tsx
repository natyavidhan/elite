import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import { LinkButton } from '@/components/ui/Button';
import { FoodLogCard } from '@/components/FoodLogCard';
import { today, isValidDateParam } from '@/db/schema';
import { getFoodLogsForDate, getDailyTotals, deleteFoodLog, type FoodLogEntry, type DailyTotals } from '@/db/foodDb';
import { getSettings, type AppSettings } from '@/db/settingsDb';
import type { MealType } from '@/db/schema';

const MEALS: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'Breakfast' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'dinner', label: 'Dinner' },
  { type: 'snack', label: 'Snacks' },
];

export function Food() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const date = isValidDateParam(dateParam) ? dateParam : today();

  function handleDateChange(newDate: string) {
    setSearchParams(newDate === today() ? {} : { date: newDate }, { replace: true });
  }

  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [totals, setTotals] = useState<DailyTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [settings, setSettings] = useState<AppSettings | null>(null);

  async function refresh() {
    setEntries(await getFoodLogsForDate(date));
    setTotals(await getDailyTotals(date));
  }

  useEffect(() => {
    refresh();
    getSettings().then(setSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function handleDelete(id: number) {
    await deleteFoodLog(id);
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="plate-caption text-xs text-ink-500">{format(parseISO(date), 'EEEE, MMMM d')}</p>
          <h1 className="font-display text-3xl sm:text-4xl text-ink-900 mt-1">Food</h1>
        </div>
        <div className="flex flex-col items-end gap-1 mt-1 text-xs">
          <Link to="/food/dishes" className="text-ink-500 hover:text-gold-600 underline underline-offset-4">
            My Dishes
          </Link>
          <Link to="/food/history" className="text-ink-500 hover:text-gold-600 underline underline-offset-4">
            History
          </Link>
        </div>
      </div>

      <label className="block w-fit">
        <span className="plate-caption text-[10px] block mb-1 text-ink-500">Date</span>
        <input
          type="date"
          value={date}
          max={today()}
          onChange={(e) => handleDateChange(e.target.value)}
          className="font-data bg-transparent border-b border-ink-900/25 focus:border-gold-600 py-1 text-sm focus:outline-none"
        />
      </label>

      <div className="bg-paper-100 border border-paper-400 shadow-plate rounded-lg p-4 sm:p-6 space-y-3">
        <MacroBar
          label="Calories"
          value={totals.calories}
          goal={settings?.dailyCalorieGoal ?? 2200}
          unit="kcal"
        />
        <div className="grid grid-cols-3 gap-4 pt-1">
          <MacroBar compact label="Protein" value={totals.protein} goal={settings?.dailyProteinGoal ?? 150} unit="g" />
          <MacroBar compact label="Carbs" value={totals.carbs} goal={settings?.dailyCarbGoal ?? 220} unit="g" />
          <MacroBar compact label="Fat" value={totals.fat} goal={settings?.dailyFatGoal ?? 70} unit="g" />
        </div>
      </div>

      {MEALS.map(({ type, label }) => {
        const mealEntries = entries.filter((e) => e.log.mealType === type);
        const subtotal = mealEntries.reduce((sum, e) => sum + e.calories, 0);
        return (
          <div key={type} className="bg-paper-100 border border-paper-400 rounded-lg px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="plate-caption text-xs">{label}</h2>
              <span className="font-data text-xs text-ink-500">{Math.round(subtotal)} kcal</span>
            </div>
            {mealEntries.length > 0 && (
              <div className="divide-y divide-paper-300 mb-2">
                {mealEntries.map((e) => (
                  <FoodLogCard key={e.log.id} entry={e} onDelete={() => e.log.id && handleDelete(e.log.id)} />
                ))}
              </div>
            )}
            <LinkButton to={`/food/search?meal=${type}&date=${date}`} variant="ghost" className="!px-0 text-xs">
              <Plus size={14} /> Add Food
            </LinkButton>
          </div>
        );
      })}
    </div>
  );
}

function MacroBar({ label, value, goal, unit, compact }: { label: string; value: number; goal: number; unit: string; compact?: boolean }) {
  const ratio = Math.min(value / goal, 1);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="plate-caption text-[10px] text-ink-500">{label}</span>
        <span className={`font-data ${compact ? 'text-xs' : 'text-sm'} text-ink-900`}>
          {Math.round(value)}
          <span className="text-ink-500">/{goal}{unit}</span>
        </span>
      </div>
      <div className="h-1 bg-paper-300 rounded-full overflow-hidden">
        <div className="h-full bg-gold-600 transition-all duration-500 ease-out" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
