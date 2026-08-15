# Elite PWA — Build Phases

This document breaks the project into 6 build phases, ordered by dependency and complexity. Full architecture, schema, and per-module screen specs live in `PLAN.md` — this file is the build order, not a second copy of the spec.

**Note on the existing codebase:** everything currently under `app/`, `components/`, `db/`, `hooks/`, `utils/`, `constants/` is the Expo/React Native build from before the PWA pivot. None of it ports directly (different framework, different storage engine, different SVG rendering model) — it's being replaced in place. It stays fully recoverable via git history if ever needed for reference.

**Total Estimated Duration**: ~10-14 days of focused development (slightly less than the original RN estimate — no native module friction, no platform-specific builds, and SVG rendering is simpler on web).

| Phase | Focus | Depends On |
|---|---|---|
| 1 | Vite/React/TS scaffold, Tailwind, PWA plugin, Dexie schema, routing shell | — |
| 2 | Muscle map SVG + Workout tracker | Phase 1 |
| 3 | Food + calorie tracker | Phase 1 |
| 4 | Cardio + Body weight trackers | Phase 1 |
| 5 | Dashboard + Settings + Backup/Restore + unit wiring | Phases 2-4 |
| 6 | PWA installability, polish, edge cases, animations | Phase 5 |

---

## Phase 1 — Project Scaffold & Data Layer

**Goal**: Boot the Vite/React app, wire up routing, and get IndexedDB fully initialized.

**Tasks**:

1. Scaffold Vite + React + TypeScript project; add Tailwind CSS
2. Install dependencies: `dexie`, `react-router-dom`, `date-fns`, `lucide-react`, `recharts`, `@zxing/browser`, `canvas-confetti`, `vite-plugin-pwa`
3. Set up React Router: routes for all pages listed in `PLAN.md`'s directory structure (`Home`, `Workout` + its sub-routes, `Food` + its sub-routes, `Cardio` + its sub-route, `BodyWeight`, `Settings`)
4. Build the layout shell (`App.tsx` + `BottomNav.tsx`) — bottom tab bar at mobile widths, side nav at desktop widths
5. Implement `db/schema.ts` — the Dexie database class and all table definitions from `PLAN.md`
6. Implement `db/` CRUD modules: `workoutDb.ts`, `foodDb.ts`, `cardioDb.ts`, `bodyweightDb.ts`, `settingsDb.ts` (remember: cascade deletes are manual, wrap in Dexie transactions)
7. Create `constants/muscles.ts` with the unified (no left/right) muscle IDs and volume thresholds from `PLAN.md`
8. Create `utils/muscleColor.ts` — `getMuscleColor()` / `getRestingColor()`
9. Stub all pages with placeholder content, reachable via navigation

**Deliverable**: Navigable app shell with working IndexedDB, all tables created, every route reachable but empty.

---

## Phase 2 — SVG Muscle Map & Workout Tracker

**Goal**: Interactive muscle heatmap and the full workout logging flow.

**Tasks**:

1. Extract path `d` + group `id` data from both source SVGs (`Muscular System.svg`, `Muscular System backside.svg`) into static modules
2. Build `MuscleMapFront.tsx` / `MuscleMapBack.tsx` — labeled groups get dynamic fill from `muscleVolumes`, unlabeled paths get static neutral fill, labeled groups are tappable, decorative paths sit behind labeled ones so they never intercept taps
3. Build `MuscleMap.tsx` — wraps front/back, side toggle, tap opens a bottom sheet of today's exercises for that muscle
4. Populate `constants/exercises.ts` with 60-80 exercises against the unified muscle IDs; support custom exercise creation
5. Build `pages/Workout.tsx`, `pages/WorkoutLogSession.tsx` (search, exercise cards, editable set rows, live-updating heatmap), `pages/WorkoutHistory.tsx` (session list + detail + PR tab with sparkline)

**Deliverable**: Complete workout logging with interactive muscle heatmap and history.

---

## Phase 3 — Food & Calorie Tracker

**Goal**: Meal logging with barcode scanning and USDA text search, cached locally.

**Tasks**:

1. Before writing any code against them, confirm CORS is actually enabled on the exact Open Food Facts and USDA FoodData Central endpoints being used — the whole point of a backend-less app is these calls succeed straight from the browser
2. Implement `utils/nutritionApi.ts` — Open Food Facts barcode lookup, USDA text search (400ms debounce), always check `foodItems` cache before hitting the network
3. Build `BarcodeScanner.tsx` — `getUserMedia` video stream + `@zxing/browser` decode loop, with a clear permission-denied fallback state
4. Build `pages/Food.tsx` (daily macro summary, progress bars, four meal sections), `pages/FoodSearch.tsx` (search + scan + quantity sheet), `pages/FoodHistory.tsx`

**Deliverable**: Full food logging with barcode scan, text search, caching, and daily macro tracking.

---

## Phase 4 — Cardio & Body Weight Trackers

**Goal**: The two simpler modules.

**Tasks**:

1. `pages/Cardio.tsx` (recent sessions, weekly totals card, "Log Session"), `pages/CardioLogRun.tsx` (form per `PLAN.md`), history/stats view with a Recharts distance-over-time chart and personal bests
2. `pages/BodyWeight.tsx` (Recharts weight trend chart with time-range filter, today's-entry card, stats row, chronological list), log-weight sheet (upsert on today's date)

**Deliverable**: Cardio logging + stats, body weight charting + daily logging.

---

## Phase 5 — Dashboard, Settings, Backup & Cross-Module Wiring

**Goal**: Home screen aggregation, preferences, and data portability.

**Tasks**:

1. Build `pages/Home.tsx` per `PLAN.md`'s dashboard spec
2. Build `pages/Settings.tsx` — unit system, daily macro goals, bodyweight unit, all persisted to the Dexie `settings` table
3. Implement `utils/unitConversion.ts` — DB stays metric, UI layer converts for display
4. Implement `db/backup.ts` — "Export Data" (serialize all tables to a downloadable JSON file) and "Import Data" (restore from that file), surfaced in Settings
5. Wire each module's Context/reducer to its pages and to the dashboard

**Deliverable**: Fully functional dashboard aggregating all 4 modules, working settings, working backup/restore.

---

## Phase 6 — PWA Installability & Polish

**Goal**: Make it installable, offline-capable, and production-ready.

**Tasks**:

1. **Manifest & icons**: design an app icon (something mark-like, not the full anatomical SVGs), export 192×192/512×512 + maskable variants, fill in `manifest.json`
2. **Service worker**: configure `vite-plugin-pwa` to precache the app shell; verify the app loads and is usable with the network fully disabled
3. **iOS install hint**: a small in-app prompt explaining Share → "Add to Home Screen," since iOS has no native install prompt event
4. **PR celebration**: `canvas-confetti` trigger on new record, wired into the same PR-detection logic from Phase 2
5. **Sparklines**: per-exercise weight progression, last 10 sessions
6. **Empty states** for each module's zero-data case, with quick-action buttons
7. **Input validation**: required fields, numeric bounds (weight > 0, reps > 0, RPE 1-10), red-border error states
8. **Loading & error states**: spinners on async ops, network-error banners with retry for food search
9. **Delete interactions**: swipe-to-delete on touch (e.g. `react-swipeable`) with a confirmation + 3s undo snackbar; hover-revealed delete button as the desktop equivalent (swipe doesn't exist with a mouse)
10. **Responsive pass**: verify mobile-width and desktop-width layouts both work well, especially the two-column workout-logging layout on desktop
11. **Performance**: memoize muscle color calculations, `React.memo` on list items, debounce all search inputs
12. Decide on and implement any approved items from `PLAN.md`'s Optional Enhancements (dark mode, streaks)

**Deliverable**: Installable, offline-capable, production-ready PWA.
