// The heatmap's material is a highlighter mark, not an app accent color:
// volume reads as how much gold ink has been laid down, from a nearly blank
// entry to fully highlighted. This same ramp is reused anywhere something is
// encoded as "how much today" — the muscle plate, the activity calendar, and
// the compact trend charts all speak the same material.
//
// Gold itself doesn't change between light and dark — it reads on both
// grounds, same as a highlighter reads the same under a desk lamp at night.
// The "ink" tone (resting wash, linework) does: dark mode runs the same page
// under different light, cream ink instead of charcoal.

const GOLD_RGB = '184, 134, 11';
const INK_RGB_LIGHT = '32, 30, 25';
const INK_RGB_DARK = '242, 239, 227';

export function inkRGB(isDark: boolean): string {
  return isDark ? INK_RGB_DARK : INK_RGB_LIGHT;
}

/** ratio in [0,1] -> a gold highlighter opacity. Floor is deliberately high:
 * even a small amount of activity should read clearly as "marked today"
 * against the resting wash, not blend into it. */
export function getIntensityColor(ratio: number, isDark = false): string {
  if (ratio <= 0) return getRestingColor(isDark);
  const clamped = Math.min(ratio, 1);
  const opacity = 0.24 + clamped * 0.76;
  return `rgba(${GOLD_RGB}, ${opacity.toFixed(2)})`;
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

export const GOLD_HEX = '#B8860B';
