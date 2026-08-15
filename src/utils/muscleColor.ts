// The heatmap's material is ink on paper, not an app accent color: volume
// reads as how much vermilion wash has been applied to that muscle today,
// from a nearly blank plate to fully inked.

const VERMILION_RGB = '193, 58, 42';
const REST_RGB = '32, 27, 21';

export function getMuscleColor(volumeLoad: number, maxVolume: number): string {
  if (volumeLoad <= 0) return getRestingColor();
  const ratio = Math.min(volumeLoad / maxVolume, 1);
  // Floor is deliberately high: even one light set should read clearly as
  // "trained today" against the resting wash, not blend into it.
  const opacity = 0.24 + ratio * 0.76;
  return `rgba(${VERMILION_RGB}, ${opacity.toFixed(2)})`;
}

export function getRestingColor(): string {
  return `rgba(${REST_RGB}, 0.05)`;
}

export function muscleVolumeRatio(volumeLoad: number, maxVolume: number): number {
  return Math.min(volumeLoad / maxVolume, 1);
}
