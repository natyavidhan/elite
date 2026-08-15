// The heatmap's material is ink on paper, not an app accent color: volume
// reads as how much vermilion wash has been applied, from a nearly blank
// plate to fully inked. This same ramp is reused anywhere something is
// encoded as "how much ink today" — the muscle plate, the activity
// calendar, and the compact trend charts all speak the same material.
//
// Vermilion itself doesn't change between light and dark — it reads on both
// grounds. The "ink" tone (resting wash, linework) does: dark mode runs the
// same plate under different light, cream ink instead of black.

const VERMILION_RGB = '193, 58, 42';
const INK_RGB_LIGHT = '32, 27, 21';
const INK_RGB_DARK = '237, 227, 204';

export function inkRGB(isDark: boolean): string {
  return isDark ? INK_RGB_DARK : INK_RGB_LIGHT;
}

/** ratio in [0,1] -> a vermilion wash opacity. Floor is deliberately high:
 * even a small amount of activity should read clearly as "inked today"
 * against the resting wash, not blend into it. */
export function getIntensityColor(ratio: number, isDark = false): string {
  if (ratio <= 0) return getRestingColor(isDark);
  const clamped = Math.min(ratio, 1);
  const opacity = 0.24 + clamped * 0.76;
  return `rgba(${VERMILION_RGB}, ${opacity.toFixed(2)})`;
}

export function getMuscleColor(volumeLoad: number, maxVolume: number, isDark = false): string {
  return getIntensityColor(volumeLoad / maxVolume, isDark);
}

export function getRestingColor(isDark = false): string {
  return `rgba(${inkRGB(isDark)}, 0.05)`;
}

export function muscleVolumeRatio(volumeLoad: number, maxVolume: number): number {
  return Math.min(volumeLoad / maxVolume, 1);
}

export const VERMILION_HEX = '#C13A2A';
