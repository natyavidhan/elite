# Elite Fitness Tracker — Build Phases

This document breaks the full project scope into 6 build phases, ordered by dependency and complexity. Each phase is self-contained and testable on its own.

---

## SVG Analysis Summary

The actual SVG files differ from the assumptions in `PLAN.md`. Here's the corrected mapping:

### Front SVG (`Muscular System.svg`) — Muscle Groups

| ID | Contains | Side |
|---|---|---|
| `forearm` | Both forearms | front |
| `bicep` | Both biceps | front |
| `abs` | Abdominal area | front |
| `shoulder` | Both deltoids | front |
| `chest` | Both pectorals | front |
| `calves` | Both calves | front |
| `traps` | Upper trapezius | front |
| `quads` | Both quadriceps | front |
| `lats` | Both latissimus dorsi | front |

### Back SVG (`Muscular System backside.svg`) — Muscle Groups

| ID | Contains | Side |
|---|---|---|
| `hamstrings` | Both hamstrings | back |
| `calves` | Both calves | back |
| `glutes` | Both glutes | back |
| `forearm` | Both forearms | back |
| `triceps` | Both triceps | back |
| `lats` | Both lats | back |
| `shoulder` | Both deltoids | back |
| `traps` | Both traps | back |

### Key SVG Details

- **No left/right split**: The SVG groups contain both sides (e.g., `bicep` = both arms, `quads` = both legs)
- **~100+ unlabeled paths** in the front SVG and many decorative paths in the back SVG (skeletal elements, neck, hands, etc.) — these are rendered as static background elements with neutral color, no interactivity
- **Each `<g id="...">` contains multiple `<path>` elements** — all child paths of a group get the same computed fill color
- **The muscle map component must render the entire SVG** (labeled + unlabeled paths) but only apply color logic and tap handlers to the labeled groups
- **Muscle IDs are the canonical group IDs** (`bicep`, `chest`, etc.), not individual path IDs

### Muscle ID Mapping for Exercise Library

```typescript
export const MUSCLES: Record<string, { displayName: string; side: 'front' | 'back'; maxVolume: number }> = {
  // Front
  bicep:        { displayName: 'Biceps',           side: 'front', maxVolume: 3000 },
  chest:        { displayName: 'Chest',            side: 'front', maxVolume: 5000 },
  abs:          { displayName: 'Abs',              side: 'front', maxVolume: 2000 },
  shoulder:     { displayName: 'Shoulders',        side: 'front', maxVolume: 3500 },
  traps:        { displayName: 'Traps',            side: 'front', maxVolume: 3000 },
  quads:        { displayName: 'Quadriceps',       side: 'front', maxVolume: 6000 },
  lats:         { displayName: 'Lats',             side: 'front', maxVolume: 4000 },
  calves:       { displayName: 'Calves',           side: 'front', maxVolume: 2000 },
  forearm:      { displayName: 'Forearms',         side: 'front', maxVolume: 1500 },
  // Back
  triceps:      { displayName: 'Triceps',          side: 'back',  maxVolume: 3000 },
  hamstrings:   { displayName: 'Hamstrings',       side: 'back',  maxVolume: 5000 },
  glutes:       { displayName: 'Glutes',           side: 'back',  maxVolume: 4000 },
  // back calves, forearm, shoulder, traps, lats mirror front
};
```

> **Volume thresholds**: Smaller muscles (biceps, abs, calves, forearms) hit their max at lower volume. Larger muscles (quads, chest, back) hit their max at higher volume. This makes the heatmap visually meaningful.

---

## Phase 1 — Project Scaffold & Data Layer

**Goal**: Boot the Expo project, configure navigation, and get SQLite fully initialized.

**Duration**: ~1-2 days

**Tasks**:

1. Initialize Expo SDK project with TypeScript
2. Install all dependencies:
   - `expo-sqlite` (local database)
   - `expo-router` (file-based navigation)
   - `react-native-svg` (muscle map rendering)
   - `react-native-gifted-charts` (charts)
   - `date-fns` (date handling)
   - `expo-barcode-scanner` (food barcode scanning)
   - `@expo/vector-icons` (Ionicons)
3. Set up Expo Router file-based routing:
   - `(tabs)` group with 5 tabs: `Home`, `Workout`, `Food`, `Cardio`, `Body Weight`
   - Stack screens: `workout/log-session`, `workout/history`, `food/search`, `food/history`, `cardio/log-run`
4. Create `app/_layout.tsx` — root layout that initializes SQLite and gates rendering until DB is ready
5. Implement `db/schema.ts` — all `CREATE TABLE IF NOT EXISTS` statements in one file:
   - `workout_sessions`
   - `workout_sets`
   - `custom_exercises`
   - `food_items`
   - `food_logs`
   - `cardio_sessions`
   - `body_weight_logs`
6. Implement `db/` CRUD modules:
   - `workoutDb.ts` — workout CRUD operations
   - `foodDb.ts` — food log CRUD operations
   - `cardioDb.ts` — cardio CRUD operations
   - `bodyweightDb.ts` — body weight CRUD operations
7. Create `constants/muscles.ts` with actual SVG IDs (see mapping above)
8. Create `utils/muscleColor.ts` — `getMuscleColor()` and `getRestingColor()` with per-muscle volume thresholds
9. Stub all tab and stack screens with placeholder text

**Deliverable**: Navigable app shell with working SQLite, all tables created, all screens reachable but empty.

---

## Phase 2 — SVG Muscle Map & Workout Tracker

**Goal**: Build the interactive muscle heatmap and the full workout logging flow.

**Duration**: ~3-4 days

**Tasks**:

### SVG Parsing & Rendering

1. Build a parsing script to extract all `<path>` elements grouped by their parent `<g id>` from both SVGs
2. Build `components/MuscleMapFront.tsx`:
   - Renders all paths from the front SVG
   - Labeled groups (`bicep`, `chest`, `abs`, etc.) get dynamic fill color from `muscleVolumes` prop
   - Unlabeled paths get static neutral color (`rgba(200, 210, 220, 0.4)`)
   - Each labeled group is tappable
3. Build `components/MuscleMapBack.tsx` — same as front but for back SVG
4. Build `components/MuscleMap.tsx`:
   - Wraps front + back views
   - Handles side toggle (front/back buttons or swipe)
   - Receives `muscleVolumes: Record<string, number>` prop
   - Tap on a muscle group opens a bottom sheet listing today's exercises targeting that muscle
5. Ensure decorative/unlabeled paths are rendered below labeled groups so they don't interfere with taps

### Exercise Library

1. Populate `constants/exercises.ts` with 60-80 exercises mapped to the actual SVG muscle IDs:
   ```typescript
   export interface Exercise {
     id: string;
     name: string;
     primaryMuscles: string[];   // muscle group IDs
     secondaryMuscles: string[];
     category: 'strength' | 'bodyweight' | 'machine' | 'cable';
   }
   ```
2. Include at least 60-80 common exercises covering all major muscle groups
3. Provide custom exercise creation via a form in the app

### Workout Screens

1. **Tab: Workout** (`app/(tabs)/workout.tsx`):
   - Shows muscle SVG heatmap with today's volume loads rendered as color
   - Shows session summary: exercises logged, total sets, total volume
   - "Start / Continue Today's Workout" button → `app/workout/log-session.tsx`
   - "View History" button → `app/workout/history.tsx`

2. **Log Session** (`app/workout/log-session.tsx`):
   - Current date at top
   - Search bar to find exercises from library (fuzzy search over `EXERCISES` + `custom_exercises` table)
   - Exercise cards with:
     - Exercise name
     - Primary muscles (colored tags)
     - List of sets: Set #, Weight (kg), Reps, optional RPE
     - "Add Set" button (pre-fills with last set's weight/reps)
     - Inline editable set rows
     - Swipe left to delete set
   - Floating "Done" button saves session and returns
   - Muscle heatmap at top updates live as sets are logged

3. **History** (`app/workout/history.tsx`):
   - Chronological list of past workout sessions
   - Tap session to view full detail (read-only)
   - **PR Tracking**: For each exercise, track highest single-set volume (weight × reps) and highest weight lifted
   - "PRs" sub-tab with list of exercises and their all-time best + sparkline chart of weight progression over last 10 sessions

**Deliverable**: Complete workout logging with interactive muscle heatmap and history.

---

## Phase 3 — Food & Calorie Tracker

**Goal**: Meal logging with barcode scanning and USDA text search, cached locally.

**Duration**: ~2-3 days

**Tasks**:

1. Implement `utils/nutritionApi.ts`:
   - **Open Food Facts** barcode lookup: `GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
   - **USDA FoodData Central** text search: `GET https://api.nal.usda.gov/fdc/v1/foods/search?query={query}&api_key={key}`
   - Debounce USDA API calls (400ms)
   - Always check local `food_items` cache first before hitting the network
2. Build `app/(tabs)/food.tsx`:
   - Daily summary at top: total calories, protein, carbs, fat vs user-set daily goals
   - Progress bars for each macro
   - Meals broken into four sections: Breakfast, Lunch, Dinner, Snacks
   - Each section lists logged food items with calories and macros
   - "Add Food" button per section → `app/food/search.tsx` with meal type pre-selected
3. Build `app/food/search.tsx`:
   - Text search input (debounced API call)
   - Camera icon for barcode scan via `expo-barcode-scanner`
   - Search results list: name, calories per 100g, source badge
   - Tap result opens quantity input sheet:
     - Food name
     - Input field for grams (default 100g)
     - Live preview of calculated macros for entered quantity
     - "Log" button → saves to `food_logs` and pops back to food tab
4. Build `app/food/history.tsx` — past food logs viewable by date

**Deliverable**: Full food logging with barcode scan, text search, caching, and daily macro tracking.

---

## Phase 4 — Cardio & Body Weight Trackers

**Goal**: The two simpler modules.

**Duration**: ~2 days

**Tasks**:

### Cardio

1. Build `app/(tabs)/cardio.tsx`:
   - Summary of recent sessions in a flat list (most recent first)
   - Weekly totals card: total km, total time, total sessions this week
   - "Log Session" button → `app/cardio/log-run.tsx`
2. Build `app/cardio/log-run.tsx`:
   - Date picker (defaults to today)
   - Activity type picker (run, walk, cycle, swim, other)
   - Duration input (MM:SS or HH:MM:SS)
   - Distance input in km (optional)
   - Heart rate input (optional)
   - Calories burned input (optional)
   - Notes text area
   - "Save" button
3. Cardio history/stats:
   - Line chart of distance over time for selected activity type
   - Personal bests: longest run, fastest pace, longest duration

### Body Weight

1. Build `app/(tabs)/bodyweight.tsx`:
   - Line chart showing weight over time (date on X, weight on Y)
   - Time range filter: 1 week, 1 month, 3 months, all time
   - Today's entry card at top
   - Stats row: current weight, starting weight, total change, 7-day rolling average
   - Chronological list of all past entries, swipe-left to delete
2. Build log-weight bottom sheet:
   - Weight input (numeric, decimal allowed)
   - Optional body fat % input
   - Optional notes
   - "Save" button — upserts today's record (update if entry already exists)

**Deliverable**: Cardio logging + stats, body weight charting + daily logging.

---

## Phase 5 — Dashboard, Settings & Cross-Module Wiring

**Goal**: Home screen aggregation and user preferences.

**Duration**: ~2 days

**Tasks**:

1. Build `app/(tabs)/index.tsx` (Home Dashboard):
   - Today's date header with greeting
   - Muscle map thumbnail — small front+back SVG showing today's muscle activation
   - Calories summary — X kcal consumed / daily goal kcal
   - Macro summary — protein / carbs / fat in grams
   - Workout summary — X exercises, Y total sets
   - Cardio summary — today's cardio sessions if any
   - Body weight — most recent logged weight + trend arrow (up/down/flat vs 7-day average)
   - Quick-action buttons: "Log Workout", "Log Meal", "Log Run", "Log Weight"
2. Build Settings screen (accessible from gear icon in header):
   - `unit_system`: 'metric' | 'imperial'
   - `daily_calorie_goal`: integer
   - `daily_protein_goal`: integer
   - `daily_carb_goal`: integer
   - `daily_fat_goal`: integer
   - `bodyweight_unit`: 'kg' | 'lbs'
   - Store in SQLite `settings` table or `expo-secure-store`
3. Implement unit conversion layer:
   - All DB values stay in metric (kg, km)
   - All display conversions happen at UI layer based on settings
   - Weight display: kg vs lbs
   - Distance display: km vs miles
4. Wire up state management:
   - `hooks/useWorkoutData.ts` — React Context + useReducer for workout module
   - `hooks/useFoodData.ts` — React Context + useReducer for food module
   - `hooks/useCardioData.ts` — React Context + useReducer for cardio module
   - `hooks/useBodyWeight.ts` — React Context + useReducer for body weight module
   - Each hook consumed by its respective screens and by the dashboard

**Deliverable**: Fully functional dashboard aggregating all 4 modules, working settings.

---

## Phase 6 — Polish & Edge Cases

**Goal**: Visual polish, celebrations, error handling, and robustness.

**Duration**: ~2-3 days

**Tasks**:

1. **PR Celebration Animation**:
   - Detect PR after every set save: query historical max for that exercise
   - If new record, trigger visual celebration (confetti via `react-native-confetti-cannon` or animated banner)
2. **Sparkline Charts**:
   - PR sub-tab: weight progression per exercise over last 10 sessions
   - Small sparkline charts inline with exercise names
3. **Custom Exercise Creation**:
   - Form in log-session screen: name, primary/secondary muscles (picker), category
   - Save to `custom_exercises` table
   - Immediately available in exercise search
4. **Empty States**:
   - Design empty state screens for each module ("No workouts yet", "No food logged", etc.)
   - Show quick-action buttons in empty states
5. **Input Validation**:
   - Required fields on all forms
   - Numeric bounds (e.g., weight > 0, reps > 0, RPE 1-10)
   - Duplicate date handling for body weight (upsert, don't duplicate)
   - Form error messages with red borders
6. **Loading & Error States**:
   - Loading spinners on all async operations
   - Error boundaries around screen components
   - Graceful offline behavior for food search API failures
   - Network error banners with retry button
7. **Swipe-to-Delete**:
   - All list items (sets, food logs, cardio sessions, weight entries) support swipe-to-delete
   - Show confirmation prompt before delete
   - Undo option (snackbar for 3 seconds)
8. **Responsive Layout**:
   - Test on various Android screen sizes
   - Ensure SVG muscle map scales properly on small/large screens
   - Adjust font sizes and padding for different densities
9. **Performance**:
   - Optimize SVG rendering: memoize muscle color calculations, avoid re-rendering decorative paths
   - Debounce all search inputs
   - Use `React.memo` on list item components
10. **Final SVG Touch-up**:
    - Ensure decorative paths don't block tap events on muscle groups
    - Optimize SVG rendering performance (reduce unnecessary re-renders)

**Deliverable**: Production-ready, polished app.

---

## Phase Order Summary

| Phase | Focus | Duration | Depends On |
|---|---|---|---|
| 1 | Project scaffold + SQLite + routing | 1-2 days | — |
| 2 | Muscle map SVG + Workout tracker | 3-4 days | Phase 1 |
| 3 | Food + calorie tracker | 2-3 days | Phase 1 |
| 4 | Cardio + Body weight trackers | 2 days | Phase 1 |
| 5 | Dashboard + Settings + wiring | 2 days | Phases 2-4 |
| 6 | Polish + edge cases + animations | 2-3 days | Phase 5 |

**Total Estimated Duration**: ~12-16 days of focused development.

---

## Key Implementation Notes

1. **SVG muscle groups must be rendered via `react-native-svg`** — not as static images. Each `<Path>` element in a labeled group gets a dynamically computed `fill` color based on today's volume data.
2. **Muscle volume calculation** runs on every render of the muscle map. Query `workout_sets` joined with exercise data for today's date, group by muscle ID, and sum `weight_kg * reps` for each.
3. **Food search debouncing** — use a `useRef` timer to debounce USDA API calls. Always check local `food_items` cache first.
4. **The app targets Android only** (Expo managed workflow). No iOS-specific APIs.
5. **No authentication, no remote sync.** All data is local. If the user wants backup, that's a future feature.
6. **Navigation structure** — Expo Router file-based routing with bottom tab navigator at root (`(tabs)` group) containing 5 tabs: Home, Workout, Food, Cardio, Body Weight.
7. **All display conversions at UI layer** — database always stores metric values (kg, km). Settings determine whether the UI displays metric or imperial.

---

## Database Schema Reference

### Workout
```sql
CREATE TABLE IF NOT EXISTS workout_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg REAL NOT NULL,
  rpe INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS custom_exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  primary_muscles TEXT NOT NULL,
  secondary_muscles TEXT NOT NULL,
  category TEXT NOT NULL
);
```

### Food
```sql
CREATE TABLE IF NOT EXISTS food_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT UNIQUE,
  name TEXT NOT NULL,
  calories_per_100g REAL NOT NULL,
  protein_per_100g REAL NOT NULL,
  carbs_per_100g REAL NOT NULL,
  fat_per_100g REAL NOT NULL,
  source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS food_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  food_item_id INTEGER NOT NULL REFERENCES food_items(id),
  meal_type TEXT NOT NULL,
  quantity_g REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Cardio
```sql
CREATE TABLE IF NOT EXISTS cardio_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  distance_km REAL,
  avg_heart_rate INTEGER,
  calories_burned INTEGER,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Body Weight
```sql
CREATE TABLE IF NOT EXISTS body_weight_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  weight_kg REAL NOT NULL,
  body_fat_pct REAL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

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
│   │   ├── log-session.tsx
│   │   └── history.tsx
│   ├── food/
│   │   ├── search.tsx
│   │   └── history.tsx
│   ├── cardio/
│   │   └── log-run.tsx
│   └── _layout.tsx
├── assets/
│   ├── body-front.svg
│   └── body-back.svg
├── components/
│   ├── MuscleMap.tsx
│   ├── MuscleMapFront.tsx
│   ├── MuscleMapBack.tsx
│   ├── ExerciseCard.tsx
│   ├── SetRow.tsx
│   ├── FoodLogCard.tsx
│   ├── CardioCard.tsx
│   └── WeightEntry.tsx
├── db/
│   ├── schema.ts
│   ├── workoutDb.ts
│   ├── foodDb.ts
│   ├── cardioDb.ts
│   └── bodyweightDb.ts
├── constants/
│   ├── exercises.ts
│   └── muscles.ts
├── hooks/
│   ├── useWorkoutData.ts
│   ├── useFoodData.ts
│   ├── useCardioData.ts
│   └── useBodyWeight.ts
└── utils/
    ├── muscleColor.ts
    └── nutritionApi.ts
```
