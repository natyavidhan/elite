// Muscle groups are unified across left/right and front/back — a muscle
// trained is trained as a whole. IDs match the <g id="..."> groups in the
// two source SVGs (Muscular System.svg / Muscular System backside.svg).
// maxVolume is the kg·reps threshold at which the plate reads "fully inked"
// (rgba opacity 1.0) for that muscle — tuned so smaller muscles saturate at
// lower volume than larger ones.

export interface MuscleDef {
  id: string;
  displayName: string;
  maxVolume: number;
  views: Array<'front' | 'back'>;
}

export const MUSCLES: Record<string, MuscleDef> = {
  chest: { id: 'chest', displayName: 'Chest', maxVolume: 5000, views: ['front'] },
  abs: { id: 'abs', displayName: 'Abs', maxVolume: 2000, views: ['front'] },
  bicep: { id: 'bicep', displayName: 'Biceps', maxVolume: 3000, views: ['front'] },
  quads: { id: 'quads', displayName: 'Quadriceps', maxVolume: 6000, views: ['front'] },
  triceps: { id: 'triceps', displayName: 'Triceps', maxVolume: 3000, views: ['back'] },
  hamstrings: { id: 'hamstrings', displayName: 'Hamstrings', maxVolume: 5000, views: ['back'] },
  glutes: { id: 'glutes', displayName: 'Glutes', maxVolume: 4000, views: ['back'] },
  shoulder: { id: 'shoulder', displayName: 'Shoulders', maxVolume: 3500, views: ['front', 'back'] },
  traps: { id: 'traps', displayName: 'Traps', maxVolume: 3000, views: ['front', 'back'] },
  lats: { id: 'lats', displayName: 'Lats', maxVolume: 4000, views: ['front', 'back'] },
  calves: { id: 'calves', displayName: 'Calves', maxVolume: 2000, views: ['front', 'back'] },
  forearm: { id: 'forearm', displayName: 'Forearms', maxVolume: 1500, views: ['front', 'back'] },
};

export const MUSCLE_IDS = Object.keys(MUSCLES);

export function muscleDisplayName(id: string): string {
  return MUSCLES[id]?.displayName ?? id;
}
