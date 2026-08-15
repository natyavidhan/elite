import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { WorkoutSet } from '@/db/schema';

interface Props {
  set: WorkoutSet;
  onUpdate: (changes: Partial<Pick<WorkoutSet, 'reps' | 'weightKg' | 'rpe'>>) => void;
  onDelete: () => void;
  isPR?: boolean;
}

export function SetRow({ set, onUpdate, onDelete, isPR }: Props) {
  const [weight, setWeight] = useState(String(set.weightKg));
  const [reps, setReps] = useState(String(set.reps));

  return (
    <div className="flex items-center gap-2 py-1.5 group">
      <span className="font-data text-xs text-ink-500 w-5 shrink-0">{set.setNumber}</span>
      <input
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={() => {
          const v = parseFloat(weight);
          if (!isNaN(v) && v !== set.weightKg) onUpdate({ weightKg: v });
          else setWeight(String(set.weightKg));
        }}
        className="font-data w-16 bg-transparent border-b border-ink-900/20 focus:border-vermilion-600 py-1 text-sm text-right focus:outline-none"
        aria-label={`Set ${set.setNumber} weight in kilograms`}
      />
      <span className="text-xs text-ink-500">kg ×</span>
      <input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={() => {
          const v = parseInt(reps, 10);
          if (!isNaN(v) && v !== set.reps) onUpdate({ reps: v });
          else setReps(String(set.reps));
        }}
        className="font-data w-12 bg-transparent border-b border-ink-900/20 focus:border-vermilion-600 py-1 text-sm text-right focus:outline-none"
        aria-label={`Set ${set.setNumber} reps`}
      />
      <span className="text-xs text-ink-500">reps</span>
      {isPR && <span className="plate-caption text-[10px] text-vermilion-700 ml-1">PR</span>}
      <button
        onClick={onDelete}
        aria-label={`Delete set ${set.setNumber}`}
        className="ml-auto text-ink-300 hover:text-vermilion-600 p-1"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
