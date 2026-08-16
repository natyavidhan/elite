import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, Check, Zap } from 'lucide-react';
import { ExerciseCard } from '@/components/ExerciseCard';
import { MuscleMap } from '@/components/MuscleMap';
import { ConfettiBanner } from '@/components/ConfettiBanner';
import { Button } from '@/components/ui/Button';
import { EXERCISES, type Exercise } from '@/constants/exercises';
import { MUSCLE_IDS, muscleDisplayName } from '@/constants/muscles';
import { today, type WorkoutSet, type ExerciseCategory, type WorkoutPreset } from '@/db/schema';
import {
  getOrCreateSession,
  getSetsForSession,
  addSet,
  updateSet,
  deleteSet,
  getMuscleVolumesForDate,
  getCustomExercises,
  addCustomExercise,
  getWorkoutPresets,
  applyWorkoutPreset,
} from '@/db/workoutDb';

export function WorkoutLogSession() {
  const navigate = useNavigate();
  const date = today();
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [exerciseOrder, setExerciseOrder] = useState<string[]>([]);
  const [setsByExercise, setSetsByExercise] = useState<Record<string, WorkoutSet[]>>({});
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [presets, setPresets] = useState<WorkoutPreset[]>([]);
  const [applyingPreset, setApplyingPreset] = useState(false);
  const [query, setQuery] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [prSetIds, setPrSetIds] = useState<Set<number>>(new Set());
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Logging a set needs a real session id. The mount effect below fetches
  // one, but a fast click (search → select → type → Add Set, all before
  // that effect resolves) must not silently drop the set — so every caller
  // goes through this instead of keeping the id in state. The ref caches
  // the in-flight promise so concurrent callers share one session instead
  // of racing to create two. Critically: if that promise rejects, the ref
  // is cleared so the NEXT call retries fresh — caching a rejected promise
  // here would make one transient failure permanent for the rest of the
  // page's life, since every future call would just replay the same error.
  const sessionPromiseRef = useRef<Promise<number> | null>(null);
  function ensureSessionId(): Promise<number> {
    if (!sessionPromiseRef.current) {
      sessionPromiseRef.current = getOrCreateSession(date)
        .then((session) => session.id!)
        .catch((e) => {
          sessionPromiseRef.current = null;
          throw e;
        });
    }
    return sessionPromiseRef.current;
  }

  useEffect(() => {
    (async () => {
      const id = await ensureSessionId();
      const [sets, custom, presetList] = await Promise.all([getSetsForSession(id), getCustomExercises(), getWorkoutPresets()]);
      setCustomExercises(custom as unknown as Exercise[]);
      setPresets(presetList);
      const grouped: Record<string, WorkoutSet[]> = {};
      const order: string[] = [];
      for (const s of sets) {
        if (!grouped[s.exerciseId]) {
          grouped[s.exerciseId] = [];
          order.push(s.exerciseId);
        }
        grouped[s.exerciseId].push(s);
      }
      setSetsByExercise(grouped);
      setExerciseOrder(order);
      refreshVolumes();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function refreshVolumes() {
    getMuscleVolumesForDate(date).then(setVolumes);
  }

  const allExercises = useMemo(() => [...EXERCISES, ...customExercises], [customExercises]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allExercises.filter((e) => e.name.toLowerCase().includes(q) && !exerciseOrder.includes(e.id)).slice(0, 8);
  }, [query, allExercises, exerciseOrder]);

  function selectExercise(id: string) {
    setExerciseOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setSetsByExercise((prev) => (prev[id] ? prev : { ...prev, [id]: [] }));
    setQuery('');
    setShowCustomForm(false);
  }

  async function handleApplyPreset(preset: WorkoutPreset) {
    if (applyingPreset) return;
    setApplyingPreset(true);
    setError(null);
    try {
      const id = await ensureSessionId();
      const { sets, prSetIds: newPrSetIds } = await applyWorkoutPreset(id, preset);
      setSetsByExercise((prev) => {
        const next = { ...prev };
        for (const set of sets) next[set.exerciseId] = [...(next[set.exerciseId] ?? []), set];
        return next;
      });
      setExerciseOrder((prev) => {
        const next = [...prev];
        for (const exercise of preset.exercises) if (!next.includes(exercise.exerciseId)) next.push(exercise.exerciseId);
        return next;
      });
      if (newPrSetIds.length > 0) {
        setPrSetIds((prev) => new Set([...prev, ...newPrSetIds]));
        setConfettiTrigger((n) => n + 1);
      }
      refreshVolumes();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not apply that preset.');
    } finally {
      setApplyingPreset(false);
    }
  }

  async function handleAddSet(exerciseId: string, reps: number, weightKg: number) {
    setError(null);
    try {
      const id = await ensureSessionId();
      const { set, isPR } = await addSet({ sessionId: id, exerciseId, reps, weightKg });
      setSetsByExercise((prev) => ({ ...prev, [exerciseId]: [...(prev[exerciseId] ?? []), set] }));
      if (isPR && set.id) {
        setPrSetIds((prev) => new Set(prev).add(set.id!));
        setConfettiTrigger((n) => n + 1);
      }
      refreshVolumes();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that set.');
    }
  }

  async function handleUpdateSet(exerciseId: string, setId: number, changes: Partial<Pick<WorkoutSet, 'reps' | 'weightKg' | 'rpe'>>) {
    await updateSet(setId, changes);
    setSetsByExercise((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((s) => (s.id === setId ? { ...s, ...changes } : s)),
    }));
    refreshVolumes();
  }

  async function handleDeleteSet(exerciseId: string, setId: number) {
    await deleteSet(setId);
    setSetsByExercise((prev) => ({ ...prev, [exerciseId]: prev[exerciseId].filter((s) => s.id !== setId) }));
    refreshVolumes();
  }

  function exerciseName(id: string) {
    return allExercises.find((e) => e.id === id)?.name ?? id;
  }

  function exerciseMuscles(id: string) {
    return allExercises.find((e) => e.id === id)?.primaryMuscles ?? [];
  }

  return (
    <div className="space-y-5 pb-24">
      <ConfettiBanner message="New Personal Record" trigger={confettiTrigger} />

      <div>
        <p className="plate-caption text-xs text-ink-500">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mt-1">Log Session</h1>
      </div>

      {error && (
        <div className="bg-vermilion-600/10 border border-vermilion-600/40 text-vermilion-700 text-sm px-4 py-2.5 rounded-[2px] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline underline-offset-4 shrink-0 ml-3">
            Dismiss
          </button>
        </div>
      )}

      <div className="md:flex md:gap-6 md:items-start">
        <div className="md:flex-none md:sticky md:top-6">
          <MuscleMap volumes={volumes} date={date} />
        </div>

        <div className="mt-5 md:mt-0 md:flex-1 min-w-0 space-y-5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p)}
                disabled={applyingPreset}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-ink-900/25 rounded-[2px] text-ink-700 hover:border-vermilion-600 hover:text-vermilion-700 transition-colors disabled:opacity-50"
              >
                <Zap size={12} /> {p.name}
              </button>
            ))}
            <Link to="/workout/presets" className="text-xs text-ink-500 hover:text-vermilion-600 underline underline-offset-4 ml-1">
              {presets.length > 0 ? 'Manage Presets' : 'Create a Preset'}
            </Link>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises…"
              className="w-full bg-transparent border-b border-ink-900/25 focus:border-vermilion-600 py-2 pl-6 text-sm focus:outline-none placeholder:text-ink-300"
            />
            {query && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-paper-100 border border-paper-400 shadow-plate rounded-[2px] max-h-72 overflow-y-auto">
                {searchResults.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => selectExercise(e.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-paper-300 transition-colors flex items-center justify-between"
                  >
                    <span>{e.name}</span>
                    <span className="plate-caption text-[9px] text-ink-500">{e.primaryMuscles.map(muscleDisplayName).join(' · ')}</span>
                  </button>
                ))}
                {!showCustomForm && (
                  <button
                    onClick={() => setShowCustomForm(true)}
                    className="w-full text-left px-3 py-2 text-sm text-vermilion-700 hover:bg-paper-300 transition-colors border-t hairline"
                  >
                    + Create &quot;{query}&quot; as a custom exercise
                  </button>
                )}
                {showCustomForm && <CustomExerciseForm name={query} onCreated={selectExercise} onCustomExerciseAdded={(ex) => setCustomExercises((p) => [...p, ex])} />}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {exerciseOrder.map((id) => (
              <ExerciseCard
                key={id}
                name={exerciseName(id)}
                primaryMuscles={exerciseMuscles(id)}
                sets={setsByExercise[id] ?? []}
                prSetIds={prSetIds}
                onAddSet={(reps, weight) => handleAddSet(id, reps, weight)}
                onUpdateSet={(setId, changes) => handleUpdateSet(id, setId, changes)}
                onDeleteSet={(setId) => handleDeleteSet(id, setId)}
              />
            ))}
            {exerciseOrder.length === 0 && <p className="text-sm text-ink-500 text-center py-8">Search above to add your first exercise.</p>}
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-20">
        <Button onClick={() => navigate('/workout')} className="shadow-plate">
          <Check size={16} /> Done
        </Button>
      </div>
    </div>
  );
}

function CustomExerciseForm({
  name,
  onCreated,
  onCustomExerciseAdded,
}: {
  name: string;
  onCreated: (id: string) => void;
  onCustomExerciseAdded: (ex: Exercise) => void;
}) {
  const [primary, setPrimary] = useState<string[]>([]);
  const [category, setCategory] = useState<ExerciseCategory>('strength');

  async function save() {
    if (primary.length === 0) return;
    const id = `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36)}`;
    const exercise = { id, name, primaryMuscles: primary, secondaryMuscles: [], category };
    await addCustomExercise(exercise);
    onCustomExerciseAdded(exercise as Exercise);
    onCreated(id);
  }

  return (
    <div className="p-3 border-t hairline space-y-2">
      <p className="plate-caption text-[10px] text-ink-500">Primary muscles</p>
      <div className="flex flex-wrap gap-1.5">
        {MUSCLE_IDS.map((id) => (
          <button
            key={id}
            onClick={() => setPrimary((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
            className={`text-xs px-2 py-1 rounded-[2px] border transition-colors ${
              primary.includes(id) ? 'bg-vermilion-600 text-paper-100 border-vermilion-600' : 'border-ink-900/25 text-ink-700'
            }`}
          >
            {muscleDisplayName(id)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
          className="text-xs bg-transparent border-b border-ink-900/25 py-1 focus:outline-none focus:border-vermilion-600"
        >
          <option value="strength">Strength</option>
          <option value="bodyweight">Bodyweight</option>
          <option value="machine">Machine</option>
          <option value="cable">Cable</option>
        </select>
        <Button variant="primary" className="ml-auto text-xs px-3 py-1.5" onClick={save} disabled={primary.length === 0}>
          Save Exercise
        </Button>
      </div>
    </div>
  );
}
