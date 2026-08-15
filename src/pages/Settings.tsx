import { useEffect, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { getSettings, updateSettings, DEFAULT_SETTINGS, type AppSettings } from '@/db/settingsDb';
import { exportBackup, importBackup } from '@/db/backup';
import { useTheme } from '@/hooks/useTheme';
import type { ThemePreference } from '@/utils/theme';

const THEME_OPTIONS: { key: ThemePreference; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'system', label: 'System' },
];

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  async function save(changes: Partial<AppSettings>) {
    const next = { ...settings, ...changes };
    setSettings(next);
    await updateSettings(changes);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importBackup(file);
      setImportMessage('Backup restored. Reloading…');
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setImportMessage('That file could not be read as an Elite backup.');
    }
  }

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="font-display text-3xl text-ink-900">Settings</h1>

      <section className="space-y-3">
        <h2 className="plate-caption text-xs text-ink-500">Appearance</h2>
        <div className="flex gap-1.5">
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              className={`text-xs px-3 py-1.5 rounded-[2px] border transition-colors ${
                theme === t.key ? 'bg-vermilion-600 text-paper-100 border-vermilion-600' : 'border-ink-900/25 text-ink-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="plate-caption text-xs text-ink-500">Units</h2>
        <label className="block">
          <span className="plate-caption text-[10px] block mb-1">Unit System</span>
          <div className="flex gap-1.5">
            {(['metric', 'imperial'] as const).map((u) => (
              <button
                key={u}
                onClick={() => save({ unitSystem: u, bodyweightUnit: u === 'metric' ? 'kg' : 'lbs' })}
                className={`text-xs px-3 py-1.5 rounded-[2px] border capitalize transition-colors ${
                  settings.unitSystem === u ? 'bg-vermilion-600 text-paper-100 border-vermilion-600' : 'border-ink-900/25 text-ink-700'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="plate-caption text-xs text-ink-500">Daily Goals</h2>
        <Field
          label="Calories (kcal)"
          type="number"
          value={settings.dailyCalorieGoal}
          onChange={(e) => save({ dailyCalorieGoal: parseInt(e.target.value, 10) || 0 })}
        />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Protein (g)" type="number" value={settings.dailyProteinGoal} onChange={(e) => save({ dailyProteinGoal: parseInt(e.target.value, 10) || 0 })} />
          <Field label="Carbs (g)" type="number" value={settings.dailyCarbGoal} onChange={(e) => save({ dailyCarbGoal: parseInt(e.target.value, 10) || 0 })} />
          <Field label="Fat (g)" type="number" value={settings.dailyFatGoal} onChange={(e) => save({ dailyFatGoal: parseInt(e.target.value, 10) || 0 })} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="plate-caption text-xs text-ink-500">Backup</h2>
        <p className="text-sm text-ink-700">
          Elite keeps everything on this device only. Export a backup before clearing browser data or switching devices, and import it to restore.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => exportBackup()} className="flex-1">
            <Download size={15} /> Export
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex-1">
            <Upload size={15} /> Import
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </div>
        {importMessage && <p className="text-xs text-vermilion-700">{importMessage}</p>}
      </section>

      {saved && <p className="text-xs text-ink-500">Saved.</p>}
    </div>
  );
}
