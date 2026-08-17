import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getTableRows } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXERCISE_CATALOG = JSON.parse(readFileSync(path.join(__dirname, '..', 'exercises.json'), 'utf8'));

function dateNDaysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// Client and server run in different timezones by construction (a browser's
// local time vs. whatever the container's clock is) — "days ago" windows are
// computed on the server's clock, so they can be off by a day at the edges.
// Fine for a coaching feature; not fine to pretend it's exact.

function buildExerciseIndex() {
  const map = new Map();
  for (const e of EXERCISE_CATALOG) map.set(e.id, e);
  for (const e of getTableRows('customExercises')) map.set(e.id, e);
  return map;
}

function findExercise(query) {
  const q = String(query).trim().toLowerCase();
  const all = [...EXERCISE_CATALOG, ...getTableRows('customExercises')];
  return (
    all.find((e) => e.id === q) ||
    all.find((e) => e.name.toLowerCase() === q) ||
    all.find((e) => e.name.toLowerCase().includes(q)) ||
    null
  );
}

function getSettingsMap() {
  const rows = getTableRows('settings');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

function computeMacros(item, quantityG) {
  const factor = quantityG / 100;
  return {
    calories: item.caloriesPer100g * factor,
    protein: item.proteinPer100g * factor,
    carbs: item.carbsPer100g * factor,
    fat: item.fatPer100g * factor,
  };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

// --- tools ---
// Each mirrors an existing client-side query (see src/db/*.ts) re-implemented
// against the server's synced copy of the data, since this feature is
// backend-only and has no access to the client's IndexedDB.

function getWorkoutHistory({ days = 30 } = {}) {
  const since = dateNDaysAgo(days);
  const sessions = getTableRows('workoutSessions')
    .filter((s) => s.date >= since)
    .sort((a, b) => a.date.localeCompare(b.date));
  const sets = getTableRows('workoutSets');
  const exIndex = buildExerciseIndex();

  const setsBySession = new Map();
  for (const s of sets) {
    if (!setsBySession.has(s.sessionId)) setsBySession.set(s.sessionId, []);
    setsBySession.get(s.sessionId).push(s);
  }

  return sessions.map((session) => {
    const sessionSets = setsBySession.get(session.id) ?? [];
    const byExercise = new Map();
    for (const s of sessionSets) {
      if (!byExercise.has(s.exerciseId)) byExercise.set(s.exerciseId, []);
      byExercise.get(s.exerciseId).push({ weightKg: s.weightKg, reps: s.reps });
    }
    return {
      date: session.date,
      totalVolume: Math.round(sessionSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0)),
      exercises: [...byExercise.entries()].map(([id, setList]) => ({
        name: exIndex.get(id)?.name ?? id,
        sets: setList,
      })),
    };
  });
}

function getExerciseTrend({ exerciseName, limit = 15 }) {
  const exercise = findExercise(exerciseName);
  if (!exercise) return { error: `No exercise matching "${exerciseName}" found.` };

  const sets = getTableRows('workoutSets').filter((s) => s.exerciseId === exercise.id);
  if (sets.length === 0) return { exercise: exercise.name, history: [], note: 'No sets logged for this exercise yet.' };

  const sessions = new Map(getTableRows('workoutSessions').map((s) => [s.id, s.date]));
  const bestBySession = new Map();
  for (const s of sets) {
    bestBySession.set(s.sessionId, Math.max(bestBySession.get(s.sessionId) ?? 0, s.weightKg));
  }
  const history = [...bestBySession.entries()]
    .map(([sessionId, bestWeightKg]) => ({ date: sessions.get(sessionId), bestWeightKg }))
    .filter((h) => h.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit);

  return {
    exercise: exercise.name,
    history,
    personalBestKg: Math.max(...sets.map((s) => s.weightKg)),
  };
}

function getPersonalRecords({ limit = 15 } = {}) {
  const sets = getTableRows('workoutSets');
  const exIndex = buildExerciseIndex();
  const byExercise = new Map();
  for (const s of sets) {
    if (!byExercise.has(s.exerciseId)) byExercise.set(s.exerciseId, []);
    byExercise.get(s.exerciseId).push(s);
  }
  return [...byExercise.entries()]
    .map(([id, exerciseSets]) => ({
      exercise: exIndex.get(id)?.name ?? id,
      bestWeightKg: Math.max(...exerciseSets.map((s) => s.weightKg)),
      bestVolume: Math.round(Math.max(...exerciseSets.map((s) => s.weightKg * s.reps))),
    }))
    .sort((a, b) => b.bestWeightKg - a.bestWeightKg)
    .slice(0, limit);
}

function muscleVolumesForSets(sets, exIndex) {
  const volumes = {};
  for (const s of sets) {
    const ex = exIndex.get(s.exerciseId);
    if (!ex) continue;
    const load = s.weightKg * s.reps;
    for (const m of ex.primaryMuscles) volumes[m] = (volumes[m] ?? 0) + load;
    for (const m of ex.secondaryMuscles) volumes[m] = (volumes[m] ?? 0) + load * 0.5;
  }
  return volumes;
}

function getMuscleVolume({ date }) {
  const session = getTableRows('workoutSessions').find((s) => s.date === date);
  if (!session) return { date, volumes: {}, note: 'No workout logged that day.' };
  const sets = getTableRows('workoutSets').filter((s) => s.sessionId === session.id);
  const exIndex = buildExerciseIndex();
  const volumes = muscleVolumesForSets(sets, exIndex);
  for (const k of Object.keys(volumes)) volumes[k] = Math.round(volumes[k]);
  return { date, volumes };
}

function getWeeklyMuscleSummary({ days = 7 } = {}) {
  const since = dateNDaysAgo(days);
  const sessions = getTableRows('workoutSessions').filter((s) => s.date >= since);
  const sessionIds = new Set(sessions.map((s) => s.id));
  const sets = getTableRows('workoutSets').filter((s) => sessionIds.has(s.sessionId));
  const exIndex = buildExerciseIndex();
  const volumes = muscleVolumesForSets(sets, exIndex);
  const ranked = Object.entries(volumes)
    .map(([muscle, volume]) => ({ muscle, volume: Math.round(volume) }))
    .sort((a, b) => b.volume - a.volume);
  return { days, sessionsLogged: sessions.length, trainedMuscles: ranked };
}

function getFoodLog({ date }) {
  const logs = getTableRows('foodLogs').filter((l) => l.date === date);
  const items = new Map(getTableRows('foodItems').map((i) => [i.id, i]));
  const entries = logs
    .map((log) => {
      const item = items.get(log.foodItemId);
      if (!item) return null;
      const macros = computeMacros(item, log.quantityG);
      return { meal: log.mealType, name: item.name, quantityG: log.quantityG, ...macros };
    })
    .filter(Boolean);
  const totals = entries.reduce(
    (t, e) => ({ calories: t.calories + e.calories, protein: t.protein + e.protein, carbs: t.carbs + e.carbs, fat: t.fat + e.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  return {
    date,
    entries: entries.map((e) => ({ ...e, calories: Math.round(e.calories), protein: round1(e.protein), carbs: round1(e.carbs), fat: round1(e.fat) })),
    totals: { calories: Math.round(totals.calories), protein: round1(totals.protein), carbs: round1(totals.carbs), fat: round1(totals.fat) },
  };
}

function getNutritionTrend({ days = 7 } = {}) {
  const since = dateNDaysAgo(days);
  const logs = getTableRows('foodLogs').filter((l) => l.date >= since);
  const items = new Map(getTableRows('foodItems').map((i) => [i.id, i]));
  const byDate = new Map();
  for (const log of logs) {
    const item = items.get(log.foodItemId);
    if (!item) continue;
    const macros = computeMacros(item, log.quantityG);
    const existing = byDate.get(log.date) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
    byDate.set(log.date, {
      calories: existing.calories + macros.calories,
      protein: existing.protein + macros.protein,
      carbs: existing.carbs + macros.carbs,
      fat: existing.fat + macros.fat,
    });
  }
  const settings = getSettingsMap();
  return {
    days,
    goals: {
      calories: Number(settings.dailyCalorieGoal ?? 2200),
      protein: Number(settings.dailyProteinGoal ?? 150),
      carbs: Number(settings.dailyCarbGoal ?? 220),
      fat: Number(settings.dailyFatGoal ?? 70),
    },
    dailyTotals: [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, t]) => ({ date, calories: Math.round(t.calories), protein: round1(t.protein), carbs: round1(t.carbs), fat: round1(t.fat) })),
  };
}

function paceLabel(durationSeconds, distanceKm) {
  if (!distanceKm || distanceKm <= 0) return null;
  const paceSeconds = durationSeconds / distanceKm;
  const min = Math.floor(paceSeconds / 60);
  const sec = Math.round(paceSeconds % 60);
  return `${min}:${String(sec).padStart(2, '0')} /km`;
}

function getCardioSummary({ days = 30 } = {}) {
  const since = dateNDaysAgo(days);
  const sessions = getTableRows('cardioSessions')
    .filter((s) => s.date >= since)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (sessions.length === 0) return { days, sessions: [], note: 'No cardio logged in this window.' };

  const longestRunKm = Math.max(...sessions.map((s) => s.distanceKm ?? 0));
  const withPace = sessions
    .filter((s) => s.distanceKm && s.distanceKm > 0)
    .map((s) => ({ seconds: s.durationSeconds / s.distanceKm, session: s }))
    .sort((a, b) => a.seconds - b.seconds);
  const fastest = withPace[0];

  return {
    days,
    sessions: sessions.map((s) => ({
      date: s.date,
      activityType: s.activityType,
      durationMin: Math.round(s.durationSeconds / 60),
      distanceKm: s.distanceKm,
      pace: paceLabel(s.durationSeconds, s.distanceKm),
    })),
    bests: {
      longestRunKm: longestRunKm > 0 ? longestRunKm : undefined,
      fastestPace: fastest ? paceLabel(fastest.session.durationSeconds, fastest.session.distanceKm) : undefined,
    },
  };
}

function getBodyWeightTrend({ days = 90 } = {}) {
  const since = dateNDaysAgo(days);
  const logs = getTableRows('bodyWeightLogs')
    .filter((l) => l.date >= since)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (logs.length === 0) return { days, entries: [], note: 'No body weight logged in this window.' };

  const current = logs[logs.length - 1].weightKg;
  const starting = logs[0].weightKg;
  const last7 = logs.slice(-7);
  const sevenDayAverage = last7.reduce((sum, l) => sum + l.weightKg, 0) / last7.length;

  return {
    days,
    entries: logs.map((l) => ({ date: l.date, weightKg: l.weightKg, bodyFatPct: l.bodyFatPct })),
    stats: { current, starting, changeKg: round1(current - starting), sevenDayAverageKg: round1(sevenDayAverage) },
  };
}

function getConsistency({ days = 14 } = {}) {
  const since = dateNDaysAgo(days);
  const sessionIdsWithSets = new Set(getTableRows('workoutSets').map((s) => s.sessionId));
  const workoutDates = new Set(
    getTableRows('workoutSessions')
      .filter((s) => s.date >= since && sessionIdsWithSets.has(s.id))
      .map((s) => s.date),
  );
  const foodDates = new Set(getTableRows('foodLogs').filter((l) => l.date >= since).map((l) => l.date));
  const cardioDates = new Set(getTableRows('cardioSessions').filter((s) => s.date >= since).map((s) => s.date));
  const weightDates = new Set(getTableRows('bodyWeightLogs').filter((l) => l.date >= since).map((l) => l.date));

  const daily = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = dateNDaysAgo(i);
    daily.push({
      date,
      workout: workoutDates.has(date),
      food: foodDates.has(date),
      cardio: cardioDates.has(date),
      bodyWeight: weightDates.has(date),
    });
  }
  return {
    days,
    daily,
    summary: {
      workoutDays: daily.filter((d) => d.workout).length,
      foodLoggedDays: daily.filter((d) => d.food).length,
      cardioDays: daily.filter((d) => d.cardio).length,
      bodyWeightLoggedDays: daily.filter((d) => d.bodyWeight).length,
    },
  };
}

export const TOOLS = {
  get_workout_history: getWorkoutHistory,
  get_exercise_trend: getExerciseTrend,
  get_personal_records: getPersonalRecords,
  get_muscle_volume: getMuscleVolume,
  get_weekly_muscle_summary: getWeeklyMuscleSummary,
  get_food_log: getFoodLog,
  get_nutrition_trend: getNutritionTrend,
  get_cardio_summary: getCardioSummary,
  get_body_weight_trend: getBodyWeightTrend,
  get_consistency: getConsistency,
};

export const TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'get_workout_history',
      description: "List the user's workout sessions (date, exercises, sets, total volume) over the last N days.",
      parameters: { type: 'object', properties: { days: { type: 'integer', description: 'How many days back, default 30' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_exercise_trend',
      description: 'Best weight lifted per session for one exercise over time, plus its all-time PR. Use for plateau/progress questions about a specific lift.',
      parameters: {
        type: 'object',
        properties: {
          exerciseName: { type: 'string', description: 'Exercise name or id, e.g. "bench press"' },
          limit: { type: 'integer', description: 'Max sessions to return, default 15' },
        },
        required: ['exerciseName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_personal_records',
      description: "The user's best weight and best single-set volume per exercise, across all history, heaviest first.",
      parameters: { type: 'object', properties: { limit: { type: 'integer', description: 'Max exercises to return, default 15' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_muscle_volume',
      description: 'Muscle-by-muscle training volume (primary muscles full credit, secondary half credit) for one specific date.',
      parameters: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD' } }, required: ['date'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weekly_muscle_summary',
      description: 'Total muscle volume trained across the last N days, ranked — use to find what is undertrained or overtrained this week.',
      parameters: { type: 'object', properties: { days: { type: 'integer', description: 'Window size, default 7' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_food_log',
      description: 'Everything logged for one specific date: each entry with macros, and the day total.',
      parameters: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD' } }, required: ['date'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_nutrition_trend',
      description: "Daily calorie/macro totals over the last N days plus the user's daily goals, for comparing intake against goals over time.",
      parameters: { type: 'object', properties: { days: { type: 'integer', description: 'Window size, default 7' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_cardio_summary',
      description: 'Cardio sessions over the last N days plus personal bests (longest run, fastest pace).',
      parameters: { type: 'object', properties: { days: { type: 'integer', description: 'Window size, default 30' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_body_weight_trend',
      description: 'Body weight entries over the last N days plus current/starting/change/7-day-average stats.',
      parameters: { type: 'object', properties: { days: { type: 'integer', description: 'Window size, default 90' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_consistency',
      description: 'Per-day whether the user logged a workout, food, cardio, and body weight over the last N days — use for "how consistent have I been" questions.',
      parameters: { type: 'object', properties: { days: { type: 'integer', description: 'Window size, default 14' } } },
    },
  },
];
