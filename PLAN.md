# Elite — Progressive Web App Fitness Tracker

## Project Overview

Elite is a personal fitness tracking **Progressive Web App** (PWA) with four core modules:

1. **Muscle Workout Tracker** — visual muscle heatmap via SVG, tracking sets/reps/weight per exercise per day
2. **Food & Calorie Tracker** — meal logging with calorie, protein, carb, and fat data pulled from a public nutrition database
3. **Cardio / Running Tracker** — logs cardio sessions with time, distance, and pace
4. **Body Weight Tracker** — logs daily body weight and visualizes trends over time

The app is local-first and installable. All data is stored on-device in the browser using **IndexedDB** (via Dexie.js). No backend, no accounts, no server. It runs identically in a desktop browser tab, installed as a PWA on Android, or added to the home screen on iOS.

---

## Tech Stack

- **Framework:** React + Vite, TypeScript
- **PWA tooling:** `vite-plugin-pwa` (generates the service worker via Workbox, manifest, and auto-update prompt)
- **Routing:** React Router (client-side only — there is no server, so no SSR/data-loader needs)
- **Local Database:** IndexedDB via **Dexie.js** — async, no size-cap surprises like `localStorage`, and gives us indexes/queries close to what the old SQL schema needed
- **SVG Rendering:** plain inline SVG in React — no wrapper library needed, the browser renders SVG natively. Muscle paths are grouped by `id` and colored via a `fill` prop.
- **Food Nutrition Database:** Open Food Facts API (`https://world.openfoodfacts.org/api/v2/product/{barcode}.json`) for barcode scanning, and USDA FoodData Central REST API (`https://api.nal.usda.gov/fdc/v1/`) for text search. Both are free; USDA needs a trivially-obtainable free key. **Both APIs are called directly from the browser — confirm CORS is enabled on the exact endpoints used during Phase 3** (most public read APIs allow it, but it must be verified before relying on it, since there is no backend to proxy through).
- **Barcode scanning:** browser camera via `getUserMedia` + `@zxing/browser` for decoding. (The native `BarcodeDetector` API exists in Chromium browsers but not Safari, so ZXing is used as the one cross-browser path rather than juggling two implementations.)
- **Charts:** Recharts (weight trend, cardio distance/pace trend — has a `ResponsiveContainer` that fits both mobile and desktop widths)
- **PR celebration:** `canvas-confetti`
- **Date handling:** `date-fns`
- **State management:** React Context + `useReducer` per module (unchanged from the original plan — still the right amount of complexity)
- **Styling:** Tailwind CSS — needed now more than before, since layouts must adapt from phone width to desktop width
- **Icons:** `lucide-react`

---

## Project Directory Structure

```
Elite/
├── public/
│   ├── manifest.json               # PWA manifest — name, icons, theme, display: standalone
│   ├── icons/                      # 192x192, 512x512, maskable variants
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx                     # Router + layout shell
│   ├── pages/
│   │   ├── Home.tsx                # Dashboard
│   │   ├── Workout.tsx
│   │   ├── WorkoutLogSession.tsx
│   │   ├── WorkoutHistory.tsx
│   │   ├── Food.tsx
│   │   ├── FoodSearch.tsx
│   │   ├── FoodHistory.tsx
│   │   ├── Cardio.tsx
│   │   ├── CardioLogRun.tsx
│   │   ├── BodyWeight.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── MuscleMap.tsx
│   │   ├── MuscleMapFront.tsx
│   │   ├── MuscleMapBack.tsx
│   │   ├── ExerciseCard.tsx
│   │   ├── SetRow.tsx
│   │   ├── FoodLogCard.tsx
│   │   ├── CardioCard.tsx
│   │   ├── WeightEntry.tsx
│   │   ├── SparkLine.tsx
│   │   ├── ConfettiBanner.tsx
│   │   ├── BottomNav.tsx           # tab bar on mobile widths, side nav on desktop widths
│   │   └── BarcodeScanner.tsx      # camera view + ZXing decode loop
│   ├── db/
│   │   ├── schema.ts               # Dexie database class + table/version definitions
│   │   ├── workoutDb.ts
│   │   ├── foodDb.ts
│   │   ├── cardioDb.ts
│   │   ├── bodyweightDb.ts
│   │   ├── settingsDb.ts
│   │   └── backup.ts               # JSON export / import of the whole database
│   ├── constants/
│   │   ├── exercises.ts            # Static exercise library with muscle mappings
│   │   └── muscles.ts              # Unified muscle group IDs + display names + volume thresholds
│   └── utils/
│       ├── muscleColor.ts
│       ├── nutritionApi.ts
│       └── unitConversion.ts
├── vite.config.ts                  # includes vite-plugin-pwa config
├── index.html
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

Note: `hooks/` from the old plan is folded into each module's Context provider (e.g. `useWorkoutData` lives next to `WorkoutContext` rather than in a separate top-level folder) — small enough not to need its own directory split from `db/`.

---

## SVG Muscle Map — Integration Details

### Muscle Groups (unified — no left/right split)

A muscle you train, you train on both sides in the same session — tracking `biceps_left` and `biceps_right` as separate entities added bookkeeping with no real benefit. Each SVG `<g id="...">` already covers both sides of the body (confirmed by inspecting the actual SVG files: `bicep` contains both arms' paths, `quads` contains both legs', etc.), so the muscle ID *is* the canonical, single identifier — front and back views included.

**Front SVG (`Muscular System.svg`):** `forearm`, `bicep`, `abs`, `shoulder`, `chest`, `calves`, `traps`, `quads`, `lats`

**Back SVG (`Muscular System backside.svg`):** `hamstrings`, `calves`, `glutes`, `forearm`, `triceps`, `lats`, `shoulder`, `traps`

Some IDs (`calves`, `forearm`, `shoulder`, `traps`, `lats`) appear in **both** SVGs because that muscle is visible from both views — both instances get the same computed fill color for a given muscle on a given day.

Roughly 100+ unlabeled paths exist in each SVG (skeletal outline, neck, hands, decorative detail) — rendered as static neutral-color background, no tap handlers, no color logic.

### `constants/muscles.ts`

```ts
export const MUSCLES: Record<string, { displayName: string; maxVolume: number }> = {
  bicep:       { displayName: 'Biceps',      maxVolume: 3000 },
  chest:       { displayName: 'Chest',       maxVolume: 5000 },
  abs:         { displayName: 'Abs',         maxVolume: 2000 },
  shoulder:    { displayName: 'Shoulders',   maxVolume: 3500 },
  traps:       { displayName: 'Traps',       maxVolume: 3000 },
  quads:       { displayName: 'Quadriceps',  maxVolume: 6000 },
  lats:        { displayName: 'Lats',        maxVolume: 4000 },
  calves:      { displayName: 'Calves',      maxVolume: 2000 },
  forearm:     { displayName: 'Forearms',    maxVolume: 1500 },
  triceps:     { displayName: 'Triceps',     maxVolume: 3000 },
  hamstrings:  { displayName: 'Hamstrings',  maxVolume: 5000 },
  glutes:      { displayName: 'Glutes',      maxVolume: 4000 },
};
```

`maxVolume` is tunable per muscle — smaller muscles (biceps, abs, calves, forearms) hit full color at lower volume than larger ones (quads, chest, lats), so the heatmap stays visually meaningful instead of everything maxing out or everything staying faint.

### Color Logic — `utils/muscleColor.ts`

Unchanged concept from the original plan:

**Volume load per set = weight (kg) × reps.** Total daily volume for a muscle = sum across all sets of all exercises that target it today.

```ts
export function getMuscleColor(volumeLoad: number, maxVolume: number): string {
  const ratio = Math.min(volumeLoad / maxVolume, 1);
  const opacity = 0.05 + ratio * 0.95;
  return `rgba(30, 100, 255, ${opacity.toFixed(2)})`;
}

export function getRestingColor(): string {
  return 'rgba(200, 210, 220, 0.4)';
}
```

### `components/MuscleMapFront.tsx` / `MuscleMapBack.tsx` / `MuscleMap.tsx`

Each `<Path>`/`<g>` element from the source SVGs is extracted once (build-time or a one-off parsing pass) into a static data structure of `{ id, d }` pairs, same approach as before — just rendered as native `<svg>`/`<path>` JSX instead of through `react-native-svg`. `MuscleMap` wraps front + back, handles the side toggle, receives `muscleVolumes: Record<string, number>`, and opens a bottom sheet on tap listing today's exercises for that muscle.

---

## Local Database — Dexie / IndexedDB

Same logical schema as before, expressed as Dexie tables instead of raw SQL. IndexedDB has no foreign-key constraints, so cascade deletes (e.g. deleting a workout session must delete its sets) are handled explicitly in the `db/*Db.ts` modules, wrapped in a Dexie transaction.

```ts
// db/schema.ts
import Dexie, { Table } from 'dexie';

export interface WorkoutSession { id?: number; date: string; notes?: string; createdAt: string; }
export interface WorkoutSet { id?: number; sessionId: number; exerciseId: string; setNumber: number; reps: number; weightKg: number; rpe?: number; createdAt: string; }
export interface CustomExercise { id: string; name: string; primaryMuscles: string[]; secondaryMuscles: string[]; category: string; }
export interface FoodItem { id?: number; externalId?: string; name: string; caloriesPer100g: number; proteinPer100g: number; carbsPer100g: number; fatPer100g: number; source: 'openfoodfacts' | 'usda' | 'manual'; }
export interface FoodLog { id?: number; date: string; foodItemId: number; mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'; quantityG: number; createdAt: string; }
export interface CardioSession { id?: number; date: string; activityType: 'run' | 'walk' | 'cycle' | 'swim' | 'other'; durationSeconds: number; distanceKm?: number; avgHeartRate?: number; caloriesBurned?: number; notes?: string; createdAt: string; }
export interface BodyWeightLog { id?: number; date: string; weightKg: number; bodyFatPct?: number; notes?: string; createdAt: string; }
export interface Setting { key: string; value: string; }

class EliteDB extends Dexie {
  workoutSessions!: Table<WorkoutSession, number>;
  workoutSets!: Table<WorkoutSet, number>;
  customExercises!: Table<CustomExercise, string>;
  foodItems!: Table<FoodItem, number>;
  foodLogs!: Table<FoodLog, number>;
  cardioSessions!: Table<CardioSession, number>;
  bodyWeightLogs!: Table<BodyWeightLog, number>;
  settings!: Table<Setting, string>;

  constructor() {
    super('EliteDB');
    this.version(1).stores({
      workoutSessions: '++id, date',
      workoutSets: '++id, sessionId, exerciseId',
      customExercises: 'id, name',
      foodItems: '++id, &externalId, name',
      foodLogs: '++id, date, foodItemId, mealType',
      cardioSessions: '++id, date, activityType',
      bodyWeightLogs: '++id, &date',
      settings: '&key',
    });
  }
}

export const db = new EliteDB();
```

Computed-on-read fields (not stored): food macros from `quantityG`, cardio `pace_per_km` / `avg_speed_kmh` — identical formulas to the original plan.

---

## Module 1 — Workout Tracker

### Exercise Library — `constants/exercises.ts`

```ts
export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];    // unified muscle IDs, no _left/_right
  secondaryMuscles: string[];
  category: 'strength' | 'bodyweight' | 'machine' | 'cable';
}
```

60–80 common exercises covering all muscle groups, plus user-created custom exercises stored in `customExercises`.

### Screens

**`pages/Workout.tsx`** — muscle heatmap for today, session summary (exercises, sets, total volume), "Start / Continue Today's Workout" → `WorkoutLogSession`, "View History" → `WorkoutHistory`.

**`pages/WorkoutLogSession.tsx`** — date header, fuzzy exercise search over `EXERCISES` + `customExercises`, exercise cards with editable set rows (weight/reps/RPE), "Add Set" pre-fills from the last set, delete-set action, floating "Done" button, heatmap updates live as sets are added.

**`pages/WorkoutHistory.tsx`** — chronological list of sessions, tap for read-only detail. **PR tab:** per-exercise best weight and best volume, sparkline of the last 10 sessions' top weight.

---

## Module 2 — Food & Calorie Tracker

Same API strategy and schema as the original plan (see Dexie schema above for `foodItems`/`foodLogs`). Barcode scan uses the browser camera (`BarcodeScanner.tsx`: `getUserMedia` video stream piped into `@zxing/browser`'s decoder) instead of `expo-camera`. Local cache-first lookup in `foodItems` before any network call, same as before.

**`pages/Food.tsx`** — daily calorie/macro summary vs goals, progress bars, four meal sections, "Add Food" per section → `FoodSearch` with meal type preselected.

**`pages/FoodSearch.tsx`** — debounced (400ms) text search hitting local cache first then USDA, camera button for barcode scan, tap a result to enter quantity (grams, default 100g) with a live macro preview, "Log" saves and returns.

**`pages/FoodHistory.tsx`** — past logs browsable by date.

---

## Module 3 — Cardio / Running Tracker

Unchanged schema and screen flow from the original plan (`cardioSessions` table above). `pages/Cardio.tsx` (recent sessions, weekly totals, "Log Session"), `pages/CardioLogRun.tsx` (date/activity/duration/distance/HR/calories/notes form), history/stats view with a Recharts line chart of distance over time and personal bests (longest run, fastest pace, longest duration).

---

## Module 4 — Body Weight Tracker

Unchanged schema (`bodyWeightLogs`, one entry per date, upserted). `pages/BodyWeight.tsx` — Recharts line chart with a time-range filter (1w/1m/3m/all), today's entry card, stats row (current/starting/change/7-day average), chronological list with delete.

---

## Home Dashboard — `pages/Home.tsx`

Same single-screen rollup as the original plan: date/greeting header, muscle map thumbnail, calorie/macro summary, workout summary, cardio summary, latest body weight + trend arrow, quick-action buttons for all four log flows.

---

## User Settings — `pages/Settings.tsx`

Stored in the Dexie `settings` table (`key`/`value` rows):

- `unitSystem`: `'metric' | 'imperial'`
- `dailyCalorieGoal`, `dailyProteinGoal`, `dailyCarbGoal`, `dailyFatGoal`
- `bodyweightUnit`: `'kg' | 'lbs'`

All values are stored in metric in the database; display conversion happens at the UI layer via `utils/unitConversion.ts`.

**Backup & Restore** (new, `db/backup.ts`): "Export Data" serializes every table to a single JSON file the browser downloads; "Import Data" reads that file back in and repopulates the database. This isn't a nice-to-have here — without an account/server, clearing site data or switching browsers is genuinely destructive, so a manual backup path needs to exist from the start rather than as a deferred feature.

---

## PWA-Specific Requirements

1. **`public/manifest.json`** — app name, short name, `display: "standalone"`, theme/background colors, icon set (192×192, 512×512, and a maskable variant for Android's adaptive icons). An app icon needs to be designed — nothing in the current assets is icon-shaped (the two SVGs are full anatomical diagrams, not a mark).
2. **Service worker** (via `vite-plugin-pwa`, Workbox under the hood) — precache the app shell (JS/CSS/HTML) so the app boots with no network at all; since all data is already local-first in IndexedDB, this makes the whole app fully offline-capable except for new food lookups.
3. **HTTPS requirement** — service workers and camera access (`getUserMedia`) both require a secure context (HTTPS, or `localhost` in dev). Relevant for wherever this ends up hosted.
4. **iOS Safari caveats** — no `beforeinstallprompt` event, so users add it via the Share sheet → "Add to Home Screen" manually (needs a small in-app hint, since it's not discoverable); IndexedDB storage can be evicted under storage pressure if the site hasn't been visited in a while, which is another point in favor of the export/import backup feature above.
5. **Responsive layout** — this is no longer a phone-only app. Mobile widths keep the bottom tab bar / single-column flows; desktop widths get a side nav and can afford two-column layouts (e.g. muscle map beside the exercise list while logging a session) rather than just a stretched phone UI.

---

## Optional Enhancements (not required, worth a decision before Phase 6)

- **Dark mode** — cheap with Tailwind (`prefers-color-scheme` + a manual toggle stored in settings), and this is exactly the kind of app people check right after a workout or before bed.
- **Logging streaks** — day-count of consecutive days with any log entry; the data to compute it already exists, purely a derived view, no schema change.

---

## Key Implementation Notes for the Coding Agent

1. **Muscle SVG paths are rendered as native `<svg>`/`<path>` JSX**, not through any wrapper library. Extract all path `d` + group `id` data from the two source SVGs once into a static module (`MuscleMapFront.tsx`/`MuscleMapBack.tsx`), same extraction step as before, just a simpler render target.
2. **Muscle volume calculation** runs on every render of the muscle map: query `workoutSets` joined against exercise muscle mappings for today's date, group by muscle ID, sum `weightKg * reps`.
3. **PR detection** runs after every set save: query `workoutSets` for that `exerciseId`, compare against the historical max `weightKg`; on a new record, fire the `canvas-confetti` celebration.
4. **Food search debouncing** via a `useRef` timer (400ms); always check the local `foodItems` cache before any network call.
5. **No authentication, no remote sync.** All data is local to the browser/device. Cross-device use means exporting from one and importing into the other — see Backup & Restore above.
6. **IndexedDB has no FK cascade** — deleting a `workoutSession` must explicitly delete its `workoutSets` first, inside a Dexie transaction. Same pattern anywhere else a parent/child relationship exists.
7. **Cross-platform by construction** — same codebase, same behavior on desktop Chrome, Android Chrome (installable), and iOS Safari (installable via Share sheet), modulo the iOS caveats noted above.
