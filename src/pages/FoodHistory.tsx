import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { getFoodDatesWithLogs, getFoodLogsForDate, getDailyTotals, type FoodLogEntry } from '@/db/foodDb';

export function FoodHistory() {
  const [dates, setDates] = useState<string[]>([]);
  const [totalsByDate, setTotalsByDate] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);

  useEffect(() => {
    getFoodDatesWithLogs().then(async (list) => {
      setDates(list);
      const totals = await Promise.all(list.map(async (d) => [d, (await getDailyTotals(d)).calories] as const));
      setTotalsByDate(Object.fromEntries(totals));
    });
  }, []);

  async function toggle(date: string) {
    if (expanded === date) {
      setExpanded(null);
      return;
    }
    setExpanded(date);
    setEntries(await getFoodLogsForDate(date));
  }

  if (dates.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="font-display text-3xl text-ink-900">Food History</h1>
        <p className="text-sm text-ink-500 py-8 text-center">No meals logged yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl text-ink-900">Food History</h1>
      <div className="bg-paper-100 border border-paper-400 shadow-plate rounded-lg divide-y divide-paper-400">
        {dates.map((date) => (
          <div key={date}>
            <button
              onClick={() => toggle(date)}
              className="w-full flex items-center justify-between px-4 py-3 sm:px-6 text-left hover:bg-paper-300/50 transition-colors"
            >
              <span className="text-sm text-ink-900">{format(parseISO(date), 'EEEE, MMM d')}</span>
              <div className="flex items-center gap-3">
                <span className="font-data text-xs text-ink-500">{Math.round(totalsByDate[date] ?? 0)} kcal</span>
                <ChevronDown size={16} className={`text-ink-500 transition-transform ${expanded === date ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {expanded === date && (
              <div className="px-4 pb-4 sm:px-6 divide-y divide-paper-300">
                {entries.map((e) => (
                  <div key={e.log.id} className="py-2 text-sm flex justify-between">
                    <span className="text-ink-900">{e.item.name}</span>
                    <span className="font-data text-xs text-ink-500">{Math.round(e.log.quantityG)}g · {Math.round(e.calories)} kcal</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
