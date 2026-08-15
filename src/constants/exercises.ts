import type { ExerciseCategory } from '@/db/schema';

export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  category: ExerciseCategory;
}

export const EXERCISES: Exercise[] = [
  // Chest
  { id: 'barbell_bench_press', name: 'Barbell Bench Press', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulder'], category: 'strength' },
  { id: 'incline_barbell_bench_press', name: 'Incline Barbell Bench Press', primaryMuscles: ['chest'], secondaryMuscles: ['shoulder', 'triceps'], category: 'strength' },
  { id: 'decline_barbell_bench_press', name: 'Decline Barbell Bench Press', primaryMuscles: ['chest'], secondaryMuscles: ['triceps'], category: 'strength' },
  { id: 'dumbbell_bench_press', name: 'Dumbbell Bench Press', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulder'], category: 'strength' },
  { id: 'incline_dumbbell_press', name: 'Incline Dumbbell Press', primaryMuscles: ['chest'], secondaryMuscles: ['shoulder', 'triceps'], category: 'strength' },
  { id: 'dumbbell_fly', name: 'Dumbbell Fly', primaryMuscles: ['chest'], secondaryMuscles: [], category: 'strength' },
  { id: 'cable_fly', name: 'Cable Fly', primaryMuscles: ['chest'], secondaryMuscles: [], category: 'cable' },
  { id: 'push_up', name: 'Push-Up', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulder', 'abs'], category: 'bodyweight' },
  { id: 'chest_dip', name: 'Chest Dip', primaryMuscles: ['chest'], secondaryMuscles: ['triceps'], category: 'bodyweight' },
  { id: 'pec_deck_machine', name: 'Pec Deck Machine', primaryMuscles: ['chest'], secondaryMuscles: [], category: 'machine' },
  { id: 'landmine_press', name: 'Landmine Press', primaryMuscles: ['chest'], secondaryMuscles: ['shoulder', 'triceps'], category: 'strength' },

  // Back / Lats
  { id: 'deadlift', name: 'Deadlift', primaryMuscles: ['hamstrings', 'lats'], secondaryMuscles: ['glutes', 'traps', 'forearm'], category: 'strength' },
  { id: 'sumo_deadlift', name: 'Sumo Deadlift', primaryMuscles: ['glutes', 'hamstrings'], secondaryMuscles: ['quads', 'lats'], category: 'strength' },
  { id: 'pull_up', name: 'Pull-Up', primaryMuscles: ['lats'], secondaryMuscles: ['bicep', 'forearm'], category: 'bodyweight' },
  { id: 'chin_up', name: 'Chin-Up', primaryMuscles: ['lats'], secondaryMuscles: ['bicep', 'forearm'], category: 'bodyweight' },
  { id: 'lat_pulldown', name: 'Lat Pulldown', primaryMuscles: ['lats'], secondaryMuscles: ['bicep'], category: 'cable' },
  { id: 'barbell_row', name: 'Barbell Row', primaryMuscles: ['lats'], secondaryMuscles: ['bicep', 'traps'], category: 'strength' },
  { id: 'dumbbell_row', name: 'One-Arm Dumbbell Row', primaryMuscles: ['lats'], secondaryMuscles: ['bicep', 'traps'], category: 'strength' },
  { id: 'seated_cable_row', name: 'Seated Cable Row', primaryMuscles: ['lats'], secondaryMuscles: ['bicep', 'traps'], category: 'cable' },
  { id: 't_bar_row', name: 'T-Bar Row', primaryMuscles: ['lats'], secondaryMuscles: ['bicep', 'traps'], category: 'strength' },
  { id: 'straight_arm_pulldown', name: 'Straight-Arm Pulldown', primaryMuscles: ['lats'], secondaryMuscles: [], category: 'cable' },
  { id: 'face_pull', name: 'Face Pull', primaryMuscles: ['shoulder'], secondaryMuscles: ['traps'], category: 'cable' },

  // Shoulders
  { id: 'overhead_press', name: 'Overhead Press', primaryMuscles: ['shoulder'], secondaryMuscles: ['triceps'], category: 'strength' },
  { id: 'dumbbell_shoulder_press', name: 'Dumbbell Shoulder Press', primaryMuscles: ['shoulder'], secondaryMuscles: ['triceps'], category: 'strength' },
  { id: 'arnold_press', name: 'Arnold Press', primaryMuscles: ['shoulder'], secondaryMuscles: ['triceps'], category: 'strength' },
  { id: 'lateral_raise', name: 'Lateral Raise', primaryMuscles: ['shoulder'], secondaryMuscles: [], category: 'strength' },
  { id: 'front_raise', name: 'Front Raise', primaryMuscles: ['shoulder'], secondaryMuscles: [], category: 'strength' },
  { id: 'rear_delt_fly', name: 'Rear Delt Fly', primaryMuscles: ['shoulder'], secondaryMuscles: ['traps'], category: 'strength' },
  { id: 'upright_row', name: 'Upright Row', primaryMuscles: ['shoulder'], secondaryMuscles: ['traps'], category: 'strength' },
  { id: 'machine_shoulder_press', name: 'Machine Shoulder Press', primaryMuscles: ['shoulder'], secondaryMuscles: ['triceps'], category: 'machine' },

  // Traps
  { id: 'barbell_shrug', name: 'Barbell Shrug', primaryMuscles: ['traps'], secondaryMuscles: ['forearm'], category: 'strength' },
  { id: 'dumbbell_shrug', name: 'Dumbbell Shrug', primaryMuscles: ['traps'], secondaryMuscles: ['forearm'], category: 'strength' },
  { id: 'farmers_carry', name: "Farmer's Carry", primaryMuscles: ['traps', 'forearm'], secondaryMuscles: ['abs'], category: 'strength' },

  // Biceps
  { id: 'barbell_curl', name: 'Barbell Curl', primaryMuscles: ['bicep'], secondaryMuscles: ['forearm'], category: 'strength' },
  { id: 'dumbbell_curl', name: 'Dumbbell Curl', primaryMuscles: ['bicep'], secondaryMuscles: ['forearm'], category: 'strength' },
  { id: 'hammer_curl', name: 'Hammer Curl', primaryMuscles: ['bicep'], secondaryMuscles: ['forearm'], category: 'strength' },
  { id: 'preacher_curl', name: 'Preacher Curl', primaryMuscles: ['bicep'], secondaryMuscles: [], category: 'strength' },
  { id: 'concentration_curl', name: 'Concentration Curl', primaryMuscles: ['bicep'], secondaryMuscles: [], category: 'strength' },
  { id: 'cable_curl', name: 'Cable Curl', primaryMuscles: ['bicep'], secondaryMuscles: ['forearm'], category: 'cable' },
  { id: 'ez_bar_curl', name: 'EZ Bar Curl', primaryMuscles: ['bicep'], secondaryMuscles: ['forearm'], category: 'strength' },

  // Triceps
  { id: 'tricep_pushdown', name: 'Tricep Pushdown', primaryMuscles: ['triceps'], secondaryMuscles: [], category: 'cable' },
  { id: 'overhead_tricep_extension', name: 'Overhead Tricep Extension', primaryMuscles: ['triceps'], secondaryMuscles: [], category: 'cable' },
  { id: 'skull_crusher', name: 'Skull Crusher', primaryMuscles: ['triceps'], secondaryMuscles: [], category: 'strength' },
  { id: 'close_grip_bench_press', name: 'Close-Grip Bench Press', primaryMuscles: ['triceps'], secondaryMuscles: ['chest'], category: 'strength' },
  { id: 'tricep_dip', name: 'Tricep Dip', primaryMuscles: ['triceps'], secondaryMuscles: ['chest'], category: 'bodyweight' },
  { id: 'cable_kickback', name: 'Cable Kickback', primaryMuscles: ['triceps'], secondaryMuscles: [], category: 'cable' },
  { id: 'diamond_push_up', name: 'Diamond Push-Up', primaryMuscles: ['triceps'], secondaryMuscles: ['chest'], category: 'bodyweight' },

  // Forearms
  { id: 'wrist_curl', name: 'Wrist Curl', primaryMuscles: ['forearm'], secondaryMuscles: [], category: 'strength' },
  { id: 'reverse_wrist_curl', name: 'Reverse Wrist Curl', primaryMuscles: ['forearm'], secondaryMuscles: [], category: 'strength' },
  { id: 'reverse_curl', name: 'Reverse Curl', primaryMuscles: ['forearm'], secondaryMuscles: ['bicep'], category: 'strength' },

  // Abs
  { id: 'crunch', name: 'Crunch', primaryMuscles: ['abs'], secondaryMuscles: [], category: 'bodyweight' },
  { id: 'sit_up', name: 'Sit-Up', primaryMuscles: ['abs'], secondaryMuscles: [], category: 'bodyweight' },
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', primaryMuscles: ['abs'], secondaryMuscles: ['forearm'], category: 'bodyweight' },
  { id: 'cable_crunch', name: 'Cable Crunch', primaryMuscles: ['abs'], secondaryMuscles: [], category: 'cable' },
  { id: 'russian_twist', name: 'Russian Twist', primaryMuscles: ['abs'], secondaryMuscles: [], category: 'bodyweight' },
  { id: 'ab_wheel_rollout', name: 'Ab Wheel Rollout', primaryMuscles: ['abs'], secondaryMuscles: ['lats', 'shoulder'], category: 'bodyweight' },
  { id: 'leg_raise', name: 'Leg Raise', primaryMuscles: ['abs'], secondaryMuscles: [], category: 'bodyweight' },
  { id: 'mountain_climber', name: 'Mountain Climber', primaryMuscles: ['abs'], secondaryMuscles: ['quads'], category: 'bodyweight' },
  { id: 'plank', name: 'Plank', primaryMuscles: ['abs'], secondaryMuscles: ['shoulder'], category: 'bodyweight' },

  // Quads
  { id: 'back_squat', name: 'Back Squat', primaryMuscles: ['quads'], secondaryMuscles: ['glutes', 'hamstrings'], category: 'strength' },
  { id: 'front_squat', name: 'Front Squat', primaryMuscles: ['quads'], secondaryMuscles: ['abs', 'glutes'], category: 'strength' },
  { id: 'leg_press', name: 'Leg Press', primaryMuscles: ['quads'], secondaryMuscles: ['glutes', 'hamstrings'], category: 'machine' },
  { id: 'leg_extension', name: 'Leg Extension', primaryMuscles: ['quads'], secondaryMuscles: [], category: 'machine' },
  { id: 'walking_lunge', name: 'Walking Lunge', primaryMuscles: ['quads'], secondaryMuscles: ['glutes', 'hamstrings'], category: 'bodyweight' },
  { id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', primaryMuscles: ['quads'], secondaryMuscles: ['glutes'], category: 'strength' },
  { id: 'goblet_squat', name: 'Goblet Squat', primaryMuscles: ['quads'], secondaryMuscles: ['glutes'], category: 'strength' },
  { id: 'hack_squat', name: 'Hack Squat', primaryMuscles: ['quads'], secondaryMuscles: ['glutes'], category: 'machine' },

  // Hamstrings
  { id: 'romanian_deadlift', name: 'Romanian Deadlift', primaryMuscles: ['hamstrings'], secondaryMuscles: ['glutes', 'lats'], category: 'strength' },
  { id: 'lying_leg_curl', name: 'Lying Leg Curl', primaryMuscles: ['hamstrings'], secondaryMuscles: [], category: 'machine' },
  { id: 'seated_leg_curl', name: 'Seated Leg Curl', primaryMuscles: ['hamstrings'], secondaryMuscles: [], category: 'machine' },
  { id: 'good_morning', name: 'Good Morning', primaryMuscles: ['hamstrings'], secondaryMuscles: ['glutes'], category: 'strength' },
  { id: 'nordic_curl', name: 'Nordic Curl', primaryMuscles: ['hamstrings'], secondaryMuscles: [], category: 'bodyweight' },
  { id: 'stiff_leg_deadlift', name: 'Stiff-Leg Deadlift', primaryMuscles: ['hamstrings'], secondaryMuscles: ['glutes'], category: 'strength' },

  // Glutes
  { id: 'hip_thrust', name: 'Hip Thrust', primaryMuscles: ['glutes'], secondaryMuscles: ['hamstrings'], category: 'strength' },
  { id: 'glute_bridge', name: 'Glute Bridge', primaryMuscles: ['glutes'], secondaryMuscles: ['hamstrings'], category: 'bodyweight' },
  { id: 'cable_glute_kickback', name: 'Cable Glute Kickback', primaryMuscles: ['glutes'], secondaryMuscles: [], category: 'cable' },
  { id: 'step_up', name: 'Step-Up', primaryMuscles: ['glutes'], secondaryMuscles: ['quads'], category: 'bodyweight' },

  // Calves
  { id: 'standing_calf_raise', name: 'Standing Calf Raise', primaryMuscles: ['calves'], secondaryMuscles: [], category: 'machine' },
  { id: 'seated_calf_raise', name: 'Seated Calf Raise', primaryMuscles: ['calves'], secondaryMuscles: [], category: 'machine' },
  { id: 'donkey_calf_raise', name: 'Donkey Calf Raise', primaryMuscles: ['calves'], secondaryMuscles: [], category: 'machine' },
  { id: 'leg_press_calf_raise', name: 'Leg Press Calf Raise', primaryMuscles: ['calves'], secondaryMuscles: [], category: 'machine' },
];

export function findExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
