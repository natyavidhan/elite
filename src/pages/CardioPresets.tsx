import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Plate } from '@/components/ui/Plate';
import { getCardioPresets, createCardioPreset, updateCardioPreset, deleteCardioPreset, type CardioPresetInput } from '@/db/cardioDb';
import type { CardioPreset, ActivityType } from '@/db/schema';

const ACTIVITIES: ActivityType[] = ['run', 'walk', 'cycle', 'swim', 'other'];

export function CardioPresets() {
  const navigate = useNavigate();
  const [presets, setPresets] = useState<CardioPreset[]>([]);
  const [editing, setEditing] = useState<CardioPreset | 'new' | null>(null);

  async function refresh() {
    setPresets(await getCardioPresets());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(id: number) {
    await deleteCardioPreset(id);
    refresh();
  }

  if (editing) {
    return (
      <PresetForm
        existing={editing === 'new' ? undefined : editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-5 max-w-lg">
      <button onClick={() => navigate('/cardio')} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
        <ChevronLeft size={16} /> Back to Cardio
      </button>

      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl text-ink-900">Presets</h1>
        <Button variant="secondary" onClick={() => setEditing('new')} className="text-xs px-3 py-1.5">
          <Plus size={14} /> New Preset
        </Button>
      </div>

      {presets.length === 0 ? (
        <p className="text-sm text-ink-500 py-8 text-center">
          No presets yet — save a usual session (e.g. &quot;Evening Cycling&quot;) with a scalable multiplier.
        </p>
      ) : (
        <Plate className="divide-y divide-paper-400">
          {presets.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 sm:px-6">
              <div>
                <div className="text-sm text-ink-900 capitalize">{p.name}</div>
                <div className="font-data text-xs text-ink-500">
                  {p.activityType} · {Math.round(p.baseDurationSeconds / 60)} min
                  {p.baseDistanceKm ? ` · ${p.baseDistanceKm} km` : ''}
                  {p.baseCaloriesBurned ? ` · ${p.baseCaloriesBurned} kcal` : ''}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`} className="text-ink-500 hover:text-gold-600 p-1.5">
                  <Pencil size={14} />
                </button>
                <button onClick={() => p.id && handleDelete(p.id)} aria-label={`Delete ${p.name}`} className="text-ink-300 hover:text-gold-600 p-1.5">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </Plate>
      )}
    </div>
  );
}

function PresetForm({ existing, onCancel, onSaved }: { existing?: CardioPreset; onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState(existing?.name ?? '');
  const [activityType, setActivityType] = useState<ActivityType>(existing?.activityType ?? 'run');
  const [minutes, setMinutes] = useState(existing ? String(Math.floor(existing.baseDurationSeconds / 60)) : '');
  const [distance, setDistance] = useState(existing?.baseDistanceKm ? String(existing.baseDistanceKm) : '');
  const [calories, setCalories] = useState(existing?.baseCaloriesBurned ? String(existing.baseCaloriesBurned) : '');

  const canSave = name.trim().length > 0 && (parseInt(minutes, 10) || 0) > 0;

  async function handleSave() {
    if (!canSave) return;
    const input: CardioPresetInput = {
      name: name.trim(),
      activityType,
      baseDurationSeconds: (parseInt(minutes, 10) || 0) * 60,
      baseDistanceKm: distance ? parseFloat(distance) : undefined,
      baseCaloriesBurned: calories ? parseInt(calories, 10) : undefined,
    };
    if (existing?.id) await updateCardioPreset(existing.id, input);
    else await createCardioPreset(input);
    onSaved();
  }

  return (
    <div className="space-y-5 max-w-md">
      <button onClick={onCancel} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
        <ChevronLeft size={16} /> Cancel
      </button>

      <h1 className="font-display text-2xl text-ink-900">{existing ? 'Edit Preset' : 'New Preset'}</h1>

      <Field label="Preset Name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Evening Cycling" autoFocus />

      <label className="block">
        <span className="plate-caption text-[10px] block mb-1">Activity</span>
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITIES.map((a) => (
            <button
              key={a}
              onClick={() => setActivityType(a)}
              className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${
                activityType === a ? 'bg-gold-600 text-paper-100 border-gold-600' : 'border-ink-900/25 text-ink-700'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </label>

      <p className="plate-caption text-[10px] text-ink-500 -mb-2">Base values (× multiplier when applied)</p>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Minutes" type="number" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        <Field label="Distance (km)" type="number" inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="—" />
        <Field label="Calories" type="number" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="—" />
      </div>

      <Button onClick={handleSave} disabled={!canSave} className="w-full">
        Save Preset
      </Button>
    </div>
  );
}
