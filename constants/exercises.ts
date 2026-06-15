export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  category: 'strength' | 'bodyweight' | 'machine' | 'cable';
}

export const EXERCISES: Exercise[] = [
  // === CHEST ===
  { id: 'bench_press', name: 'Bench Press', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulder'], category: 'strength' },
  { id: 'incline_bench_press', name: 'Incline Bench Press', primaryMuscles: ['chest'], secondaryMuscles: ['shoulder', 'triceps'], category: 'strength' },
  { id: 'decline_bench_press', name: 'Decline Bench Press', primaryMuscles: ['chest'], secondaryMuscles: ['triceps'], category: 'strength' },
  { id: 'dumbbell_fly', name: 'Dumbbell Fly', primaryMuscles: ['chest'], secondaryMuscles: [], category: 'strength' },
  { id: 'cable_crossover', name: 'Cable Crossover', primaryMuscles: ['chest'], secondaryMuscles: ['shoulder'], category: 'cable' },
  { id: 'push_up', name: 'Push Up', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulder'], category: 'bodyweight' },
  { id: 'dumbbell_bench_press', name: 'Dumbbell Bench Press', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulder'], category: 'strength' },
  { id: 'incline_dumbbell_press', name: 'Incline Dumbbell Press', primaryMuscles: ['chest'], secondaryMuscles: ['shoulder', 'triceps'], category: 'strength' },
  { id: 'chest_dip', name: 'Chest Dip', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulder'], category: 'bodyweight' },
  { id: 'pec_deck', name: 'Pec Deck Fly', primaryMuscles: ['chest'], secondaryMuscles: [], category: 'machine' },

  // === BACK / LATS ===
  { id: 'pull_up', name: 'Pull Up', primaryMuscles: ['lats'], secondaryMuscles: ['bicep', 'traps'], category: 'bodyweight' },
  { id: 'lat_pulldown', name: 'Lat Pulldown', primaryMuscles: ['lats'], secondaryMuscles: ['bicep', 'traps'], category: 'cable' },
  { id: 'barbell_row', name: 'Barbell Row', primaryMuscles: ['lats'], secondaryMuscles: ['traps', 'bicep', 'hamstrings'], category: 'strength' },
  { id: 'dumbbell_row', name: 'Dumbbell Row', primaryMuscles: ['lats'], secondaryMuscles: ['traps', 'bicep'], category: 'strength' },
  { id: 't_bar_row', name: 'T-Bar Row', primaryMuscles: ['lats'], secondaryMuscles: ['traps', 'bicep'], category: 'strength' },
  { id: 'seated_cable_row', name: 'Seated Cable Row', primaryMuscles: ['lats'], secondaryMuscles: ['traps', 'bicep'], category: 'cable' },
  { id: 'deadlift', name: 'Deadlift', primaryMuscles: ['hamstrings', 'glutes', 'traps'], secondaryMuscles: ['lats', 'forearm'], category: 'strength' },
  { id: 'rack_pull', name: 'Rack Pull', primaryMuscles: ['traps'], secondaryMuscles: ['hamstrings', 'glutes', 'forearm'], category: 'strength' },
  { id: 'face_pull', name: 'Face Pull', primaryMuscles: ['shoulder'], secondaryMuscles: ['traps'], category: 'cable' },

  // === SHOULDERS ===
  { id: 'overhead_press', name: 'Overhead Press', primaryMuscles: ['shoulder'], secondaryMuscles: ['triceps', 'traps'], category: 'strength' },
  { id: 'dumbbell_shoulder_press', name: 'Dumbbell Shoulder Press', primaryMuscles: ['shoulder'], secondaryMuscles: ['triceps'], category: 'strength' },
  { id: 'lateral_raise', name: 'Lateral Raise', primaryMuscles: ['shoulder'], secondaryMuscles: ['traps'], category: 'strength' },
  { id: 'front_raise', name: 'Front Raise', primaryMuscles: ['shoulder'], secondaryMuscles: ['chest'], category: 'strength' },
  { id: 'rear_delt_fly', name: 'Rear Delt Fly', primaryMuscles: ['shoulder'], secondaryMuscles: ['traps'], category: 'strength' },
  { id: 'upright_row', name: 'Upright Row', primaryMuscles: ['shoulder', 'traps'], secondaryMuscles: ['bicep'], category: 'strength' },
  { id: 'arnold_press', name: 'Arnold Press', primaryMuscles: ['shoulder'], secondaryMuscles: ['triceps'], category: 'strength' },
  { id: 'shrug', name: 'Shrug', primaryMuscles: ['traps'], secondaryMuscles: [], category: 'strength' },

  // === BICEPS ===
  { id: 'barbell_curl', name: 'Barbell Curl', primaryMuscles: ['bicep'], secondaryMuscles: ['forearm'], category: 'strength' },
  { id: 'dumbbell_curl', name: 'Dumbbell Curl', primaryMuscles: ['bicep'], secondaryMuscles: ['forearm'], category: 'strength' },
  { id: 'hammer_curl', name: 'Hammer Curl', primaryMuscles: ['bicep'], secondaryMuscles: ['forearm'], category: 'strength' },
  { id: 'preacher_curl', name: 'Preacher Curl', primaryMuscles: ['bicep'], secondaryMuscles: [], category: 'strength' },
  { id: 'concentration_curl', name: 'Concentration Curl', primaryMuscles: ['bicep'], secondaryMuscles: ['forearm'], category: 'strength' },
  { id: 'cable_bicep_curl', name: 'Cable Bicep Curl', primaryMuscles: ['bicep'], secondaryMuscles: ['forearm'], category: 'cable' },
  { id: 'incline_dumbbell_curl', name: 'Incline Dumbbell Curl', primaryMuscles: ['bicep'], secondaryMuscles: [], category: 'strength' },

  // === TRICEPS ===
  { id: 'tricep_pushdown', name: 'Tricep Pushdown', primaryMuscles: ['triceps'], secondaryMuscles: [], category: 'cable' },
  { id: 'overhead_tricep_extension', name: 'Overhead Tricep Extension', primaryMuscles: ['triceps'], secondaryMuscles: [], category: 'strength' },
  { id: 'skull_crusher', name: 'Skull Crusher', primaryMuscles: ['triceps'], secondaryMuscles: [], category: 'strength' },
  { id: 'close_grip_bench', name: 'Close Grip Bench Press', primaryMuscles: ['triceps'], secondaryMuscles: ['chest'], category: 'strength' },
  { id: 'tricep_dip', name: 'Tricep Dip', primaryMuscles: ['triceps'], secondaryMuscles: ['chest', 'shoulder'], category: 'bodyweight' },
  { id: 'kickback', name: 'Tricep Kickback', primaryMuscles: ['triceps'], secondaryMuscles: [], category: 'strength' },

  // === QUADS ===
  { id: 'squat', name: 'Squat', primaryMuscles: ['quads'], secondaryMuscles: ['hamstrings', 'glutes'], category: 'strength' },
  { id: 'front_squat', name: 'Front Squat', primaryMuscles: ['quads'], secondaryMuscles: ['glutes', 'hamstrings'], category: 'strength' },
  { id: 'leg_press', name: 'Leg Press', primaryMuscles: ['quads'], secondaryMuscles: ['hamstrings', 'glutes'], category: 'machine' },
  { id: 'leg_extension', name: 'Leg Extension', primaryMuscles: ['quads'], secondaryMuscles: [], category: 'machine' },
  { id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', primaryMuscles: ['quads'], secondaryMuscles: ['glutes', 'hamstrings'], category: 'strength' },
  { id: 'goblet_squat', name: 'Goblet Squat', primaryMuscles: ['quads'], secondaryMuscles: ['glutes'], category: 'strength' },
  { id: 'lunge', name: 'Lunge', primaryMuscles: ['quads'], secondaryMuscles: ['glutes', 'hamstrings'], category: 'strength' },

  // === HAMSTRINGS ===
  { id: 'romanian_deadlift', name: 'Romanian Deadlift', primaryMuscles: ['hamstrings'], secondaryMuscles: ['glutes'], category: 'strength' },
  { id: 'leg_curl', name: 'Leg Curl', primaryMuscles: ['hamstrings'], secondaryMuscles: [], category: 'machine' },
  { id: 'good_morning', name: 'Good Morning', primaryMuscles: ['hamstrings'], secondaryMuscles: ['glutes', 'traps'], category: 'strength' },
  { id: 'nordic_curl', name: 'Nordic Curl', primaryMuscles: ['hamstrings'], secondaryMuscles: ['glutes'], category: 'bodyweight' },

  // === GLUTES ===
  { id: 'hip_thrust', name: 'Hip Thrust', primaryMuscles: ['glutes'], secondaryMuscles: ['hamstrings'], category: 'strength' },
  { id: 'glute_bridge', name: 'Glute Bridge', primaryMuscles: ['glutes'], secondaryMuscles: ['hamstrings'], category: 'bodyweight' },
  { id: 'cable_kickback', name: 'Cable Kickback', primaryMuscles: ['glutes'], secondaryMuscles: [], category: 'cable' },
  { id: 'step_up', name: 'Step Up', primaryMuscles: ['glutes'], secondaryMuscles: ['quads', 'hamstrings'], category: 'strength' },

  // === ABS ===
  { id: 'crunch', name: 'Crunch', primaryMuscles: ['abs'], secondaryMuscles: [], category: 'bodyweight' },
  { id: 'leg_raise', name: 'Leg Raise', primaryMuscles: ['abs'], secondaryMuscles: ['quads'], category: 'bodyweight' },
  { id: 'plank', name: 'Plank', primaryMuscles: ['abs'], secondaryMuscles: [], category: 'bodyweight' },
  { id: 'cable_crunch', name: 'Cable Crunch', primaryMuscles: ['abs'], secondaryMuscles: [], category: 'cable' },
  { id: 'russian_twist', name: 'Russian Twist', primaryMuscles: ['abs'], secondaryMuscles: [], category: 'bodyweight' },
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', primaryMuscles: ['abs'], secondaryMuscles: ['forearm'], category: 'bodyweight' },
  { id: 'ab_wheel_rollout', name: 'Ab Wheel Rollout', primaryMuscles: ['abs'], secondaryMuscles: ['lats'], category: 'bodyweight' },

  // === CALVES ===
  { id: 'standing_calf_raise', name: 'Standing Calf Raise', primaryMuscles: ['calves'], secondaryMuscles: [], category: 'strength' },
  { id: 'seated_calf_raise', name: 'Seated Calf Raise', primaryMuscles: ['calves'], secondaryMuscles: [], category: 'machine' },
  { id: 'donkey_calf_raise', name: 'Donkey Calf Raise', primaryMuscles: ['calves'], secondaryMuscles: [], category: 'strength' },

  // === FOREARMS ===
  { id: 'wrist_curl', name: 'Wrist Curl', primaryMuscles: ['forearm'], secondaryMuscles: [], category: 'strength' },
  { id: 'reverse_wrist_curl', name: 'Reverse Wrist Curl', primaryMuscles: ['forearm'], secondaryMuscles: [], category: 'strength' },
  { id: 'farmer_walk', name: 'Farmer Walk', primaryMuscles: ['forearm', 'traps'], secondaryMuscles: [], category: 'strength' },

  // === COMPOUND / FULL BODY ===
  { id: 'clean_and_jerk', name: 'Clean & Jerk', primaryMuscles: ['quads', 'shoulder', 'traps'], secondaryMuscles: ['hamstrings', 'glutes', 'forearm'], category: 'strength' },
  { id: 'snatch', name: 'Snatch', primaryMuscles: ['shoulder', 'quads', 'traps'], secondaryMuscles: ['hamstrings', 'glutes', 'forearm'], category: 'strength' },
  { id: 'power_clean', name: 'Power Clean', primaryMuscles: ['quads', 'traps'], secondaryMuscles: ['hamstrings', 'glutes', 'forearm'], category: 'strength' },
  { id: 'burpee', name: 'Burpee', primaryMuscles: ['quads', 'chest'], secondaryMuscles: ['shoulder', 'abs'], category: 'bodyweight' },
];

export const EXERCISE_CATEGORIES = ['strength', 'bodyweight', 'machine', 'cable'] as const;

export function getExercisesByMuscle(muscleId: string): Exercise[] {
  return EXERCISES.filter(
    e => e.primaryMuscles.includes(muscleId) || e.secondaryMuscles.includes(muscleId)
  );
}

export function searchExercises(query: string): Exercise[] {
  const q = query.toLowerCase();
  return EXERCISES.filter(
    e => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)
  );
}

export function getMuscleIdsForExercise(exerciseId: string): string[] {
  const exercise = EXERCISES.find(e => e.id === exerciseId);
  if (!exercise) return [];
  return [...exercise.primaryMuscles, ...exercise.secondaryMuscles];
}
