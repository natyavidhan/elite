import { format, parseISO } from 'date-fns';
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '@/hooks/useTheme';
import { THEME_COLORS } from '@/utils/theme';

export interface CoachVisualizationData {
  chartType: 'line' | 'bar' | 'pie' | 'table';
  title: string;
  xKey: string;
  yKeys: string[];
  rows: Record<string, unknown>[];
}

// Shades of the app's one highlighter color, not a rainbow palette — matches
// the "one gold accent" design language even when a series has 2-3 fields
// (e.g. calories/protein/carbs). Most coach charts are a single series.
const SERIES_COLORS = ['#B8860B', '#6B4F06', '#E0B23C'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatXTick(value: unknown): string {
  if (typeof value === 'string' && DATE_RE.test(value)) {
    try {
      return format(parseISO(value), 'MMM d');
    } catch {
      return value;
    }
  }
  return String(value ?? '');
}

// Table columns come straight from a tool result's field names (bestWeightKg,
// bodyFatPct, ...) — camelCase reads as one run-together word once
// uppercased by the plate-caption style, so split it into words first.
function humanizeKey(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\bKg\b/i, '(kg)')
    .replace(/\bPct\b/i, '(%)')
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function CoachVisualization({ chartType, title, xKey, yKeys, rows }: CoachVisualizationData) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const c = THEME_COLORS[resolvedTheme];

  if (chartType === 'table') {
    const columns = [xKey, ...yKeys.filter((k) => k !== xKey)];
    return (
      <div className="mt-1">
        <div className="plate-caption text-[10px] text-ink-500 mb-1.5">{title}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-data border-collapse">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col} className="border border-paper-400 px-2 py-1.5 text-left plate-caption text-[10px]">
                    {humanizeKey(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="border border-paper-400 px-2 py-1.5">
                      {String(row[col] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const tooltipAccent = isDark ? '#6B4F06' : '#F0D98C';
  const tooltipStyle = { background: c.ink900, border: 'none', borderRadius: 6, fontSize: 11, padding: '6px 10px' };

  if (chartType === 'pie') {
    // Slices are categories of the SAME metric, so this leans on more of
    // the gold family than a line/bar series would. Deliberately NOT mixing
    // in ink/paper tokens here: those flip lightness between themes (ink900
    // is near-black in light mode, near-white in dark mode), so a slice
    // built from one can end up nearly matching the card's own background
    // in whichever theme it's light in — confirmed directly: ink900 read
    // fine in light mode but blended into an equally-light dark-mode card.
    // Gold's hue carries the contrast in both themes instead of lightness
    // alone, so it doesn't have that failure mode. A 5th+ slice repeats a
    // color; the legend list (always shown alongside) still disambiguates.
    const pieColors = ['#B8860B', '#6B4F06', '#E0B23C', '#96700A'];
    const valueKey = yKeys[0];
    return (
      <div className="mt-1">
        <div className="plate-caption text-[10px] text-ink-500 mb-1.5">{title}</div>
        <div className="flex items-center gap-4">
          <div className="h-36 w-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows}
                  dataKey={valueKey}
                  nameKey={xKey}
                  cx="50%"
                  cy="50%"
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={32}
                  outerRadius={68}
                  paddingAngle={2}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {rows.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [typeof v === 'number' ? v.toLocaleString() : v, humanizeKey(valueKey)]}
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: c.paper100 }}
                  itemStyle={{ color: tooltipAccent }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1.5 text-xs min-w-0 flex-1">
            {rows.map((row, i) => (
              <li key={i} className="flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: pieColors[i % pieColors.length] }} />
                <span className="truncate text-ink-900">{String(row[xKey] ?? '')}</span>
                <span className="font-data text-ink-500 shrink-0 ml-auto">{String(row[valueKey] ?? '')}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const tooltip = (
    <Tooltip labelFormatter={formatXTick} contentStyle={tooltipStyle} labelStyle={{ color: c.paper100 }} itemStyle={{ color: tooltipAccent }} />
  );
  const xAxis = (
    <XAxis
      dataKey={xKey}
      tickFormatter={formatXTick}
      tick={{ fontSize: 10, fill: c.ink500, fontFamily: 'JetBrains Mono' }}
      axisLine={{ stroke: c.paper400 }}
      tickLine={false}
      minTickGap={20}
    />
  );
  const yAxis = <YAxis tick={{ fontSize: 10, fill: c.ink500, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={36} />;

  return (
    <div className="mt-1">
      <div className="plate-caption text-[10px] text-ink-500 mb-1.5">{title}</div>
      <div className="h-48 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={rows} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              {xAxis}
              {yAxis}
              {tooltip}
              {yKeys.map((key, i) => (
                <Bar key={key} dataKey={key} name={humanizeKey(key)} fill={SERIES_COLORS[i % SERIES_COLORS.length]} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          ) : (
            <LineChart data={rows} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              {xAxis}
              {yAxis}
              {tooltip}
              {yKeys.map((key, i) => (
                <Line key={key} type="monotone" dataKey={key} name={humanizeKey(key)} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={1.75} dot={{ r: 2.5 }} connectNulls />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
