import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { upsertBodyWeight } from '@/db/bodyweightDb';
import { kgToLbs, lbsToKg } from '@/utils/unitConversion';
import type { BodyWeightLog } from '@/db/schema';

interface Props {
  existing?: BodyWeightLog;
  unit: 'kg' | 'lbs';
  onSaved: () => void;
}

export function WeightEntry({ existing, unit, onSaved }: Props) {
  const initial = existing ? (unit === 'kg' ? existing.weightKg : kgToLbs(existing.weightKg)) : undefined;
  const [weight, setWeight] = useState(initial ? initial.toFixed(1) : '');
  const [bodyFat, setBodyFat] = useState(existing?.bodyFatPct ? String(existing.bodyFatPct) : '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  async function handleSave() {
    const value = parseFloat(weight);
    if (isNaN(value) || value <= 0) return;
    const weightKg = unit === 'kg' ? value : lbsToKg(value);
    await upsertBodyWeight({ weightKg, bodyFatPct: bodyFat ? parseFloat(bodyFat) : undefined, notes: notes || undefined });
    onSaved();
  }

  return (
    <div className="bg-paper-100 border border-paper-400 shadow-plate rounded-[2px] p-4 sm:p-6 space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="plate-caption text-[10px] block mb-1">Weight ({unit})</span>
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            autoFocus
            className="font-data w-full text-xl bg-transparent border-b border-ink-900/25 focus:border-vermilion-600 py-1 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="plate-caption text-[10px] block mb-1">Body Fat % (optional)</span>
          <input
            type="number"
            inputMode="decimal"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            className="font-data w-full text-xl bg-transparent border-b border-ink-900/25 focus:border-vermilion-600 py-1 focus:outline-none"
          />
        </label>
      </div>
      <label className="block">
        <span className="plate-caption text-[10px] block mb-1">Notes (optional)</span>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-transparent border-b border-ink-900/25 focus:border-vermilion-600 py-1.5 text-sm focus:outline-none"
        />
      </label>
      <Button onClick={handleSave} disabled={!weight} className="w-full">
        {existing ? 'Update' : 'Save'}
      </Button>
    </div>
  );
}
