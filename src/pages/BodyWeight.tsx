import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Trash2, Pencil, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { WeightEntry } from '@/components/WeightEntry';
import {
  getTodayBodyWeight,
  getBodyWeightLogByDate,
  getBodyWeightLogsInRange,
  getBodyWeightStats,
  deleteBodyWeightLog,
  type WeightRange,
  type BodyWeightStats,
} from '@/db/bodyweightDb';
import { getSettings } from '@/db/settingsDb';
import { formatWeight, kgToLbs } from '@/utils/unitConversion';
import { useTheme } from '@/hooks/useTheme';
import { THEME_COLORS } from '@/utils/theme';
import { today as todayStr } from '@/db/schema';
import type { BodyWeightLog } from '@/db/schema';

const RANGES: { key: WeightRange; label: string }[] = [
  { key: '1w', label: '1W' },
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: 'all', label: 'All' },
];

export function BodyWeight() {
  const [range, setRange] = useState<WeightRange>('1m');
  const [logs, setLogs] = useState<BodyWeightLog[]>([]);
  const [today, setToday] = useState<BodyWeightLog | undefined>();
  const [stats, setStats] = useState<BodyWeightStats>({});
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [editing, setEditing] = useState(false);
  const [pastEntryOpen, setPastEntryOpen] = useState(false);
  const [pastDate, setPastDate] = useState('');
  const [pastExisting, setPastExisting] = useState<BodyWeightLog | undefined>();

  async function refresh() {
    setLogs(await getBodyWeightLogsInRange(range));
    setToday(await getTodayBodyWeight());
    setStats(await getBodyWeightStats());
  }

  useEffect(() => {
    refresh();
    getSettings().then((s) => setUnit(s.bodyweightUnit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  async function handleDelete(id: number) {
    await deleteBodyWeightLog(id);
    refresh();
  }

  async function openPastEntry(date: string) {
    setPastDate(date);
    setPastExisting(date ? await getBodyWeightLogByDate(date) : undefined);
  }

  function closePastEntry() {
    setPastEntryOpen(false);
    setPastDate('');
    setPastExisting(undefined);
  }

  const chartData = logs.map((l) => ({
    date: l.date,
    weight: unit === 'kg' ? l.weightKg : kgToLbs(l.weightKg),
  }));
  const weightValues = chartData.map((d) => d.weight);
  const yDomain: [number, number] =
    weightValues.length > 0 ? [Math.floor(Math.min(...weightValues) - 1), Math.ceil(Math.max(...weightValues) + 1)] : [0, 1];

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const c = THEME_COLORS[resolvedTheme];
  const tooltipAccent = isDark ? '#6B4F06' : '#F0D98C';

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl sm:text-4xl text-ink-900">Body Weight</h1>

      <div className="bg-paper-100 border border-paper-400 shadow-plate rounded-lg p-4 sm:p-6">
        <div className="flex justify-end gap-1 mb-2">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`plate-caption text-[10px] px-2 py-1 transition-colors ${
                range === r.key ? 'text-gold-700 underline underline-offset-4' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {chartData.length < 2 ? (
          <div className="h-48 flex items-center justify-center text-sm text-ink-500">Log a few days to see your trend.</div>
        ) : (
          <ResponsiveContainer width="100%" height={192}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(parseISO(d), 'MMM d')}
                tick={{ fontSize: 10, fill: c.ink500, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: c.paper400 }}
                tickLine={false}
                minTickGap={30}
              />
              <YAxis
                tick={{ fontSize: 10, fill: c.ink500, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                domain={yDomain}
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(1)} ${unit}`, 'Weight']}
                labelFormatter={(d) => (typeof d === 'string' ? format(parseISO(d), 'EEE, MMM d') : '')}
                contentStyle={{ background: c.ink900, border: 'none', borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: c.paper200 }}
                itemStyle={{ color: tooltipAccent }}
              />
              <Line type="monotone" dataKey="weight" stroke="#B8860B" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {editing || !today ? (
        <WeightEntry date={todayStr()} existing={today} unit={unit} onSaved={() => { setEditing(false); refresh(); }} />
      ) : (
        <div className="bg-paper-100 border border-paper-400 rounded-lg px-4 py-3 sm:px-6 flex items-center justify-between">
          <div>
            <span className="plate-caption text-xs text-ink-500">Today</span>
            <div className="font-data text-lg text-ink-900">{formatWeight(today.weightKg, unit)}</div>
          </div>
          <button onClick={() => setEditing(true)} className="text-ink-500 hover:text-gold-600 p-2">
            <Pencil size={16} />
          </button>
        </div>
      )}

      {pastEntryOpen ? (
        <div className="bg-paper-100 border border-paper-400 rounded-lg p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block flex-1">
              <span className="plate-caption text-[10px] block mb-1">Date</span>
              <input
                type="date"
                value={pastDate}
                max={todayStr()}
                onChange={(e) => openPastEntry(e.target.value)}
                className="font-data bg-transparent border-b border-ink-900/25 focus:border-gold-600 py-1 text-sm focus:outline-none"
              />
            </label>
            <button onClick={closePastEntry} className="text-xs text-ink-500 hover:text-gold-600 underline underline-offset-4">
              Cancel
            </button>
          </div>
          {pastDate && (
            <WeightEntry
              key={pastDate}
              date={pastDate}
              existing={pastExisting}
              unit={unit}
              onSaved={() => { closePastEntry(); refresh(); }}
            />
          )}
        </div>
      ) : (
        <button
          onClick={() => setPastEntryOpen(true)}
          className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-gold-600"
        >
          <Plus size={14} /> Log a past day
        </button>
      )}

      <div className="bg-paper-100 border border-paper-400 shadow-plate rounded-lg divide-y divide-paper-400">
        <StatRow label="Current" value={stats.current ? formatWeight(stats.current, unit) : '—'} />
        <StatRow label="Starting" value={stats.starting ? formatWeight(stats.starting, unit) : '—'} />
        <StatRow label="Change" value={stats.changeKg !== undefined ? `${stats.changeKg >= 0 ? '+' : ''}${formatWeight(stats.changeKg, unit)}` : '—'} />
        <StatRow label="7-Day Avg" value={stats.sevenDayAverage ? formatWeight(stats.sevenDayAverage, unit) : '—'} />
      </div>

      <div className="bg-paper-100 border border-paper-400 rounded-lg px-4 sm:px-6 divide-y divide-paper-300">
        {[...logs].reverse().map((log) => (
          <div key={log.id} className="flex items-center justify-between py-2.5 group">
            <span className="text-sm text-ink-900">{format(parseISO(log.date), 'EEE, MMM d')}</span>
            <div className="flex items-center gap-3">
              <span className="font-data text-xs text-ink-500">{formatWeight(log.weightKg, unit)}</span>
              <button
                onClick={() => log.id && handleDelete(log.id)}
                aria-label="Delete entry"
                className="text-ink-300 hover:text-gold-600 p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6">
      <span className="plate-caption text-xs text-ink-500">{label}</span>
      <span className="font-data text-sm text-ink-900">{value}</span>
    </div>
  );
}
