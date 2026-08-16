import { useEffect, useMemo, useRef } from 'react';
import { parseISO, format } from 'date-fns';
import { getIntensityColor } from '@/utils/muscleColor';
import { useTheme } from '@/hooks/useTheme';
import type { DailyActivity } from '@/db/insightsDb';

interface Props {
  data: DailyActivity[];
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const CELL = 11;
const GAP = 3;

export function ContributionHeatmap({ data }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const { weeks, monthMarkers } = useMemo(() => {
    if (data.length === 0) return { weeks: [], monthMarkers: [] };
    const firstDow = parseISO(data[0].date).getDay(); // 0 = Sunday
    const padded: (DailyActivity | null)[] = [...Array(firstDow).fill(null), ...data];
    const weeks: (DailyActivity | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

    const monthMarkers: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstReal = week.find((d) => d);
      if (!firstReal) return;
      const month = parseISO(firstReal.date).getMonth();
      if (month !== lastMonth) {
        monthMarkers.push({ weekIndex: i, label: format(parseISO(firstReal.date), 'MMM') });
        lastMonth = month;
      }
    });
    return { weeks, monthMarkers };
  }, [data]);

  useEffect(() => {
    // Most recent activity (right edge) matters far more than the oldest —
    // default the scroll position there instead of leaving narrow viewports
    // parked at the start of the year.
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [weeks.length]);

  if (data.length === 0) return null;

  const width = weeks.length * (CELL + GAP);

  return (
    <div ref={scrollRef} className="overflow-x-auto">
      <div style={{ width: Math.max(width, 280) }}>
        <div className="relative h-4 mb-1">
          {monthMarkers.map(({ weekIndex, label }) => (
            <span
              key={weekIndex + label}
              className="absolute plate-caption text-[9px] text-ink-500"
              style={{ left: weekIndex * (CELL + GAP) }}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="flex gap-[3px]">
          <div className="flex flex-col gap-[3px] mr-1">
            {DAY_LABELS.map((label, i) => (
              <span key={i} className="text-[9px] text-ink-500 leading-none font-data" style={{ height: CELL }}>
                {label}
              </span>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) =>
                day ? (
                  <div
                    key={di}
                    title={`${day.score}/4 tracked — ${format(parseISO(day.date), 'EEE, MMM d')}`}
                    style={{ width: CELL, height: CELL, backgroundColor: getIntensityColor(day.score / 4, isDark) }}
                    className="rounded-[3px]"
                  />
                ) : (
                  <div key={di} style={{ width: CELL, height: CELL }} />
                ),
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-[9px] text-ink-500">Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <div key={r} style={{ width: CELL, height: CELL, backgroundColor: getIntensityColor(r, isDark) }} className="rounded-[3px]" />
          ))}
          <span className="text-[9px] text-ink-500">More</span>
        </div>
      </div>
    </div>
  );
}
