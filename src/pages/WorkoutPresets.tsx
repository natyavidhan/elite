import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Plate } from '@/components/ui/Plate';
import { EXERCISES, findExerciseById, type Exercise } from '@/constants/exercises';
import { getCustomExercises } from '@/db/workoutDb';
import { getWorkoutPresets, createWorkoutPreset, updateWorkoutPreset, deleteWorkoutPreset } from '@/db/workoutDb';
import type { WorkoutPreset, WorkoutPresetExercise } from '@/db/schema';

export function WorkoutPresets() {
  const navigate = useNavigate();
  const [presets, setPresets] = useState<WorkoutPreset[]>([]);
  const [editing, setEditing] = useState<WorkoutPreset | 'new' | null>(null);

  async function refresh() {
    setPresets(await getWorkoutPresets());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(id: number) {
    await deleteWorkoutPreset(id);
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
      <button onClick={() => navigate('/workout')} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
        <ChevronLeft size={16} /> Back to Workout
      </button>

      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl text-ink-900">Presets</h1>
        <Button variant="secondary" onClick={() => setEditing('new')} className="text-xs px-3 py-1.5">
          <Plus size={14} /> New Preset
        </Button>
      </div>

      {presets.length === 0 ? (
        <p className="text-sm text-ink-500 py-8 text-center">
          No presets yet — save a typical session (e.g. &quot;Chest Day&quot;) to log it in one tap.
        </p>
      ) : (
        <Plate className="divide-y divide-paper-400">
          {presets.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 sm:px-6">
              <div>
                <div className="text-sm text-ink-900">{p.name}</div>
                <div className="font-data text-xs text-ink-500">
                  {p.exercises.length} exercise{p.exercises.length !== 1 ? 's' : ''} ·{' '}
                  {p.exercises.reduce((n, e) => n + e.sets, 0)} sets
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

function PresetForm({ existing, onCancel, onSaved }: { existing?: WorkoutPreset; onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState(existing?.name ?? '');
  const [exercises, setExercises] = useState<WorkoutPresetExercise[]>(existing?.exercises ?? []);
  const [query, setQuery] = useState('');
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    getCustomExercises().then((c) => setCustomExercises(c as unknown as Exercise[]));
  }, []);

  const allExercises = useMemo(() => [...EXERCISES, ...customExercises], [customExercises]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allExercises.filter((e) => e.name.toLowerCase().includes(q) && !exercises.some((ex) => ex.exerciseId === e.id)).slice(0, 6);
  }, [query, allExercises, exercises]);

  function addExercise(id: string) {
    setExercises((prev) => [...prev, { exerciseId: id, sets: 3, reps: 8, weightKg: 20 }]);
    setQuery('');
  }

  function updateExercise(index: number, changes: Partial<WorkoutPresetExercise>) {
    setExercises((prev) => prev.map((e, i) => (i === index ? { ...e, ...changes } : e)));
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  const canSave = name.trim().length > 0 && exercises.length > 0;

  async function handleSave() {
    if (!canSave) return;
    if (existing?.id) await updateWorkoutPreset(existing.id, name.trim(), exercises);
    else await createWorkoutPreset(name.trim(), exercises);
    onSaved();
  }

  function exerciseName(id: string) {
    return findExerciseById(id)?.name ?? allExercises.find((e) => e.id === id)?.name ?? id;
  }

  return (
    <div className="space-y-5 max-w-lg">
      <button onClick={onCancel} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
        <ChevronLeft size={16} /> Cancel
      </button>

      <h1 className="font-display text-2xl text-ink-900">{existing ? 'Edit Preset' : 'New Preset'}</h1>

      <Field label="Preset Name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chest Day" autoFocus />

      <div className="space-y-2">
        {exercises.map((ex, i) => (
          <div key={i} className="bg-paper-100 border border-paper-400 rounded-lg px-3 py-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-ink-900">{exerciseName(ex.exerciseId)}</span>
              <button onClick={() => removeExercise(i)} aria-label="Remove" className="text-ink-300 hover:text-gold-600 p-1">
                <Trash2 size={13} />
              </button>
            </div>
            <div className="flex items-center gap-3 font-data text-sm">
              <label className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={ex.sets}
                  onChange={(e) => updateExercise(i, { sets: parseInt(e.target.value, 10) || 1 })}
                  className="w-10 bg-transparent border-b border-ink-900/20 text-right focus:outline-none focus:border-gold-600"
                />
                <span className="text-xs text-ink-500">sets</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={ex.reps}
                  onChange={(e) => updateExercise(i, { reps: parseInt(e.target.value, 10) || 1 })}
                  className="w-10 bg-transparent border-b border-ink-900/20 text-right focus:outline-none focus:border-gold-600"
                />
                <span className="text-xs text-ink-500">reps</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={ex.weightKg}
                  onChange={(e) => updateExercise(i, { weightKg: parseFloat(e.target.value) || 0 })}
                  className="w-14 bg-transparent border-b border-ink-900/20 text-right focus:outline-none focus:border-gold-600"
                />
                <span className="text-xs text-ink-500">kg</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Add an exercise…"
          className="w-full bg-transparent border-b border-ink-900/25 focus:border-gold-600 py-2 pl-6 text-sm focus:outline-none placeholder:text-ink-300"
        />
        {query && results.length > 0 && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-paper-100 border border-paper-400 shadow-plate rounded-lg max-h-56 overflow-y-auto">
            {results.map((e) => (
              <button
                key={e.id}
                onClick={() => addExercise(e.id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-paper-300 transition-colors"
              >
                {e.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={!canSave} className="w-full">
        Save Preset
      </Button>
    </div>
  );
}
