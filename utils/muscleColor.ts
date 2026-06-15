import { MUSCLES } from '../constants/muscles';

const DEFAULT_MAX_VOLUME = 5000;

export function getMuscleMaxVolume(muscleId: string): number {
  return MUSCLES[muscleId]?.maxVolume ?? DEFAULT_MAX_VOLUME;
}

export function getMuscleColor(volumeLoad: number, muscleId?: string): string {
  const maxVolume = muscleId ? getMuscleMaxVolume(muscleId) : DEFAULT_MAX_VOLUME;
  const ratio = Math.min(volumeLoad / maxVolume, 1);
  const opacity = 0.05 + ratio * 0.95;
  return `rgba(30, 100, 255, ${opacity.toFixed(2)})`;
}

export function getRestingColor(): string {
  return 'rgba(200, 210, 220, 0.4)';
}

export function getStaticColor(): string {
  return 'rgba(180, 185, 190, 0.5)';
}
