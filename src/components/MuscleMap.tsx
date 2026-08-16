import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { MuscleMapFront } from './MuscleMapFront';
import { MuscleMapBack } from './MuscleMapBack';
import { MUSCLES, muscleDisplayName } from '@/constants/muscles';
import { getMuscleBreakdownForDate, type MuscleExerciseBreakdown } from '@/db/workoutDb';
import { today } from '@/db/schema';

interface MuscleMapProps {
  volumes: Record<string, number>;
  date?: string;
}

export function MuscleMap({ volumes, date = today() }: MuscleMapProps) {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<MuscleExerciseBreakdown[]>([]);

  useEffect(() => {
    if (!activeMuscle) {
      setBreakdown([]);
      return;
    }
    let cancelled = false;
    getMuscleBreakdownForDate(date, activeMuscle).then((data) => {
      if (!cancelled) setBreakdown(data);
    });
    return () => {
      cancelled = true;
    };
  }, [activeMuscle, date]);

  function handleSelect(muscleId: string) {
    setActiveMuscle((prev) => (prev === muscleId ? null : muscleId));
  }

  const ranked = Object.entries(volumes)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);
  const trainedIds = new Set(ranked.map(([id]) => id));
  const resting = Object.keys(MUSCLES).filter((id) => !trainedIds.has(id));

  return (
    <div className="bg-paper-100 border border-paper-400 shadow-plate rounded-[2px]">
      <div className="flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5">
        <h2 className="plate-caption text-xs sm:text-sm">Plate — Today&apos;s Training</h2>
        <div className="flex gap-1 text-xs">
          <button
            onClick={() => setSide('front')}
            className={`plate-caption px-2 py-1 transition-colors ${side === 'front' ? 'text-gold-700 underline underline-offset-4' : 'text-ink-500 hover:text-ink-700'}`}
          >
            Anterior
          </button>
          <button
            onClick={() => setSide('back')}
            className={`plate-caption px-2 py-1 transition-colors ${side === 'back' ? 'text-gold-700 underline underline-offset-4' : 'text-ink-500 hover:text-ink-700'}`}
          >
            Posterior
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="max-w-sm mx-auto md:mx-0 md:max-w-none w-full md:w-auto md:h-[min(64vh,640px)] md:justify-self-start">
          {side === 'front' ? (
            <MuscleMapFront volumes={volumes} activeMuscle={activeMuscle} onSelect={handleSelect} />
          ) : (
            <MuscleMapBack volumes={volumes} activeMuscle={activeMuscle} onSelect={handleSelect} />
          )}
        </div>

        <div className="border-t md:border-t-0 md:border-l hairline pt-3 md:pt-0 md:pl-4">
          <ol className="space-y-1.5">
            {ranked.map(([id, volume], i) => (
              <li key={id}>
                <button
                  onClick={() => handleSelect(id)}
                  className={`w-full flex items-baseline gap-2 text-left text-sm py-0.5 transition-colors ${activeMuscle === id ? 'text-gold-700' : 'text-ink-900 hover:text-gold-600'}`}
                >
                  <span className="font-data text-xs text-ink-500 w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 truncate">{muscleDisplayName(id)}</span>
                  <span className="font-data text-xs text-ink-500">{Math.round(volume).toLocaleString()}</span>
                </button>
              </li>
            ))}
          </ol>
          {resting.length > 0 && (
            <>
              {ranked.length > 0 && <div className="my-2 border-t hairline" />}
              <ul className="space-y-1">
                {resting.map((id) => (
                  <li key={id}>
                    <button
                      onClick={() => handleSelect(id)}
                      className={`w-full text-left text-xs py-0.5 transition-colors ${activeMuscle === id ? 'text-gold-700' : 'text-ink-500 hover:text-ink-700'}`}
                    >
                      {muscleDisplayName(id)}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: activeMuscle ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          {activeMuscle && (
            <div className="border-t hairline px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="plate-caption text-xs">{muscleDisplayName(activeMuscle)} — Today</h3>
                <button onClick={() => setActiveMuscle(null)} aria-label="Close" className="text-ink-500 hover:text-gold-600">
                  <X size={16} />
                </button>
              </div>
              {breakdown.length === 0 ? (
                <p className="text-sm text-ink-500">Nothing logged for this muscle yet today.</p>
              ) : (
                <ul className="space-y-2">
                  {breakdown.map((b) => (
                    <li key={b.exerciseId} className="text-sm">
                      <div className="flex items-baseline gap-2">
                        <span className="text-ink-900">{b.exerciseName}</span>
                        {b.role === 'secondary' && <span className="text-xs text-ink-500">(secondary)</span>}
                      </div>
                      <div className="font-data text-xs text-ink-500 mt-0.5">
                        {b.sets.map((s) => `${s.weightKg}kg×${s.reps}`).join('  ·  ')}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
