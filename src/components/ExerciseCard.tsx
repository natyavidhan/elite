import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SetRow } from './SetRow';
import { muscleDisplayName } from '@/constants/muscles';
import type { WorkoutSet } from '@/db/schema';

interface Props {
  name: string;
  primaryMuscles: string[];
  sets: WorkoutSet[];
  prSetIds: Set<number>;
  onAddSet: (reps: number, weightKg: number) => void;
  onUpdateSet: (setId: number, changes: Partial<Pick<WorkoutSet, 'reps' | 'weightKg' | 'rpe'>>) => void;
  onDeleteSet: (setId: number) => void;
}

export function ExerciseCard({ name, primaryMuscles, sets, prSetIds, onAddSet, onUpdateSet, onDeleteSet }: Props) {
  const last = sets[sets.length - 1];
  const [draftWeight, setDraftWeight] = useState('');
  const [draftReps, setDraftReps] = useState('');

  function submitDraft() {
    const weight = parseFloat(draftWeight || (last ? String(last.weightKg) : ''));
    const reps = parseInt(draftReps || (last ? String(last.reps) : ''), 10);
    if (isNaN(weight) || weight <= 0 || isNaN(reps) || reps <= 0) return;
    onAddSet(reps, weight);
    setDraftWeight('');
    setDraftReps('');
  }

  return (
    <div className="bg-paper-100 border border-paper-400 rounded-[2px] px-4 py-3">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-medium text-ink-900">{name}</h3>
        <div className="flex gap-1">
          {primaryMuscles.map((m) => (
            <span key={m} className="plate-caption text-[9px] text-ink-500">
              {muscleDisplayName(m)}
            </span>
          ))}
        </div>
      </div>

      <div className="divide-y divide-paper-300">
        {sets.map((s) => (
          <SetRow
            key={s.id}
            set={s}
            isPR={s.id ? prSetIds.has(s.id) : false}
            onUpdate={(changes) => s.id && onUpdateSet(s.id, changes)}
            onDelete={() => s.id && onDeleteSet(s.id)}
          />
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitDraft();
        }}
        className="flex items-center gap-2 pt-2 mt-1 border-t hairline"
      >
        <span className="font-data text-xs text-ink-500 w-5 shrink-0">{sets.length + 1}</span>
        <input
          type="number"
          inputMode="decimal"
          placeholder={last ? String(last.weightKg) : 'kg'}
          value={draftWeight}
          onChange={(e) => setDraftWeight(e.target.value)}
          className="font-data w-16 bg-transparent border-b border-ink-900/20 focus:border-gold-600 py-1 text-sm text-right focus:outline-none placeholder:text-ink-300"
          aria-label="New set weight in kilograms"
        />
        <span className="text-xs text-ink-500">kg ×</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder={last ? String(last.reps) : 'reps'}
          value={draftReps}
          onChange={(e) => setDraftReps(e.target.value)}
          className="font-data w-12 bg-transparent border-b border-ink-900/20 focus:border-gold-600 py-1 text-sm text-right focus:outline-none placeholder:text-ink-300"
          aria-label="New set reps"
        />
        <span className="text-xs text-ink-500">reps</span>
        <button
          type="submit"
          className="ml-auto flex items-center gap-1 text-xs text-gold-700 hover:text-gold-800 py-1 px-2 -mr-2"
        >
          <Plus size={14} /> Add Set
        </button>
      </form>
    </div>
  );
}
