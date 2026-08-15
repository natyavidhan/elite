import { format, parseISO } from 'date-fns';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Plate } from '@/components/ui/Plate';
import { useTheme } from '@/hooks/useTheme';
import { THEME_COLORS } from '@/utils/theme';

interface Props {
  label: string;
  todayValue: string;
  todayDetail?: string;
  data: { date: string; value: number }[];
  chartType?: 'bar' | 'line';
  unit?: string;
}

export function InsightCard({ label, todayValue, todayDetail, data, chartType = 'bar', unit = '' }: Props) {
  const hasData = data.some((d) => d.value > 0);
  const { resolvedTheme } = useTheme();
  const c = THEME_COLORS[resolvedTheme];
  // The tooltip stays a solid ink-toned chip in both themes — in dark mode
  // that means a light cream chip with dark text, so it never blends into
  // an already-dark page. The vermilion accent flips depth to match: light
  // tint on the dark-mode-light chip needs a deeper vermilion, not a lighter one.
  const isDark = resolvedTheme === 'dark';
  const cursorFill = isDark ? 'rgba(237,227,204,0.08)' : 'rgba(32,27,21,0.06)';
  const tooltipAccent = isDark ? '#A22E20' : '#EFA593';

  return (
    <Plate className="p-4 sm:p-5">
      <div className="plate-caption text-[10px] text-ink-500 mb-1">{label}</div>
      <div className="font-data text-2xl text-ink-900 mb-0.5">{todayValue}</div>
      {todayDetail && <div className="font-data text-xs text-ink-500 mb-2">{todayDetail}</div>}
      <div className="h-14 -mx-1 mt-2">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                <Tooltip
                  cursor={{ fill: cursorFill }}
                  formatter={(v: number) => [`${Math.round(v).toLocaleString()}${unit}`, undefined]}
                  labelFormatter={(d) => (typeof d === 'string' ? format(parseISO(d), 'EEE, MMM d') : '')}
                  contentStyle={{ background: c.ink900, border: 'none', borderRadius: 2, fontSize: 11, padding: '4px 8px' }}
                  labelStyle={{ color: c.paper100 }}
                  itemStyle={{ color: tooltipAccent }}
                />
                <Bar dataKey="value" fill="#C13A2A" radius={[1, 1, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(1)}${unit}`, undefined]}
                  labelFormatter={(d) => (typeof d === 'string' ? format(parseISO(d), 'EEE, MMM d') : '')}
                  contentStyle={{ background: c.ink900, border: 'none', borderRadius: 2, fontSize: 11, padding: '4px 8px' }}
                  labelStyle={{ color: c.paper100 }}
                  itemStyle={{ color: tooltipAccent }}
                />
                <Line type="monotone" dataKey="value" stroke="#C13A2A" strokeWidth={1.75} dot={false} connectNulls />
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center text-xs text-ink-300">No data yet</div>
        )}
      </div>
    </Plate>
  );
}
