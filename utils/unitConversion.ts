export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

export function lbsToKg(lbs: number): number {
  return lbs / 2.20462;
}

export function kmToMiles(km: number): number {
  return km * 0.621371;
}

export function milesToKm(miles: number): number {
  return miles / 0.621371;
}

export function formatWeight(kg: number, unit: 'kg' | 'lbs'): string {
  if (unit === 'lbs') {
    return `${kgToLbs(kg).toFixed(1)} lbs`;
  }
  return `${kg.toFixed(1)} kg`;
}

export function formatDistance(km: number, unit: 'metric' | 'imperial'): string {
  if (unit === 'imperial') {
    return `${kmToMiles(km).toFixed(2)} mi`;
  }
  return `${km.toFixed(2)} km`;
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatPace(durationSeconds: number, distanceKm: number | null, unit: 'metric' | 'imperial'): string | null {
  if (!distanceKm || distanceKm === 0) return null;

  const distance = unit === 'imperial' ? kmToMiles(distanceKm) : distanceKm;
  const unitLabel = unit === 'imperial' ? '/mi' : '/km';
  const paceSeconds = durationSeconds / distance;
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} ${unitLabel}`;
}
