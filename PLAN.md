# Elite — React Native + Expo Fitness Tracker App

## Project Overview

Elite is a personal fitness tracking Android app (built with React Native and Expo) with four core modules:

1. **Muscle Workout Tracker** — visual muscle heatmap via SVG, tracking sets/reps/weight per exercise per day
2. **Food & Calorie Tracker** — meal logging with calorie, protein, carb, and fat data pulled from a public nutrition database
3. **Cardio / Running Tracker** — logs cardio sessions with time, distance, and pace
4. **Body Weight Tracker** — logs daily body weight and visualizes trends over time

The app is local-first. All data is stored on-device using SQLite (via `expo-sqlite`). No backend or user accounts are required.

---

## Tech Stack

- **Framework:** React Native with Expo SDK (managed workflow)
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based routing, tab + stack navigation)
- **Local Database:** `expo-sqlite` with a raw SQL schema (no ORM)
- **SVG Rendering:** `react-native-svg` — the muscle body map SVGs are rendered directly in React Native and muscle paths are tapped/highlighted programmatically
- **Food Nutrition Database:** Open Food Facts API (`https://world.openfoodfacts.org/api/v2/product/{barcode}`) for barcode scanning, and USDA FoodData Central REST API (`https://api.nal.usda.gov/fdc/v1/`) for text search. Both are free and require no API key for basic usage (USDA requires a free key but it is trivially obtainable).
- **Charts:** `react-native-gifted-charts` or `victory-native` for weight trend and PR progression graphs
- **Date handling:** `date-fns`
- **State management:** React Context + `useReducer` per module (no Redux, keeps it simple)
- **Icons:** `@expo/vector-icons` (Ionicons set)

---

## Project Directory Structure

```
Elite/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx              # Home / Dashboard
│   │   ├── workout.tsx            # Workout Tracker tab
│   │   ├── food.tsx               # Food Tracker tab
│   │   ├── cardio.tsx             # Cardio Tracker tab
│   │   └── bodyweight.tsx         # Body Weight Tracker tab
│   ├── workout/
│   │   ├── log-session.tsx        # Log a new workout session
│   │   └── history.tsx            # Past workout sessions
│   ├── food/
│   │   ├── search.tsx             # Search food items
│   │   └── history.tsx            # Past food logs
│   ├── cardio/
│   │   └── log-run.tsx            # Log a cardio session
│   └── _layout.tsx
├── assets/
│   ├── body-front.svg             # SVG with labeled front muscle paths
│   └── body-back.svg              # SVG with labeled back muscle paths
├── components/
│   ├── MuscleMap.tsx              # Renders the SVG and handles muscle coloring
│   ├── MuscleMapFront.tsx
│   ├── MuscleMapBack.tsx
│   ├── ExerciseCard.tsx
│   ├── SetRow.tsx
│   ├── FoodLogCard.tsx
│   ├── CardioCard.tsx
│   └── WeightEntry.tsx
├── db/
│   ├── schema.ts                  # All CREATE TABLE statements
│   ├── workoutDb.ts               # Workout CRUD operations
│   ├── foodDb.ts                  # Food log CRUD operations
│   ├── cardioDb.ts                # Cardio CRUD operations
│   └── bodyweightDb.ts            # Body weight CRUD operations
├── constants/
│   ├── exercises.ts               # Static exercise library with muscle mappings
│   └── muscles.ts                 # Muscle ID list extracted from SVG + display names
├── hooks/
│   ├── useWorkoutData.ts
│   ├── useFoodData.ts
│   ├── useCardioData.ts
│   └── useBodyWeight.ts
└── utils/
    ├── muscleColor.ts             # Color interpolation logic
    └── nutritionApi.ts            # API wrapper for food databases
```

---

## SVG Muscle Map — Integration Details

### SVG Files

You have two SVG files: `body-front.svg` and `body-back.svg`. Each muscle group is a `<path>` or `<g>` element with a unique `id` attribute. These IDs are the canonical muscle identifiers used throughout the database and exercise library.

**Example SVG structure (what your SVG likely looks like):**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400">
  <path id="chest" d="..." />
  <path id="biceps_left" d="..." />
  <path id="biceps_right" d="..." />
  <path id="abs" d="..." />
  <path id="quads_left" d="..." />
  <path id="quads_right" d="..." />
  <!-- etc -->
</svg>
```

**You must extract the exact `id` values from your SVG files and populate `constants/muscles.ts` and `constants/exercises.ts` with them.** The rest of the app references muscles only by these IDs.

### Typical Muscle IDs (replace with your actual SVG IDs)

**Front:**
`chest`, `biceps_left`, `biceps_right`, `front_deltoid_left`, `front_deltoid_right`, `abs`, `obliques_left`, `obliques_right`, `quads_left`, `quads_right`, `forearms_left`, `forearms_right`, `neck`, `tibialis_left`, `tibialis_right`, `adductors_left`, `adductors_right`

**Back:**
`traps`, `lats_left`, `lats_right`, `rear_deltoid_left`, `rear_deltoid_right`, `triceps_left`, `triceps_right`, `rhomboids`, `lower_back`, `glutes_left`, `glutes_right`, `hamstrings_left`, `hamstrings_right`, `calves_left`, `calves_right`

### `constants/muscles.ts`

```ts
export const MUSCLES: Record<string, { displayName: string; side: 'front' | 'back' }> = {
  chest:                { displayName: 'Chest',             side: 'front' },
  biceps_left:          { displayName: 'Bicep (L)',         side: 'front' },
  biceps_right:         { displayName: 'Bicep (R)',         side: 'front' },
  abs:                  { displayName: 'Abs',               side: 'front' },
  // ... fill in all muscle IDs from your SVG
  traps:                { displayName: 'Traps',             side: 'back'  },
  lats_left:            { displayName: 'Lat (L)',           side: 'back'  },
  triceps_left:         { displayName: 'Tricep (L)',        side: 'back'  },
  // ...
};
```

### Color Logic — `utils/muscleColor.ts`

Each muscle's color is determined by its **total volume load for the current day**, normalized against a per-muscle maximum threshold.

**Volume load per set = weight (kg) × reps**

**Total daily volume load for a muscle = sum of (weight × reps) across all sets of all exercises that target that muscle on that date**

The color is a blue with variable opacity:

```ts
// muscleColor.ts

const MAX_VOLUME_PER_MUSCLE = 5000; // kg·reps, tune this per muscle if needed

export function getMuscleColor(volumeLoad: number): string {
  const ratio = Math.min(volumeLoad / MAX_VOLUME_PER_MUSCLE, 1); // clamp to [0, 1]
  const opacity = 0.05 + ratio * 0.95; // maps [0,1] → [0.05, 1.00] so rested muscles still faintly visible
  return `rgba(30, 100, 255, ${opacity.toFixed(2)})`;
}

// For muscles with zero activity today, return a neutral resting color
export function getRestingColor(): string {
  return 'rgba(200, 210, 220, 0.4)'; // light grey-blue
}
```

The SVG renderer passes the computed color as the `fill` prop for each muscle path element.

### `components/MuscleMap.tsx`

This component receives a `muscleVolumes: Record<string, number>` prop (muscle ID → today's volume load), renders the SVG, and applies `getMuscleColor(volume)` as the fill for each path. It shows front and back side by side or as a toggled view (tab or swipe). Tapping a muscle path opens a bottom sheet listing all exercises logged for that muscle today.

Use `react-native-svg` to render the SVG paths programmatically — do **not** use an `<Image>` tag. Each `<Path>` element in the SVG must be individually controllable via its `id`. Parse the SVG XML into a set of React Native SVG `<Path>` components at app startup, or write a static mapping file that hardcodes each path's `d` attribute alongside its `id`.

---

## Module 1 — Workout Tracker

### Exercise Library — `constants/exercises.ts`

A static array of exercise definitions. Each exercise maps to one or more primary muscle IDs (from your SVG).

```ts
export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];   // IDs matching your SVG
  secondaryMuscles: string[]; // IDs matching your SVG
  category: 'strength' | 'bodyweight' | 'machine' | 'cable';
}

export const EXERCISES: Exercise[] = [
  {
    id: 'overhead_tricep_extension',
    name: 'Overhead Tricep Extension',
    primaryMuscles: ['triceps_left', 'triceps_right'],
    secondaryMuscles: [],
    category: 'cable',
  },
  {
    id: 'bench_press',
    name: 'Bench Press',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps_left', 'triceps_right', 'front_deltoid_left', 'front_deltoid_right'],
    category: 'strength',
  },
  // ... add all exercises
];
```

Include at least 60–80 common exercises covering all major muscle groups. The user can also add custom exercises via a form in the app.

### Database Schema — Workout

```sql
CREATE TABLE IF NOT EXISTS workout_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,          -- ISO date string 'YYYY-MM-DD'
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,   -- matches Exercise.id from constants
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg REAL NOT NULL,     -- store in kg; display in kg or lbs based on user preference
  rpe INTEGER,                 -- optional rate of perceived exertion (1–10)
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS custom_exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  primary_muscles TEXT NOT NULL,    -- JSON array of muscle IDs
  secondary_muscles TEXT NOT NULL,  -- JSON array of muscle IDs
  category TEXT NOT NULL
);
```

### Workout Tracker Screen Flow

**Tab: Workout (`app/(tabs)/workout.tsx`)**
- Shows the muscle SVG heatmap with today's volume loads rendered as color
- Shows a summary of today's session: exercises logged, total sets, total volume
- "Start / Continue Today's Workout" button → navigates to `app/workout/log-session.tsx`
- "View History" button → navigates to `app/workout/history.tsx`

**Log Session Screen (`app/workout/log-session.tsx`)**
- Shows the current date at the top
- A search bar to find exercises from the exercise library (fuzzy search over `EXERCISES` constant + `custom_exercises` table)
- Once an exercise is selected, it is added to the session as a card
- Each exercise card shows:
  - Exercise name
  - Primary muscles (as small colored tags)
  - A list of sets, each set showing: Set #, Weight (kg), Reps, optional RPE
  - "Add Set" button to append a new set row (pre-fills with the last set's weight and reps)
  - Individual set rows are editable inline
  - Swipe left on a set to delete it
- A floating "Done" button saves the session and returns to the workout tab
- As sets are logged, the muscle heatmap at the top of the screen updates live

**History Screen (`app/workout/history.tsx`)**
- Calendar view or chronological list of past workout sessions
- Tapping a session shows its full detail (read-only)
- **PR Tracking:** For each exercise, the app tracks the highest single-set volume (weight × reps) and the highest weight lifted. A "PRs" sub-tab shows a list of all exercises with their all-time best weight and best volume, plus a sparkline chart of weight progression over the last 10 sessions.

---

## Module 2 — Food & Calorie Tracker

### Nutrition API Strategy

Use two sources in priority order:

1. **Barcode scan** → Open Food Facts API: `GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
   - Returns `product.nutriments` with `energy-kcal_100g`, `proteins_100g`, `carbohydrates_100g`, `fat_100g`
   - Use `expo-barcode-scanner` or `expo-camera` for scanning

2. **Text search** → USDA FoodData Central: `GET https://api.nal.usda.gov/fdc/v1/foods/search?query={query}&api_key={key}`
   - Returns a list of foods each with `foodNutrients` array
   - Store the free API key in `app.config.ts` as an Expo constant (not hardcoded in source)
   - Extract nutrient values by `nutrientId`: 1008 = calories, 1003 = protein, 1005 = carbs, 1004 = fat

Cache all previously fetched food items locally in SQLite so subsequent lookups don't need a network request.

### Database Schema — Food

```sql
CREATE TABLE IF NOT EXISTS food_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT UNIQUE,        -- barcode or FDC ID
  name TEXT NOT NULL,
  calories_per_100g REAL NOT NULL,
  protein_per_100g REAL NOT NULL,
  carbs_per_100g REAL NOT NULL,
  fat_per_100g REAL NOT NULL,
  source TEXT NOT NULL            -- 'openfoodfacts' | 'usda' | 'manual'
);

CREATE TABLE IF NOT EXISTS food_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,             -- 'YYYY-MM-DD'
  food_item_id INTEGER NOT NULL REFERENCES food_items(id),
  meal_type TEXT NOT NULL,        -- 'breakfast' | 'lunch' | 'dinner' | 'snack'
  quantity_g REAL NOT NULL,       -- user-entered grams consumed
  created_at TEXT DEFAULT (datetime('now'))
);
```

Computed fields (not stored, calculated on read):
- `calories = (calories_per_100g / 100) * quantity_g`
- `protein = (protein_per_100g / 100) * quantity_g`
- `carbs = (carbs_per_100g / 100) * quantity_g`
- `fat = (fat_per_100g / 100) * quantity_g`

### Food Tracker Screen Flow

**Tab: Food (`app/(tabs)/food.tsx`)**
- Daily summary at top: total calories, protein (g), carbs (g), fat (g) vs user-set daily goals
- Progress bars for each macro
- Meals broken into four sections: Breakfast, Lunch, Dinner, Snacks
- Each section lists logged food items with their calories and macros
- "Add Food" button per section → navigates to `app/food/search.tsx` with the meal type pre-selected

**Search Screen (`app/food/search.tsx`)**
- Text search input — queries local cache first, then USDA API with debounce (400ms)
- Camera icon for barcode scan
- Search results list: each result shows name, calories per 100g, source badge
- Tapping a result opens a quantity input sheet:
  - Food name
  - Input field for grams (default 100g)
  - Live preview of calculated macros for entered quantity
  - "Log" button → saves to `food_logs` and pops back to food tab

---

## Module 3 — Cardio / Running Tracker

### Database Schema — Cardio

```sql
CREATE TABLE IF NOT EXISTS cardio_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,               -- 'YYYY-MM-DD'
  activity_type TEXT NOT NULL,      -- 'run' | 'walk' | 'cycle' | 'swim' | 'other'
  duration_seconds INTEGER NOT NULL,
  distance_km REAL,                 -- nullable; some activities don't have distance
  avg_heart_rate INTEGER,           -- optional
  calories_burned INTEGER,          -- optional, user-entered or estimated
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

Computed on read:
- `pace_per_km = duration_seconds / 60 / distance_km` → formatted as `MM:SS /km`
- `avg_speed_kmh = distance_km / (duration_seconds / 3600)`

### Cardio Screen Flow

**Tab: Cardio (`app/(tabs)/cardio.tsx`)**
- Summary of recent sessions in a flat list (most recent first)
- Weekly totals card: total km, total time, total sessions this week
- "Log Session" button → navigates to `app/cardio/log-run.tsx`

**Log Session Screen (`app/cardio/log-run.tsx`)**
- Date picker (defaults to today)
- Activity type picker (run, walk, cycle, swim, other)
- Duration input (MM:SS or HH:MM:SS)
- Distance input in km (optional)
- Heart rate input (optional)
- Calories burned input (optional)
- Notes text area
- "Save" button

**Cardio History / Stats**
- Accessible from the cardio tab via a "Stats" or "History" button
- Shows a line chart of distance over time for the selected activity type
- Shows personal bests: longest run, fastest pace, longest duration

---

## Module 4 — Body Weight Tracker

### Database Schema — Body Weight

```sql
CREATE TABLE IF NOT EXISTS body_weight_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,      -- 'YYYY-MM-DD', one entry per day enforced at app level
  weight_kg REAL NOT NULL,
  body_fat_pct REAL,              -- optional
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Body Weight Screen Flow

**Tab: Body Weight (`app/(tabs)/bodyweight.tsx`)**
- A line chart showing weight over time with date on X axis and weight (kg or lbs) on Y axis
- Time range filter: 1 week, 1 month, 3 months, all time
- Today's entry card at top — if no entry yet, shows "Log Today's Weight" button; if already logged, shows today's value with an edit button
- Below chart: stats row showing current weight, starting weight, total change, 7-day rolling average
- Chronological list of all past entries, swipe-left to delete

**Log Weight Bottom Sheet**
- Weight input (numeric, decimal allowed)
- Optional body fat % input
- Optional notes
- "Save" button — upserts today's record (if entry already exists for today, update it)

---

## Home / Dashboard Screen

**Tab: Home (`app/(tabs)/index.tsx`)**

A single-screen overview of all four modules for today:

- **Today's date header** with a greeting
- **Muscle map thumbnail** — small front+back SVG showing today's muscle activation
- **Calories summary** — X kcal consumed / daily goal kcal
- **Macro summary** — protein / carbs / fat in grams
- **Workout summary** — X exercises, Y total sets
- **Cardio summary** — today's cardio sessions if any
- **Body weight** — most recent logged weight + trend arrow (up/down/flat vs 7-day average)
- Quick-action buttons: "Log Workout", "Log Meal", "Log Run", "Log Weight"

---

## SQLite Initialization — `db/schema.ts`

On app startup, run all `CREATE TABLE IF NOT EXISTS` statements in sequence using `expo-sqlite`. Use a single `SQLiteDatabase` instance opened once and passed via React Context or a singleton module. All database operations are `async` and wrapped in try/catch. Use transactions for multi-row inserts (e.g., saving a full workout session with multiple sets).

```ts
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export async function initDatabase() {
  db = await SQLite.openDatabaseAsync('Elite.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS workout_sessions (...);
    CREATE TABLE IF NOT EXISTS workout_sets (...);
    CREATE TABLE IF NOT EXISTS custom_exercises (...);
    CREATE TABLE IF NOT EXISTS food_items (...);
    CREATE TABLE IF NOT EXISTS food_logs (...);
    CREATE TABLE IF NOT EXISTS cardio_sessions (...);
    CREATE TABLE IF NOT EXISTS body_weight_logs (...);
  `);
}

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}
```

Call `initDatabase()` in the root `_layout.tsx` before rendering any screens, using a loading state to gate rendering until the DB is ready.

---

## User Settings

Store user preferences in `expo-secure-store` or a simple `settings` table in SQLite:

- `unit_system`: `'metric'` | `'imperial'` — affects weight display (kg vs lbs) and distance (km vs miles)
- `daily_calorie_goal`: integer (kcal)
- `daily_protein_goal`: integer (g)
- `daily_carb_goal`: integer (g)
- `daily_fat_goal`: integer (g)
- `bodyweight_unit`: `'kg'` | `'lbs'`

Settings are accessible from a gear icon in the header of any tab. All display conversions are done at the UI layer — values are always stored in metric in the database.

---

## Key Implementation Notes for the Coding Agent

1. **SVG muscle paths must be rendered via `react-native-svg`**, not as static images. Each `<Path>` element gets a dynamically computed `fill` color prop based on today's volume data. Extract all path `d` attributes and `id` attributes from the provided SVG files and hardcode them as a static data structure in `components/MuscleMapFront.tsx` and `components/MuscleMapBack.tsx`.

2. **The muscle volume calculation** runs on every render of the muscle map. Query `workout_sets` joined with exercise data for today's date, group by muscle ID, and sum `weight_kg * reps` for each. This gives the volume load per muscle for the color function.

3. **PR detection** runs after every set is saved: query `workout_sets` for the given `exercise_id`, compare the new `weight_kg` to the historical max. If it is a new record, trigger a visual celebration (confetti or a banner) using `react-native-confetti-cannon` or a simple animated banner.

4. **Food search debouncing:** use a `useRef` timer to debounce the USDA API call. Always check the local `food_items` cache table first. Only hit the network if no cached results match the query.

5. **Volume thresholds per muscle** in `getMuscleColor` should be tunable constants, not hardcoded. Smaller muscles (biceps, triceps, calves) hit their threshold at lower volume than larger muscles (quads, chest, back). Define a `MUSCLE_MAX_VOLUME` map in `constants/muscles.ts` alongside the display names.

6. **The app targets Android only** (Expo managed workflow). Do not add iOS-specific APIs. Use `expo-barcode-scanner` which works on Android.

7. **No authentication, no remote sync.** All data is local. If the user wants backup, that is a future feature. Do not scaffold any auth flow.

8. **Navigation structure:** use Expo Router's file-based routing with a bottom tab navigator at the root (`(tabs)` group) containing five tabs: Home, Workout, Food, Cardio, Body Weight. Stack navigators inside each tab handle deeper screens (log session, search food, etc.).