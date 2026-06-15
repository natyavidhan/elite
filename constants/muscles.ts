export interface MuscleDef {
  displayName: string;
  side: 'front' | 'back';
  maxVolume: number;
}

export const MUSCLES: Record<string, MuscleDef> = {
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
};

export const FRONT_MUSCLES = Object.entries(MUSCLES)
  .filter(([_, def]) => def.side === 'front')
  .map(([id]) => id);

export const BACK_MUSCLES = Object.entries(MUSCLES)
  .filter(([_, def]) => def.side === 'back')
  .map(([id]) => id);
