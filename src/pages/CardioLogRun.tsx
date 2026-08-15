import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { today } from '@/db/schema';
import type { ActivityType, CardioPreset } from '@/db/schema';
import { addCardioSession, getCardioPresets } from '@/db/cardioDb';

const ACTIVITIES: ActivityType[] = ['run', 'walk', 'cycle', 'swim', 'other'];

export function CardioLogRun() {
  const navigate = useNavigate();
  const [date, setDate] = useState(today());
  const [activityType, setActivityType] = useState<ActivityType>('run');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [distance, setDistance] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');

  const [presets, setPresets] = useState<CardioPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [multiplier, setMultiplier] = useState('1');

  useEffect(() => {
    getCardioPresets().then(setPresets);
  }, []);

  function applyPreset(preset: CardioPreset, mult: number) {
    const factor = isNaN(mult) || mult <= 0 ? 1 : mult;
    setActivityType(preset.activityType);
    const totalSeconds = Math.round(preset.baseDurationSeconds * factor);
    setMinutes(String(Math.floor(totalSeconds / 60)));
    setSeconds(String(totalSeconds % 60));
    if (preset.baseDistanceKm) setDistance((preset.baseDistanceKm * factor).toFixed(2));
    if (preset.baseCaloriesBurned) setCalories(String(Math.round(preset.baseCaloriesBurned * factor)));
  }

  function selectPreset(preset: CardioPreset) {
    setSelectedPresetId(preset.id ?? null);
    setMultiplier('1');
    applyPreset(preset, 1);
  }

  function handleMultiplierChange(value: string) {
    setMultiplier(value);
    const preset = presets.find((p) => p.id === selectedPresetId);
    if (preset) applyPreset(preset, parseFloat(value));
  }

  const durationSeconds = (parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0);
  const canSave = durationSeconds > 0;

  async function handleSave() {
    if (!canSave) return;
    await addCardioSession({
      date,
      activityType,
      durationSeconds,
      distanceKm: distance ? parseFloat(distance) : undefined,
      avgHeartRate: heartRate ? parseInt(heartRate, 10) : undefined,
      caloriesBurned: calories ? parseInt(calories, 10) : undefined,
      notes: notes || undefined,
    });
    navigate('/cardio');
  }

  return (
    <div className="space-y-5 max-w-md">
      <h1 className="font-display text-2xl sm:text-3xl text-ink-900">Log Session</h1>

      <div className="flex items-center gap-1.5 flex-wrap">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => selectPreset(p)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-[2px] border transition-colors ${
              selectedPresetId === p.id ? 'border-vermilion-600 text-vermilion-700' : 'border-ink-900/25 text-ink-700 hover:border-vermilion-600 hover:text-vermilion-700'
            }`}
          >
            <Zap size={12} /> {p.name}
          </button>
        ))}
        <Link to="/cardio/presets" className="text-xs text-ink-500 hover:text-vermilion-600 underline underline-offset-4 ml-1">
          {presets.length > 0 ? 'Manage Presets' : 'Create a Preset'}
        </Link>
      </div>

      {selectedPresetId !== null && (
        <label className="flex items-center gap-2">
          <span className="plate-caption text-[10px]">Multiplier</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={multiplier}
            onChange={(e) => handleMultiplierChange(e.target.value)}
            className="font-data w-16 bg-transparent border-b border-ink-900/25 focus:border-vermilion-600 py-1 text-sm focus:outline-none"
          />
          <span className="text-xs text-ink-500">× base session</span>
        </label>
      )}

      <Field label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <label className="block">
        <span className="plate-caption text-[10px] block mb-1">Activity</span>
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITIES.map((a) => (
            <button
              key={a}
              onClick={() => setActivityType(a)}
              className={`text-xs px-3 py-1.5 rounded-[2px] border capitalize transition-colors ${
                activityType === a ? 'bg-vermilion-600 text-paper-100 border-vermilion-600' : 'border-ink-900/25 text-ink-700'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Minutes" type="number" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="0" />
        <Field label="Seconds" type="number" inputMode="numeric" value={seconds} onChange={(e) => setSeconds(e.target.value)} placeholder="0" />
      </div>

      <Field label="Distance (km, optional)" type="number" inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="0.0" />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Avg Heart Rate (optional)" type="number" inputMode="numeric" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} placeholder="—" />
        <Field label="Calories (optional)" type="number" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="—" />
      </div>

      <label className="block">
        <span className="plate-caption text-[10px] block mb-1">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-transparent border-b border-ink-900/25 focus:border-vermilion-600 py-1.5 text-sm focus:outline-none resize-none"
        />
      </label>

      <Button onClick={handleSave} disabled={!canSave} className="w-full">
        Save
      </Button>
    </div>
  );
}
